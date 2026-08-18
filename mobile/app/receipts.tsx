import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { StatusPill } from '../src/components/StatusPill';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

interface Receipt {
  id: string;
  lotName: string;
  grade: string;
  quantity: number;
  estimatedValue: number;
  storageLocation: string;
  createdAt: string;
}

export default function ReceiptsScreen() {
  const insets = useSafeAreaInsets();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get('/receipts/user');
      setReceipts(result.receipts || []);
    } catch (e) {
      console.error('Error loading receipts:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts]),
  );

  async function shareReceipt(receiptId: string) {
    try {
      const result = await api.post(`/receipts/${receiptId}/share`, { format: 'link' });
      await Share.share({
        message: `Here's my warehouse receipt: ${result.shareLink}`,
        title: 'Share Receipt',
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  }

  async function downloadReceipt(receiptId: string) {
    try {
      await api.post(`/receipts/${receiptId}/share`, { format: 'pdf' });
      Alert.alert('Success', 'Receipt downloaded to your device');
    } catch (e) {
      Alert.alert('Error', 'Failed to download receipt');
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeader title="Warehouse Receipts" />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.navy}
          style={{ marginTop: 40 }}
        />
      ) : receipts.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="document-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No receipts yet</Text>
          <Text style={styles.emptySubtext}>
            Receipts are generated when you complete quality grading
          </Text>
        </Card>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Card style={styles.receiptCard}>
              <View style={styles.receiptHeader}>
                <View>
                  <Text style={styles.receiptTitle}>{item.lotName}</Text>
                  <Text style={styles.receiptMeta}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <StatusPill status="verified" />
              </View>

              <View style={styles.receiptDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Grade</Text>
                  <Text style={styles.value}>{item.grade}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Quantity</Text>
                  <Text style={styles.value}>{item.quantity} bags</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Storage</Text>
                  <Text style={styles.value}>{item.storageLocation}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Estimated Value</Text>
                  <Text style={styles.valueHighlight}>
                    ${item.estimatedValue.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Button
                  title="Share"
                  onPress={() => shareReceipt(item.id)}
                  icon="share-social-outline"
                  size="small"
                  variant="secondary"
                />
                <Button
                  title="Download"
                  onPress={() => downloadReceipt(item.id)}
                  icon="download-outline"
                  size="small"
                  variant="secondary"
                />
                <Button
                  title="Finance"
                  onPress={() => router.push(`/financing?receiptId=${item.id}`)}
                  icon="cash-outline"
                  size="small"
                />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  emptyCard: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 8,
    color: colors.textMuted,
    textAlign: 'center',
  },
  receiptCard: {
    marginBottom: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  receiptTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  receiptMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  receiptDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  valueHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
});
