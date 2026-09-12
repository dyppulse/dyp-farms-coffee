import { Module } from '@nestjs/common';
import { StoreModule } from '../common/data/store.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';

@Module({
  imports: [StoreModule, NotificationsModule],
  controllers: [QualityController],
  providers: [QualityService],
})
export class QualityModule {}
