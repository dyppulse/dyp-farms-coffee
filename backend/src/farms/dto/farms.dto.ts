import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BoundaryPointDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateFarmDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  sizeHectares?: number;

  /** A single-point "pin" is a 1-element array; a traced field boundary has 3+. */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BoundaryPointDto)
  boundary: BoundaryPointDto[];
}

export class UpdateFarmDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsNumber()
  sizeHectares?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BoundaryPointDto)
  boundary?: BoundaryPointDto[];
}
