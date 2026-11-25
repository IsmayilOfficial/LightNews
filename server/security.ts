import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

// Ephemeral CSPRNG fallback when SESSION_SECRET env var is not configured
const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  return configured && configured.length >= 16 ? configured : EPHEMERAL_SESSION_SECRET;
}

export const SESSION_COOKIE_NAME = 'ln_sid';

export function isSecureRequest(req: Request): boolean {
  if (req.secure) return true;
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (typeof forwardedProto === 'string' && forwardedProto.split(',')[0].trim().toLowerCase() === 'https') {
    return true;
  }
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.startsWith('https://')) return true;
  const referer = req.headers.referer;
  if (typeof referer === 'string' && referer.startsWith('https://')) return true;
  return false;
}

export function hashIdentifier(rawValue: string): string {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(rawValue)
    .digest('hex')
    .slice(0, 32);
}

export function signSessionToken(sessionId: string): string {
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(sessionId)
    .digest('base64url');
  return `${sessionId}.${signature}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [sessionId, providedSig] = parts;
  if (!sessionId || !providedSig || sessionId.length > 64) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(sessionId)
    .digest('base64url');

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return sessionId;
}

export function deriveCsrfToken(sessionId: string): string {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(`csrf:${sessionId}`)
    .digest('base64url');
}

export function verifyCsrfToken(sessionId: string, token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const expected = deriveCsrfToken(sessionId);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function attachSessionCookie(req: Request, res: Response, sessionId: string): void {
  const signedValue = signSessionToken(sessionId);
  const secure = isSecureRequest(req);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(signedValue)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${30 * 24 * 60 * 60}`,
    secure ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (secure) {
    parts.push('Secure');
    parts.push('Partitioned');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function extractSessionFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerSession = verifySessionToken(authHeader.slice(7).trim());
    if (bearerSession) return bearerSession;
  }

  const rawCookie = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  return verifySessionToken(rawCookie);
}

export function getOrCreateSession(
  req: Request,
  res: Response,
  options: { issueCookie?: boolean } = {}
): {
  sessionId: string;
  sessionIdHash: string;
  sessionToken: string;
  csrfToken: string;
} {
  let sessionId = extractSessionFromRequest(req);

  if (!sessionId) {
    if (options.issueCookie) {
      sessionId = crypto.randomBytes(18).toString('base64url');
      attachSessionCookie(req, res, sessionId);
    } else {
      // Ephemeral anonymous read context when caller hasn't completed /api/session yet
      sessionId = 'anon_read_session';
    }
  }

  return {
    sessionId,
    sessionIdHash: hashIdentifier(sessionId),
    sessionToken: signSessionToken(sessionId),
    csrfToken: deriveCsrfToken(sessionId),
  };
}

export function requireSameOriginAndCsrf(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const allowedHosts = new Set<string>();

  const forwardedHost = req.headers['x-forwarded-host'];
  if (typeof forwardedHost === 'string') {
    for (const h of forwardedHost.split(',')) {
      if (h.trim()) allowedHosts.add(h.trim());
    }
  }
  if (typeof req.headers.host === 'string' && req.headers.host.trim()) {
    allowedHosts.add(req.headers.host.trim());
  }
  if (process.env.APP_URL) {
    try {
      allowedHosts.add(new URL(process.env.APP_URL).host);
    } catch {
      // Ignore malformed APP_URL
    }
  }

  if (origin && allowedHosts.size > 0) {
    try {
      const originHost = new URL(origin).host;
      if (!allowedHosts.has(originHost)) {
        res.status(403).json({ error: 'Cross-origin request rejected' });
        return;
      }
    } catch {
      res.status(403).json({ error: 'Invalid Origin header' });
      return;
    }
  }

  const sessionId = extractSessionFromRequest(req);
  const csrfHeader = req.headers['x-csrf-token'] as string | undefined;

  if (!sessionId || !verifyCsrfToken(sessionId, csrfHeader)) {
    res.status(403).json({ error: 'Session verification failed. Please retry.' });
    return;
  }

  res.locals.sessionId = sessionId;
  res.locals.sessionIdHash = hashIdentifier(sessionId);
  next();
}

// Scrypt password hashing for registered editorial/user accounts (OWASP compliant)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const salt = parts[4];
  const expectedHex = parts[5];
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (derivedKey.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derivedKey, expectedBuf);
}

// Strict server-side HTML sanitization for editorial body paragraphs
export function sanitizeEditorialHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, 'blocked:');
}

export const newsApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 180,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again shortly.' },
});

export const telemetryApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Telemetry rate limit exceeded.' },
});

export const reactionApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Reaction rate limit exceeded.' },
});

export const commentApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Comment rate limit exceeded. Please wait a moment.' },
});

export const summarizeApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Summary rate limit exceeded. Please wait a moment.' },
});
