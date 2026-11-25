export type Language = 'en' | 'az' | 'ru';

export type CategorySlug =
  | 'all'
  | 'politics'
  | 'economy'
  | 'society'
  | 'sports'
  | 'tech'
  | 'world';

export interface LocalizedText {
  en: string;
  az: string;
  ru: string;
}

export interface MediaAsset {
  id: string;
  storageProvider: 'Cloudflare R2' | 'AWS S3';
  objectKey: string;
  cdnUrl: string;
  mimeType: string;
  width: number;
  height: number;
}

export interface AuthorProfile {
  id: string;
  name: string;
  role: LocalizedText;
  bio: LocalizedText;
  beat: LocalizedText;
  location: string;
  email: string;
}

export interface ArticleRecord {
  id: string;
  slug: string;
  category: Exclude<CategorySlug, 'all'>;
  tags: string[];
  title: LocalizedText;
  excerpt: LocalizedText;
  bodyHtml: LocalizedText;
  pullQuote: LocalizedText;
  imageCaption: LocalizedText;
  mediaAsset: MediaAsset;
  author: AuthorProfile;
  publishedAt: string;
  readTimeMinutes: number;
  viewsToday: number;
  viewsWeek: number;
  likes: number;
  dislikes: number;
  isBreaking: boolean;
  isFeatured: boolean;
  editorialPriority: number; // 1.0 - 1.5 baseline boost for lead news
}

export interface ArticleViewModel {
  id: string;
  slug: string;
  category: Exclude<CategorySlug, 'all'>;
  tags: string[];
  title: string;
  excerpt: string;
  bodyHtml: string;
  pullQuote: string;
  imageCaption: string;
  imageUrl: string;
  mediaAsset: MediaAsset;
  author: {
    id: string;
    name: string;
    role: string;
    bio: string;
    beat: string;
    location: string;
    email: string;
  };
  publishedAt: string;
  readTimeMinutes: number;
  viewsToday: number;
  viewsWeek: number;
  likes: number;
  dislikes: number;
  isBreaking: boolean;
  isFeatured: boolean;
  userReaction: 'like' | 'dislike' | null;
}

export interface BreakingTickerItem {
  id: string;
  slug: string;
  category: Exclude<CategorySlug, 'all'>;
  title: string;
  publishedAt: string;
}

export interface TrendingTag {
  tag: string;
  count: number;
}

export type TelemetryEventType =
  | 'impression'
  | 'click'
  | 'dwell'
  | 'scroll_milestone'
  | 'reaction';

export interface TelemetryEventPayload {
  articleId: string;
  category: Exclude<CategorySlug, 'all'>;
  tags: string[];
  eventType: TelemetryEventType;
  dwellSeconds?: number;
  scrollDepthPct?: number;
  reaction?: 'like' | 'dislike';
}

export interface PersonalizationProfileSnapshot {
  sessionIdHash: string;
  categoryScores: Record<string, number>;
  tagScores: Record<string, number>;
  articlesReadCount: number;
  highIntentReads: number;
  lastUpdated: string;
}

export interface SiteConfig {
  breakingTickerEnabled: boolean;
  personalizationEnabled: boolean;
  defaultLanguage: Language;
  announcementBanner: string;
}

export interface AdminAuthStatus {
  setupRequired: boolean;
  envConfigured: boolean;
  authenticated: boolean;
}

export interface AdminSubscriber {
  email: string;
  lang: Language;
  subscribedAt: string;
}

export interface AdminOverviewMetrics {
  totalArticles: number;
  breakingCount: number;
  featuredCount: number;
  totalViewsToday: number;
  totalViewsWeek: number;
  totalLikes: number;
  totalDislikes: number;
  subscriberCount: number;
  byCategory: Array<{
    category: Exclude<CategorySlug, 'all'>;
    count: number;
    viewsToday: number;
    likes: number;
  }>;
}

export interface AdminArticleInput {
  title: string;
  excerpt: string;
  bodyText: string;
  category: Exclude<CategorySlug, 'all'>;
  tags: string[];
  imageUrl: string;
  authorName: string;
  authorRole: string;
  readTimeMinutes: number;
  isBreaking: boolean;
  isFeatured: boolean;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  parentId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
  isOwn: boolean;
}

