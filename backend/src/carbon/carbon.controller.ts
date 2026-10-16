import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AnnualImpactDto, CalculateFootprintDto } from './dto/carbon.dto';
import { CarbonService } from './carbon.service';

@Controller('carbon')
@UseGuards(JwtAuthGuard)
export class CarbonController {
  constructor(private carbon: CarbonService) {}

  @Post('calculate')
  calculateFootprint(
    @Body() body: CalculateFootprintDto,
  ) {
    const footprint = this.carbon.calculateCarbonFootprint(
      {
        batchSize: body.batchSize,
        distance: body.distance,
        transportMode: body.transportMode,
        origin: body.origin,
        certifications: body.certifications,
      },
      body.processingMethod || 'washed',
      body.packagingType || 'paper',
    );
    return footprint;
  }

  @Get('region-stats')
  getRegionStats(@Query('origin') origin: string) {
    if (!origin) {
      return { error: 'Origin parameter required' };
    }
    return this.carbon.getEmissionsByRegion(origin);
  }

  @Post('annual-impact')
  calculateAnnualImpact(
    @Body() body: AnnualImpactDto,
  ) {
    const impact = this.carbon.calculateAnnualImpact(
      body.monthlyLots,
      body.avgBatchSize,
    );
    return impact;
  }

  @Get('offset-projects')
  getOffsetProjects(@Query('origin') origin: string) {
    const stats = this.carbon.getEmissionsByRegion(origin);
    return {
      origin,
      avgEmissions: stats.avgEmissionsPerKg,
      projects: [
        'Global Reforestation Fund',
        'Renewable Energy Initiative',
        'Soil Carbon Sequestration',
      ],
    };
  }
}
