import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { AdminArticleInput, CategorySlug, Language, TelemetryEventPayload, TelemetryEventType } from './src/types/news';
import {
  adminAuthLimiter,
  claimInitialAdminPassword,
  extractAdminToken,
  getAdminAuthState,
  issueAdminBearerToken,
  requireAdminAuth,
  revokeAdminBearerToken,
  verifyAdminBearerToken,
  verifyAdminCredential,
} from './server/adminAuth';
import { newsEngine } from './server/recommendationEngine';
import {
  getOrCreateSession,
  newsApiLimiter,
  reactionApiLimiter,
  requireSameOriginAndCsrf,
  telemetryApiLimiter,
} from './server/security';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_LANGS = new Set<Language>(['en', 'az', 'ru']);
const VALID_CATEGORIES = new Set<CategorySlug>([
  'all',
  'politics',
  'economy',
  'society',
  'sports',
  'tech',
  'world',
]);
const VALID_EVENT_TYPES = new Set<TelemetryEventType>([
  'impression',
  'click',
  'dwell',
  'scroll_milestone',
  'reaction',
]);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.set('trust proxy', 1);

  // Zero-Trust HTTP Security Headers (HSTS, CSP, X-Content-Type-Options, Referrer-Policy)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          upgradeInsecureRequests: null,
          // Allow embedding inside AI Studio preview iframe
          frameAncestors: ["'self'", 'https://*.google.com', 'https://aistudio.google.com', '*'],
        },
      },
      frameguard: false,
      crossOriginEmbedderPolicy: false,
      hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'lightnews-api' });
  });

  // Session bootstrap: issues opaque HMAC-signed HttpOnly cookie + in-memory sessionToken + CSRF token
  app.get('/api/session', newsApiLimiter, (req, res) => {
    const { sessionIdHash, sessionToken, csrfToken } = getOrCreateSession(req, res, {
      issueCookie: true,
    });
    res.json({ sessionIdHash, sessionToken, csrfToken });
  });

  // Main Personalized & Filtered News Feed Delivery
  app.get('/api/news', newsApiLimiter, (req, res) => {
    const { sessionIdHash } = getOrCreateSession(req, res);
    const rawLang = String(req.query.lang ?? 'en').toLowerCase() as Language;
    const lang: Language = VALID_LANGS.has(rawLang) ? rawLang : 'en';

    const rawCategory = String(req.query.category ?? 'all').toLowerCase() as CategorySlug;
    const category: CategorySlug = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'all';

    const rawTag = typeof req.query.tag === 'string' ? req.query.tag.slice(0, 48) : undefined;
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.slice(0, 120) : undefined;
    const sort = req.query.sort === 'latest' ? 'latest' : 'personalized';

    const payload = newsEngine.queryFeed({
      sessionIdHash,
      lang,
      category,
      tag: rawTag,
      query: rawQuery,
      sort,
    });

    res.json(payload);
  });

  // Most Read Aggregation (Today vs This Week)
  app.get('/api/news/most-read', newsApiLimiter, (req, res) => {
    const { sessionIdHash } = getOrCreateSession(req, res);
    const period = req.query.period === 'week' ? 'week' : 'today';
    const rawLang = String(req.query.lang ?? 'en').toLowerCase() as Language;
    const lang: Language = VALID_LANGS.has(rawLang) ? rawLang : 'en';

    const items = newsEngine.getMostRead(period, lang, sessionIdHash);
    res.json({ period, items });
  });

  // Single Article Detail + Atomic View Count & Implicit Click Tracking
  app.get('/api/news/:slug', newsApiLimiter, (req, res) => {
    const { sessionIdHash } = getOrCreateSession(req, res);
    const slug = String(req.params.slug ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 140);
    const rawLang = String(req.query.lang ?? 'en').toLowerCase() as Language;
    const lang: Language = VALID_LANGS.has(rawLang) ? rawLang : 'en';

    const article = newsEngine.openArticleBySlug(slug, lang, sessionIdHash);
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.json({ article });
  });

  // Silent Background Behavioral Telemetry Collector (CSRF + Rate-Limited)
  app.post('/api/telemetry/event', telemetryApiLimiter, requireSameOriginAndCsrf, (req, res) => {
    const body = req.body as Partial<TelemetryEventPayload> | undefined;
    if (!body || typeof body.articleId !== 'string' || typeof body.category !== 'string') {
      res.status(400).json({ error: 'Invalid telemetry payload' });
      return;
    }

    const catStr = String(body.category);
    if (
      catStr === 'all' ||
      !VALID_CATEGORIES.has(catStr as CategorySlug) ||
      !VALID_EVENT_TYPES.has(body.eventType as TelemetryEventType)
    ) {
      res.status(400).json({ error: 'Unsupported telemetry category or eventType' });
      return;
    }

    const sanitizedPayload: TelemetryEventPayload = {
      articleId: body.articleId.slice(0, 40),
      category: catStr as Exclude<CategorySlug, 'all'>,
      tags: Array.isArray(body.tags)
        ? body.tags.filter((t): t is string => typeof t === 'string').slice(0, 8)
        : [],
      eventType: body.eventType as TelemetryEventType,
      dwellSeconds:
        typeof body.dwellSeconds === 'number' && Number.isFinite(body.dwellSeconds)
          ? Math.max(0, Math.min(3600, Math.round(body.dwellSeconds)))
          : undefined,
      scrollDepthPct:
        typeof body.scrollDepthPct === 'number' && Number.isFinite(body.scrollDepthPct)
          ? Math.max(0, Math.min(100, Math.round(body.scrollDepthPct)))
          : undefined,
      reaction: body.reaction === 'like' || body.reaction === 'dislike' ? body.reaction : undefined,
    };

    const snapshot = newsEngine.recordTelemetryEvent(res.locals.sessionIdHash, sanitizedPayload);
    res.status(202).json({ accepted: true, profile: snapshot });
  });

  // Like / Dislike Reaction Endpoint (CSRF + Rate-Limited)
  app.post('/api/news/:id/react', reactionApiLimiter, requireSameOriginAndCsrf, (req, res) => {
    const articleId = String(req.params.id ?? '').slice(0, 40);
    const reaction = req.body?.reaction;
    const rawLang = String(req.body?.lang ?? 'en').toLowerCase() as Language;
    const lang: Language = VALID_LANGS.has(rawLang) ? rawLang : 'en';

    if (reaction !== 'like' && reaction !== 'dislike') {
      res.status(400).json({ error: 'Reaction must be like or dislike' });
      return;
    }

    const updated = newsEngine.toggleReaction(articleId, reaction, lang, res.locals.sessionIdHash);
    if (!updated) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.json({ article: updated });
  });

  // Daily Digest Newsletter Subscription Endpoint (CSRF + Rate-Limited)
  const newsletterSubscribers = new Map<
    string,
    { lang: Language; sessionIdHash: string; subscribedAt: string }
  >();
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

  app.post('/api/newsletter/subscribe', reactionApiLimiter, requireSameOriginAndCsrf, (req, res) => {
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const rawLang = String(req.body?.lang ?? 'en').toLowerCase() as Language;
    const lang: Language = VALID_LANGS.has(rawLang) ? rawLang : 'en';

    if (!rawEmail || rawEmail.length > 254 || !EMAIL_REGEX.test(rawEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    const alreadySubscribed = newsletterSubscribers.has(rawEmail);
    if (!alreadySubscribed) {
      newsletterSubscribers.set(rawEmail, {
        lang,
        sessionIdHash: res.locals.sessionIdHash,
        subscribedAt: new Date().toISOString(),
      });
    }

    res.status(alreadySubscribed ? 200 : 201).json({
      subscribed: true,
      alreadySubscribed,
      totalSubscribers: newsletterSubscribers.size,
    });
  });

  // Read-only inspector endpoint used solely by the System Architecture Blueprint drawer
  app.get('/api/personalization/profile', newsApiLimiter, (req, res) => {
    const { sessionIdHash } = getOrCreateSession(req, res);
    const snapshot = newsEngine.getProfileSnapshot(sessionIdHash);
    res.json({ profile: snapshot });
  });

  // =========================================================================
  // Admin Console Auth & Protected Editorial Control Endpoints
  // =========================================================================
  app.get('/api/admin/auth/status', newsApiLimiter, (req, res) => {
    const state = getAdminAuthState();
    const token = extractAdminToken(req);
    const authenticated = Boolean(verifyAdminBearerToken(token));
    res.json({ ...state, authenticated });
  });

  app.post('/api/admin/auth/setup', adminAuthLimiter, requireSameOriginAndCsrf, async (req, res) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({ error: 'Admin password must be between 8 and 128 characters.' });
      return;
    }

    const claimed = await claimInitialAdminPassword(password);
    if (!claimed) {
      res.status(409).json({ error: 'Admin credentials are already configured.' });
      return;
    }

    const adminToken = issueAdminBearerToken();
    res.status(201).json({ adminToken });
  });

  app.post('/api/admin/auth/login', adminAuthLimiter, requireSameOriginAndCsrf, async (req, res) => {
    const state = getAdminAuthState();
    if (state.setupRequired) {
      res.status(409).json({ error: 'Initial admin setup is required before signing in.' });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const valid = await verifyAdminCredential(password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid admin password.' });
      return;
    }

    const adminToken = issueAdminBearerToken();
    res.json({ adminToken });
  });

  app.post('/api/admin/auth/logout', requireAdminAuth, (req, res) => {
    revokeAdminBearerToken(extractAdminToken(req));
    res.json({ signedOut: true });
  });

  app.get('/api/admin/overview', requireAdminAuth, (_req, res) => {
    const overview = newsEngine.getAdminOverview(newsletterSubscribers.size);
    const siteConfig = newsEngine.getSiteConfig();
    res.json({ overview, siteConfig });
  });

  app.get('/api/admin/articles', requireAdminAuth, (req, res) => {
    const rawLang = String(req.query.lang ?? 'en').toLowerCase() as Language;
    const lang: Language = VALID_LANGS.has(rawLang) ? rawLang : 'en';
    res.json({ articles: newsEngine.listAdminArticles(lang) });
  });

  app.post('/api/admin/articles', requireAdminAuth, (req, res) => {
    const body = req.body as Partial<AdminArticleInput> | undefined;
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const excerpt = typeof body?.excerpt === 'string' ? body.excerpt.trim() : '';
    const bodyText = typeof body?.bodyText === 'string' ? body.bodyText.trim() : '';
    const catStr = String(body?.category ?? 'politics');

    if (title.length < 4 || excerpt.length < 10 || bodyText.length < 20) {
      res.status(400).json({ error: 'Title, excerpt, and article body are required.' });
      return;
    }
    if (catStr === 'all' || !VALID_CATEGORIES.has(catStr as CategorySlug)) {
      res.status(400).json({ error: 'Invalid article category.' });
      return;
    }

    const created = newsEngine.createArticle({
      title: title.slice(0, 180),
      excerpt: excerpt.slice(0, 340),
      bodyText: bodyText.slice(0, 20000),
      category: catStr as Exclude<CategorySlug, 'all'>,
      tags: Array.isArray(body?.tags)
        ? body.tags.filter((t): t is string => typeof t === 'string')
        : [],
      imageUrl: typeof body?.imageUrl === 'string' ? body.imageUrl : '',
      authorName: typeof body?.authorName === 'string' ? body.authorName : 'LightNews Desk',
      authorRole: typeof body?.authorRole === 'string' ? body.authorRole : 'Editorial Staff',
      readTimeMinutes: typeof body?.readTimeMinutes === 'number' ? body.readTimeMinutes : 3,
      isBreaking: Boolean(body?.isBreaking),
      isFeatured: Boolean(body?.isFeatured),
    });

    res.status(201).json({ article: created });
  });

  app.patch('/api/admin/articles/:id', requireAdminAuth, (req, res) => {
    const id = String(req.params.id ?? '').slice(0, 64);
    const updated = newsEngine.updateArticle(id, req.body ?? {});
    if (!updated) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    res.json({ article: updated });
  });

  app.delete('/api/admin/articles/:id', requireAdminAuth, (req, res) => {
    const id = String(req.params.id ?? '').slice(0, 64);
    const deleted = newsEngine.deleteArticle(id);
    if (!deleted) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    res.json({ deleted: true, id });
  });

  app.get('/api/admin/subscribers', requireAdminAuth, (_req, res) => {
    const subscribers = Array.from(newsletterSubscribers.entries())
      .map(([email, meta]) => ({
        email,
        lang: meta.lang,
        subscribedAt: meta.subscribedAt,
      }))
      .sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime());
    res.json({ subscribers });
  });

  app.delete('/api/admin/subscribers', requireAdminAuth, (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || !newsletterSubscribers.has(email)) {
      res.status(404).json({ error: 'Subscriber not found.' });
      return;
    }
    newsletterSubscribers.delete(email);
    res.json({ removed: true, email });
  });

  app.patch('/api/admin/settings', requireAdminAuth, (req, res) => {
    const updated = newsEngine.updateSiteConfig(req.body ?? {});
    res.json({ siteConfig: updated });
  });

  // Serve generated/static editorial media assets in both dev and production
  app.use('/src/assets', express.static(path.join(__dirname, 'src/assets')));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LightNews server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LightNews server:', err);
  process.exit(1);
});
