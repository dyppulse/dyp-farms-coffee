import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SearchLotsDto {
  @IsOptional()
  @IsString()
  search?: string;
}

export class AddToCartDto {
  @IsString()
  lotId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}
