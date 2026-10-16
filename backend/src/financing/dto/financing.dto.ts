import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CalculateOfferDto {
  @IsNumber()
  @Min(0)
  @Max(10_000_000_000)
  receiptValue: number;
}

export class RequestLoanDto {
  // Optional: the lot is taken from the receipt. If sent, it must match.
  @IsOptional()
  @IsString()
  @MaxLength(64)
  lotId?: string;

  @IsString()
  @MaxLength(64)
  receiptId: string;

  @IsNumber()
  @Min(1)
  @Max(10_000_000_000)
  amount: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  duration?: number;
}
