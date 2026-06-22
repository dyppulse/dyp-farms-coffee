import { IsNumber, Min } from 'class-validator';

export class WalletAmountDto {
  @IsNumber()
  @Min(1)
  amount: number;
}
