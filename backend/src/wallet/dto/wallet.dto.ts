import { IsEnum, IsInt, IsString, Min, MinLength } from 'class-validator';
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
