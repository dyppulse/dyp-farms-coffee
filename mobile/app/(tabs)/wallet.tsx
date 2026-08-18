import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  api,
  formatUGX,
  providerLabel,
  Transaction,
} from '../../src/api/client';
import { useScreenInsets } from '../../src/hooks/useScreenInsets';
import { colors } from '../../src/theme/colors';
import { fonts } from '../../src/theme/typography';

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
  const insets = useSafeAreaInsets();
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.navy, colors.navy2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerLabel}>Digital Wallet</Text>
        <Text style={styles.balance}>{formatUGX(balance)}</Text>
        <View style={styles.quickActions}>
          {(
            [
              { label: 'Add', onPress: handleAddFunds },
              { label: 'Withdraw', onPress: handleWithdraw },
              {
                label: 'Send',
                onPress: () => Alert.alert('Coming soon', 'Send funds'),
              },
              {
                label: 'Split',
                onPress: () => Alert.alert('Coming soon', 'Split payment'),
              },
            ] as const
          ).map((a) => (
            <Pressable
              key={a.label}
              style={styles.quickBtn}
              onPress={a.onPress}
              disabled={actionLoading}
            >
              <Text style={styles.quickBtnText}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <TextInput
          style={styles.amountInput}
          placeholder="Enter amount (UGX)"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

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
                  {item.provider && item.provider !== 'system' ? (
                    <Text style={styles.txProvider}>{providerLabel(item.provider)}</Text>
                  ) : null}
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
                {item.amount >= 0 ? '+' : '−'}
                {formatUGX(item.amount)}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lavender },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lavender,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerLabel: {
    fontFamily: fonts.displayMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  balance: {
    fontFamily: fonts.displayExtra,
    fontSize: 34,
    color: colors.white,
    marginTop: 6,
    marginBottom: 18,
  },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  quickBtnText: {
    fontFamily: fonts.displaySemi,
    fontSize: 13,
    color: colors.white,
  },
  body: { flex: 1, padding: 20 },
  amountInput: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: fonts.body,
    marginBottom: 20,
    textAlign: 'center',
    color: colors.navy,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 12,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  txLeft: { flex: 1, marginRight: 12 },
  txDesc: {
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    color: colors.navy,
  },
  txMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  txBadge: {
    fontSize: 11,
    fontFamily: fonts.displaySemi,
    color: colors.navy2,
    backgroundColor: colors.lavender,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txProvider: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  txDate: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  txAmount: { fontFamily: fonts.displaySemi, fontSize: 14 },
  positive: { color: colors.green },
  negative: { color: colors.red },
});
