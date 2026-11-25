import { Check, Copy, Database, GitBranch, Layers, Lock, Server, Workflow, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PersonalizationProfileSnapshot } from '../types/news';

interface ArchitectureBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PersonalizationProfileSnapshot | null;
  onRefreshProfile: () => void;
}

type BlueprintTab = 'erd' | 'recommender' | 'frontend' | 'api' | 'pipeline';

const POSTGRES_ERD_SQL = `-- PostgreSQL 16 Relational Schema & High-Throughput Indexes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE categories (
  id          SMALLSERIAL PRIMARY KEY,
  slug        VARCHAR(32) UNIQUE NOT NULL,
  name_i18n   JSONB NOT NULL
);

CREATE TABLE media_assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_provider VARCHAR(32) NOT NULL, -- 'Cloudflare R2' | 'AWS S3'
  object_key       TEXT UNIQUE NOT NULL,
  cdn_url          TEXT NOT NULL,
  mime_type        VARCHAR(64) NOT NULL,
  width            INT NOT NULL,
  height           INT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT UNIQUE,
  password_hash TEXT, -- Argon2id / scrypt hashed & salted
  role          VARCHAR(24) NOT NULL DEFAULT 'reader',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE articles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               VARCHAR(160) UNIQUE NOT NULL,
  category_id        SMALLINT NOT NULL REFERENCES categories(id),
  lead_media_id      UUID REFERENCES media_assets(id),
  author_id          UUID REFERENCES users(id),
  title_i18n         JSONB NOT NULL,
  excerpt_i18n       JSONB NOT NULL,
  sanitized_body     JSONB NOT NULL,
  search_vector      TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title_i18n->>'en','') || ' ' || coalesce(excerpt_i18n->>'en',''))
  ) STORED,
  views_total        BIGINT NOT NULL DEFAULT 0,
  likes_count        INT NOT NULL DEFAULT 0,
  dislikes_count     INT NOT NULL DEFAULT 0,
  is_breaking        BOOLEAN NOT NULL DEFAULT FALSE,
  published_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
  id   SERIAL PRIMARY KEY,
  slug VARCHAR(64) UNIQUE NOT NULL
);

CREATE TABLE article_tags (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE reading_events (
  id              BIGSERIAL PRIMARY KEY,
  session_hash    CHAR(32) NOT NULL,
  article_id      UUID NOT NULL REFERENCES articles(id),
  event_type      VARCHAR(24) NOT NULL, -- click | dwell | scroll_milestone | reaction
  dwell_seconds   SMALLINT DEFAULT 0,
  scroll_pct      SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_preference_vectors (
  session_hash     CHAR(32) PRIMARY KEY,
  category_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  tag_weights      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimized Indexes: Full-Text (GIN) + Time-Series + Trending Views
CREATE INDEX idx_articles_fts_gin ON articles USING GIN (search_vector);
CREATE INDEX idx_articles_pub_brin ON articles USING BRIN (published_at);
CREATE INDEX idx_articles_cat_pub ON articles (category_id, published_at DESC);
CREATE INDEX idx_articles_views_desc ON articles (views_total DESC, published_at DESC);
CREATE INDEX idx_events_session_time ON reading_events (session_hash, created_at DESC);`;

const RECOMMENDER_NODE_CODE = `// Silent Behavioral Scoring Engine (Node.js / TypeScript)
export function scoreArticleForSession(article, profile, nowMs) {
  const ageHours = Math.max(0.1, (nowMs - article.publishedAtMs) / 3_600_000);
  const freshness = Math.exp(-0.08 * ageHours) * article.editorialPriority;

  const velocity = Math.log10(
    Math.max(10, article.viewsToday + article.likes * 8 - article.dislikes * 4)
  ) / 5;

  // Aggregate category + tag affinity with smooth tanh bounding [-1, 1]
  const catAffinity = profile.categoryScores[article.category] ?? 0;
  const tagAffinity = article.tags.reduce(
    (sum, tag) => sum + (profile.tagScores[tag] ?? 0), 0
  );
  const normalizedAffinity = Math.tanh((catAffinity + tagAffinity * 0.45) / 8);

  return (0.45 * freshness) + (0.25 * velocity) + (0.30 * normalizedAffinity);
}`;

const RECOMMENDER_PYTHON_CODE = `# Python FastAPI / Worker Reference Scoring (NumPy)
import math

def update_preference_vector(vector: dict, event: dict) -> dict:
    decay = math.exp(-0.02 * event["hours_since_last_update"])
    for k in vector["categories"]:
        vector["categories"][k] *= decay

    weight = 0.0
    if event["type"] == "click":
        weight = 1.0
    elif event["type"] == "scroll_milestone" and event["scroll_pct"] >= 60:
        weight = 2.5
    elif event["type"] == "dwell" and event["dwell_seconds"] >= 10:
        weight = 0.04 * min(event["dwell_seconds"], 180)
    elif event["type"] == "reaction":
        weight = 3.0 if event["reaction"] == "like" else -2.0

    cat = event["category"]
    vector["categories"][cat] = max(-5.0, vector["categories"].get(cat, 0.0) + weight)
    return vector`;

export function ArchitectureBlueprintModal({
  isOpen,
  onClose,
  profile,
  onRefreshProfile,
}: ArchitectureBlueprintModalProps) {
  const [activeTab, setActiveTab] = useState<BlueprintTab>('erd');
  const [codeLang, setCodeLang] = useState<'ts' | 'py'>('ts');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    onRefreshProfile();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    });
  };

  const tabs: { id: BlueprintTab; label: string; icon: typeof Database }[] = [
    { id: 'erd', label: '01. Architecture & ERD', icon: Database },
    { id: 'recommender', label: '02. Personalization Engine', icon: Workflow },
    { id: 'frontend', label: '03. Frontend System', icon: Layers },
    { id: 'api', label: '04. API & Zero-Trust', icon: Lock },
    { id: 'pipeline', label: '05. Analytics Pipeline', icon: GitBranch },
  ];

  const sortedCategories = Object.entries(profile?.categoryScores ?? {}).sort(
    (a, b) => b[1] - a[1]
  );
  const sortedTags = Object.entries(profile?.tagScores ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="LightNews System Architecture Blueprint"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-0 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl h-full sm:h-[90vh] bg-white dark:bg-[#0B1120] sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-5 sm:px-7 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50 dark:bg-[#0F172A]">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              LightNews System Architecture &amp; Technical Deliverables
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High-throughput digital media architecture, silent personalization engine, and zero-trust controls
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close blueprint"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 px-5 sm:px-7 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white dark:bg-[#0B1120]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0070FF] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {activeTab === 'erd' && (
            <div className="space-y-6">
              {/* SVG High-Level Architecture Diagram */}
              <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                  High-Level Edge-to-Core Topology
                </h3>
                <div className="overflow-x-auto">
                  <svg
                    viewBox="0 0 920 190"
                    className="w-full min-w-[680px] h-auto text-slate-800 dark:text-slate-200"
                    role="img"
                    aria-label="High-level system architecture diagram"
                  >
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#0070FF" />
                      </marker>
                    </defs>

                    {[
                      { x: 20, y: 45, title: 'Client / Browser', sub: 'React 19 + Silent Tracker' },
                      { x: 240, y: 45, title: 'Edge CDN & WAF', sub: 'TLS 1.3 · Rate Limit · HSTS' },
                      { x: 465, y: 45, title: 'API & Recommender', sub: 'Node.js / Express + CSRF' },
                      { x: 700, y: 15, title: 'PostgreSQL 16 + GIN', sub: 'Articles · Vectors · Events' },
                      { x: 700, y: 105, title: 'Cloudflare R2 / S3', sub: 'Media CDN + Redis Cache' },
                    ].map((node) => (
                      <g key={node.title}>
                        <rect
                          x={node.x}
                          y={node.y}
                          width="190"
                          height="68"
                          rx="10"
                          className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
                          strokeWidth="1.5"
                        />
                        <text
                          x={node.x + 14}
                          y={node.y + 28}
                          className="fill-slate-900 dark:fill-slate-100 text-[13px] font-bold"
                        >
                          {node.title}
                        </text>
                        <text
                          x={node.x + 14}
                          y={node.y + 49}
                          className="fill-slate-500 dark:fill-slate-400 text-[11px]"
                        >
                          {node.sub}
                        </text>
                      </g>
                    ))}

                    <line x1="210" y1="79" x2="236" y2="79" stroke="#0070FF" strokeWidth="2" markerEnd="url(#arrow)" />
                    <line x1="430" y1="79" x2="461" y2="79" stroke="#0070FF" strokeWidth="2" markerEnd="url(#arrow)" />
                    <path d="M 655 72 L 696 49" fill="none" stroke="#0070FF" strokeWidth="2" markerEnd="url(#arrow)" />
                    <path d="M 655 88 L 696 135" fill="none" stroke="#0070FF" strokeWidth="2" markerEnd="url(#arrow)" />
                  </svg>
                </div>
              </div>

              {/* PostgreSQL DDL Schema */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono-tabular text-slate-300">
                    schema.sql — PostgreSQL 16 Relational ERD &amp; GIN/BRIN Indexing
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText('sql', POSTGRES_ERD_SQL)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded cursor-pointer"
                  >
                    {copiedKey === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'sql' ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono-tabular text-slate-200 overflow-x-auto leading-relaxed">
                  {POSTGRES_ERD_SQL}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'recommender' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Live Silent Session Preference Vector Inspector */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Live Session Preference Vector
                  </h3>
                  <button
                    type="button"
                    onClick={onRefreshProfile}
                    className="text-xs font-semibold text-[#0070FF] hover:underline cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  In production, this vector stays completely invisible to readers. Click articles, scroll past 60%, or react to watch your silent weights evolve in real time.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <div className="text-slate-400 mb-0.5">Articles Opened</div>
                    <div className="text-xl font-bold font-mono-tabular text-slate-900 dark:text-white">
                      {profile?.articlesReadCount ?? 0}
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <div className="text-slate-400 mb-0.5">&gt;60% Scroll Reads</div>
                    <div className="text-xl font-bold font-mono-tabular text-[#0070FF] dark:text-[#3894FF]">
                      {profile?.highIntentReads ?? 0}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    Category Affinity Scores
                  </h4>
                  {sortedCategories.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No interactions recorded yet in this session — cold-start ranking active.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sortedCategories.map(([cat, score]) => (
                        <div key={cat} className="flex items-center justify-between text-xs">
                          <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                            {cat}
                          </span>
                          <span className="font-mono-tabular font-semibold text-[#0070FF] dark:text-[#3894FF]">
                            {score > 0 ? `+${score}` : score}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {sortedTags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                      Top Tag Weights
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {sortedTags.map(([tag, score]) => (
                        <span
                          key={tag}
                          className="text-xs font-mono-tabular text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded"
                        >
                          {tag}: {score > 0 ? `+${score}` : score}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scoring Flowchart & Dual-Language Code */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Behavioral Signal Weights &amp; Organic Feed Blending
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="font-semibold text-slate-900 dark:text-white">Article Click</div>
                      <div className="font-mono-tabular text-[#0070FF] mt-0.5">+1.0 Cat / +0.6 Tag</div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="font-semibold text-slate-900 dark:text-white">Dwell &ge; 10s</div>
                      <div className="font-mono-tabular text-[#0070FF] mt-0.5">+0.04/sec (cap 180s)</div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="font-semibold text-slate-900 dark:text-white">Scroll &ge; 60%</div>
                      <div className="font-mono-tabular text-[#0070FF] mt-0.5">+2.5 Cat / +1.5 Tag</div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div className="font-semibold text-slate-900 dark:text-white">Reaction</div>
                      <div className="font-mono-tabular text-[#0070FF] mt-0.5">+3.0 Like / -2.0 Dislike</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCodeLang('ts')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                          codeLang === 'ts' ? 'bg-[#0070FF] text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Node.js / TypeScript
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodeLang('py')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer ${
                          codeLang === 'py' ? 'bg-[#0070FF] text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Python Worker
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText('rec', codeLang === 'ts' ? RECOMMENDER_NODE_CODE : RECOMMENDER_PYTHON_CODE)
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded cursor-pointer"
                    >
                      {copiedKey === 'rec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'rec' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono-tabular text-slate-200 overflow-x-auto leading-relaxed">
                    {codeLang === 'ts' ? RECOMMENDER_NODE_CODE : RECOMMENDER_PYTHON_CODE}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'frontend' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Responsive Component Hierarchy
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-mono-tabular">
                  <li>Header.tsx — Sticky 3-zone bar, single-line category tabs</li>
                  <li>UtilityRibbon.tsx — Breaking ticker + EN/AZ/RU + Theme + Trending</li>
                  <li>HeroSection.tsx — 7/5 col split: 16:9 lead + 2x2 feature cards</li>
                  <li>ArticleCard.tsx — 4:3 photo, unboxed metadata, tabular reactions</li>
                  <li>MostReadSidebar.tsx — Sticky rail with Today / This Week tabs</li>
                  <li>ArticleReaderModal.tsx — Source Serif 4 prose, DOMPurify, progress bar</li>
                  <li>useSilentReadingTracker.ts — Keepalive dwell &amp; &gt;60% scroll beacon</li>
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Design Tokens &amp; Dual-Theme Architecture
                </h3>
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    <strong>Typography:</strong> Plus Jakarta Sans (UI &amp; Headlines), Source Serif 4 (Editorial Reading), JetBrains Mono (Tabular Metrics).
                  </p>
                  <p>
                    <strong>Light Canvas:</strong> #F8FAFC background, #FFFFFF surfaces, #0F172A ink, #0070FF primary accent.
                  </p>
                  <p>
                    <strong>Dark Canvas:</strong> #0B1120 background, #111827 surfaces, #F1F5F9 ink, #3894FF optical accent via Tailwind v4 <code className="font-mono-tabular">@custom-variant dark</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-5">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Method &amp; Endpoint</th>
                      <th className="px-4 py-3 font-semibold">Purpose</th>
                      <th className="px-4 py-3 font-semibold">Security Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="px-4 py-3 font-mono-tabular font-semibold text-[#0070FF]">GET /api/session</td>
                      <td className="px-4 py-3">Issues opaque HMAC-signed HttpOnly session cookie + CSRF token</td>
                      <td className="px-4 py-3">HttpOnly, SameSite, Partitioned, HMAC-SHA256</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono-tabular font-semibold text-[#0070FF]">GET /api/news</td>
                      <td className="px-4 py-3">Delivers organically ranked feed, breaking ticker, trending tags, FTS search</td>
                      <td className="px-4 py-3">Allowlist validation, query cap 120 chars, 180 req/min limiter</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono-tabular font-semibold text-[#0070FF]">GET /api/news/most-read</td>
                      <td className="px-4 py-3">Time-windowed view aggregation (Today vs This Week)</td>
                      <td className="px-4 py-3">Parameterized window enum, Redis cache friendly</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono-tabular font-semibold text-[#0070FF]">GET /api/news/:slug</td>
                      <td className="px-4 py-3">Fetches sanitized article body &amp; atomically records view/click</td>
                      <td className="px-4 py-3">Slug regex sanitization, DOMPurify + server HTML strip</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono-tabular font-semibold text-emerald-600 dark:text-emerald-400">POST /api/telemetry/event</td>
                      <td className="px-4 py-3">Silent background beacon for dwell seconds &amp; &gt;60% scroll milestones</td>
                      <td className="px-4 py-3">Origin check, X-CSRF-Token, bounded ints, 90 req/min</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono-tabular font-semibold text-emerald-600 dark:text-emerald-400">POST /api/news/:id/react</td>
                      <td className="px-4 py-3">Idempotent per-session Like / Dislike toggle &amp; score adjustment</td>
                      <td className="px-4 py-3">CSRF verified, 40 req/min rate limit</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">OWASP Injection &amp; XSS</div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Parameterized queries ($1/$2), server HTML tag scrubbing, and client-side DOMPurify sanitization before rendering article prose.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Zero-Trust Headers</div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Helmet enforces strict Content-Security-Policy, HSTS, X-Content-Type-Options: nosniff, and Referrer-Policy.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">Credentials &amp; Anonymity</div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Anonymous sessions use HMAC-hashed IDs with zero PII; registered accounts use per-user salted Scrypt/Argon2id digests.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Server className="w-4 h-4 text-[#0070FF]" />
                  <span>Streaming Event &amp; OLAP Warehouse Pipeline</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>
                    <strong>Ingestion Edge:</strong> Express collector validates schema &amp; CSRF, strips IP/User-Agent into rotating daily HMAC hashes, and publishes events to <strong>Kafka / AWS Kinesis</strong> (<code className="font-mono-tabular">topic: lightnews.telemetry.v1</code>).
                  </li>
                  <li>
                    <strong>Stream Processor:</strong> Apache Flink aggregates 5-minute sliding windows for real-time Most Read leaderboards (pushed to Redis) and updates PostgreSQL preference vectors asynchronously.
                  </li>
                  <li>
                    <strong>Analytical Sink:</strong> Batch sink writes Parquet partitions every 60s to <strong>ClickHouse / BigQuery</strong> for editorial engagement cohorts and CTR lift experiments.
                  </li>
                </ol>
              </div>

              <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <GitBranch className="w-4 h-4 text-[#0070FF]" />
                  <span>Observability, SLOs &amp; Third-Party Integrations</span>
                </div>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>
                    <strong>OpenTelemetry + Prometheus:</strong> Export p95/p99 feed latency (&lt;45ms), PostgreSQL GIN query duration, and Redis cache hit ratio (&gt;94%).
                  </li>
                  <li>
                    <strong>Privacy-Safe Analytics (Plausible / PostHog Self-Hosted):</strong> Forward anonymized category &amp; scroll-depth funnels via server-side relay—eliminating third-party browser cookies and ad-blocker blind spots.
                  </li>
                  <li>
                    <strong>Dead-Letter &amp; Drift Alerts:</strong> PagerDuty/Slack alert if telemetry drop rate &gt;0.5% or personalization cold-start fallback spikes unexpectedly.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
