import 'reflect-metadata';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/auth.guard';
import { parseDemoLogins } from '../common/data/demo-logins';
import { AdminDemoAccountsController } from './demo-accounts.controller';

describe('demo accounts', () => {
  it('is only reachable by a signed-in admin', () => {
    const guards: unknown[] = Reflect.getMetadata('__guards__', AdminDemoAccountsController) ?? [];
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, AdminGuard]));
  });

  it('parses sections, skips comments and keeps every field', () => {
    const parsed = parseDemoLogins(
      ['# comment', '## farmers', 'a@demo.dypfarms.test\tpw1\tfarmer\tAda Lule\tMasaka', '', '## buyers', 'b@demo.dypfarms.test\tpw2\troaster\tBen K\t', 'broken line'].join('\n'),
    );
    expect(parsed.farmers).toEqual([{ email: 'a@demo.dypfarms.test', password: 'pw1', role: 'farmer', name: 'Ada Lule', district: 'Masaka' }]);
    expect(parsed.buyers[0]).toMatchObject({ role: 'roaster', district: '' });
    expect(parsed.tourists).toEqual([]);
  });

  it('reads all 1,090 accounts from the committed logins file', () => {
    const parsed = parseDemoLogins(readFileSync(join(__dirname, '..', '..', 'prisma', 'demo', 'DEMO_LOGINS.txt'), 'utf8'));
    expect(parsed.farmers).toHaveLength(1000);
    expect(parsed.buyers.length).toBeGreaterThanOrEqual(50);
    expect(parsed.tourists.length).toBeGreaterThanOrEqual(20);
  });

  it('the endpoint returns the lists with counts', () => {
    const result = new AdminDemoAccountsController().list();
    expect(result.counts.farmers).toBe(result.farmers.length);
  });
});
