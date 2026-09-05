import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    let db: 'ok' | 'unreachable' = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'unreachable';
    }

    // Always 200: this is Render's deploy health check, so a transient DB
    // hiccup shouldn't strand a deploy in "unhealthy" forever. Watch the
    // `db` field (or logs) to notice real outages instead.
    return {
      status: 'ok',
      db,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
