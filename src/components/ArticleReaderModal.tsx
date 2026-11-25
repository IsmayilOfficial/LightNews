import DOMPurify from 'dompurify';
import {
  AlertCircle,
  Bookmark,
  Check,
  ChevronRight,
  Link2,
  Mail,
  MapPin,
  Pause,
  Play,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_LABELS, UI_COPY } from '../data/i18n';
import { SPEECH_SPEEDS, useArticleSpeech } from '../hooks/useArticleSpeech';
import { useSilentReadingTracker } from '../hooks/useSilentReadingTracker';
import { ArticleViewModel, Language } from '../types/news';
import { formatCompactNumber, formatNewsTimestamp } from '../utils/formatters';
import { CommentSection } from './CommentSection';
import { EditorialImage } from './EditorialImage';

interface ArticleReaderModalProps {
  article: ArticleViewModel | null;
  lang: Language;
  sessionToken: string;
  csrfToken: string;
  onEnsureSession: (
    forceRefresh?: boolean
  ) => Promise<{ sessionToken: string; csrfToken: string } | null>;
  isSaved: boolean;
  onClose: () => void;
  onReact: (articleId: string, reaction: 'like' | 'dislike') => void;
  onToggleSave: (articleId: string) => void;
  onOpenArticle: (slug: string) => void;
  onSelectTag: (tag: string) => void;
  onProfileSynced: () => void;
}

export function ArticleReaderModal({
  article,
  lang,
  sessionToken,
  csrfToken,
  onEnsureSession,
  isSaved,
  onClose,
  onReact,
  onToggleSave,
  onOpenArticle,
  onSelectTag,
  onProfileSynced,
}: ArticleReaderModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const articleContentRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<ArticleViewModel[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [authorDrawerOpen, setAuthorDrawerOpen] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<ArticleViewModel['author'] | null>(null);
  const [authorArticles, setAuthorArticles] = useState<ArticleViewModel[]>([]);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [summaryBullets, setSummaryBullets] = useState<string[] | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const summaryCardRef = useRef<HTMLElement | null>(null);
  const copy = UI_COPY[lang];

  useSilentReadingTracker({
    article,
    scrollContainerRef,
    sessionToken,
    csrfToken,
    onProfileSynced,
  });

  useEffect(() => {
    if (!article) return;
    setScrollProgress(0);
    setCopiedLink(false);
    setAuthorDrawerOpen(false);
    setSummaryBullets(null);
    setSummaryLoading(false);
    setSummaryError('');
    setSummaryExpanded(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    const updateReadingProgress = () => {
      const container = scrollContainerRef.current;
      const contentEl = articleContentRef.current;
      if (!container) return;

      const contentBottom = contentEl
        ? contentEl.offsetTop + contentEl.offsetHeight
        : container.scrollHeight;
      const maxScrollable = Math.min(
        Math.max(0, container.scrollHeight - container.clientHeight),
        Math.max(0, contentBottom - container.clientHeight)
      );

      if (maxScrollable <= 10) {
        setScrollProgress(100);
        return;
      }

      const pct = Math.min(100, Math.max(0, (container.scrollTop / maxScrollable) * 100));
      setScrollProgress(pct);
    };

    let rafId = 0;
    const handleScroll = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateReadingProgress);
    };

    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && articleContentRef.current
        ? new ResizeObserver(handleScroll)
        : null;
    if (resizeObserver && articleContentRef.current) {
      resizeObserver.observe(articleContentRef.current);
    }

    const initTimer = window.setTimeout(updateReadingProgress, 120);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAuthorDrawerOpen((wasOpen) => {
          if (wasOpen) return false;
          onClose();
          return false;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(initTimer);
      container?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      resizeObserver?.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [article?.id, onClose]);

  useEffect(() => {
    setSummaryBullets(null);
    setSummaryError('');
    setSummaryExpanded(false);
  }, [lang]);

  useEffect(() => {
    if (summaryExpanded && summaryCardRef.current) {
      summaryCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [summaryExpanded]);

  // Fetch author profile & all published articles by that author when side-panel opens
  useEffect(() => {
    if (!authorDrawerOpen || !article?.author.id) return;

    const controller = new AbortController();
    setAuthorLoading(true);
    setAuthorProfile(article.author);

    const headers: Record<string, string> = {};
    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`;
    }

    fetch(
      `/api/authors/${encodeURIComponent(article.author.id)}/articles?lang=${lang}`,
      {
        credentials: 'same-origin',
        headers,
        signal: controller.signal,
      }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!controller.signal.aborted && data) {
          if (data.author) setAuthorProfile(data.author);
          setAuthorArticles(Array.isArray(data.articles) ? data.articles : []);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAuthorArticles([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAuthorLoading(false);
        }
      });

    return () => controller.abort();
  }, [authorDrawerOpen, article?.author.id, lang, sessionToken]);

  // Fetch similar stories by category & tag metadata for 'More Like This'
  useEffect(() => {
    if (!article?.slug) {
      setRelatedArticles([]);
      return;
    }

    const controller = new AbortController();
    setRelatedLoading(true);

    const headers: Record<string, string> = {};
    if (sessionToken) {
      headers.Authorization = `Bearer ${sessionToken}`;
    }

    fetch(`/api/news/${encodeURIComponent(article.slug)}/related?lang=${lang}&limit=3`, {
      credentials: 'same-origin',
      headers,
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!controller.signal.aborted) {
          setRelatedArticles(Array.isArray(data?.items) ? data.items : []);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRelatedArticles([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRelatedLoading(false);
        }
      });

    return () => controller.abort();
  }, [article?.slug, lang, sessionToken]);

  const sanitizedBody = useMemo(() => {
    if (!article) return '';
    return DOMPurify.sanitize(article.bodyHtml, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'blockquote', 'ul', 'ol', 'li', 'a', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }, [article?.bodyHtml]);

  const speech = useArticleSpeech({
    articleId: article?.id ?? null,
    title: article?.title ?? '',
    excerpt: article?.excerpt ?? '',
    bodyHtml: sanitizedBody,
    lang,
  });

  if (!article) return null;

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?article=${encodeURIComponent(article.slug)}`
      : `/?article=${encodeURIComponent(article.slug)}`;

  const twitterHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  const handleSummarize = async () => {
    if (!article) return;

    if (summaryBullets && summaryBullets.length > 0) {
      setSummaryExpanded((prev) => !prev);
      return;
    }

    setSummaryLoading(true);
    setSummaryError('');
    setSummaryExpanded(true);

    try {
      let activeSession = sessionToken;
      let activeCsrf = csrfToken;
      if (!activeSession || !activeCsrf) {
        const refreshed = await onEnsureSession();
        if (refreshed) {
          activeSession = refreshed.sessionToken;
          activeCsrf = refreshed.csrfToken;
        }
      }

      const sendRequest = (sToken: string, cToken: string) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (sToken) headers.Authorization = `Bearer ${sToken}`;
        if (cToken) headers['X-CSRF-Token'] = cToken;
        return fetch(`/api/news/${encodeURIComponent(article.id)}/summarize`, {
          method: 'POST',
          credentials: 'same-origin',
          headers,
          body: JSON.stringify({ lang }),
        });
      };

      let res = await sendRequest(activeSession, activeCsrf);
      if (res.status === 403) {
        const refreshed = await onEnsureSession(true);
        if (refreshed) {
          res = await sendRequest(refreshed.sessionToken, refreshed.csrfToken);
        }
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSummaryError(data?.error || copy.aiSummaryError);
        return;
      }

      const bullets = Array.isArray(data?.bullets)
        ? data.bullets.filter((b: unknown): b is string => typeof b === 'string')
        : [];
      if (bullets.length === 0) {
        setSummaryError(copy.aiSummaryError);
        return;
      }
      setSummaryBullets(bullets);
    } catch {
      setSummaryError(copy.aiSummaryError);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore clipboard permission failures gracefully
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-headline"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-full sm:h-[90vh] bg-white dark:bg-[#0F172A] sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Slim Fixed-Position Reading Progress Bar at Top of Modal */}
        <div
          role="progressbar"
          aria-label="Reading progress"
          aria-valuenow={Math.round(scrollProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute top-0 inset-x-0 z-20 h-[3px] bg-slate-200/80 dark:bg-slate-800/80 pointer-events-none"
        >
          <div
            className="h-full w-full bg-[#0070FF] dark:bg-[#3894FF] origin-left transition-transform duration-75 ease-out"
            style={{ transform: `scaleX(${scrollProgress / 100})` }}
          />
        </div>

        {/* Top Sticky Reader Bar */}
        <div className="relative shrink-0 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-5 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
            <span className="font-semibold text-[#0070FF] dark:text-[#3894FF]">
              {CATEGORY_LABELS[article.category][lang]}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {formatNewsTimestamp(article.publishedAt, lang, copy.todayPrefix, copy.yesterdayPrefix)}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="hidden sm:inline font-mono-tabular">
              {article.readTimeMinutes} {copy.minRead}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSummarize}
              disabled={summaryLoading}
              aria-expanded={summaryExpanded}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 ${
                summaryExpanded && summaryBullets
                  ? 'bg-[#0070FF] text-white'
                  : 'bg-[#0070FF]/10 dark:bg-[#3894FF]/15 text-[#0070FF] dark:text-[#3894FF] hover:bg-[#0070FF]/20 dark:hover:bg-[#3894FF]/25'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${summaryLoading ? 'animate-pulse' : ''}`} aria-hidden="true" />
              <span>
                {summaryLoading
                  ? copy.aiSummarizing
                  : summaryBullets
                  ? summaryExpanded
                    ? copy.aiSummaryHide
                    : copy.aiSummaryShow
                  : copy.aiSummarizeButton}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(article.id)}
              aria-pressed={isSaved}
              aria-label={isSaved ? copy.savedLabel : copy.saveForLater}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                isSaved
                  ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">{isSaved ? copy.savedLabel : copy.saveForLater}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                speech.stop();
                onClose();
              }}
              aria-label={copy.close}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Editorial Article Body */}
        <div
          ref={scrollContainerRef}
          className="relative flex-1 overflow-y-auto px-5 sm:px-10 py-8"
        >
          <article className="max-w-[68ch] mx-auto">
            <div ref={articleContentRef}>
            <h1
              id="reader-headline"
              className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 leading-tight tracking-tight text-balance mb-4"
            >
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {article.excerpt}
            </p>

            {/* Author Byline, Views & Social Sharing Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 border-y border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mb-7">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-400 dark:text-slate-500">{copy.authorBy}</span>
                <button
                  type="button"
                  onClick={() => setAuthorDrawerOpen(true)}
                  aria-expanded={authorDrawerOpen}
                  className="group inline-flex items-center gap-1.5 px-2 py-1 -my-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF]"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0070FF]/12 text-[#0070FF] dark:bg-[#3894FF]/20 dark:text-[#3894FF] text-[10px] font-bold"
                  >
                    {article.author.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? '')
                      .join('')}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#0070FF] dark:group-hover:text-[#3894FF] underline-offset-2 group-hover:underline">
                    {article.author.name}
                  </span>
                  <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
                    · {article.author.role}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0070FF] dark:group-hover:text-[#3894FF]" aria-hidden="true" />
                </button>
                <span aria-hidden="true" className="mx-0.5">
                  ·
                </span>
                <span className="font-mono-tabular">
                  {formatCompactNumber(article.viewsToday)} {copy.viewsLabel}
                </span>
              </div>

              <div
                role="group"
                aria-label={copy.shareLabel}
                className="flex items-center gap-1.5 shrink-0"
              >
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
                  {copy.shareLabel}:
                </span>

                <a
                  href={twitterHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={copy.shareTwitter}
                  title={copy.shareTwitter}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#0070FF] hover:text-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                <a
                  href={linkedInHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={copy.shareLinkedIn}
                  title={copy.shareLinkedIn}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#0A66C2] hover:text-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z" />
                  </svg>
                </a>

                <a
                  href={facebookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={copy.shareFacebook}
                  title={copy.shareFacebook}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#1877F2] hover:text-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95" />
                  </svg>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  aria-label={copiedLink ? copy.linkCopied : copy.copyLink}
                  className={`inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{copiedLink ? copy.linkCopied : copy.copyLink}</span>
                </button>
              </div>
            </div>

            {/* Text-to-Speech Audio Article Controls */}
            <div
              role="region"
              aria-label={copy.listenTitle}
              className="mb-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3"
            >
              {!speech.supported ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{copy.listenUnsupported}</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={speech.togglePlayPause}
                      disabled={!speech.hasContent}
                      aria-label={
                        speech.status === 'playing'
                          ? copy.listenPause
                          : speech.status === 'paused'
                          ? copy.listenResume
                          : copy.listenPlay
                      }
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {speech.status === 'playing' ? (
                        <Pause className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      )}
                      <span>
                        {speech.status === 'playing'
                          ? copy.listenPause
                          : speech.status === 'paused'
                          ? copy.listenResume
                          : copy.listenPlay}
                      </span>
                    </button>

                    {speech.status !== 'idle' && (
                      <button
                        type="button"
                        onClick={speech.stop}
                        aria-label={copy.listenStop}
                        title={copy.listenStop}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      </button>
                    )}

                    <div className="min-w-0 flex-1 pl-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 truncate">
                          <Volume2 className="w-3.5 h-3.5 text-[#0070FF] dark:text-[#3894FF] shrink-0" aria-hidden="true" />
                          <span className="truncate">{copy.listenTitle}</span>
                        </span>
                        <span className="text-[11px] font-mono-tabular text-slate-500 dark:text-slate-400 shrink-0">
                          {speech.status === 'playing'
                            ? `${copy.listenPlaying} · ${speech.progressPct}%`
                            : speech.status === 'paused'
                            ? `${copy.listenPaused} · ${speech.progressPct}%`
                            : `${article.readTimeMinutes} ${copy.minRead}`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-[#0070FF] dark:bg-[#3894FF] transition-all duration-300"
                          style={{ width: `${speech.progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Speed Controls */}
                  <div
                    role="group"
                    aria-label={copy.listenSpeed}
                    className="flex items-center gap-1 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg p-1 self-start sm:self-auto shrink-0"
                  >
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-1.5 hidden md:inline">
                      {copy.listenSpeed}
                    </span>
                    {SPEECH_SPEEDS.map((spd) => {
                      const active = speech.rate === spd;
                      return (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => speech.setRate(spd)}
                          aria-pressed={active}
                          className={`px-2 py-1 text-[11px] font-mono-tabular font-semibold rounded transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#0070FF] text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {spd}x
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Expandable 3-Bullet AI Summary Card */}
            {summaryExpanded && (summaryLoading || summaryError || (summaryBullets && summaryBullets.length > 0)) && (
              <section
                ref={summaryCardRef}
                aria-label={copy.aiSummaryTitle}
                className="mb-7 rounded-xl border border-[#0070FF]/25 dark:border-[#3894FF]/30 bg-[#0070FF]/[0.04] dark:bg-[#3894FF]/[0.07] p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0070FF] dark:text-[#3894FF]" aria-hidden="true" />
                    <h2 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {copy.aiSummaryTitle}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSummaryExpanded(false)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
                  >
                    {copy.aiSummaryHide}
                  </button>
                </div>

                {summaryLoading ? (
                  <div className="space-y-2.5">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-4 rounded bg-[#0070FF]/12 dark:bg-[#3894FF]/15 animate-pulse"
                        style={{ width: `${94 - idx * 8}%` }}
                      />
                    ))}
                  </div>
                ) : summaryError ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-rose-600 dark:text-rose-400">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{summaryError}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSummaryBullets(null);
                        handleSummarize();
                      }}
                      className="px-2.5 py-1 rounded-md font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      {copy.aiSummaryRetry}
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {summaryBullets?.map((bullet, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
                      >
                        <span className="mt-0.5 w-5 h-5 rounded-md bg-[#0070FF]/12 dark:bg-[#3894FF]/20 text-[#0070FF] dark:text-[#3894FF] text-[11px] font-mono-tabular font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Lead Photography & Caption */}
            <figure className="mb-8">
              <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                <EditorialImage
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <figcaption className="mt-2.5 text-xs font-editorial italic text-slate-500 dark:text-slate-400">
                {article.imageCaption}
              </figcaption>
            </figure>

            {/* Editorial Pull Quote (clean top/bottom hairline rules, no thick left bar) */}
            <blockquote className="my-8 py-5 border-y border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xl sm:text-2xl font-editorial italic text-slate-800 dark:text-slate-100 leading-snug text-balance">
                {article.pullQuote}
              </p>
            </blockquote>

            {/* Sanitized Long-Form Editorial Prose */}
            <div
              className="font-editorial text-[17px] sm:text-[18px] leading-[1.8] text-slate-800 dark:text-slate-200 space-y-5 [&>p:first-of-type]:first-letter:text-5xl [&>p:first-of-type]:first-letter:font-bold [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-1 [&>p:first-of-type]:first-letter:text-[#0070FF] dark:[&>p:first-of-type]:first-letter:text-[#3894FF]"
              dangerouslySetInnerHTML={{ __html: sanitizedBody }}
            />

            {/* Topics + Reactions Footer */}
            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1">
                  {copy.tagsLabel}:
                </span>
                {article.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      onSelectTag(tag);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-[#0070FF] hover:text-white rounded-md transition-colors cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onReact(article.id, 'like')}
                  aria-pressed={article.userReaction === 'like'}
                  className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-lg text-xs font-semibold font-mono-tabular transition-colors cursor-pointer ${
                    article.userReaction === 'like'
                      ? 'bg-[#0070FF] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{article.likes}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onReact(article.id, 'dislike')}
                  aria-pressed={article.userReaction === 'dislike'}
                  className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-lg text-xs font-semibold font-mono-tabular transition-colors cursor-pointer ${
                    article.userReaction === 'dislike'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>{article.dislikes}</span>
                </button>
              </div>
            </div>

            {/* Object Storage Media Provenance Metadata */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular text-slate-400 dark:text-slate-500">
              <span>
                {copy.storageLabel}: {article.mediaAsset.storageProvider} · {article.mediaAsset.objectKey}
              </span>
              <span>
                {article.mediaAsset.width}×{article.mediaAsset.height}
              </span>
            </div>
            </div>

            {/* Reader Comments & Replies */}
            <CommentSection
              articleId={article.id}
              lang={lang}
              sessionToken={sessionToken}
              csrfToken={csrfToken}
              onEnsureSession={onEnsureSession}
            />

            {/* More Like This: Category & Tag Matched Stories */}
            {(relatedLoading || relatedArticles.length > 0) && (
              <section
                aria-label={copy.moreLikeThisTitle}
                className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {copy.moreLikeThisTitle}
                  </h2>
                  {relatedLoading && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {copy.moreLikeThisLoading}
                    </span>
                  )}
                </div>

                {relatedLoading && relatedArticles.length === 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {relatedArticles.map((rel) => (
                      <button
                        key={rel.id}
                        type="button"
                        onClick={() => {
                          speech.stop();
                          onOpenArticle(rel.slug);
                        }}
                        className="group flex flex-col text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 hover:border-[#0070FF]/60 overflow-hidden transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF]"
                      >
                        <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <EditorialImage
                            src={rel.imageUrl}
                            alt={rel.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="p-3 flex flex-col flex-1 gap-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-[#0070FF] dark:text-[#3894FF]">
                              {CATEGORY_LABELS[rel.category][lang]}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">
                              {rel.readTimeMinutes} {copy.minRead}
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-[#0070FF] dark:group-hover:text-[#3894FF] transition-colors">
                            {rel.title}
                          </h3>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </article>
        </div>

        {/* Slide-Over Author Profile & Published Articles Side-Panel */}
        {authorDrawerOpen && (
          <div
            className="absolute inset-0 z-30 flex justify-end bg-slate-950/40 backdrop-blur-[1px]"
            onClick={() => setAuthorDrawerOpen(false)}
          >
            <aside
              role="region"
              aria-label={authorProfile?.name ?? article.author.name}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm h-full bg-white dark:bg-[#0F172A] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="h-14 shrink-0 px-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                  {copy.authorMoreBy}
                </span>
                <button
                  type="button"
                  onClick={() => setAuthorDrawerOpen(false)}
                  aria-label={copy.authorClosePanel}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Author Profile Header */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#0070FF] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {(authorProfile?.name ?? article.author.name)
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? '')
                        .join('')}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                        {authorProfile?.name ?? article.author.name}
                      </h3>
                      <p className="text-xs font-medium text-[#0070FF] dark:text-[#3894FF] truncate">
                        {authorProfile?.role ?? article.author.role}
                      </p>
                    </div>
                  </div>

                  {(authorProfile?.bio ?? article.author.bio) && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {authorProfile?.bio ?? article.author.bio}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {(authorProfile?.beat ?? article.author.beat) && (
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {authorProfile?.beat ?? article.author.beat}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        <span>{authorProfile?.location ?? article.author.location}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" aria-hidden="true" />
                        <span>{authorProfile?.email ?? article.author.email}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Published Articles by Author */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {copy.authorArticlesCount}
                    </span>
                    <span className="font-mono-tabular text-slate-500 dark:text-slate-400">
                      {authorArticles.length}
                    </span>
                  </div>

                  {authorLoading ? (
                    <div className="space-y-2.5">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : authorArticles.length <= 1 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-3">
                      {copy.authorNoOtherArticles}
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {authorArticles.map((item) => {
                        const isCurrent = item.id === article.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={isCurrent}
                            onClick={() => {
                              speech.stop();
                              setAuthorDrawerOpen(false);
                              onOpenArticle(item.slug);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-colors ${
                              isCurrent
                                ? 'border-[#0070FF]/50 bg-[#0070FF]/5 dark:bg-[#3894FF]/10 cursor-default'
                                : 'border-slate-200 dark:border-slate-800 hover:border-[#0070FF]/60 bg-white dark:bg-slate-900/40 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                              <span className="font-semibold text-[#0070FF] dark:text-[#3894FF]">
                                {CATEGORY_LABELS[item.category][lang]}
                              </span>
                              <span className="font-mono-tabular text-slate-400 dark:text-slate-500">
                                {isCurrent
                                  ? copy.authorCurrentlyReading
                                  : formatNewsTimestamp(
                                      item.publishedAt,
                                      lang,
                                      copy.todayPrefix,
                                      copy.yesterdayPrefix
                                    )}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                              {item.title}
                            </h4>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
