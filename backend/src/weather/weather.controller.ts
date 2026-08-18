import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private weather: WeatherService) {}

  @Get('location')
  getWeatherByLocation(@Query('location') location: string) {
    const weather = this.weather.getWeatherByLocation(location || 'Ethiopia');
    return weather;
  }

  @Get('locations')
  getMultipleLocations(@Query('locations') locationsStr: string) {
    const locations = locationsStr.split(',').map((l) => l.trim());
    const weatherData = this.weather.getMultipleLocations(locations);
    return { locations: weatherData };
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
