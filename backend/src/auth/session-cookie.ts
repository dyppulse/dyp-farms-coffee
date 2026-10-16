import type { Request, Response } from 'express';

export const SESSION_COOKIE = 'dyp_session';
export const CLIENT_HEADER = 'x-dyp-client';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Reads one cookie from the raw Cookie header (no cookie-parser dependency needed). */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** passport-jwt extractor: the Bearer header (mobile app) first, then the session cookie (web). */
export function extractToken(req: Pick<Request, 'headers'>): string | null {
  const auth = req.headers.authorization;
  if (auth && /^bearer /i.test(auth)) return auth.slice(7).trim() || null;
  return readCookie(req.headers.cookie, SESSION_COOKIE);
}

/**
 * Cookie sessions are sent by the browser automatically, so state-changing requests that rely
 * on one must also carry a custom header. A foreign site cannot add it without a CORS
 * preflight, which only our own origins pass. Bearer-token requests are exempt.
 */
export function isCsrfSafe(req: Pick<Request, 'headers' | 'method'>): boolean {
  if (req.headers.authorization) return true;
  if (SAFE_METHODS.has(req.method.toUpperCase())) return true;
  return typeof req.headers[CLIENT_HEADER] === 'string' && req.headers[CLIENT_HEADER] !== '';
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS_MS,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
