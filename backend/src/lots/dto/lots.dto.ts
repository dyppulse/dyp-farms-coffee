import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SearchLotsDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateLotDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  cuppingNotes?: string;

  @IsOptional()
  @IsString()
  traceability?: string;

  @IsOptional()
  @IsString()
  warehouse?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  farmId?: string;
}

export class AddToCartDto {
  @IsString()
  lotId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
