import { Ionicons } from '@expo/vector-icons';
import { ReactElement, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HarvestSeasons as HarvestSeasonsData, OriginSeason } from '../api/client';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { Card } from './Card';

const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const STATUS_STYLE = {
  active: { label: 'Harvesting now', color: colors.farmerGreen, bg: '#DCFCE7' },
  upcoming: { label: 'Starting soon', color: colors.amber, bg: '#FEF3C7' },
  off: { label: 'Off-season', color: colors.textSecondary, bg: '#F3F4F6' },
} as const;

function plural(n: number, word: string) {
  return n === 1 ? `${n} ${word}` : `${n} ${word}s`;
}

function timing(o: OriginSeason): string {
  if (o.status === 'active') {
    return o.monthsAway === 0
      ? `${o.window} ends this month`
      : `${o.window} ends in ${plural(o.monthsAway, 'month')}`;
  }
  return o.monthsAway === 0
    ? `${o.window} starts this month`
    : `${o.window} starts in ${plural(o.monthsAway, 'month')}`;
}

/** Twelve tiny cells, one per month; green = harvest, outlined = this month. */
function MonthStrip({ months, current }: { months: OriginSeason['months']; current: number }) {
  return (
    <View style={styles.strip} accessibilityLabel="Harvest months">
      {months.map((m, i) => (
        <View key={m.month} style={styles.stripCol}>
          <View
            style={[
              styles.stripCell,
              m.active && styles.stripActive,
              m.month === current && styles.stripCurrent,
            ]}
          />
          <Text style={[styles.stripLabel, m.month === current && styles.stripLabelNow]}>
            {MONTH_INITIALS[i]}
          </Text>
        </View>
      ))}
    </View>
  );
}

function OriginCard({ origin, current }: { origin: OriginSeason; current: number }) {
  const s = STATUS_STYLE[origin.status];
  const home = origin.country === 'Uganda';
  return (
    <Card style={StyleSheet.flatten([styles.card, home && styles.homeCard])}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.country}>
            {origin.country}
            {home ? <Text style={styles.homeTag}>  · Home origin</Text> : null}
          </Text>
          <Text style={styles.meta}>
            {origin.coffee.join(' · ')} · {origin.region}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: s.bg }]}>
          <Text style={[styles.pillText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>
      <Text style={styles.timing}>
        {timing(origin)} · {origin.range}
      </Text>
      <MonthStrip months={origin.months} current={current} />
      {home && origin.note ? <Text style={styles.note}>{origin.note}</Text> : null}
    </Card>
  );
}

export function HarvestSeasons({ data }: { data: HarvestSeasonsData }): ReactElement {
  const [showOff, setShowOff] = useState(false);
  const active = data.origins.filter((o) => o.status === 'active');
  const upcoming = data.origins.filter((o) => o.status === 'upcoming');
  const off = data.origins.filter((o) => o.status === 'off');

  const group = (title: string, list: OriginSeason[]) =>
    list.length ? (
      <View style={styles.group}>
        <Text style={styles.groupTitle}>
          {title} ({list.length})
        </Text>
        {list.map((o) => (
          <OriginCard key={o.country} origin={o} current={data.asOfMonth} />
        ))}
      </View>
    ) : null;

  return (
    <View>
      <Text style={styles.summary}>
        {data.asOfMonthName}: {plural(data.counts.active, 'origin')} harvesting now,{' '}
        {data.counts.upcoming} starting within two months.
      </Text>

      {group('Harvesting now', active)}
      {group('Starting soon', upcoming)}

      {off.length ? (
        <View style={styles.group}>
          <Pressable style={styles.toggle} onPress={() => setShowOff((v) => !v)}>
            <Text style={styles.groupTitle}>Off-season ({off.length})</Text>
            <Ionicons
              name={showOff ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
          {showOff
            ? off.map((o) => <OriginCard key={o.country} origin={o} current={data.asOfMonth} />)
            : null}
        </View>
      ) : null}

      <Text style={styles.disclaimer}>{data.disclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  group: { marginTop: 8, gap: 8 },
  groupTitle: { fontFamily: fonts.displaySemi, fontSize: 14, color: colors.navy },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { gap: 8 },
  homeCard: { borderWidth: 1.5, borderColor: colors.farmerGreen },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  country: { fontFamily: fonts.displaySemi, fontSize: 15, color: colors.navy },
  homeTag: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.farmerGreen },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontFamily: fonts.displaySemi, fontSize: 11 },
  timing: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textBody },
  strip: { flexDirection: 'row', gap: 3 },
  stripCol: { flex: 1, alignItems: 'center', gap: 3 },
  stripCell: {
    height: 8,
    alignSelf: 'stretch',
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stripActive: { backgroundColor: colors.farmerGreen },
  stripCurrent: { borderWidth: 2, borderColor: colors.navy, height: 12 },
  stripLabel: { fontFamily: fonts.body, fontSize: 9, color: colors.textMuted },
  stripLabelNow: { fontFamily: fonts.displaySemi, color: colors.navy },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  disclaimer: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 12,
  },
});
