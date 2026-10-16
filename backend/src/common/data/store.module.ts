import { Global, Module } from '@nestjs/common';
import { DemoSeedService } from './demo-seed.service';
import { StoreService } from './store.service';

@Global()
@Module({
  providers: [StoreService, DemoSeedService],
  exports: [StoreService],
})
export class StoreModule {}
