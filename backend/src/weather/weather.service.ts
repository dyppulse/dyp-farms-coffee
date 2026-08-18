import { Injectable } from '@nestjs/common';

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  forecast: string;
  risk: 'low' | 'medium' | 'high';
  recommendation: string;
  timestamp: string;
}

@Injectable()
export class WeatherService {
  private weatherCache: Map<string, WeatherData> = new Map();

  getWeatherByLocation(location: string): WeatherData {
    const cached = this.weatherCache.get(location);
    if (cached) return cached;

    const weather = this.generateMockWeather(location);
    this.weatherCache.set(location, weather);
    return weather;
  }

  private generateMockWeather(location: string): WeatherData {
    const locations: Record<string, Partial<WeatherData>> = {
      Ethiopia: {
        temperature: 22,
        humidity: 65,
        rainfall: 12,
        forecast: 'Partly cloudy with light rain expected',
        risk: 'medium',
      },
      Colombia: {
        temperature: 25,
        humidity: 70,
        rainfall: 8,
        forecast: 'Sunny with afternoon showers',
        risk: 'low',
      },
      Kenya: {
        temperature: 20,
        humidity: 55,
        rainfall: 5,
        forecast: 'Clear skies, ideal conditions',
        risk: 'low',
      },
      Peru: {
        temperature: 18,
        humidity: 75,
        rainfall: 15,
        forecast: 'Overcast with intermittent rain',
        risk: 'high',
      },
      Guatemala: {
        temperature: 23,
        humidity: 68,
        rainfall: 10,
        forecast: 'Cloudy with possible thunderstorms',
        risk: 'medium',
      },
      Brazil: {
        temperature: 26,
        humidity: 60,
        rainfall: 3,
        forecast: 'Dry and warm',
        risk: 'low',
      },
    };

    const base = locations[location] || {
      temperature: 22,
      humidity: 65,
      rainfall: 10,
      forecast: 'Variable conditions',
      risk: 'medium' as const,
    };

    const recommendations: Record<string, string> = {
      low: 'Excellent harvesting conditions. Proceed with harvest operations.',
      medium: 'Monitor weather closely. Implement rain protection measures if needed.',
      high: 'High risk conditions. Consider postponing harvest or increasing protection.',
    };

    return {
      location,
      temperature: base.temperature!,
      humidity: base.humidity!,
      rainfall: base.rainfall!,
      forecast: base.forecast!,
      risk: base.risk as any,
      recommendation: recommendations[base.risk as string],
      timestamp: new Date().toISOString(),
    };
  }

  getMultipleLocations(locations: string[]): WeatherData[] {
    return locations.map((loc) => this.getWeatherByLocation(loc));
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
}
