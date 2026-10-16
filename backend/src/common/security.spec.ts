import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SkipThrottle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Test } from '@nestjs/testing';
import helmet from 'helmet';
import request from 'supertest';

@Controller('ping')
class PingController {
  @Get()
  ping() {
    return { ok: true };
  }

  @SkipThrottle()
  @Get('free')
  free() {
    return { ok: true };
  }
}

@Module({
  imports: [ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 3 }])],
  controllers: [PingController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
class TestModule {}

describe('API hardening', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestModule] }).compile();
    app = moduleRef.createNestApplication();
    app.getHttpAdapter().getInstance().disable('x-powered-by');
    app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } } }));
    await app.init();
  });

  afterAll(() => app.close());

  it('sends security headers and hides Express', async () => {
    const res = await request(app.getHttpServer()).get('/ping/free');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
  });

  it('rate limits a client after the allowance and keeps exempt routes open', async () => {
    const server = app.getHttpServer();
    const codes: number[] = [];
    for (let i = 0; i < 5; i++) codes.push((await request(server).get('/ping')).status);
    expect(codes).toEqual([200, 200, 200, 429, 429]);
    expect((await request(server).get('/ping/free')).status).toBe(200);
  });
});
