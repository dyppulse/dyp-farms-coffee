import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const CONNECT_ATTEMPTS = 5;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /** Neon scales idle databases to zero, so the first connection after a quiet
   * spell can take a few seconds. Retry with backoff instead of crashing the boot. */
  async onModuleInit() {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (error) {
        if (attempt >= CONNECT_ATTEMPTS) throw error;
        const delayMs = attempt * 2000;
        this.logger.warn(
          `Database not reachable (attempt ${attempt}/${CONNECT_ATTEMPTS}), retrying in ${delayMs / 1000}s…`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
