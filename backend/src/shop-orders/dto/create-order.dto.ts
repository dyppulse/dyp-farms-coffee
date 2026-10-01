import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  Min,
  MinLength,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { DeliveryMethod, PaymentMethod, ShopChannel } from '@prisma/client';

export class OrderItemInputDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsEnum(ShopChannel)
  channel: ShopChannel;

  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @ValidateIf((dto: CreateOrderDto) => dto.deliveryMethod === 'shipping')
  @IsString()
  @MinLength(5)
  deliveryAddress?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @MinLength(10)
  phoneNumber: string;
}
