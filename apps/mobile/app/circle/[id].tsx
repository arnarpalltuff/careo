import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { colors } from '../../utils/colors';
import { circleService } from '../../services/circles';
import { MemberAvatar } from '../../components/MemberAvatar';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCircle();
  }, []);

  const loadCircle = async () => {
    try {
      const data = await circleService.get(id);
      setCircle(data.circle);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (!circle) return null;

  return (
    <>
      <Stack.Screen options={{ title: circle.name }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>{circle.name}</Text>
          <Text style={styles.recipient}>Caring for {circle.careRecipient}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Members ({circle.members.length})</Text>
          <FlatList
            data={circle.members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MemberAvatar member={item} />}
          />
        </View>

        <Button
          title="Invite Member"
          onPress={() => router.push('/circle/invite')}
          style={styles.inviteBtn}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 24, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
  name: { fontSize: 22, fontWeight: '600', color: colors.textPrimary },
  recipient: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  inviteBtn: { marginHorizontal: 16 },
});
