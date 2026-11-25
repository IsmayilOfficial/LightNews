import { Bookmark, ThumbsDown, ThumbsUp } from 'lucide-react';
import { CATEGORY_LABELS, UI_COPY } from '../data/i18n';
import { ArticleViewModel, Language } from '../types/news';
import { formatCompactNumber, formatNewsTimestamp } from '../utils/formatters';
import { EditorialImage } from './EditorialImage';

interface ArticleCardProps {
  article: ArticleViewModel;
  lang: Language;
  isSaved: boolean;
  onOpenArticle: (slug: string) => void;
  onReact: (articleId: string, reaction: 'like' | 'dislike') => void;
  onToggleSave: (articleId: string) => void;
}

export function ArticleCard({
  article,
  lang,
  isSaved,
  onOpenArticle,
  onReact,
  onToggleSave,
}: ArticleCardProps) {
  const copy = UI_COPY[lang];

  return (
    <article className="flex flex-col bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-150">
      <button
        type="button"
        onClick={() => onOpenArticle(article.slug)}
        className="group flex flex-col flex-1 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0070FF]"
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <EditorialImage
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        </div>

        <div className="p-4 flex flex-col flex-1">
          {/* Clean unboxed metadata row (zero-pill discipline) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold text-[#0070FF] dark:text-[#3894FF]">
              {CATEGORY_LABELS[article.category][lang]}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {formatNewsTimestamp(article.publishedAt, lang, copy.todayPrefix, copy.yesterdayPrefix)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {formatCompactNumber(article.viewsToday)} {copy.viewsLabel}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 text-balance mb-2 group-hover:text-[#0070FF] dark:group-hover:text-[#3894FF] transition-colors">
            {article.title}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        </div>
      </button>

      {/* Card footer with read time, Save for Later, and Like / Dislike counters */}
      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular whitespace-nowrap">
          {article.readTimeMinutes} {copy.minRead}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onReact(article.id, 'like')}
            aria-pressed={article.userReaction === 'like'}
            aria-label={`Like ${article.title}`}
            className={`inline-flex items-center gap-1 px-2 h-8 rounded-md text-xs font-medium font-mono-tabular transition-colors cursor-pointer ${
              article.userReaction === 'like'
                ? 'bg-[#0070FF]/12 text-[#0070FF] dark:bg-[#3894FF]/20 dark:text-[#3894FF]'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{article.likes}</span>
          </button>

          <button
            type="button"
            onClick={() => onReact(article.id, 'dislike')}
            aria-pressed={article.userReaction === 'dislike'}
            aria-label={`Dislike ${article.title}`}
            className={`inline-flex items-center gap-1 px-2 h-8 rounded-md text-xs font-medium font-mono-tabular transition-colors cursor-pointer ${
              article.userReaction === 'dislike'
                ? 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>{article.dislikes}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSave(article.id)}
            aria-pressed={isSaved}
            aria-label={isSaved ? copy.savedLabel : copy.saveForLater}
            title={isSaved ? copy.savedLabel : copy.saveForLater}
            className={`inline-flex items-center gap-1 px-2 h-8 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              isSaved
                ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} aria-hidden="true" />
            <span>{isSaved ? copy.savedLabel : copy.saveForLater}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
