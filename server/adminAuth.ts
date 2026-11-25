import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { hashPassword, requireSameOriginAndCsrf, verifyPassword } from './security';

const EPHEMERAL_ADMIN_SIGNING_KEY = crypto.randomBytes(32).toString('hex');
const ADMIN_TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

let claimedAdminHash: string | null = null;
const revokedTokenIds = new Set<string>();

function getAdminSigningKey(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  return configured && configured.length >= 16 ? `admin:${configured}` : EPHEMERAL_ADMIN_SIGNING_KEY;
}

function getEnvAdminPasscode(): string | null {
  const raw = process.env.ADMIN_PASSCODE?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export function getAdminAuthState(): {
  envConfigured: boolean;
  setupRequired: boolean;
} {
  const envConfigured = Boolean(getEnvAdminPasscode());
  return {
    envConfigured,
    setupRequired: !envConfigured && !claimedAdminHash,
  };
}

export async function claimInitialAdminPassword(password: string): Promise<boolean> {
  if (getEnvAdminPasscode() || claimedAdminHash) {
    return false;
  }
  claimedAdminHash = await hashPassword(password);
  return true;
}

export async function verifyAdminCredential(candidate: string): Promise<boolean> {
  if (!candidate || typeof candidate !== 'string') return false;

  // Configured environment passcode always takes precedence over claimed fallback hash
  const envPasscode = getEnvAdminPasscode();
  if (envPasscode) {
    const a = crypto.createHash('sha256').update(candidate).digest();
    const b = crypto.createHash('sha256').update(envPasscode).digest();
    return crypto.timingSafeEqual(a, b);
  }

  if (!claimedAdminHash) return false;
  return verifyPassword(candidate, claimedAdminHash);
}

export function issueAdminBearerToken(): string {
  const payloadObj = {
    role: 'admin',
    jti: crypto.randomBytes(12).toString('base64url'),
    exp: Date.now() + ADMIN_TOKEN_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getAdminSigningKey())
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyAdminBearerToken(token: string | undefined): { jti: string; exp: number } | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, providedSig] = parts;
  if (!payloadB64 || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getAdminSigningKey())
    .update(payloadB64)
    .digest('base64url');

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as {
      role?: string;
      jti?: string;
      exp?: number;
    };
    if (parsed.role !== 'admin' || !parsed.jti || typeof parsed.exp !== 'number') return null;
    if (Date.now() > parsed.exp) return null;
    if (revokedTokenIds.has(parsed.jti)) return null;
    return { jti: parsed.jti, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function revokeAdminBearerToken(token: string | undefined): void {
  const verified = verifyAdminBearerToken(token);
  if (verified) {
    revokedTokenIds.add(verified.jti);
  }
}

export function extractAdminToken(req: Request): string | undefined {
  const header = req.headers['x-admin-token'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return undefined;
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractAdminToken(req);
  const verified = verifyAdminBearerToken(token);
  if (!verified) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    requireSameOriginAndCsrf(req, res, next);
    return;
  }

  next();
}

export const adminAuthLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait a few minutes.' },
});
