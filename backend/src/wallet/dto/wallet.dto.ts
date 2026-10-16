import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class WalletAmountDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsEnum(PaymentMethod)
  provider: PaymentMethod;

  @IsString()
  @MinLength(10)
  phoneNumber: string;
}

export class RejectWithdrawalDto {
  @IsString()
  @MinLength(1)
  reason: string;
}

export class ApproveWithdrawalDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  payoutReference?: string;
}
