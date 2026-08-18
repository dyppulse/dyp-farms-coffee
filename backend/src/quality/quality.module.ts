import { Module } from '@nestjs/common';
import { StoreModule } from '../common/data/store.module';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';

@Module({
  imports: [StoreModule],
  controllers: [QualityController],
  providers: [QualityService],
})
export class QualityModule {}
