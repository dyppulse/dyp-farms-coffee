import { Ionicons } from '@expo/vector-icons';
import { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface CarbonFootprintProps {
  totalCo2kg: number;
  farming: number;
  processing: number;
  transportation: number;
  packaging: number;
  offsetCost: number;
  certification: string;
  offsetProjects: string[];
}

export function CarbonFootprint({
  totalCo2kg,
  farming,
  processing,
  transportation,
  packaging,
  offsetCost,
  certification,
  offsetProjects,
}: CarbonFootprintProps): ReactElement {
  const certColors = {
    'Carbon Neutral': colors.success,
    'Low Carbon': '#10B981',
    Standard: colors.warning,
    'High Impact': colors.error,
  };

  const certColor = certColors[certification as keyof typeof certColors] || colors.warning;
  const treeEquivalent = Math.ceil(totalCo2kg / 20); // 1 tree absorbs ~20kg CO2/year

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="leaf" size={24} color={certColor} />
        <View style={styles.headerContent}>
          <Text style={styles.title}>Carbon Footprint</Text>
          <Text style={[styles.certification, { color: certColor }]}>
            {certification}
          </Text>
        </View>
      </View>

      <View style={styles.mainMetric}>
        <Text style={styles.totalLabel}>Total Emissions</Text>
        <View style={styles.totalValue}>
          <Text style={styles.totalNumber}>{totalCo2kg}</Text>
          <Text style={styles.totalUnit}>kg CO₂</Text>
        </View>
        <Text style={styles.treeEquivalent}>
          = {treeEquivalent} trees needed to offset
        </Text>
      </View>

      <View style={styles.breakdown}>
        <Text style={styles.breakdownTitle}>Breakdown by Source</Text>
        <BreakdownItem label="Farming" value={farming} total={totalCo2kg} />
        <BreakdownItem label="Processing" value={processing} total={totalCo2kg} />
        <BreakdownItem label="Transportation" value={transportation} total={totalCo2kg} />
        <BreakdownItem label="Packaging" value={packaging} total={totalCo2kg} />
      </View>

      <View style={styles.offsetSection}>
        <View style={styles.offsetHeader}>
          <Text style={styles.offsetLabel}>Carbon Offset Cost</Text>
          <Text style={styles.offsetCost}>${offsetCost.toFixed(2)}</Text>
        </View>
        <Text style={styles.offsetSubtext}>
          Fund verified offset projects to neutralize emissions
        </Text>
      </View>

      {offsetProjects.length > 0 && (
        <View style={styles.projects}>
          <Text style={styles.projectsTitle}>Recommended Offset Projects</Text>
          {offsetProjects.map((project, idx) => (
            <View key={idx} style={styles.projectItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.projectName}>{project}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.impact}>
        <Ionicons name="information-circle" size={16} color={colors.navy} />
        <Text style={styles.impactText}>
          Every offset purchase supports verified environmental projects worldwide
        </Text>
      </View>
    </View>
  );
}

function BreakdownItem({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}): ReactElement {
  const percentage = (value / total) * 100;

  return (
    <View style={styles.breakdownItem}>
      <View style={styles.breakdownLeft}>
        <Text style={styles.breakdownLabel}>{label}</Text>
        <Text style={styles.breakdownValue}>{value.toFixed(2)} kg</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  certification: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  mainMetric: {
    backgroundColor: colors.lavender,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  totalValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.navy,
  },
  totalUnit: {
    fontSize: 12,
    color: colors.navy,
    fontWeight: '600',
  },
  treeEquivalent: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  breakdown: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  breakdownLeft: {
    width: 80,
  },
  breakdownLabel: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.navy,
    height: '100%',
  },
  percentage: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
  offsetSection: {
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  offsetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  offsetLabel: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  offsetCost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0284C7',
  },
  offsetSubtext: {
    fontSize: 11,
    color: '#0C2340',
  },
  projects: {
    marginBottom: 12,
  },
  projectsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  projectName: {
    fontSize: 12,
    color: colors.text,
  },
  impact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.lavender,
    borderRadius: 8,
    padding: 10,
  },
  impactText: {
    fontSize: 11,
    color: colors.navy,
    flex: 1,
    lineHeight: 16,
  },
});
