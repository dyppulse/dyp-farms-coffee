import { Injectable } from '@nestjs/common';

export interface CarbonFootprint {
  lotId: string;
  totalCo2kg: number;
  farming: number;
  processing: number;
  transportation: number;
  packaging: number;
  offsetCost: number;
  offsetProjects: string[];
  certification: string;
  createdAt: string;
}

export interface CarbonMetrics {
  batchSize: number; // kg
  distance: number; // km from farm to destination
  transportMode: 'air' | 'sea' | 'land';
  origin: string;
  certifications: string[]; // organic, fair-trade, etc
}

@Injectable()
export class CarbonService {
  // Carbon emissions factors (kg CO2 per unit)
  private readonly emissionFactors = {
    farming: {
      conventional: 0.5, // kg CO2 per kg coffee
      organic: 0.35,
      regenerative: 0.25,
    },
    processing: {
      washed: 0.15,
      natural: 0.1,
      honey: 0.12,
    },
    transportation: {
      air: 4.5, // kg CO2 per kg per 1000km
      sea: 0.8,
      land: 0.12, // per km
    },
    packaging: {
      plastic: 0.08,
      paper: 0.04,
      compostable: 0.02,
    },
  };

  // Carbon offset prices per ton CO2
  private readonly offsetPrices = {
    reforestation: 15,
    renewable: 12,
    methane_capture: 18,
    soil_carbon: 20,
  };

  calculateCarbonFootprint(
    metrics: CarbonMetrics,
    processingMethod: 'washed' | 'natural' | 'honey' = 'washed',
    packagingType: 'plastic' | 'paper' | 'compostable' = 'paper',
  ): CarbonFootprint {
    const { batchSize, distance, transportMode, origin, certifications } =
      metrics;

    // Farming emissions
    let farmingEmissions = this.calculateFarmingEmissions(
      batchSize,
      origin,
      certifications,
    );

    // Processing emissions
    const processingEmissions =
      batchSize * this.emissionFactors.processing[processingMethod];

    // Transportation emissions
    let transportEmissions = 0;
    if (transportMode === 'air') {
      transportEmissions =
        (batchSize * distance * this.emissionFactors.transportation.air) / 1000;
    } else if (transportMode === 'sea') {
      transportEmissions =
        (batchSize * distance * this.emissionFactors.transportation.sea) / 1000;
    } else {
      transportEmissions =
        batchSize * distance * this.emissionFactors.transportation.land;
    }

    // Packaging emissions
    const packagingEmissions =
      batchSize * this.emissionFactors.packaging[packagingType];

    // Total emissions
    const totalCo2kg =
      farmingEmissions +
      processingEmissions +
      transportEmissions +
      packagingEmissions;

    // Calculate offset cost (assume $15-20 per ton CO2)
    const offsetCost = (totalCo2kg / 1000) * this.offsetPrices.reforestation;

    // Determine certification based on emissions
    const certification = this.getCertificationLevel(totalCo2kg, batchSize);

    // Suggest offset projects based on profile
    const offsetProjects = this.suggestOffsetProjects(
      origin,
      certifications,
    );

    return {
      lotId: `lot-${Date.now()}`,
      totalCo2kg: Math.round(totalCo2kg * 100) / 100,
      farming: Math.round(farmingEmissions * 100) / 100,
      processing: Math.round(processingEmissions * 100) / 100,
      transportation: Math.round(transportEmissions * 100) / 100,
      packaging: Math.round(packagingEmissions * 100) / 100,
      offsetCost: Math.round(offsetCost * 100) / 100,
      offsetProjects,
      certification,
      createdAt: new Date().toISOString(),
    };
  }

  private calculateFarmingEmissions(
    batchSize: number,
    origin: string,
    certifications: string[],
  ): number {
    // Base emission factor varies by region
    const regionFactors: Record<string, number> = {
      Ethiopia: 0.45,
      Colombia: 0.5,
      Kenya: 0.48,
      Peru: 0.52,
      Guatemala: 0.49,
      Brazil: 0.55,
    };

    let factor =
      regionFactors[origin] || this.emissionFactors.farming.conventional;

    // Reduce emissions if organic/regenerative
    if (certifications.includes('organic')) {
      factor = this.emissionFactors.farming.organic;
    }
    if (certifications.includes('regenerative')) {
      factor = this.emissionFactors.farming.regenerative;
    }

    return batchSize * factor;
  }

  private getCertificationLevel(
    totalCo2kg: number,
    batchSize: number,
  ): string {
    const emissionsPerKg = totalCo2kg / batchSize;

    if (emissionsPerKg < 0.7) {
      return 'Carbon Neutral';
    } else if (emissionsPerKg < 1.0) {
      return 'Low Carbon';
    } else if (emissionsPerKg < 1.5) {
      return 'Standard';
    } else {
      return 'High Impact';
    }
  }

  private suggestOffsetProjects(
    origin: string,
    certifications: string[],
  ): string[] {
    const projects = [];

    // Suggest local reforestation
    const reforestationProjects: Record<string, string> = {
      Ethiopia: 'Ethiopian Highlands Reforestation',
      Colombia: 'Amazon Rainforest Conservation',
      Kenya: 'Mount Kenya Forest Project',
      Peru: 'Amazon Indigenous Communities',
      Guatemala: 'Mesoamerican Forest Initiative',
      Brazil: 'Atlantic Forest Restoration',
    };

    projects.push(reforestationProjects[origin] || 'Global Reforestation Fund');

    // Add renewable energy if not already certified
    if (!certifications.includes('renewable')) {
      projects.push('Wind Power in Kenya');
    }

    // Add soil carbon if organic
    if (certifications.includes('organic')) {
      projects.push('Soil Carbon Sequestration Program');
    }

    return projects.slice(0, 3);
  }

  getEmissionsByRegion(origin: string): {
    region: string;
    avgEmissionsPerKg: number;
    topProducer: boolean;
  } {
    const emissions: Record<string, number> = {
      Ethiopia: 0.45,
      Colombia: 0.5,
      Kenya: 0.48,
      Peru: 0.52,
      Guatemala: 0.49,
      Brazil: 0.55,
    };

    return {
      region: origin,
      avgEmissionsPerKg: emissions[origin] || 0.5,
      topProducer: ['Ethiopia', 'Colombia', 'Brazil'].includes(origin),
    };
  }

  calculateAnnualImpact(
    monthlyLots: number,
    avgBatchSize: number,
  ): {
    annualCo2kg: number;
    offsetCost: number;
    treeEquivalent: number;
    description: string;
  } {
    const avgEmissionsPerLot = avgBatchSize * 1.2; // estimated
    const annualCo2kg = monthlyLots * 12 * avgEmissionsPerLot;
    const offsetCost = (annualCo2kg / 1000) * 15;

    // 1 mature tree absorbs ~20kg CO2 per year
    const treeEquivalent = Math.ceil(annualCo2kg / 20);

    let description = '';
    if (annualCo2kg < 500) {
      description = 'Your coffee production has minimal environmental impact';
    } else if (annualCo2kg < 2000) {
      description =
        'Your coffee production has moderate environmental impact. Consider carbon offsets';
    } else {
      description =
        'Your coffee production has significant environmental impact. Offsetting recommended';
    }

    return {
      annualCo2kg: Math.round(annualCo2kg * 100) / 100,
      offsetCost: Math.round(offsetCost * 100) / 100,
      treeEquivalent,
      description,
    };
  }
}
