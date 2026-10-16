import { PaymentsOffNotice } from '../../src/components/PaymentsOffNotice';
import { PAYMENTS_OFF_MESSAGE, usePaymentsAvailable } from '../../src/hooks/usePaymentsAvailable';
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  api,
  formatUGX,
  providerLabel,
  Transaction,
  WalletMovementInput,
} from "../../src/api/client";
import { useScreenInsets } from "../../src/hooks/useScreenInsets";
import {
  isValidPhone,
  normalizePhone,
  pollTopUp,
} from "../../src/utils/walletPolling";
import { colors } from "../../src/theme/colors";
import { fonts } from "../../src/theme/typography";

function typeLabel(type: string): string {
  switch (type) {
    case "tour_booking":
      return "Tour payment";
    case "deposit":
      return "Top-up";
    case "withdrawal":
      return "Withdrawal";
    case "refund":
      return "Refund";
    default:
      return type;
  }
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { contentBottom } = useScreenInsets({ inTabs: true });
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<"mtn_momo" | "airtel_money">(
    "mtn_momo",
  );
  const [notice, setNotice] = useState<{
    kind: "pending" | "success" | "failed";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const payments = usePaymentsAvailable();

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

  function buildInput(): WalletMovementInput | null {
    const value = parseInt(amount, 10);
    if (!value || value <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return null;
    }
    if (!isValidPhone(phone)) {
      Alert.alert(
        "Error",
        "Enter the mobile money phone number, e.g. 256770000000",
      );
      return null;
    }
    return { amount: value, provider, phoneNumber: normalizePhone(phone) };
  }

  async function handleAddFunds() {
    if (!payments.available) {
      Alert.alert('Payments unavailable', PAYMENTS_OFF_MESSAGE);
      return;
    }
    const input = buildInput();
    if (!input) return;
    setActionLoading(true);
    setNotice({
      kind: "pending",
      text: "Approve the payment prompt on your phone…",
    });
    try {
      const { transaction } = await api.wallet.addFunds(input);
      setAmount("");
      await load();
      const outcome = await pollTopUp(() =>
        api.wallet.pollTopUp(transaction.id),
      );
      await load();
      if (outcome === "completed") {
        setNotice({
          kind: "success",
          text: `${formatUGX(input.amount)} added to wallet`,
        });
      } else if (outcome === "failed") {
        setNotice({
          kind: "failed",
          text: "Top-up failed or was declined. Nothing was charged.",
        });
      } else {
        setNotice({
          kind: "pending",
          text: "Still waiting for confirmation. Your balance updates automatically once the payment clears.",
        });
      }
    } catch (e) {
      setNotice({ kind: "failed", text: (e as Error).message });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!payments.available) {
      Alert.alert('Payments unavailable', PAYMENTS_OFF_MESSAGE);
      return;
    }
    const input = buildInput();
    if (!input) return;
    setActionLoading(true);
    try {
      await api.wallet.withdraw(input);
      setAmount("");
      await load();
      setNotice({
        kind: "pending",
        text: `Withdrawal of ${formatUGX(input.amount)} requested. It is held until our team sends the payout.`,
      });
    } catch (e) {
      setNotice({ kind: "failed", text: (e as Error).message });
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
              { label: "Add", onPress: handleAddFunds },
              { label: "Withdraw", onPress: handleWithdraw },
              {
                label: "Send",
                onPress: () => Alert.alert("Coming soon", "Send funds"),
              },
              {
                label: "Split",
                onPress: () => Alert.alert("Coming soon", "Split payment"),
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
        {!payments.available ? <PaymentsOffNotice /> : null}
        <View style={styles.providerRow}>
          {(["mtn_momo", "airtel_money"] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setProvider(p)}
              style={[
                styles.providerBtn,
                provider === p && styles.providerBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.providerText,
                  provider === p && styles.providerTextActive,
                ]}
              >
                {providerLabel(p)}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={[styles.amountInput, { marginBottom: 10 }]}
          placeholder="Mobile money number (256…)"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.amountInput}
          placeholder="Enter amount (UGX)"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
        />

        {notice ? (
          <View
            style={[
              styles.notice,
              notice.kind === "failed" && styles.noticeFailed,
              notice.kind === "success" && styles.noticeOk,
            ]}
          >
            {actionLoading && notice.kind === "pending" ? (
              <ActivityIndicator color={colors.navy} />
            ) : null}
            <Text style={styles.noticeText}>{notice.text}</Text>
          </View>
        ) : null}

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
                  {item.status !== "completed" ? (
                    <Text
                      style={[
                        styles.txBadge,
                        item.status === "failed" && styles.txFailed,
                      ]}
                    >
                      {item.status === "pending" ? "Pending" : "Failed"}
                    </Text>
                  ) : null}
                  {item.provider && item.provider !== "system" ? (
                    <Text style={styles.txProvider}>
                      {providerLabel(item.provider)}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.txDate}>
                  {new Date(item.createdAt).toLocaleString("en-UG")}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  item.amount >= 0 ? styles.positive : styles.negative,
                ]}
              >
                {item.amount >= 0 ? "+" : "−"}
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
  providerRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  providerBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  providerBtnActive: { backgroundColor: colors.navy },
  providerText: {
    fontFamily: fonts.displaySemi,
    fontSize: 13,
    color: colors.navy,
  },
  providerTextActive: { color: colors.white },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  noticeFailed: { borderLeftWidth: 4, borderLeftColor: colors.red },
  noticeOk: { borderLeftWidth: 4, borderLeftColor: colors.green },
  noticeText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.navy,
  },
  txFailed: { color: colors.red },
  container: { flex: 1, backgroundColor: colors.lavender },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    color: "rgba(255,255,255,0.75)",
  },
  balance: {
    fontFamily: fonts.displayExtra,
    fontSize: 34,
    color: colors.white,
    marginTop: 6,
    marginBottom: 18,
  },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickBtn: {
    flexGrow: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
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
    textAlign: "center",
    color: colors.navy,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 12,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  txMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
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
