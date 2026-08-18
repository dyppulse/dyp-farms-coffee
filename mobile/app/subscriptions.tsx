import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
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

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  bagCount: number;
  deliveryFrequency: string;
  features: string[];
}

interface Subscription {
  id: string;
  planName: string;
  status: 'active' | 'paused' | 'cancelled';
  nextDeliveryDate: string;
  deliveryFrequency: string;
  nextPaymentDate: string;
  totalSpent: number;
  bagsSent: number;
}

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'plans' | 'my-sub'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFrequency, setSelectedFrequency] = useState('monthly');

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get('/subscriptions/plans');
      setPlans(result.plans || []);
    } catch (e) {
      console.error('Error loading plans:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get('/subscriptions/my-subscription');
      setSubscription(result.subscription);
    } catch (e) {
      console.error('Error loading subscription:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (tab === 'plans') {
        loadPlans();
      } else {
        loadSubscription();
      }
    }, [tab, loadPlans, loadSubscription]),
  );

  const handleSelectPlan = async (planId: string) => {
    try {
      await api.post('/subscriptions/create', { planId });
      Alert.alert('Success', 'Subscription created!');
      loadSubscription();
      setTab('my-sub');
    } catch (e) {
      Alert.alert('Error', 'Failed to create subscription');
    }
  };

  const handleUpdateFrequency = async (newFrequency: string) => {
    if (!subscription) return;

    try {
      await api.put(`/subscriptions/${subscription.id}/frequency`, {
        frequency: newFrequency,
      });
      Alert.alert('Success', 'Delivery frequency updated');
      loadSubscription();
    } catch (e) {
      Alert.alert('Error', 'Failed to update frequency');
    }
  };

  const handlePause = async () => {
    if (!subscription) return;

    Alert.alert(
      'Pause Subscription',
      'Are you sure? You can resume anytime.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Pause',
          onPress: async () => {
            try {
              await api.post(`/subscriptions/${subscription.id}/pause`, {});
              Alert.alert('Success', 'Subscription paused');
              loadSubscription();
            } catch (e) {
              Alert.alert('Error', 'Failed to pause');
            }
          },
        },
      ],
    );
  };

  const handleSkipDelivery = async () => {
    if (!subscription) return;

    try {
      await api.post(`/subscriptions/${subscription.id}/skip`, {});
      Alert.alert('Success', 'Delivery skipped. Next delivery rescheduled.');
      loadSubscription();
    } catch (e) {
      Alert.alert('Error', 'Failed to skip delivery');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Coffee Subscriptions" />

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('plans')}
          style={[styles.tab, tab === 'plans' && styles.activeTab]}
        >
          <Text
            style={[styles.tabText, tab === 'plans' && styles.activeTabText]}
          >
            Plans
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('my-sub')}
          style={[styles.tab, tab === 'my-sub' && styles.activeTab]}
        >
          <Text
            style={[styles.tabText, tab === 'my-sub' && styles.activeTabText]}
          >
            My Subscription
          </Text>
        </Pressable>
      </View>

      {tab === 'plans' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.navy} />
          ) : (
            <>
              <Text style={styles.sectionTitle}>Choose Your Plan</Text>
              <Text style={styles.sectionSubtitle}>
                Fresh coffee delivered right to your door
              </Text>

              <FlatList
                data={plans}
                scrollEnabled={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Card style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <View>
                        <Text style={styles.planName}>{item.name}</Text>
                        <Text style={styles.planDesc}>{item.description}</Text>
                      </View>
                    </View>

                    <View style={styles.planPrice}>
                      <Text style={styles.priceAmount}>
                        ${item.monthlyPrice}
                      </Text>
                      <Text style={styles.priceUnit}>/month</Text>
                    </View>

                    <View style={styles.planDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="leaf-outline"
                          size={16}
                          color={colors.navy}
                        />
                        <Text style={styles.detailText}>
                          {item.bagCount} bag{item.bagCount > 1 ? 's' : ''} per
                          shipment
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={colors.navy}
                        />
                        <Text style={styles.detailText}>
                          Delivered {item.deliveryFrequency}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.featuresList}>
                      <Text style={styles.featuresTitle}>Includes:</Text>
                      {item.features.map((feature, idx) => (
                        <View key={idx} style={styles.featureItem}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={colors.navy}
                          />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    <Button
                      title="Select Plan"
                      onPress={() => handleSelectPlan(item.id)}
                    />
                  </Card>
                )}
              />
            </>
          )}
        </ScrollView>
      )}

      {tab === 'my-sub' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.navy} />
          ) : !subscription ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="leaf-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No active subscription</Text>
              <Text style={styles.emptySubtext}>
                Choose a plan to get started
              </Text>
              <Button
                title="View Plans"
                onPress={() => setTab('plans')}
              />
            </Card>
          ) : (
            <>
              <Card style={styles.activeSubCard}>
                <View style={styles.subHeader}>
                  <View>
                    <Text style={styles.subPlan}>{subscription.planName}</Text>
                    <Text style={styles.subMeta}>
                      {subscription.bagsSent} bags sent • $
                      {subscription.totalSpent.toFixed(2)} spent
                    </Text>
                  </View>
                  <StatusPill status={subscription.status} />
                </View>

                <View style={styles.subDetails}>
                  <View style={styles.subDetailRow}>
                    <Text style={styles.subLabel}>Next Delivery</Text>
                    <Text style={styles.subValue}>
                      {new Date(subscription.nextDeliveryDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.subDetailRow}>
                    <Text style={styles.subLabel}>Delivery Frequency</Text>
                    <Text style={styles.subValue}>
                      {subscription.deliveryFrequency}
                    </Text>
                  </View>
                  <View style={styles.subDetailRow}>
                    <Text style={styles.subLabel}>Next Payment</Text>
                    <Text style={styles.subValue}>
                      {new Date(subscription.nextPaymentDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </Card>

              <Card style={styles.settingsCard}>
                <Text style={styles.settingsTitle}>Delivery Settings</Text>

                <View style={styles.settingItem}>
                  <Text style={styles.settingLabel}>Delivery Frequency</Text>
                  <View style={styles.frequencyButtons}>
                    {['weekly', 'biweekly', 'monthly'].map((freq) => (
                      <Pressable
                        key={freq}
                        onPress={() => handleUpdateFrequency(freq)}
                        style={[
                          styles.freqBtn,
                          subscription.deliveryFrequency === freq &&
                            styles.freqBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.freqText,
                            subscription.deliveryFrequency === freq &&
                              styles.freqTextActive,
                          ]}
                        >
                          {freq}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Pressable
                  onPress={handleSkipDelivery}
                  style={styles.actionButton}
                >
                  <Ionicons name="skip-forward-outline" size={18} color={colors.navy} />
                  <Text style={styles.actionText}>Skip Next Delivery</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>

                <Pressable
                  onPress={handlePause}
                  style={styles.actionButton}
                >
                  <Ionicons name="pause-outline" size={18} color={colors.navy} />
                  <Text style={styles.actionText}>Pause Subscription</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              </Card>

              <Button
                title="View All Plans"
                variant="secondary"
                onPress={() => setTab('plans')}
              />
            </>
          )}
        </ScrollView>
      )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  planCard: {
    marginBottom: 16,
  },
  planHeader: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  planDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.lavender,
    borderRadius: 8,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
  },
  priceUnit: {
    fontSize: 12,
    color: colors.navy,
    marginLeft: 4,
  },
  planDetails: {
    marginBottom: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: colors.text,
  },
  featuresList: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: colors.text,
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
  emptySubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    marginBottom: 16,
  },
  activeSubCard: {
    marginBottom: 16,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subPlan: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  subMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  subDetails: {
    gap: 8,
  },
  subDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  subLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  subValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  settingsCard: {
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
  },
  freqBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  freqText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textTransform: 'capitalize',
  },
  freqTextActive: {
    color: colors.white,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
  },
});
