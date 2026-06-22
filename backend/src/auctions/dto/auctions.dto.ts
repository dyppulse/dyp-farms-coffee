import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class PlaceBidDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsBoolean()
  autoBid?: boolean;
}
