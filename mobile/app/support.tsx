import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiExtended, SupportTicket } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { ScreenScrollView } from '../src/components/ScreenScrollView';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

const STATUS_LABEL: Record<SupportTicket['status'], string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

const STATUS_COLOR: Record<SupportTicket['status'], string> = {
  open: colors.warning,
  in_progress: colors.navy2,
  resolved: colors.success,
};

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setTickets(await apiExtended.tickets.list());
    } catch {
      // keep list empty
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function submit() {
    if (!subject.trim() || !body.trim()) {
      Alert.alert('Missing details', 'Add a subject and a short description.');
      return;
    }
    setSubmitting(true);
    try {
      await apiExtended.tickets.create({ subject: subject.trim(), body: body.trim() });
      setSubject('');
      setBody('');
      await load();
      Alert.alert('Sent', 'Our team will get back to you soon.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not submit your ticket.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Contact Support" />
      <ScreenScrollView contentContainerStyle={styles.content}>
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>File a new issue</Text>
          <Input label="Subject" value={subject} onChangeText={setSubject} placeholder="Payout delay" />
          <Input
            label="Details"
            value={body}
            onChangeText={setBody}
            placeholder="Tell us what happened…"
            multiline
            numberOfLines={4}
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />
          <Button title="Submit" onPress={submit} loading={submitting} />
        </Card>

        <Text style={styles.sectionTitle}>Your tickets</Text>
        {loading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 16 }} />
        ) : tickets.length === 0 ? (
          <Text style={styles.emptyText}>You haven't filed any issues yet.</Text>
        ) : (
          tickets.map((t) => (
            <Card key={t.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketSubject}>{t.subject}</Text>
                <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[t.status]}18` }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[t.status] }]}>
                    {STATUS_LABEL[t.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.ticketBody}>{t.body}</Text>
            </Card>
          ))
        )}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 16, gap: 12 },
  formCard: { gap: 4 },
  formTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 16,
    color: colors.navy,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  ticketCard: { gap: 6 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketSubject: { fontFamily: fonts.displayMedium, fontSize: 14, color: colors.navy, flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontFamily: fonts.displaySemi, fontSize: 11 },
  ticketBody: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
});
