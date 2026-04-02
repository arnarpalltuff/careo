import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/fonts';
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
      let file: { name: string; uri: string; mimeType: string | undefined; size: number | undefined };

      if (Platform.OS === 'web') {
        const picked = await new Promise<{ name: string; uri: string; mimeType: string; size: number } | null>((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.onchange = () => {
            const f = input.files?.[0];
            if (!f) { resolve(null); return; }
            resolve({ name: f.name, uri: URL.createObjectURL(f), mimeType: f.type, size: f.size });
          };
          input.click();
        });
        if (!picked) return;
        file = picked;
      } else {
        const DocumentPicker = require('expo-document-picker');
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
        if (result.canceled) return;
        const asset = result.assets[0];
        file = { name: asset.name, uri: asset.uri, mimeType: asset.mimeType, size: asset.size };
      }

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
    try {
      const { downloadUrl } = await documentService.getDownloadUrl(activeCircleId, docId);
      Linking.openURL(downloadUrl);
    } catch {
      Alert.alert('Error', 'Failed to download document. Please try again.');
    }
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
          <>
          <View style={styles.countRow}>
            <Text style={styles.countText}>{documents.length} document{documents.length !== 1 ? 's' : ''}</Text>
          </View>
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.docList}
            renderItem={({ item }) => (
              <View style={styles.docCard}>
                <TouchableOpacity style={styles.docCardTop} onPress={() => handleDownload(item.id)} activeOpacity={0.7}>
                  <Text style={styles.docIcon}>{item.mimeType.includes('image') ? '🖼' : item.mimeType.includes('pdf') ? '📄' : '📎'}</Text>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.docMeta}>{formatSize(item.sizeBytes)} · {formatDate(item.createdAt)}</Text>
                    {item.uploadedBy && (
                      <Text style={styles.docUploader}>by {item.uploadedBy.firstName} {item.uploadedBy.lastName}</Text>
                    )}
                  </View>
                  <Badge label={item.category} />
                </TouchableOpacity>
                <View style={styles.docActions}>
                  <TouchableOpacity style={styles.docActionBtn} onPress={() => handleDownload(item.id)}>
                    <Text style={styles.docActionText}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.docActionBtnDanger} onPress={() => handleDelete(item.id)}>
                    <Text style={styles.docActionTextDanger}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          </>
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
  catText: { ...typography.labelSmall, color: colors.textSecondary },
  catTextActive: { color: '#fff', fontWeight: '600' },
  countRow: { paddingHorizontal: 16, paddingBottom: 8 },
  countText: { ...typography.labelSmall, color: colors.textHint },
  docList: { paddingHorizontal: 12, paddingBottom: 20 },
  docCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.divider, overflow: 'hidden',
  },
  docCardTop: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  docIcon: { fontSize: 28, marginRight: 12 },
  docInfo: { flex: 1 },
  docName: { ...typography.headingSmall, color: colors.textPrimary },
  docMeta: { ...typography.labelSmall, color: colors.textHint, marginTop: 2 },
  docUploader: { ...typography.labelSmall, color: colors.textHint, marginTop: 1, fontSize: 10 },
  docActions: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.divider,
  },
  docActionBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRightWidth: 1, borderRightColor: colors.divider,
  },
  docActionBtnDanger: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  docActionText: { ...typography.labelSmall, color: colors.primary, fontWeight: '600' },
  docActionTextDanger: { ...typography.labelSmall, color: colors.danger, fontWeight: '600' },
});
