import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../utils/colors';
import { useCircleStore } from '../../stores/circleStore';
import { documentService } from '../../services/documents';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';

const categories = ['All', 'INSURANCE', 'PRESCRIPTION', 'LEGAL', 'MEDICAL', 'ID', 'OTHER'] as const;

export default function DocumentsScreen() {
  const { activeCircleId } = useCircleStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [activeCategory]);

  const loadDocuments = async () => {
    if (!activeCircleId) return;
    setLoading(true);
    try {
      const cat = activeCategory === 'All' ? undefined : activeCategory;
      const data = await documentService.list(activeCircleId, cat);
      setDocuments(data.documents);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!activeCircleId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled) return;
      const file = result.assets[0];

      // Pick category
      const category = await new Promise<string>((resolve) => {
        Alert.alert('Document Category', 'Select a category', [
          { text: 'Insurance', onPress: () => resolve('INSURANCE') },
          { text: 'Prescription', onPress: () => resolve('PRESCRIPTION') },
          { text: 'Legal', onPress: () => resolve('LEGAL') },
          { text: 'Medical', onPress: () => resolve('MEDICAL') },
          { text: 'ID', onPress: () => resolve('ID') },
          { text: 'Other', onPress: () => resolve('OTHER') },
        ]);
      });

      setUploading(true);
      const { uploadUrl, s3Key } = await documentService.getUploadUrl(activeCircleId, {
        fileName: file.name,
        mimeType: file.mimeType || 'application/octet-stream',
        category,
      });

      await documentService.uploadToS3(uploadUrl, { uri: file.uri, mimeType: file.mimeType || 'application/octet-stream' });

      await documentService.create(activeCircleId, {
        name: file.name,
        category,
        s3Key,
        mimeType: file.mimeType || 'application/octet-stream',
        sizeBytes: file.size || 0,
      });

      Alert.alert('Success', 'Document uploaded');
      loadDocuments();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId: string) => {
    if (!activeCircleId) return;
    const { downloadUrl } = await documentService.getDownloadUrl(activeCircleId, docId);
    Linking.openURL(downloadUrl);
  };

  const handleDelete = (docId: string) => {
    Alert.alert('Delete Document', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!activeCircleId) return;
          await documentService.delete(activeCircleId, docId);
          loadDocuments();
        },
      },
    ]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'Documents',
        headerRight: () => (
          <TouchableOpacity onPress={handleUpload} disabled={uploading}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600', marginRight: 8 }}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Text>
          </TouchableOpacity>
        ),
      }} />
      <View style={styles.container}>
        <View style={styles.categories}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.catPill, activeCategory === c && styles.catPillActive]}
              onPress={() => setActiveCategory(c)}
            >
              <Text style={[styles.catText, activeCategory === c && styles.catTextActive]}>{c === 'All' ? 'All' : c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? <Spinner /> : documents.length === 0 ? (
          <EmptyState
            title="No documents uploaded"
            message="Store insurance cards, prescriptions, and legal documents here."
            buttonTitle="Upload"
            onPress={handleUpload}
          />
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.docRow} onPress={() => handleDownload(item.id)} onLongPress={() => handleDelete(item.id)}>
                <Text style={styles.docIcon}>{item.mimeType.includes('image') ? '🖼' : item.mimeType.includes('pdf') ? '📄' : '📎'}</Text>
                <View style={styles.docInfo}>
                  <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.docMeta}>{formatSize(item.sizeBytes)} · {formatDate(item.createdAt)}</Text>
                </View>
                <Badge label={item.category} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  categories: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 6 },
  catPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  catPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 12, color: colors.textSecondary },
  catTextActive: { color: '#fff', fontWeight: '600' },
  docRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
  docIcon: { fontSize: 28, marginRight: 12 },
  docInfo: { flex: 1 },
  docName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  docMeta: { fontSize: 12, color: colors.textHint, marginTop: 2 },
});
