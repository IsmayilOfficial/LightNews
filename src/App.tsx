import { Bookmark } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { ArchitectureBlueprintModal } from './components/ArchitectureBlueprintModal';
import { ArticleCard } from './components/ArticleCard';
import { ArticleReaderModal } from './components/ArticleReaderModal';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { MostReadSidebar } from './components/MostReadSidebar';
import { NewsletterSubscription } from './components/NewsletterSubscription';
import { SearchOverlay } from './components/SearchOverlay';
import { UtilityRibbon } from './components/UtilityRibbon';
import { CATEGORY_LABELS, UI_COPY } from './data/i18n';
import {
  ArticleViewModel,
  BreakingTickerItem,
  CategorySlug,
  Language,
  PersonalizationProfileSnapshot,
  SiteConfig,
  TrendingTag,
} from './types/news';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('ln_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  const [activeCategory, setActiveCategory] = useState<CategorySlug>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [savedOnly, setSavedOnly] = useState<boolean>(false);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('ln_saved_articles');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });
  const [mostReadPeriod, setMostReadPeriod] = useState<'today' | 'week'>('today');

  const [sessionToken, setSessionToken] = useState<string>('');
  const [csrfToken, setCsrfToken] = useState<string>('');
  const sessionTokenRef = useRef<string>('');
  const csrfTokenRef = useRef<string>('');
  const userSelectedLangRef = useRef<boolean>(false);
  const sessionPromiseRef = useRef<Promise<{ sessionToken: string; csrfToken: string } | null> | null>(null);
  const [articles, setArticles] = useState<ArticleViewModel[]>([]);
  const [breaking, setBreaking] = useState<BreakingTickerItem[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [mostRead, setMostRead] = useState<ArticleViewModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [openArticle, setOpenArticle] = useState<ArticleViewModel | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [architectureOpen, setArchitectureOpen] = useState<boolean>(false);
  const [adminOpen, setAdminOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('view') === 'admin';
    }
    return false;
  });
  const [adminToken, setAdminToken] = useState<string>('');
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    breakingTickerEnabled: true,
    personalizationEnabled: true,
    defaultLanguage: 'en',
    announcementBanner: '',
  });
  const [profileSnapshot, setProfileSnapshot] = useState<PersonalizationProfileSnapshot | null>(
    null
  );

  // Sync Tailwind v4 .dark root class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('ln_theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem('ln_saved_articles', JSON.stringify(savedIds));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [savedIds]);

  const savedIdSet = useMemo(() => new Set(savedIds), [savedIds]);

  const handleToggleSave = useCallback((articleId: string) => {
    setSavedIds((prev) =>
      prev.includes(articleId) ? prev.filter((id) => id !== articleId) : [articleId, ...prev]
    );
  }, []);

  // Keyboard shortcut Cmd/Ctrl+K for instant search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const ensureSession = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && sessionTokenRef.current && csrfTokenRef.current) {
      return { sessionToken: sessionTokenRef.current, csrfToken: csrfTokenRef.current };
    }
    if (forceRefresh) {
      sessionTokenRef.current = '';
      csrfTokenRef.current = '';
    }
    if (!sessionPromiseRef.current) {
      sessionPromiseRef.current = fetch('/api/session', { credentials: 'same-origin' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.csrfToken && data?.sessionToken) {
            sessionTokenRef.current = data.sessionToken;
            csrfTokenRef.current = data.csrfToken;
            setSessionToken(data.sessionToken);
            setCsrfToken(data.csrfToken);
            return { sessionToken: data.sessionToken as string, csrfToken: data.csrfToken as string };
          }
          return null;
        })
        .catch(() => null)
        .finally(() => {
          sessionPromiseRef.current = null;
        });
    }
    return sessionPromiseRef.current;
  }, []);

  // Bootstrap opaque HttpOnly session & CSRF token silently
  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        lang,
        category: savedOnly ? 'all' : activeCategory,
        sort: 'personalized',
      });
      if (activeTag) params.set('tag', activeTag);
      if (searchQuery) params.set('q', searchQuery);

      const headers: Record<string, string> = {};
      if (sessionTokenRef.current) headers.Authorization = `Bearer ${sessionTokenRef.current}`;

      const res = await fetch(`/api/news?${params.toString()}`, {
        credentials: 'same-origin',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles ?? []);
        setBreaking(data.breaking ?? []);
        setTrendingTags(data.trendingTags ?? []);
        if (data.siteConfig) {
          setSiteConfig(data.siteConfig);
          if (!userSelectedLangRef.current && data.siteConfig.defaultLanguage) {
            setLang(data.siteConfig.defaultLanguage);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [lang, activeCategory, activeTag, searchQuery, savedOnly]);

  const fetchMostRead = useCallback(async () => {
    try {
      const params = new URLSearchParams({ period: mostReadPeriod, lang });
      const headers: Record<string, string> = {};
      if (sessionTokenRef.current) headers.Authorization = `Bearer ${sessionTokenRef.current}`;

      const res = await fetch(`/api/news/most-read?${params.toString()}`, {
        credentials: 'same-origin',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setMostRead(data.items ?? []);
      }
    } catch {
      // Ignore transient network errors
    }
  }, [mostReadPeriod, lang]);

  const fetchProfileSnapshot = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (sessionTokenRef.current) headers.Authorization = `Bearer ${sessionTokenRef.current}`;

      const res = await fetch('/api/personalization/profile', {
        credentials: 'same-origin',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setProfileSnapshot(data.profile ?? null);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    fetchMostRead();
  }, [fetchMostRead]);

  const handleOpenArticle = useCallback(
    async (slug: string) => {
      try {
        const auth = await ensureSession();
        const headers: Record<string, string> = {};
        if (auth?.sessionToken) headers.Authorization = `Bearer ${auth.sessionToken}`;

        const res = await fetch(`/api/news/${encodeURIComponent(slug)}?lang=${lang}`, {
          credentials: 'same-origin',
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.article) {
            setOpenArticle(data.article);
            const url = new URL(window.location.href);
            url.searchParams.set('article', slug);
            window.history.replaceState({}, '', url.toString());
            fetchMostRead();
          }
        }
      } catch {
        // Ignore
      }
    },
    [ensureSession, lang, fetchMostRead]
  );

  // Open shared ?article=<slug> link automatically on initial load
  useEffect(() => {
    const initialSlug = new URLSearchParams(window.location.search).get('article');
    if (initialSlug) {
      handleOpenArticle(initialSlug);
    }
  }, []);

  const handleReact = useCallback(
    async (articleId: string, reaction: 'like' | 'dislike') => {
      const auth = await ensureSession();
      if (!auth) return;
      try {
        const res = await fetch(`/api/news/${encodeURIComponent(articleId)}/react`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': auth.csrfToken,
            Authorization: `Bearer ${auth.sessionToken}`,
          },
          body: JSON.stringify({ reaction, lang }),
        });
        if (res.ok) {
          const data = await res.json();
          const updated: ArticleViewModel | undefined = data.article;
          if (updated) {
            setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setOpenArticle((prev) => (prev && prev.id === updated.id ? updated : prev));
            fetchProfileSnapshot();
          }
        }
      } catch {
        // Ignore
      }
    },
    [ensureSession, lang, fetchProfileSnapshot]
  );

  const handleCloseReader = useCallback(() => {
    setOpenArticle(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('article');
    window.history.replaceState({}, '', url.toString());
    // Seamlessly re-rank feed in background after user finishes reading
    window.setTimeout(() => {
      fetchFeed();
      fetchProfileSnapshot();
    }, 220);
  }, [fetchFeed, fetchProfileSnapshot]);

  const copy = UI_COPY[lang];
  const isFiltered = activeCategory !== 'all' || Boolean(activeTag) || Boolean(searchQuery) || savedOnly;
  const displayedArticles = useMemo(
    () => (savedOnly ? articles.filter((a) => savedIdSet.has(a.id)) : articles),
    [articles, savedOnly, savedIdSet]
  );
  const heroArticles = !isFiltered ? displayedArticles.slice(0, 5) : [];
  const gridArticles = !isFiltered ? displayedArticles.slice(5) : displayedArticles;

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F1F5F9]">
      <Header
        lang={lang}
        theme={theme}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setActiveTag(null);
          setSavedOnly(false);
        }}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenArchitecture={() => setArchitectureOpen(true)}
        onOpenAdmin={() => {
          setAdminOpen(true);
          const url = new URL(window.location.href);
          url.searchParams.set('view', 'admin');
          window.history.replaceState({}, '', url.toString());
        }}
      />

      <UtilityRibbon
        lang={lang}
        onChangeLang={(nextLang) => {
          userSelectedLangRef.current = true;
          setLang(nextLang);
        }}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        breaking={breaking}
        trendingTags={trendingTags}
        activeTag={activeTag}
        searchQuery={searchQuery}
        breakingTickerEnabled={siteConfig.breakingTickerEnabled}
        announcementBanner={siteConfig.announcementBanner}
        onSelectTag={(tag) => setActiveTag(tag)}
        onClearSearch={() => setSearchQuery('')}
        onOpenSlug={handleOpenArticle}
      />

      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-7 sm:py-9">
        {!isFiltered && !isLoading && heroArticles.length > 0 && (
          <HeroSection
            articles={heroArticles}
            lang={lang}
            onOpenArticle={handleOpenArticle}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Main 3-Column Responsive News Grid */}
          <section
            aria-label={copy.latestFeedTitle}
            className="lg:col-span-8 xl:col-span-9"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-baseline gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {savedOnly
                    ? copy.savedItemsFilter
                    : activeTag
                    ? `#${activeTag}`
                    : searchQuery
                    ? `${copy.searchAction}: "${searchQuery}"`
                    : activeCategory !== 'all'
                    ? CATEGORY_LABELS[activeCategory][lang]
                    : copy.latestFeedTitle}
                </h2>
                <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                  {displayedArticles.length}
                </span>
              </div>

              <div
                role="group"
                aria-label="Feed filter"
                className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => setSavedOnly(false)}
                  aria-pressed={!savedOnly}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    !savedOnly
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {copy.allFeedFilter}
                </button>
                <button
                  type="button"
                  onClick={() => setSavedOnly(true)}
                  aria-pressed={savedOnly}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    savedOnly
                      ? 'bg-[#0070FF] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? 'fill-current' : ''}`} aria-hidden="true" />
                  <span>{copy.savedItemsFilter}</span>
                  <span className="font-mono-tabular opacity-85">({savedIds.length})</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-80 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : gridArticles.length === 0 ? (
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  {savedOnly ? copy.noSavedTitle : copy.noResults}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                  {savedOnly ? copy.noSavedHint : copy.noResultsHint}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('all');
                    setActiveTag(null);
                    setSearchQuery('');
                    setSavedOnly(false);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] rounded-lg cursor-pointer"
                >
                  {copy.resetFilters}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {gridArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    lang={lang}
                    isSaved={savedIdSet.has(article.id)}
                    onOpenArticle={handleOpenArticle}
                    onReact={handleReact}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Sticky Right Sidebar: Most Read News */}
          <div className="lg:col-span-4 xl:col-span-3">
            <MostReadSidebar
              items={mostRead}
              period={mostReadPeriod}
              lang={lang}
              onChangePeriod={setMostReadPeriod}
              onOpenArticle={handleOpenArticle}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] mt-14">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-8 border-b border-slate-200 dark:border-slate-800">
            <div className="lg:col-span-6 space-y-2.5">
              <div className="text-2xl font-extrabold tracking-tight">
                <span className="text-[#0070FF]">Light</span>
                <span className="text-[#F59E0B]">News</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
                {copy.footerTagline}
              </p>
            </div>

            <div className="lg:col-span-6">
              <NewsletterSubscription
                lang={lang}
                sessionToken={sessionToken}
                csrfToken={csrfToken}
                onEnsureSession={ensureSession}
              />
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>© {new Date().getFullYear()} LightNews</span>
            <div className="flex items-center gap-4">
              <span>{copy.footerPrivacy}</span>
              <button
                type="button"
                onClick={() => setArchitectureOpen(true)}
                className="font-semibold text-[#0070FF] dark:text-[#3894FF] hover:underline cursor-pointer"
              >
                {copy.footerArchitecture}
              </button>
            </div>
          </div>
        </div>
      </footer>

      <ArticleReaderModal
        article={openArticle}
        lang={lang}
        sessionToken={sessionToken}
        csrfToken={csrfToken}
        onEnsureSession={ensureSession}
        isSaved={openArticle ? savedIdSet.has(openArticle.id) : false}
        onClose={handleCloseReader}
        onReact={handleReact}
        onToggleSave={handleToggleSave}
        onOpenArticle={handleOpenArticle}
        onSelectTag={(tag) => setActiveTag(tag)}
        onProfileSynced={fetchProfileSnapshot}
      />

      <SearchOverlay
        isOpen={searchOpen}
        lang={lang}
        initialQuery={searchQuery}
        onClose={() => setSearchOpen(false)}
        onApplySearch={(q) => setSearchQuery(q)}
        onOpenArticle={handleOpenArticle}
      />

      <ArchitectureBlueprintModal
        isOpen={architectureOpen}
        onClose={() => setArchitectureOpen(false)}
        profile={profileSnapshot}
        onRefreshProfile={fetchProfileSnapshot}
      />

      <AdminPanel
        isOpen={adminOpen}
        onClose={() => {
          setAdminOpen(false);
          const url = new URL(window.location.href);
          url.searchParams.delete('view');
          window.history.replaceState({}, '', url.toString());
        }}
        sessionToken={sessionToken}
        csrfToken={csrfToken}
        onEnsureSession={ensureSession}
        adminToken={adminToken}
        onSetAdminToken={setAdminToken}
        onApplyDefaultLanguage={(nextLang) => {
          userSelectedLangRef.current = false;
          setLang(nextLang);
        }}
        onPortalUpdated={() => {
          fetchFeed();
          fetchMostRead();
        }}
      />
    </div>
  );
}
