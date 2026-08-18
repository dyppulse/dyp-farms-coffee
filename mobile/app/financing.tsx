import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
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

export default function FinancingScreen() {
  const insets = useSafeAreaInsets();
  const { receiptId } = useLocalSearchParams();
  const [step, setStep] = useState<'offers' | 'request' | 'history'>('offers');
  const [receiptValue, setReceiptValue] = useState(5000);
  const [offer, setOffer] = useState<LoanOffer | null>(null);
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [requestAmount, setRequestAmount] = useState('');
  const [duration, setDuration] = useState('6');
  const [loading, setLoading] = useState(false);

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
    if (!requestAmount || !offer) {
      Alert.alert('Error', 'Please enter a loan amount');
      return;
    }

    const amount = parseFloat(requestAmount);
    if (amount < offer.minLoan || amount > offer.maxLoan) {
      Alert.alert('Error', `Loan amount must be between $${offer.minLoan} and $${offer.maxLoan}`);
      return;
    }

    setLoading(true);
    try {
      await api.post('/financing/request-loan', {
        lotId: 'lot-1',
        receiptId: receiptId || 'receipt-1',
        amount,
        duration: parseInt(duration),
      });
      Alert.alert('Success', 'Loan request submitted');
      setRequestAmount('');
      setStep('history');
      loadLoanHistory();
    } catch (e) {
      Alert.alert('Error', 'Failed to request loan');
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
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {step === 'offers' && (
          <View>
            <Card style={styles.offerCard}>
              <Text style={styles.cardTitle}>Calculate Your Loan Offer</Text>
              <Text style={styles.subtitle}>
                Based on your warehouse receipt value
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Receipt Value: ${receiptValue}</Text>
                <TextInput
                  style={styles.slider}
                  value={String(receiptValue)}
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
                      ${offer.maxLoan.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.offerRow}>
                    <Text style={styles.label}>Minimum Loan</Text>
                    <Text style={styles.offerValue}>
                      ${offer.minLoan.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.offerRow}>
                    <Text style={styles.label}>Interest Rate</Text>
                    <Text style={styles.offerValue}>{offer.interestRate}%</Text>
                  </View>
                  <View style={styles.offerRow}>
                    <Text style={styles.label}>Processing Fee</Text>
                    <Text style={styles.offerValue}>
                      ${offer.processingFee.toFixed(2)}
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
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount"
                    value={requestAmount}
                    onChangeText={setRequestAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={styles.hint}>
                  Min: ${offer.minLoan.toFixed(2)} | Max: $
                  {offer.maxLoan.toFixed(2)}
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
                    ${parseFloat(requestAmount || '0').toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Interest Rate</Text>
                  <Text style={styles.summaryValue}>{offer.interestRate}%</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Monthly Payment</Text>
                  <Text style={styles.summaryValue}>
                    $
                    {(
                      parseFloat(requestAmount || '0') /
                      parseInt(duration)
                    ).toFixed(2)}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Repayment</Text>
                  <Text style={styles.totalValue}>
                    $
                    {(parseFloat(requestAmount || '0') * (1 + offer.interestRate / 100)).toFixed(2)}
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
                          ${item.requestedAmount.toFixed(2)}
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
                          ${(item.monthlyPayment || 0).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Total Repayment</Text>
                        <Text style={styles.value}>
                          ${(item.totalRepayment || 0).toFixed(2)}
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
