import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { StatusPill } from '../src/components/StatusPill';
import { colors } from '../src/theme/colors';
import { useScreenInsets } from '../src/hooks/useScreenInsets';

interface LoanOffer {
  maxLoan: number;
  minLoan: number;
  interestRate: number;
  processingFee: number;
}

interface LoanRequest {
  id: string;
  requestedAmount: number;
  interestRate: number;
  duration: number;
  status: 'pending' | 'approved' | 'rejected' | 'funded';
  monthlyPayment?: number;
  totalRepayment?: number;
  dueDate?: string;
  createdAt: string;
}


const ugx = (n: number) => `UGX ${Math.round(n || 0).toLocaleString()}`;

/** Same amortised monthly payment the API calculates. */
function monthlyPayment(principal: number, annualRate: number, months: number) {
  const r = annualRate / 100 / 12;
  if (!months) return 0;
  if (r === 0) return principal / months;
  const g = Math.pow(1 + r, months);
  return (principal * r * g) / (g - 1);
}

export default function FinancingScreen() {
  const insets = useSafeAreaInsets();
  const { contentBottom } = useScreenInsets();
  const params = useLocalSearchParams<{ receiptId?: string | string[] }>();
  const receiptId = Array.isArray(params.receiptId) ? params.receiptId[0] : params.receiptId;
  const [receipt, setReceipt] = useState<{ id: string; lotId: string; lotName: string; estimatedValue: number } | null>(null);
  const [step, setStep] = useState<'offers' | 'request' | 'history'>('offers');
  const [receiptValue, setReceiptValue] = useState(0);
  const [offer, setOffer] = useState<LoanOffer | null>(null);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [requestAmount, setRequestAmount] = useState('');
  const [duration, setDuration] = useState('6');
  const [loading, setLoading] = useState(false);

  // Financing is offered against a real warehouse receipt, so load its value and lot.
  useEffect(() => {
    if (!receiptId) return;
    api
      .get(`/receipts/${receiptId}`)
      .then((r) => {
        setReceipt(r);
        setReceiptValue(Math.round(r.estimatedValue));
      })
      .catch(() => Alert.alert('Error', 'Could not load that receipt'));
  }, [receiptId]);

  const calculateOffer = async () => {
    setLoading(true);
    try {
      const result = await api.post('/financing/calculate-offer', {
        receiptValue,
      });
      setOffer(result);
    } catch (e) {
      Alert.alert('Error', 'Failed to calculate offer');
    } finally {
      setLoading(false);
    }
  };

  const requestLoan = async () => {
    if (!receipt) {
      Alert.alert('Choose a receipt', 'Open Financing from one of your warehouse receipts.');
      return;
    }
    if (!requestAmount || !offer) {
      Alert.alert('Error', 'Please enter a loan amount');
      return;
    }

    const amount = parseFloat(requestAmount);
    if (amount < offer.minLoan || amount > offer.maxLoan) {
      Alert.alert('Error', `Loan amount must be between UGX ${Math.ceil(offer.minLoan).toLocaleString()} and UGX ${Math.floor(offer.maxLoan).toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      await api.post('/financing/request-loan', {
        lotId: receipt.lotId,
        receiptId: receipt.id,
        amount,
        duration: parseInt(duration),
      });
      Alert.alert('Success', 'Loan request submitted');
      setRequestAmount('');
      setStep('history');
      loadLoanHistory();
    } catch (e) {
      Alert.alert('Could not request loan', (e as Error).message || 'Failed to request loan');
    } finally {
      setLoading(false);
    }
  };

  const loadLoanHistory = async () => {
    try {
      const result = await api.get('/financing/requests');
      setLoanRequests(result.requests || []);
    } catch (e) {
      console.error('Error loading loans:', e);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Financing" />

      <View style={styles.tabs}>
        {(['offers', 'request', 'history'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => {
              setStep(t);
              if (t === 'history') loadLoanHistory();
            }}
            style={[styles.tab, step === t && styles.activeTab]}
          >
            <Text style={[styles.tabText, step === t && styles.activeTabText]}>
              {t === 'offers' ? 'Loan Offers' : t === 'request' ? 'Request Loan' : 'My Loans'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: contentBottom }}
      >
        {step === 'offers' && (
          <View>
            <Card style={styles.offerCard}>
              <Text style={styles.cardTitle}>Calculate Your Loan Offer</Text>
              <Text style={styles.subtitle}>
                Based on your warehouse receipt value
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {receipt ? `${receipt.lotName}: ` : ''}Receipt value: UGX {receiptValue.toLocaleString()}
                </Text>
                <TextInput
                  style={styles.slider}
                  value={String(receiptValue)}
                  editable={!receipt}
                  onChangeText={(text) => setReceiptValue(parseFloat(text) || 0)}
                  placeholder="Enter receipt value"
                  keyboardType="decimal-pad"
                />
              </View>

              <Button
                title={loading ? 'Calculating...' : 'Get Loan Offer'}
                onPress={calculateOffer}
                disabled={loading}
              />

              {offer && (
                <View style={styles.offerDetails}>
                  <Text style={styles.cardTitle}>Your Loan Offer</Text>
                  <View style={styles.offerRow}>
                    <Text style={styles.label}>Maximum Loan</Text>
                    <Text style={styles.offerValue}>
                      {ugx(offer.maxLoan)}
                    </Text>
                  </View>
                  <View style={styles.offerRow}>
                    <Text style={styles.label}>Minimum Loan</Text>
                    <Text style={styles.offerValue}>
                      {ugx(offer.minLoan)}
                    </Text>
                  </View>
                  <View style={styles.offerRow}>
                    <Text style={styles.label}>Interest Rate</Text>
                    <Text style={styles.offerValue}>{offer.interestRate}%</Text>
                  </View>
                  <View style={styles.offerRow}>
                    <Text style={styles.label}>Processing Fee</Text>
                    <Text style={styles.offerValue}>
                      {ugx(offer.processingFee)}
                    </Text>
                  </View>

                  <Button
                    title="Proceed to Request"
                    onPress={() => setStep('request')}
                  />
                </View>
              )}
            </Card>
          </View>
        )}

        {step === 'request' && offer && (
          <View>
            <Card style={styles.requestCard}>
              <Text style={styles.cardTitle}>Request Loan</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Loan Amount *</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>UGX</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount"
                    value={requestAmount}
                    onChangeText={setRequestAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={styles.hint}>
                  Min: {ugx(offer.minLoan)} | Max: {ugx(offer.maxLoan)}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Loan Duration (months) *</Text>
                <View style={styles.durationOptions}>
                  {['3', '6', '12'].map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setDuration(m)}
                      style={[
                        styles.durationBtn,
                        duration === m && styles.durationBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.durationText,
                          duration === m && styles.durationTextActive,
                        ]}
                      >
                        {m}m
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Card style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Loan Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Requested Amount</Text>
                  <Text style={styles.summaryValue}>
                    {ugx(parseFloat(requestAmount || '0'))}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Interest Rate</Text>
                  <Text style={styles.summaryValue}>{offer.interestRate}%</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Monthly Payment</Text>
                  <Text style={styles.summaryValue}>
                    {ugx(monthlyPayment(parseFloat(requestAmount || '0'), offer.interestRate, parseInt(duration)))}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Repayment</Text>
                  <Text style={styles.totalValue}>
                    {ugx(monthlyPayment(parseFloat(requestAmount || '0'), offer.interestRate, parseInt(duration)) * parseInt(duration))}
                  </Text>
                </View>
              </Card>

              <Button
                title={loading ? 'Submitting...' : 'Submit Loan Request'}
                onPress={requestLoan}
                disabled={loading}
              />
            </Card>
          </View>
        )}

        {step === 'history' && (
          <View>
            {loanRequests.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="document-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No loan requests yet</Text>
              </Card>
            ) : (
              <FlatList
                data={loanRequests}
                scrollEnabled={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Card style={styles.loanCard}>
                    <View style={styles.loanHeader}>
                      <View>
                        <Text style={styles.loanAmount}>
                          {ugx(item.requestedAmount)}
                        </Text>
                        <Text style={styles.loanDate}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <StatusPill status={item.status} />
                    </View>
                    <View style={styles.loanDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Monthly Payment</Text>
                        <Text style={styles.value}>
                          {ugx(item.monthlyPayment || 0)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Total Repayment</Text>
                        <Text style={styles.value}>
                          {ugx(item.totalRepayment || 0)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                )}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: colors.navy,
  },
  tabText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.navy,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  offerCard: {
    marginBottom: 16,
  },
  requestCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  slider: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    marginRight: 4,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 14,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  durationBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  durationTextActive: {
    color: colors.white,
  },
  offerDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  offerValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
  },
  summaryCard: {
    marginVertical: 16,
    backgroundColor: colors.lavender,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.navy,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navy,
  },
  totalRow: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.navy20,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  emptyCard: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    color: colors.text,
  },
  loanCard: {
    marginBottom: 12,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  loanAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
  },
  loanDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  loanDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
});
