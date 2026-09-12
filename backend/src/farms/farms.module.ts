import { Module } from '@nestjs/common';
import { FarmsController, AdminFarmsController } from './farms.controller';
import { FarmsService } from './farms.service';

// PrismaService/StoreService come from PrismaModule/StoreModule, both @Global().
@Module({
  controllers: [FarmsController, AdminFarmsController],
  providers: [FarmsService],
  exports: [FarmsService],
})
export class FarmsModule {}
