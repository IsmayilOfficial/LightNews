import { CATEGORY_LABELS, UI_COPY } from '../data/i18n';
import { ArticleViewModel, Language } from '../types/news';
import { formatCompactNumber, formatNewsTimestamp } from '../utils/formatters';
import { EditorialImage } from './EditorialImage';

interface HeroSectionProps {
  articles: ArticleViewModel[];
  lang: Language;
  onOpenArticle: (slug: string) => void;
}

export function HeroSection({ articles, lang, onOpenArticle }: HeroSectionProps) {
  if (articles.length === 0) return null;

  const copy = UI_COPY[lang];
  const lead = articles[0];
  const secondary = articles.slice(1, 5);

  return (
    <section aria-label={copy.topStoriesTitle} className="mb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Lead Story (7 columns) */}
        <article className="lg:col-span-7 flex flex-col">
          <button
            type="button"
            onClick={() => onOpenArticle(lead.slug)}
            className="group relative w-full h-full min-h-[340px] sm:min-h-[420px] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF]"
          >
            <EditorialImage
              src={lead.imageUrl}
              alt={lead.title}
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex flex-col justify-end">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-200 mb-2.5">
                <span className="text-sky-300 font-semibold">
                  {CATEGORY_LABELS[lead.category][lang]}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {formatNewsTimestamp(lead.publishedAt, lang, copy.todayPrefix, copy.yesterdayPrefix)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {formatCompactNumber(lead.viewsToday)} {copy.viewsLabel}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight text-balance mb-2.5 group-hover:text-sky-200 transition-colors">
                {lead.title}
              </h1>
              <p className="text-sm text-slate-200/90 line-clamp-2 max-w-2xl leading-relaxed">
                {lead.excerpt}
              </p>
            </div>
          </button>
        </article>

        {/* Secondary 2x2 Editorial Grid (5 columns) */}
        {secondary.length > 0 && (
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {secondary.map((item) => (
              <article
                key={item.id}
                className="flex flex-col bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onOpenArticle(item.slug)}
                  className="group flex flex-col h-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF]"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <EditorialImage
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                        <span className="text-[#0070FF] dark:text-[#3894FF] font-semibold">
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
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-[#0070FF] dark:group-hover:text-[#3894FF] transition-colors">
                        {item.title}
                      </h2>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular">
                      {formatCompactNumber(item.viewsToday)} {copy.viewsLabel}
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
