import { Injectable, Logger } from '@nestjs/common';
import { HARVEST_ORIGINS, HarvestOrigin } from './harvest-seasons.data';

export interface WeatherData {
  location: string;
  /** The place the reading is for, e.g. "Mbale, Mt Elgon". */
  place: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast: string;
  risk: 'low' | 'medium' | 'high';
  recommendation: string;
  timestamp: string;
  /** "live" = Open-Meteo reading; "estimate" = built-in typical values (API unreachable). */
  source: 'live' | 'estimate';
}

interface Region {
  name: string;
  place: string;
  lat: number;
  lng: number;
}

/** Coffee-growing regions we report on. Uganda stays first: it is the home origin. */
const REGIONS: Region[] = [
  { name: 'Uganda', place: 'Mbale, Mt Elgon', lat: 1.0827, lng: 34.1754 },
  { name: 'Kenya', place: 'Nyeri', lat: -0.4167, lng: 36.95 },
  { name: 'Ethiopia', place: 'Jimma', lat: 7.6667, lng: 36.8333 },
  { name: 'Colombia', place: 'Manizales', lat: 5.07, lng: -75.5206 },
  { name: 'Peru', place: 'Chanchamayo', lat: -11.05, lng: -75.3333 },
  { name: 'Guatemala', place: 'Antigua', lat: 14.5586, lng: -90.7295 },
  {
    name: 'Brazil',
    place: 'Varginha, Minas Gerais',
    lat: -21.5514,
    lng: -45.4303,
  },
];

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const CACHE_TTL_MS = 30 * 60 * 1000;

export type SeasonStatus = 'active' | 'upcoming' | 'off';

export interface SeasonMonth {
  month: number;
  active: boolean;
}

export interface OriginSeason {
  country: string;
  region: HarvestOrigin['region'];
  coffee: HarvestOrigin['coffee'];
  status: SeasonStatus;
  /** Window label for the active (or next) crop, e.g. "Main crop". */
  window: string;
  /** Human text, e.g. "Oct to Feb". */
  range: string;
  /** Whole months until the window ends (active) or begins (upcoming/off). */
  monthsAway: number;
  months: SeasonMonth[];
  note?: string;
}

const inWindow = (m: number, start: number, end: number) =>
  start <= end ? m >= start && m <= end : m >= start || m <= end;

const monthsUntil = (from: number, to: number) => (to - from + 12) % 12;

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private cache = new Map<string, { at: number; data: WeatherData }>();

  /** Region names in display order (Uganda first). */
  getRegionNames(): string[] {
    return REGIONS.map((r) => r.name);
  }

  async getWeatherByLocation(location: string): Promise<WeatherData> {
    const name = location || 'Uganda';
    const hit = this.cache.get(name);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

    const region = REGIONS.find(
      (r) => r.name.toLowerCase() === name.toLowerCase(),
    );
    let data: WeatherData | null = null;
    if (region) {
      try {
        data = await this.fetchLive(region);
      } catch (error) {
        this.logger.warn(
          `Live weather unavailable for ${region.name}: ${(error as Error).message}`,
        );
      }
    }
    data ??= this.estimate(name, region?.place ?? name);

    // Only cache live readings for the full TTL; retry estimates sooner.
    this.cache.set(name, {
      at:
        data.source === 'live'
          ? Date.now()
          : Date.now() - CACHE_TTL_MS + 60_000,
      data,
    });
    return data;
  }

  async getMultipleLocations(locations: string[]): Promise<WeatherData[]> {
    return Promise.all(locations.map((loc) => this.getWeatherByLocation(loc)));
  }

  private async fetchLive(region: Region): Promise<WeatherData> {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${region.lat}&longitude=${region.lng}` +
      '&current=temperature_2m,relative_humidity_2m,weather_code' +
      '&daily=precipitation_sum&timezone=auto&forecast_days=1';
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as {
      current: {
        temperature_2m: number;
        relative_humidity_2m: number;
        weather_code: number;
      };
      daily: { precipitation_sum: number[] };
    };

    const temperature = Math.round(body.current.temperature_2m);
    const humidity = Math.round(body.current.relative_humidity_2m);
    const rainfall =
      Math.round((body.daily.precipitation_sum[0] ?? 0) * 10) / 10;
    const { risk, reason } = this.getHarvestRisk(
      temperature,
      humidity,
      rainfall,
    );

    return {
      location: region.name,
      place: region.place,
      temperature,
      humidity,
      rainfall,
      forecast: this.describe(body.current.weather_code),
      risk,
      recommendation: this.recommendation(risk, reason),
      timestamp: new Date().toISOString(),
      source: 'live',
    };
  }

  /** WMO weather interpretation codes, in plain words. */
  private describe(code: number): string {
    if (code === 0) return 'Clear skies';
    if (code <= 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code === 45 || code === 48) return 'Foggy';
    if (code >= 51 && code <= 57) return 'Light drizzle';
    if (code >= 61 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 95) return 'Thunderstorms';
    return 'Variable conditions';
  }

  private recommendation(
    risk: 'low' | 'medium' | 'high',
    reason: string,
  ): string {
    const advice = {
      low: 'Good harvesting and drying conditions. Proceed with harvest operations.',
      medium:
        'Monitor the weather closely and have rain protection ready for drying beds.',
      high: 'High-risk conditions. Consider postponing harvest or protecting drying coffee.',
    };
    return `${advice[risk]} (${reason})`;
  }

  /** Typical values, used only when the live service can't be reached. */
  private estimate(location: string, place: string): WeatherData {
    const typical: Record<
      string,
      { t: number; h: number; r: number; f: string }
    > = {
      Uganda: { t: 24, h: 70, r: 6, f: 'Partly cloudy with afternoon showers' },
      Ethiopia: { t: 22, h: 65, r: 12, f: 'Partly cloudy with light rain' },
      Colombia: { t: 25, h: 70, r: 8, f: 'Sunny with afternoon showers' },
      Kenya: { t: 20, h: 55, r: 5, f: 'Clear skies' },
      Peru: { t: 18, h: 75, r: 15, f: 'Overcast with intermittent rain' },
      Guatemala: {
        t: 23,
        h: 68,
        r: 10,
        f: 'Cloudy with possible thunderstorms',
      },
      Brazil: { t: 26, h: 60, r: 3, f: 'Dry and warm' },
    };
    const base = typical[location] ?? {
      t: 22,
      h: 65,
      r: 10,
      f: 'Variable conditions',
    };
    const { risk, reason } = this.getHarvestRisk(base.t, base.h, base.r);
    return {
      location,
      place,
      temperature: base.t,
      humidity: base.h,
      rainfall: base.r,
      forecast: `${base.f} (typical, live data unavailable)`,
      risk,
      recommendation: this.recommendation(risk, reason),
      timestamp: new Date().toISOString(),
      source: 'estimate',
    };
  }

  getHarvestRisk(
    temperature: number,
    humidity: number,
    rainfall: number,
  ): { risk: 'low' | 'medium' | 'high'; reason: string } {
    if (rainfall > 12 || humidity > 80 || temperature < 15) {
      return {
        risk: 'high',
        reason: 'Excessive moisture or unfavorable temperature conditions',
      };
    }
    if (rainfall > 8 || humidity > 70) {
      return {
        risk: 'medium',
        reason: 'Moderate moisture levels. Monitor conditions.',
      };
    }
    return {
      risk: 'low',
      reason: 'Ideal conditions for harvesting',
    };
  }

  /** Where coffee is being harvested right now. `month` (1-12) is for testing. */
  getHarvestSeasons(month = new Date().getUTCMonth() + 1) {
    const origins: OriginSeason[] = HARVEST_ORIGINS.map((o) => {
      const months = MONTH_NAMES.map((_, i) => ({
        month: i + 1,
        active: o.windows.some((w) =>
          inWindow(i + 1, w.startMonth, w.endMonth),
        ),
      }));
      const current = o.windows.find((w) =>
        inWindow(month, w.startMonth, w.endMonth),
      );
      const range = (w: { startMonth: number; endMonth: number }) =>
        `${MONTH_NAMES[w.startMonth - 1]} to ${MONTH_NAMES[w.endMonth - 1]}`;

      if (current) {
        return {
          country: o.country,
          region: o.region,
          coffee: o.coffee,
          status: 'active',
          window: current.label,
          range: range(current),
          monthsAway: monthsUntil(month, current.endMonth),
          months,
          note: o.note,
        };
      }
      const next = [...o.windows].sort(
        (a, b) =>
          monthsUntil(month, a.startMonth) - monthsUntil(month, b.startMonth),
      )[0];
      const away = monthsUntil(month, next.startMonth);
      return {
        country: o.country,
        region: o.region,
        coffee: o.coffee,
        status: away <= 2 ? 'upcoming' : 'off',
        window: next.label,
        range: range(next),
        monthsAway: away,
        months,
        note: o.note,
      };
    });

    // Home origin first, then by status, then soonest change.
    const order: Record<SeasonStatus, number> = {
      active: 0,
      upcoming: 1,
      off: 2,
    };
    origins.sort((a, b) => {
      if (a.country === 'Uganda') return -1;
      if (b.country === 'Uganda') return 1;
      return order[a.status] - order[b.status] || a.monthsAway - b.monthsAway;
    });

    return {
      asOfMonth: month,
      asOfMonthName: MONTH_NAMES[month - 1],
      counts: {
        active: origins.filter((o) => o.status === 'active').length,
        upcoming: origins.filter((o) => o.status === 'upcoming').length,
        total: origins.length,
      },
      disclaimer:
        'Typical harvest windows. Actual timing varies by altitude, region and year; confirm locally before planning.',
      origins,
    };
  }
}
