import { Ionicons } from '@expo/vector-icons';
import { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

interface WeatherCardProps {
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast: string;
  risk: 'low' | 'medium' | 'high';
  recommendation: string;
}

export function WeatherCard({
  location,
  temperature,
  humidity,
  rainfall,
  forecast,
  risk,
  recommendation,
}: WeatherCardProps): ReactElement {
  const riskColors = {
    low: colors.success,
    medium: colors.warning,
    high: colors.error,
  };

  const riskIcons = {
    low: 'checkmark-circle',
    medium: 'alert-circle',
    high: 'close-circle',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.location}>{location}</Text>
          <Text style={styles.forecast}>{forecast}</Text>
        </View>
        <View style={styles.temperature}>
          <Ionicons name="thermometer-outline" size={32} color={colors.navy} />
          <Text style={styles.tempValue}>{temperature}°C</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="water-outline" size={18} color={colors.navy} />
          <View>
            <Text style={styles.detailLabel}>Humidity</Text>
            <Text style={styles.detailValue}>{humidity}%</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="cloud-download-outline" size={18} color={colors.navy} />
          <View>
            <Text style={styles.detailLabel}>Rainfall</Text>
            <Text style={styles.detailValue}>{rainfall}mm</Text>
          </View>
        </View>
      </View>

      <View style={[styles.riskBox, { backgroundColor: riskColors[risk] }]}>
        <Ionicons
          name={riskIcons[risk]}
          size={16}
          color={colors.white}
          style={{ marginRight: 8 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.riskLabel}>
            {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
          </Text>
          <Text style={styles.riskRecommendation}>{recommendation}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  forecast: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  temperature: {
    alignItems: 'center',
  },
  tempValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
    marginTop: 4,
  },
  details: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  riskBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  riskRecommendation: {
    fontSize: 11,
    color: colors.white,
    marginTop: 2,
    opacity: 0.9,
  },
});
