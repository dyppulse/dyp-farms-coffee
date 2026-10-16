import { Type } from 'class-transformer';
import {
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class GpsLocationDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}

export class QualityDataDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  variety?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  moistureLevel?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => GpsLocationDto)
  gpsLocation?: GpsLocationDto;
}

export class GenerateReceiptDto {
  @IsString()
  @MaxLength(64)
  lotId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => QualityDataDto)
  qualityData?: QualityDataDto;
}

export class ShareReceiptDto {
  @IsIn(['pdf', 'email', 'link'])
  format: 'pdf' | 'email' | 'link';
}
