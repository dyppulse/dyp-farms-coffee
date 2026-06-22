import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  api,
  formatUGX,
  providerLabel,
  Transaction,
} from '../../src/api/client';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { useScreenInsets } from '../../src/hooks/useScreenInsets';
import { colors } from '../../src/theme/colors';

function typeLabel(type: string): string {
  switch (type) {
    case 'tour_booking':
      return 'Tour payment';
    case 'deposit':
      return 'Top-up';
    case 'withdrawal':
      return 'Withdrawal';
    case 'refund':
      return 'Refund';
    default:
      return type;
  }
}

export default function WalletScreen() {
  const { contentBottom } = useScreenInsets({ inTabs: true });
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.wallet.get();
      setBalance(result.balance);
      setTransactions(result.transactions);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleAddFunds() {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    setActionLoading(true);
    try {
      await api.wallet.addFunds(value);
      setAmount('');
      await load();
      Alert.alert('Success', `${formatUGX(value)} added to wallet`);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWithdraw() {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    setActionLoading(true);
    try {
      await api.wallet.withdraw(value);
      setAmount('');
      await load();
      Alert.alert('Success', `${formatUGX(value)} withdrawn`);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  function formatAmount(tx: Transaction) {
    const prefix = tx.amount >= 0 ? '+' : '−';
    return `${prefix}${formatUGX(tx.amount)}`;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Digital Wallet Balance</Text>
        <Text style={styles.balance}>{formatUGX(balance)}</Text>
      </Card>

      <TextInput
        style={styles.amountInput}
        placeholder="Enter amount (UGX)"
        placeholderTextColor={colors.textSecondary}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={styles.actionRow}>
        <Button
          title="Add Funds"
          onPress={handleAddFunds}
          loading={actionLoading}
          style={styles.actionBtn}
        />
        <Button
          title="Withdraw"
          variant="outline"
          onPress={handleWithdraw}
          loading={actionLoading}
          style={styles.actionBtn}
        />
      </View>

      <Text style={styles.sectionTitle}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: contentBottom }}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={styles.txLeft}>
              <Text style={styles.txDesc}>{item.description}</Text>
              <View style={styles.txMeta}>
                <Text style={styles.txBadge}>{typeLabel(item.type)}</Text>
                {item.provider && item.provider !== 'system' && (
                  <Text style={styles.txProvider}>{providerLabel(item.provider)}</Text>
                )}
                <Text style={styles.txStatus}>{item.status}</Text>
              </View>
              <Text style={styles.txDate}>
                {new Date(item.createdAt).toLocaleString('en-UG')}
              </Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                item.amount >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {formatAmount(item)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  balanceCard: { backgroundColor: colors.primary, marginBottom: 20 },
  balanceLabel: { color: colors.accent, fontSize: 14 },
  balance: { color: colors.white, fontSize: 32, fontWeight: '700', marginTop: 4 },
  amountInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  txLeft: { flex: 1, marginRight: 12 },
  txDesc: { fontSize: 14, fontWeight: '500', color: colors.text },
  txMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  txBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    backgroundColor: '#e8f5ee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txProvider: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txStatus: { fontSize: 11, color: colors.textSecondary },
  txDate: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  txAmount: { fontSize: 14, fontWeight: '600' },
  positive: { color: colors.success },
  negative: { color: colors.error },
});
