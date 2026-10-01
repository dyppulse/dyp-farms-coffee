import { Module } from '@nestjs/common';
import {
  AdminProductsController,
  ProductsController,
} from './products.controller';
import { ProductsService } from './products.service';

// PrismaService comes from PrismaModule, which is @Global().
@Module({
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ShopProductsModule {}
