import { Layers, Menu, Moon, Search, ShieldCheck, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABELS, UI_COPY } from '../data/i18n';
import { CategorySlug, Language } from '../types/news';

interface HeaderProps {
  lang: Language;
  theme: 'light' | 'dark';
  activeCategory: CategorySlug;
  onSelectCategory: (cat: CategorySlug) => void;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
  onOpenArchitecture: () => void;
  onOpenAdmin: () => void;
}

const CATEGORIES: CategorySlug[] = [
  'all',
  'politics',
  'economy',
  'society',
  'sports',
  'tech',
  'world',
];

export function Header({
  lang,
  theme,
  activeCategory,
  onSelectCategory,
  onToggleTheme,
  onOpenSearch,
  onOpenArchitecture,
  onOpenAdmin,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const copy = UI_COPY[lang];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single text element, whitespace-nowrap) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectCategory('all');
          }}
          className="text-2xl font-extrabold tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF] rounded"
        >
          <span className="text-[#0070FF]">Light</span>
          <span className="text-[#F59E0B]">News</span>
        </a>

        {/* Zone 2: Clean single-line category navigation links */}
        <nav
          aria-label="Primary categories"
          className="hidden lg:flex items-center gap-6 overflow-x-auto no-scrollbar"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`relative py-5 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF] rounded cursor-pointer ${
                  isActive
                    ? 'text-[#0070FF] dark:text-[#3894FF]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {CATEGORY_LABELS[cat][lang]}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[#0070FF] dark:bg-[#3894FF]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search & Blueprint primary actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label={copy.searchAction}
            className="inline-flex items-center gap-2 h-10 px-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF]"
          >
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">{copy.searchAction}</span>
            <kbd className="hidden md:inline-block text-[11px] font-mono-tabular px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={onOpenArchitecture}
            className="inline-flex items-center gap-2 h-10 px-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF]"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden xl:inline">{copy.architectureAction}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={theme === 'dark'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex items-center justify-center w-10 h-10 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-lg transition-colors duration-150 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF]"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0070FF]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle category menu"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile category drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile categories"
          className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] px-4 py-3 flex flex-wrap gap-2"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onSelectCategory(cat);
                  setMobileMenuOpen(false);
                }}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0070FF] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {CATEGORY_LABELS[cat][lang]}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
