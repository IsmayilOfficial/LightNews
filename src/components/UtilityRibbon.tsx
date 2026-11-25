import { Moon, Radio, Sun, X } from 'lucide-react';
import { CATEGORY_LABELS, UI_COPY } from '../data/i18n';
import { BreakingTickerItem, Language, TrendingTag } from '../types/news';

interface UtilityRibbonProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  breaking: BreakingTickerItem[];
  trendingTags: TrendingTag[];
  activeTag: string | null;
  searchQuery: string;
  breakingTickerEnabled?: boolean;
  announcementBanner?: string;
  onSelectTag: (tag: string | null) => void;
  onClearSearch: () => void;
  onOpenSlug: (slug: string) => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'az', label: 'AZ' },
  { code: 'ru', label: 'RU' },
];

export function UtilityRibbon({
  lang,
  onChangeLang,
  theme,
  onToggleTheme,
  breaking,
  trendingTags,
  activeTag,
  searchQuery,
  breakingTickerEnabled = true,
  announcementBanner = '',
  onSelectTag,
  onClearSearch,
  onOpenSlug,
}: UtilityRibbonProps) {
  const copy = UI_COPY[lang];
  const tickerList = breakingTickerEnabled && breaking.length > 0 ? [...breaking, ...breaking] : [];

  return (
    <div className="w-full">
      {/* Row 1: Breaking News Ticker + Language & Theme Controls */}
      <div className="bg-[#0058CC] dark:bg-[#0F2447] text-white border-b border-[#004BB0] dark:border-slate-800">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            {breakingTickerEnabled ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold tracking-wider bg-[#DC2626] text-white rounded whitespace-nowrap shrink-0">
                  <Radio className="w-3 h-3" aria-hidden="true" />
                  {copy.breakingLabel}
                </span>

                <div className="relative overflow-hidden flex-1 min-w-0">
                  {tickerList.length > 0 && (
                    <div className="animate-ticker flex items-center gap-8">
                      {tickerList.map((item, idx) => (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          onClick={() => onOpenSlug(item.slug)}
                          className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-medium text-white/95 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <span className="text-sky-200 font-semibold">
                            {CATEGORY_LABELS[item.category][lang]}
                          </span>
                          <span aria-hidden="true" className="text-white/40">
                            /
                          </span>
                          <span>{item.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="text-xs font-medium text-white/85 truncate">
                {announcementBanner || 'LightNews Editorial Edition'}
              </span>
            )}
          </div>

          {/* Language Switcher & Dark/Light Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-white/15">
            <div
              role="group"
              aria-label="Language selector"
              className="flex items-center bg-black/20 rounded-md p-0.5"
            >
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onChangeLang(item.code)}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded transition-colors whitespace-nowrap cursor-pointer ${
                    lang === item.code
                      ? 'bg-white text-[#0058CC] shadow-xs'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-black/20 hover:bg-black/35 text-white transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Trending Topic Tags Bar */}
      <div className="bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-11 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0 mr-1">
              {copy.trendingLabel}:
            </span>
            {trendingTags.map(({ tag }) => {
              const isSelected = activeTag?.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectTag(isSelected ? null : tag)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0070FF] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          {(activeTag || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                onSelectTag(null);
                onClearSearch();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{copy.resetFilters}</span>
            </button>
          )}
        </div>
      </div>

      {breakingTickerEnabled && announcementBanner && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/60">
          <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-2 text-xs font-medium text-amber-900 dark:text-amber-200">
            {announcementBanner}
          </div>
        </div>
      )}
    </div>
  );
}
