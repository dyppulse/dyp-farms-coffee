import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiExtended } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { FilterChips } from '../src/components/FilterChips';
import { Input } from '../src/components/Input';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { ScreenScrollView } from '../src/components/ScreenScrollView';
import { WeatherCard } from '../src/components/WeatherCard';
import { colors } from '../src/theme/colors';
import { fonts } from '../src/theme/typography';

const LOCATIONS = ['Kenya', 'Ethiopia', 'Colombia', 'Peru', 'Guatemala', 'Brazil'];

type WeatherData = {
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast: string;
  risk: 'low' | 'medium' | 'high';
  recommendation: string;
};

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState('Kenya');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const [temp, setTemp] = useState('22');
  const [humidity, setHumidity] = useState('65');
  const [rainfall, setRainfall] = useState('10');
  const [riskCheck, setRiskCheck] = useState<{ risk: string; reason: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async (loc: string) => {
    setLoading(true);
    try {
      const data = await apiExtended.weather.getByLocation(loc);
      setWeather(data as WeatherData);
    } catch {
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(location);
  }, [location, load]);

  const checkRisk = async () => {
    setChecking(true);
    try {
      const result = await apiExtended.weather.getHarvestRisk(
        Number(temp) || 0,
        Number(humidity) || 0,
        Number(rainfall) || 0,
      );
      setRiskCheck(result as { risk: string; reason: string });
    } catch {
      setRiskCheck(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="Weather & Insights" />
      <ScreenScrollView contentContainerStyle={styles.content}>
        <FilterChips options={LOCATIONS} value={location} onChange={setLocation} />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.navy} />
          </View>
        ) : weather ? (
          <WeatherCard
            location={weather.location}
            temperature={weather.temperature}
            humidity={weather.humidity}
            rainfall={weather.rainfall}
            forecast={weather.forecast}
            risk={weather.risk}
            recommendation={weather.recommendation}
          />
        ) : (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>Couldn't load weather for {location}.</Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Harvest Risk Calculator</Text>
        <Text style={styles.sectionSub}>
          Try different conditions to see the harvest recommendation before you commit a crew.
        </Text>
        <Card style={styles.calcCard}>
          <View style={styles.calcRow}>
            <View style={styles.calcField}>
              <Input label="Temp (°C)" value={temp} onChangeText={setTemp} keyboardType="numeric" />
            </View>
            <View style={styles.calcField}>
              <Input label="Humidity (%)" value={humidity} onChangeText={setHumidity} keyboardType="numeric" />
            </View>
            <View style={styles.calcField}>
              <Input label="Rainfall (mm)" value={rainfall} onChangeText={setRainfall} keyboardType="numeric" />
            </View>
          </View>
          <Button title="Check Risk" onPress={checkRisk} loading={checking} />
          {riskCheck ? (
            <View style={styles.riskResult}>
              <Text style={styles.riskResultLabel}>
                {riskCheck.risk.toUpperCase()} RISK
              </Text>
              <Text style={styles.riskResultReason}>{riskCheck.reason}</Text>
            </View>
          ) : null}
        </Card>
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.lavender },
  content: { padding: 16, gap: 12 },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  errorCard: { alignItems: 'center', paddingVertical: 24 },
  errorText: { fontFamily: fonts.body, color: colors.textMuted },
  sectionTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 16,
    color: colors.navy,
    marginTop: 8,
  },
  sectionSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  calcCard: { gap: 12 },
  calcRow: { flexDirection: 'row', gap: 8 },
  calcField: { flex: 1 },
  riskResult: {
    backgroundColor: colors.lavender,
    borderRadius: 10,
    padding: 12,
  },
  riskResultLabel: {
    fontFamily: fonts.displayExtra,
    fontSize: 13,
    color: colors.navy,
  },
  riskResultReason: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
