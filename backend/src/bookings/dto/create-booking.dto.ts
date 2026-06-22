import { IsEnum, IsInt, IsString, Min, MinLength } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreateBookingDto {
  @IsString()
  slotId: string;

  @IsInt()
  @Min(1)
  guests: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @MinLength(10)
  phoneNumber: string;
}
