import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ScanLotDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  lotId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  variety?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  moistureNote?: string;
}
