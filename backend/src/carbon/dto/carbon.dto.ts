import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CalculateFootprintDto {
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  batchSize: number;

  @IsNumber()
  @Min(0)
  @Max(40_000)
  distance: number;

  @IsIn(['air', 'sea', 'land'])
  transportMode: 'air' | 'sea' | 'land';

  @IsString()
  @MaxLength(80)
  origin: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  certifications: string[];

  @IsOptional()
  @IsIn(['washed', 'natural', 'honey'])
  processingMethod?: 'washed' | 'natural' | 'honey';

  @IsOptional()
  @IsIn(['plastic', 'paper', 'compostable'])
  packagingType?: 'plastic' | 'paper' | 'compostable';
}

export class AnnualImpactDto {
  @IsNumber()
  @Min(0)
  @Max(100_000)
  monthlyLots: number;

  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  avgBatchSize: number;
}
