import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/auth.guard';
import { loadDemoLogins } from '../common/data/demo-logins';

/**
 * The demo test accounts (see prisma/demo), for admins to hand out to testers. These are
 * test logins only; they are never returned to anyone who is not signed in as an admin.
 */
@Controller('admin/demo-accounts')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminDemoAccountsController {
  @Get()
  list() {
    const logins = loadDemoLogins();
    return {
      ...logins,
      counts: {
        farmers: logins.farmers.length,
        buyers: logins.buyers.length,
        tourists: logins.tourists.length,
      },
    };
  }
}
