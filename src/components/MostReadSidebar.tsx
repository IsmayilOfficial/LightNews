import { CATEGORY_LABELS, UI_COPY } from '../data/i18n';
import { ArticleViewModel, Language } from '../types/news';
import { formatCompactNumber } from '../utils/formatters';

interface MostReadSidebarProps {
  items: ArticleViewModel[];
  period: 'today' | 'week';
  lang: Language;
  onChangePeriod: (period: 'today' | 'week') => void;
  onOpenArticle: (slug: string) => void;
}

export function MostReadSidebar({
  items,
  period,
  lang,
  onChangePeriod,
  onOpenArticle,
}: MostReadSidebarProps) {
  const copy = UI_COPY[lang];

  return (
    <aside
      aria-label={copy.mostReadTitle}
      className="lg:sticky lg:top-20 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {copy.mostReadTitle}
        </h2>
      </div>

      {/* Segmented Today / This Week switcher */}
      <div
        role="tablist"
        aria-label={copy.mostReadTitle}
        className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg mb-4"
      >
        <button
          type="button"
          role="tab"
          aria-selected={period === 'today'}
          onClick={() => onChangePeriod('today')}
          className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            period === 'today'
              ? 'bg-white dark:bg-slate-900 text-[#0070FF] dark:text-[#3894FF] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {copy.todayTab}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={period === 'week'}
          onClick={() => onChangePeriod('week')}
          className={`py-1.5 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            period === 'week'
              ? 'bg-white dark:bg-slate-900 text-[#0070FF] dark:text-[#3894FF] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          {copy.weekTab}
        </button>
      </div>

      {/* Numbered 1..8 list */}
      <ol className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {items.map((item, idx) => {
          const views = period === 'today' ? item.viewsToday : item.viewsWeek;
          return (
            <li key={item.id} className="py-3 first:pt-1 last:pb-0">
              <button
                type="button"
                onClick={() => onOpenArticle(item.slug)}
                className="group w-full flex items-start gap-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF] rounded"
              >
                <span className="text-lg font-extrabold text-[#0070FF] dark:text-[#3894FF] font-mono-tabular leading-tight w-5 shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 group-hover:text-[#0070FF] dark:group-hover:text-[#3894FF] transition-colors mb-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{CATEGORY_LABELS[item.category][lang]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {formatCompactNumber(views)} {copy.viewsLabel}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
