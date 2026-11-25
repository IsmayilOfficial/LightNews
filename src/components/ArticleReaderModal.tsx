import DOMPurify from 'dompurify';
import { Check, Link2, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_LABELS, UI_COPY } from '../data/i18n';
import { useSilentReadingTracker } from '../hooks/useSilentReadingTracker';
import { ArticleViewModel, Language } from '../types/news';
import { formatCompactNumber, formatNewsTimestamp } from '../utils/formatters';
import { EditorialImage } from './EditorialImage';

interface ArticleReaderModalProps {
  article: ArticleViewModel | null;
  lang: Language;
  sessionToken: string;
  csrfToken: string;
  onClose: () => void;
  onReact: (articleId: string, reaction: 'like' | 'dislike') => void;
  onSelectTag: (tag: string) => void;
  onProfileSynced: () => void;
}

export function ArticleReaderModal({
  article,
  lang,
  sessionToken,
  csrfToken,
  onClose,
  onReact,
  onSelectTag,
  onProfileSynced,
}: ArticleReaderModalProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const copy = UI_COPY[lang];

  useSilentReadingTracker({
    article,
    scrollContainerRef,
    sessionToken,
    csrfToken,
    onScrollProgress: setScrollProgress,
    onProfileSynced,
  });

  useEffect(() => {
    if (!article) return;
    setScrollProgress(0);
    setCopiedLink(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [article?.id, onClose]);

  const sanitizedBody = useMemo(() => {
    if (!article) return '';
    return DOMPurify.sanitize(article.bodyHtml, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'blockquote', 'ul', 'ol', 'li', 'a', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }, [article?.bodyHtml]);

  if (!article) return null;

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?article=${encodeURIComponent(article.slug)}`
      : `/?article=${encodeURIComponent(article.slug)}`;

  const twitterHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

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
        {/* Top Sticky Reader Bar + Compositor-Only Reading Depth Progress */}
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

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0070FF] origin-left transition-transform duration-100"
            style={{ transform: `scaleX(${scrollProgress / 100})` }}
          />
        </div>

        {/* Scrollable Editorial Article Body */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-5 sm:px-10 py-8"
        >
          <article className="max-w-[68ch] mx-auto">
            <h1
              id="reader-headline"
              className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 leading-tight tracking-tight text-balance mb-4"
            >
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {article.excerpt}
            </p>

            {/* Author, Views & Social Sharing Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 border-y border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mb-7">
              <div>
                <span className="text-slate-400 dark:text-slate-500 mr-1">{copy.authorBy}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {article.author.name}
                </span>
                <span aria-hidden="true" className="mx-1.5">
                  ·
                </span>
                <span>{article.author.role}</span>
                <span aria-hidden="true" className="mx-1.5">
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
          </article>
        </div>
      </div>
    </div>
  );
}
