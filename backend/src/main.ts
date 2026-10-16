import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { config as loadEnv } from 'dotenv';
import { AppModule } from './app.module';
import { isOriginAllowed, parseOrigins } from './common/cors';

loadEnv();

const DEFAULT_WEB_ORIGIN = 'https://dyp-farms-web.onrender.com';

/**
 * Browsers only get CORS access from known web origins in production — set CORS_ORIGINS
 * (comma-separated, `*` allowed inside a hostname) to change them. Requests with no Origin header (the mobile app,
 * curl, server-to-server webhooks) aren't browser cross-origin calls and are unaffected.
 * Outside production any origin is allowed, so local dev and LAN testing just work.
 */
function corsOrigin(): CorsOptions['origin'] {
  if (process.env.NODE_ENV !== 'production') return true;
  const allowed = parseOrigins(process.env.CORS_ORIGINS, DEFAULT_WEB_ORIGIN);
  return (origin, callback) => callback(null, isOriginAllowed(origin, allowed));
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Behind Render's proxy, trust one hop so req.ip is the client's address (used by the
  // login/sign-up limiter). Override with TRUST_PROXY if the deployment changes.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
  }

  app.enableCors({
    origin: corsOrigin(),
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Dyp Farms API running on http://localhost:${port}/api`);
}
void bootstrap();
