import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CATEGORY_LABELS, UI_COPY } from '../data/i18n';
import { ArticleViewModel, Language } from '../types/news';
import { formatNewsTimestamp } from '../utils/formatters';

interface SearchOverlayProps {
  isOpen: boolean;
  lang: Language;
  initialQuery: string;
  onClose: () => void;
  onApplySearch: (q: string) => void;
  onOpenArticle: (slug: string) => void;
}

export function SearchOverlay({
  isOpen,
  lang,
  initialQuery,
  onClose,
  onApplySearch,
  onOpenArticle,
}: SearchOverlayProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ArticleViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const copy = UI_COPY[lang];

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/news?q=${encodeURIComponent(trimmed)}&lang=${encodeURIComponent(lang)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.articles ?? []);
        }
      } catch {
        // Ignore aborted fetch
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, lang, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.searchAction}
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/65 backdrop-blur-xs pt-14 sm:pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApplySearch(query.trim());
            onClose();
          }}
          className="flex items-center gap-3 px-4 sm:px-5 h-14 border-b border-slate-200 dark:border-slate-800"
        >
          <Search className="w-5 h-5 text-[#0070FF] shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.searchPlaceholder}
            maxLength={120}
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading && (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Searching full-text index...
            </div>
          )}

          {!isLoading && query.trim().length >= 2 && results.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {copy.noResults}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{copy.noResultsHint}</p>
            </div>
          )}

          {!isLoading &&
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onOpenArticle(item.slug);
                  onClose();
                }}
                className="w-full px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-semibold text-[#0070FF] dark:text-[#3894FF]">
                    {CATEGORY_LABELS[item.category][lang]}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">
                    {formatNewsTimestamp(
                      item.publishedAt,
                      lang,
                      copy.todayPrefix,
                      copy.yesterdayPrefix
                    )}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {item.excerpt}
                </p>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
