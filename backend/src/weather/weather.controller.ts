import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private weather: WeatherService) {}

  /** Region names in display order, Uganda first. */
  @Get('regions')
  getRegions() {
    return { regions: this.weather.getRegionNames() };
  }

  @Get('location')
  getWeatherByLocation(@Query('location') location: string) {
    return this.weather.getWeatherByLocation(location || 'Uganda');
  }

  @Get('locations')
  async getMultipleLocations(@Query('locations') locationsStr = '') {
    const locations = locationsStr
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);
    const weatherData = await this.weather.getMultipleLocations(
      locations.length ? locations : this.weather.getRegionNames(),
    );
    return { locations: weatherData };
  }

  /** Which coffee origins are harvesting now, soon, or are off-season. */
  @Get('harvest-seasons')
  getHarvestSeasons(@Query('month') month?: string) {
    const m = Number(month);
    return this.weather.getHarvestSeasons(
      Number.isInteger(m) && m >= 1 && m <= 12 ? m : undefined,
    );
  }

  @Get('risk')
  getHarvestRisk(
    @Query('temperature') temp: string,
    @Query('humidity') humidity: string,
    @Query('rainfall') rainfall: string,
  ) {
    const risk = this.weather.getHarvestRisk(
      parseFloat(temp) || 22,
      parseFloat(humidity) || 65,
      parseFloat(rainfall) || 10,
    );
    return risk;
  }
}
