import { INITIAL_ARTICLES } from '../src/data/articles';
import {
  AdminArticleInput,
  AdminOverviewMetrics,
  ArticleRecord,
  ArticleViewModel,
  BreakingTickerItem,
  CategorySlug,
  Language,
  PersonalizationProfileSnapshot,
  SiteConfig,
  TelemetryEventPayload,
  TrendingTag,
} from '../src/types/news';
import { sanitizeEditorialHtml } from './security';

interface StoredPreferenceVector {
  sessionIdHash: string;
  categoryScores: Record<string, number>;
  tagScores: Record<string, number>;
  readArticleIds: Set<string>;
  highIntentReads: number;
  reactions: Map<string, 'like' | 'dislike'>;
  lastUpdated: number;
}

const VALID_CATEGORIES = new Set<Exclude<CategorySlug, 'all'>>([
  'politics',
  'economy',
  'society',
  'sports',
  'tech',
  'world',
]);

// In-memory relational store (PostgreSQL-ready repository abstraction)
class NewsRepositoryAndRecommender {
  private articles: Map<string, ArticleRecord> = new Map();
  private userProfiles: Map<string, StoredPreferenceVector> = new Map();
  private siteConfig: SiteConfig = {
    breakingTickerEnabled: true,
    personalizationEnabled: true,
    defaultLanguage: 'en',
    announcementBanner: '',
  };

  constructor() {
    for (const article of INITIAL_ARTICLES) {
      this.articles.set(article.id, {
        ...article,
        bodyHtml: {
          en: sanitizeEditorialHtml(article.bodyHtml.en),
          az: sanitizeEditorialHtml(article.bodyHtml.az),
          ru: sanitizeEditorialHtml(article.bodyHtml.ru),
        },
      });
    }
  }

  private getOrInitProfile(sessionIdHash: string): StoredPreferenceVector {
    let profile = this.userProfiles.get(sessionIdHash);
    if (!profile) {
      profile = {
        sessionIdHash,
        categoryScores: {},
        tagScores: {},
        readArticleIds: new Set(),
        highIntentReads: 0,
        reactions: new Map(),
        lastUpdated: Date.now(),
      };
      this.userProfiles.set(sessionIdHash, profile);
    }
    return profile;
  }

  // Apply exponential temporal decay so stale interests naturally fade
  private applyTemporalDecay(profile: StoredPreferenceVector): void {
    const now = Date.now();
    const hoursElapsed = (now - profile.lastUpdated) / 3_600_000;
    if (hoursElapsed < 0.05) return;

    const decayFactor = Math.exp(-0.02 * hoursElapsed);
    for (const key of Object.keys(profile.categoryScores)) {
      profile.categoryScores[key] = Number((profile.categoryScores[key] * decayFactor).toFixed(3));
    }
    for (const key of Object.keys(profile.tagScores)) {
      profile.tagScores[key] = Number((profile.tagScores[key] * decayFactor).toFixed(3));
    }
    profile.lastUpdated = now;
  }

  public recordTelemetryEvent(sessionIdHash: string, payload: TelemetryEventPayload): PersonalizationProfileSnapshot {
    const profile = this.getOrInitProfile(sessionIdHash);
    this.applyTemporalDecay(profile);

    const { articleId, category, tags, eventType, dwellSeconds = 0, scrollDepthPct = 0, reaction } = payload;

    let categoryDelta = 0;
    let tagDelta = 0;

    switch (eventType) {
      case 'impression':
        categoryDelta = 0.05;
        tagDelta = 0.02;
        break;
      case 'click':
        categoryDelta = 1.0;
        tagDelta = 0.6;
        profile.readArticleIds.add(articleId);
        break;
      case 'dwell': {
        const cappedSeconds = Math.max(0, Math.min(dwellSeconds, 180));
        if (cappedSeconds >= 10) {
          categoryDelta = Number((0.04 * cappedSeconds).toFixed(2));
          tagDelta = Number((0.025 * cappedSeconds).toFixed(2));
        }
        break;
      }
      case 'scroll_milestone':
        if (scrollDepthPct >= 60) {
          // >60% scroll depth signals strong organic engagement
          categoryDelta = 2.5;
          tagDelta = 1.5;
          profile.highIntentReads += 1;
        } else if (scrollDepthPct >= 30) {
          categoryDelta = 0.75;
          tagDelta = 0.4;
        }
        break;
      case 'reaction':
        if (reaction === 'like') {
          categoryDelta = 3.0;
          tagDelta = 2.0;
        } else if (reaction === 'dislike') {
          categoryDelta = -2.0;
          tagDelta = -1.0;
        }
        break;
    }

    if (VALID_CATEGORIES.has(category)) {
      const prevCat = profile.categoryScores[category] ?? 0;
      profile.categoryScores[category] = Number(Math.max(-5, prevCat + categoryDelta).toFixed(2));
    }

    for (const tag of tags.slice(0, 8)) {
      const cleanTag = tag.trim().slice(0, 40);
      if (!cleanTag) continue;
      const prevTag = profile.tagScores[cleanTag] ?? 0;
      profile.tagScores[cleanTag] = Number(Math.max(-5, prevTag + tagDelta).toFixed(2));
    }

    profile.lastUpdated = Date.now();
    return this.getProfileSnapshot(sessionIdHash);
  }

  public getProfileSnapshot(sessionIdHash: string): PersonalizationProfileSnapshot {
    const profile = this.getOrInitProfile(sessionIdHash);
    return {
      sessionIdHash,
      categoryScores: { ...profile.categoryScores },
      tagScores: { ...profile.tagScores },
      articlesReadCount: profile.readArticleIds.size,
      highIntentReads: profile.highIntentReads,
      lastUpdated: new Date(profile.lastUpdated).toISOString(),
    };
  }

  // Compute organic blended ranking score combining Freshness, Velocity, and Silent User Affinity
  private computeArticleScore(article: ArticleRecord, profile: StoredPreferenceVector): number {
    const ageHours = Math.max(0.1, (Date.now() - new Date(article.publishedAt).getTime()) / 3_600_000);
    const freshnessScore = Math.exp(-0.08 * ageHours) * article.editorialPriority;

    const engagementVelocity =
      Math.log10(Math.max(10, article.viewsToday + article.likes * 8 - article.dislikes * 4)) / 5;

    // Cold-start threshold: blend personalization seamlessly once user shows >= 1.0 cumulative signal
    const rawCatScore = profile.categoryScores[article.category] ?? 0;
    const rawTagScore = article.tags.reduce((acc, t) => acc + (profile.tagScores[t] ?? 0), 0);
    const combinedAffinity = rawCatScore + rawTagScore * 0.45;
    const normalizedAffinity = Math.tanh(combinedAffinity / 8); // Smoothly bounded [-1, 1]

    // Slightly de-prioritize already deeply read articles to keep feed fresh
    const alreadyReadPenalty = profile.readArticleIds.has(article.id) ? -0.08 : 0;

    return 0.45 * freshnessScore + 0.25 * engagementVelocity + 0.3 * normalizedAffinity + alreadyReadPenalty;
  }

  private toViewModel(
    article: ArticleRecord,
    lang: Language,
    sessionIdHash?: string
  ): ArticleViewModel {
    const profile = sessionIdHash ? this.userProfiles.get(sessionIdHash) : undefined;
    return {
      id: article.id,
      slug: article.slug,
      category: article.category,
      tags: article.tags,
      title: article.title[lang] || article.title.en,
      excerpt: article.excerpt[lang] || article.excerpt.en,
      bodyHtml: article.bodyHtml[lang] || article.bodyHtml.en,
      pullQuote: article.pullQuote[lang] || article.pullQuote.en,
      imageCaption: article.imageCaption[lang] || article.imageCaption.en,
      imageUrl: article.mediaAsset.cdnUrl,
      mediaAsset: article.mediaAsset,
      author: {
        id: article.author.id,
        name: article.author.name,
        role: article.author.role[lang] || article.author.role.en,
      },
      publishedAt: article.publishedAt,
      readTimeMinutes: article.readTimeMinutes,
      viewsToday: article.viewsToday,
      viewsWeek: article.viewsWeek,
      likes: article.likes,
      dislikes: article.dislikes,
      isBreaking: article.isBreaking,
      isFeatured: article.isFeatured,
      userReaction: profile?.reactions.get(article.id) ?? null,
    };
  }

  public queryFeed(params: {
    sessionIdHash: string;
    lang: Language;
    category?: CategorySlug;
    tag?: string;
    query?: string;
    sort?: 'personalized' | 'latest';
  }): {
    articles: ArticleViewModel[];
    breaking: BreakingTickerItem[];
    trendingTags: TrendingTag[];
    siteConfig: SiteConfig;
  } {
    const { sessionIdHash, lang, category = 'all', tag, query } = params;
    const effectiveSort =
      !this.siteConfig.personalizationEnabled || params.sort === 'latest'
        ? 'latest'
        : 'personalized';
    const profile = this.getOrInitProfile(sessionIdHash);
    this.applyTemporalDecay(profile);

    let list = Array.from(this.articles.values());

    if (category !== 'all' && VALID_CATEGORIES.has(category)) {
      list = list.filter((a) => a.category === category);
    }

    if (tag && tag.trim().length > 0) {
      const normalizedTag = tag.trim().toLowerCase();
      list = list.filter((a) => a.tags.some((t) => t.toLowerCase() === normalizedTag));
    }

    // Parameterized full-text search simulation (matching PostgreSQL GIN tsvector across title, excerpt, body, tags)
    if (query && query.trim().length > 0) {
      const terms = query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length >= 2)
        .slice(0, 8);

      if (terms.length > 0) {
        list = list.filter((a) => {
          const haystack = [
            a.title[lang],
            a.excerpt[lang],
            a.bodyHtml[lang],
            a.title.en,
            a.tags.join(' '),
            a.author.name,
          ]
            .join(' ')
            .toLowerCase();
          return terms.every((term) => haystack.includes(term));
        });
      }
    }

    if (effectiveSort === 'latest') {
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } else {
      list.sort((a, b) => this.computeArticleScore(b, profile) - this.computeArticleScore(a, profile));
    }

    const allArticles = Array.from(this.articles.values());
    const breaking: BreakingTickerItem[] = allArticles
      .filter((a) => a.isBreaking)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .map((a) => ({
        id: a.id,
        slug: a.slug,
        category: a.category,
        title: a.title[lang] || a.title.en,
        publishedAt: a.publishedAt,
      }));

    // Trending topics sorted by aggregated views & tag frequency
    const tagCountMap = new Map<string, number>();
    for (const a of allArticles) {
      for (const t of a.tags) {
        tagCountMap.set(t, (tagCountMap.get(t) ?? 0) + Math.round(a.viewsToday / 500));
      }
    }
    const trendingTags: TrendingTag[] = Array.from(tagCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t, count]) => ({ tag: t, count }));

    return {
      articles: list.map((a) => this.toViewModel(a, lang, sessionIdHash)),
      breaking,
      trendingTags,
      siteConfig: { ...this.siteConfig },
    };
  }

  public getMostRead(period: 'today' | 'week', lang: Language, sessionIdHash: string): ArticleViewModel[] {
    const list = Array.from(this.articles.values());
    list.sort((a, b) =>
      period === 'today' ? b.viewsToday - a.viewsToday : b.viewsWeek - a.viewsWeek
    );
    return list.slice(0, 8).map((a) => this.toViewModel(a, lang, sessionIdHash));
  }

  public openArticleBySlug(slug: string, lang: Language, sessionIdHash: string): ArticleViewModel | null {
    const article = Array.from(this.articles.values()).find((a) => a.slug === slug);
    if (!article) return null;

    article.viewsToday += 1;
    article.viewsWeek += 1;

    this.recordTelemetryEvent(sessionIdHash, {
      articleId: article.id,
      category: article.category,
      tags: article.tags,
      eventType: 'click',
    });

    return this.toViewModel(article, lang, sessionIdHash);
  }

  public toggleReaction(
    articleId: string,
    reaction: 'like' | 'dislike',
    lang: Language,
    sessionIdHash: string
  ): ArticleViewModel | null {
    const article = this.articles.get(articleId);
    if (!article) return null;

    const profile = this.getOrInitProfile(sessionIdHash);
    const existing = profile.reactions.get(articleId);

    if (existing === reaction) {
      // Toggle off
      profile.reactions.delete(articleId);
      if (reaction === 'like') article.likes = Math.max(0, article.likes - 1);
      else article.dislikes = Math.max(0, article.dislikes - 1);
    } else {
      if (existing === 'like') article.likes = Math.max(0, article.likes - 1);
      if (existing === 'dislike') article.dislikes = Math.max(0, article.dislikes - 1);

      profile.reactions.set(articleId, reaction);
      if (reaction === 'like') article.likes += 1;
      else article.dislikes += 1;

      this.recordTelemetryEvent(sessionIdHash, {
        articleId: article.id,
        category: article.category,
        tags: article.tags,
        eventType: 'reaction',
        reaction,
      });
    }

    return this.toViewModel(article, lang, sessionIdHash);
  }

  public getSiteConfig(): SiteConfig {
    return { ...this.siteConfig };
  }

  public updateSiteConfig(patch: Partial<SiteConfig>): SiteConfig {
    if (typeof patch.breakingTickerEnabled === 'boolean') {
      this.siteConfig.breakingTickerEnabled = patch.breakingTickerEnabled;
    }
    if (typeof patch.personalizationEnabled === 'boolean') {
      this.siteConfig.personalizationEnabled = patch.personalizationEnabled;
    }
    if (patch.defaultLanguage === 'en' || patch.defaultLanguage === 'az' || patch.defaultLanguage === 'ru') {
      this.siteConfig.defaultLanguage = patch.defaultLanguage;
    }
    if (typeof patch.announcementBanner === 'string') {
      this.siteConfig.announcementBanner = patch.announcementBanner.trim().slice(0, 180);
    }
    return this.getSiteConfig();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private textToSafeParagraphs(bodyText: string): string {
    const paragraphs = bodyText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 20)
      .map((p) => `<p>${this.escapeHtml(p).replace(/\n/g, '<br />')}</p>`);
    return sanitizeEditorialHtml(paragraphs.join('\n') || '<p></p>');
  }

  private normalizeSafeImageUrl(url: string): string {
    const trimmed = url.trim();
    if (trimmed.startsWith('/src/assets/') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return '/src/assets/images/news_baku_summit_1795615683603.jpg';
  }

  public listAdminArticles(lang: Language = 'en'): ArticleViewModel[] {
    return Array.from(this.articles.values())
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .map((a) => this.toViewModel(a, lang));
  }

  public createArticle(input: AdminArticleInput): ArticleViewModel {
    const id = `art-${Date.now().toString(36)}`;
    const baseSlug =
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90) || id;

    let slug = baseSlug;
    let suffix = 1;
    const existingSlugs = new Set(Array.from(this.articles.values()).map((a) => a.slug));
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const safeHtml = this.textToSafeParagraphs(input.bodyText);
    const safeImageUrl = this.normalizeSafeImageUrl(input.imageUrl);
    const cleanTags = input.tags
      .map((t) => t.trim().slice(0, 32))
      .filter(Boolean)
      .slice(0, 6);

    const record: ArticleRecord = {
      id,
      slug,
      category: VALID_CATEGORIES.has(input.category) ? input.category : 'politics',
      tags: cleanTags.length > 0 ? cleanTags : ['Editorial'],
      title: { en: input.title, az: input.title, ru: input.title },
      excerpt: { en: input.excerpt, az: input.excerpt, ru: input.excerpt },
      bodyHtml: { en: safeHtml, az: safeHtml, ru: safeHtml },
      pullQuote: {
        en: `“${input.excerpt.slice(0, 140)}”`,
        az: `“${input.excerpt.slice(0, 140)}”`,
        ru: `«${input.excerpt.slice(0, 140)}»`,
      },
      imageCaption: {
        en: `${input.title} — LightNews Editorial Desk.`,
        az: `${input.title} — LightNews Redaksiyası.`,
        ru: `${input.title} — Редакция LightNews.`,
      },
      mediaAsset: {
        id: `med-${id}`,
        storageProvider: 'Cloudflare R2',
        objectKey: `media/2026/11/${slug}.jpg`,
        cdnUrl: safeImageUrl,
        mimeType: 'image/jpeg',
        width: 1200,
        height: 900,
      },
      author: {
        id: 'auth-admin',
        name: input.authorName.trim().slice(0, 60) || 'LightNews Desk',
        role: {
          en: input.authorRole.trim().slice(0, 60) || 'Editorial Staff',
          az: input.authorRole.trim().slice(0, 60) || 'Redaksiya Heyəti',
          ru: input.authorRole.trim().slice(0, 60) || 'Редакция',
        },
      },
      publishedAt: new Date().toISOString(),
      readTimeMinutes: Math.max(1, Math.min(30, Math.round(input.readTimeMinutes || 3))),
      viewsToday: 1,
      viewsWeek: 1,
      likes: 0,
      dislikes: 0,
      isBreaking: Boolean(input.isBreaking),
      isFeatured: Boolean(input.isFeatured),
      editorialPriority: input.isFeatured ? 1.35 : 1.1,
    };

    this.articles.set(id, record);
    return this.toViewModel(record, 'en');
  }

  public updateArticle(id: string, patch: Partial<AdminArticleInput>): ArticleViewModel | null {
    const existing = this.articles.get(id);
    if (!existing) return null;

    if (typeof patch.title === 'string' && patch.title.trim()) {
      const cleanTitle = patch.title.trim().slice(0, 180);
      existing.title = { en: cleanTitle, az: cleanTitle, ru: cleanTitle };
    }
    if (typeof patch.excerpt === 'string' && patch.excerpt.trim()) {
      const cleanExcerpt = patch.excerpt.trim().slice(0, 340);
      existing.excerpt = { en: cleanExcerpt, az: cleanExcerpt, ru: cleanExcerpt };
    }
    if (typeof patch.bodyText === 'string' && patch.bodyText.trim()) {
      const safeHtml = this.textToSafeParagraphs(patch.bodyText);
      existing.bodyHtml = { en: safeHtml, az: safeHtml, ru: safeHtml };
    }
    if (patch.category && VALID_CATEGORIES.has(patch.category)) {
      existing.category = patch.category;
    }
    if (Array.isArray(patch.tags)) {
      const cleanTags = patch.tags
        .map((t) => t.trim().slice(0, 32))
        .filter(Boolean)
        .slice(0, 6);
      if (cleanTags.length > 0) existing.tags = cleanTags;
    }
    if (typeof patch.imageUrl === 'string' && patch.imageUrl.trim()) {
      existing.mediaAsset.cdnUrl = this.normalizeSafeImageUrl(patch.imageUrl);
    }
    if (typeof patch.isBreaking === 'boolean') {
      existing.isBreaking = patch.isBreaking;
    }
    if (typeof patch.isFeatured === 'boolean') {
      existing.isFeatured = patch.isFeatured;
      existing.editorialPriority = patch.isFeatured ? Math.max(existing.editorialPriority, 1.3) : 1.0;
    }

    return this.toViewModel(existing, 'en');
  }

  public deleteArticle(id: string): boolean {
    return this.articles.delete(id);
  }

  public getAdminOverview(subscriberCount: number): AdminOverviewMetrics {
    const all = Array.from(this.articles.values());
    const catMap = new Map<
      Exclude<CategorySlug, 'all'>,
      { count: number; viewsToday: number; likes: number }
    >();
    for (const cat of VALID_CATEGORIES) {
      catMap.set(cat, { count: 0, viewsToday: 0, likes: 0 });
    }

    let breakingCount = 0;
    let featuredCount = 0;
    let totalViewsToday = 0;
    let totalViewsWeek = 0;
    let totalLikes = 0;
    let totalDislikes = 0;

    for (const a of all) {
      if (a.isBreaking) breakingCount += 1;
      if (a.isFeatured) featuredCount += 1;
      totalViewsToday += a.viewsToday;
      totalViewsWeek += a.viewsWeek;
      totalLikes += a.likes;
      totalDislikes += a.dislikes;

      const entry = catMap.get(a.category);
      if (entry) {
        entry.count += 1;
        entry.viewsToday += a.viewsToday;
        entry.likes += a.likes;
      }
    }

    return {
      totalArticles: all.length,
      breakingCount,
      featuredCount,
      totalViewsToday,
      totalViewsWeek,
      totalLikes,
      totalDislikes,
      subscriberCount,
      byCategory: Array.from(catMap.entries()).map(([category, stats]) => ({
        category,
        ...stats,
      })),
    };
  }
}

export const newsEngine = new NewsRepositoryAndRecommender();
