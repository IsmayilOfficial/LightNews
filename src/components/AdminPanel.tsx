import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdminArticleInput,
  AdminAuthStatus,
  AdminOverviewMetrics,
  AdminSubscriber,
  ArticleViewModel,
  CategorySlug,
  Language,
  SiteConfig,
} from '../types/news';
import { formatCompactNumber } from '../utils/formatters';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
  csrfToken: string;
  onEnsureSession: (forceRefresh?: boolean) => Promise<{ sessionToken: string; csrfToken: string } | null>;
  adminToken: string;
  onSetAdminToken: (token: string) => void;
  onApplyDefaultLanguage?: (lang: Language) => void;
  onPortalUpdated: () => void;
}

type AdminSection = 'overview' | 'articles' | 'subscribers' | 'settings';
type ArticleStatusFilter = 'all' | 'breaking' | 'featured';

const ARTICLE_CATEGORIES: Exclude<CategorySlug, 'all'>[] = [
  'politics',
  'economy',
  'society',
  'sports',
  'tech',
  'world',
];

const CURATED_IMAGES = [
  { label: 'Baku Summit Skyline', url: '/src/assets/images/news_baku_summit_1795615683603.jpg' },
  { label: 'Offshore Energy Grid', url: '/src/assets/images/news_energy_corridor_1795615685474.jpg' },
  { label: '2nm Semiconductor Lab', url: '/src/assets/images/news_semiconductor_ai_1795615686385.jpg' },
  { label: 'European Stadium Match', url: '/src/assets/images/news_football_stadium_1795615686115.jpg' },
  { label: 'Electric Boulevard Tram', url: '/src/assets/images/news_urban_transit_1795615686731.jpg' },
  { label: 'Central Exchange Atrium', url: '/src/assets/images/news_central_bank_1795615686800.jpg' },
  { label: 'Quantum Fiber Data Center', url: '/src/assets/images/news_quantum_fiber_1795615686953.jpg' },
  { label: 'Geneva Plenary Hall', url: '/src/assets/images/news_climate_summit_1795615688677.jpg' },
];

export function AdminPanel({
  isOpen,
  onClose,
  sessionToken,
  csrfToken,
  onEnsureSession,
  adminToken,
  onSetAdminToken,
  onApplyDefaultLanguage,
  onPortalUpdated,
}: AdminPanelProps) {
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [authChecking, setAuthChecking] = useState(false);
  const [authStatusError, setAuthStatusError] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);

  const [section, setSection] = useState<AdminSection>('overview');
  const [overview, setOverview] = useState<AdminOverviewMetrics | null>(null);
  const [articles, setArticles] = useState<ArticleViewModel[]>([]);
  const [subscribers, setSubscribers] = useState<AdminSubscriber[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    breakingTickerEnabled: true,
    personalizationEnabled: true,
    defaultLanguage: 'en',
    announcementBanner: '',
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Article search / filter + editor modal state
  const [articleQuery, setArticleQuery] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<CategorySlug>('all');
  const [articleStatusFilter, setArticleStatusFilter] = useState<ArticleStatusFilter>('all');
  const [subscriberQuery, setSubscriberQuery] = useState('');
  const [newSubscriberEmail, setNewSubscriberEmail] = useState('');
  const [newSubscriberLang, setNewSubscriberLang] = useState<Language>('en');
  const [addingSubscriber, setAddingSubscriber] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Claimed local password rotation state
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmNewAdminPassword, setConfirmNewAdminPassword] = useState('');
  const [rotatingPassword, setRotatingPassword] = useState(false);

  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [useCustomImageUrl, setUseCustomImageUrl] = useState(false);
  const [formState, setFormState] = useState<AdminArticleInput>({
    title: '',
    excerpt: '',
    bodyText: '',
    category: 'politics',
    tags: [],
    imageUrl: CURATED_IMAGES[0].url,
    authorName: 'LightNews Desk',
    authorRole: 'Editorial Staff',
    readTimeMinutes: 4,
    isBreaking: false,
    isFeatured: false,
  });
  const [tagsText, setTagsText] = useState('');

  const buildAuthHeaders = useCallback(
    async (includeCsrf: boolean, forceRefreshSession = false): Promise<Record<string, string>> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (adminToken) {
        headers['X-Admin-Token'] = adminToken;
      }
      if (includeCsrf) {
        let sToken = forceRefreshSession ? '' : sessionToken;
        let cToken = forceRefreshSession ? '' : csrfToken;
        if (!sToken || !cToken) {
          const auth = await onEnsureSession(forceRefreshSession);
          if (auth) {
            sToken = auth.sessionToken;
            cToken = auth.csrfToken;
          }
        }
        if (sToken) headers.Authorization = `Bearer ${sToken}`;
        if (cToken) headers['X-CSRF-Token'] = cToken;
      }
      return headers;
    },
    [adminToken, sessionToken, csrfToken, onEnsureSession]
  );

  // Wrapper for mutating requests that refreshes CSRF/session token once on 403
  const fetchWithAdminMutation = useCallback(
    async (url: string, options: Omit<RequestInit, 'headers' | 'credentials'>): Promise<Response> => {
      let headers = await buildAuthHeaders(true, false);
      let res = await fetch(url, {
        ...options,
        credentials: 'same-origin',
        headers,
      });

      if (res.status === 403) {
        headers = await buildAuthHeaders(true, true);
        res = await fetch(url, {
          ...options,
          credentials: 'same-origin',
          headers,
        });
      }

      return res;
    },
    [buildAuthHeaders]
  );

  const checkAuthStatus = useCallback(async () => {
    setAuthChecking(true);
    setAuthStatusError(false);
    try {
      const headers: Record<string, string> = {};
      if (adminToken) headers['X-Admin-Token'] = adminToken;
      const res = await fetch('/api/admin/auth/status', {
        credentials: 'same-origin',
        headers,
      });
      if (res.ok) {
        const data = (await res.json()) as AdminAuthStatus;
        setAuthStatus(data);
        if (!data.authenticated && adminToken) {
          onSetAdminToken('');
        }
      } else {
        setAuthStatusError(true);
      }
    } catch {
      setAuthStatusError(true);
    } finally {
      setAuthChecking(false);
    }
  }, [adminToken, onSetAdminToken]);

  const loadAdminData = useCallback(async () => {
    if (!adminToken) return;
    setDataLoading(true);
    try {
      const headers = await buildAuthHeaders(false);
      const [ovRes, artRes, subRes] = await Promise.all([
        fetch('/api/admin/overview', { credentials: 'same-origin', headers }),
        fetch('/api/admin/articles?lang=en', { credentials: 'same-origin', headers }),
        fetch('/api/admin/subscribers', { credentials: 'same-origin', headers }),
      ]);

      if (ovRes.status === 401 || artRes.status === 401) {
        onSetAdminToken('');
        return;
      }

      if (ovRes.ok) {
        const ovData = await ovRes.json();
        setOverview(ovData.overview ?? null);
        if (ovData.siteConfig) setSiteConfig(ovData.siteConfig);
      }
      if (artRes.ok) {
        const artData = await artRes.json();
        setArticles(artData.articles ?? []);
      }
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscribers(subData.subscribers ?? []);
      }
    } finally {
      setDataLoading(false);
    }
  }, [adminToken, buildAuthHeaders, onSetAdminToken]);

  useEffect(() => {
    if (!isOpen) return;
    checkAuthStatus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editorOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, editorOpen, onClose, checkAuthStatus]);

  useEffect(() => {
    if (isOpen && adminToken) {
      loadAdminData();
    }
  }, [isOpen, adminToken, loadAdminData]);

  const notify = (type: 'ok' | 'err', text: string) => {
    setBannerMessage({ type, text });
    window.setTimeout(() => setBannerMessage(null), 3500);
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Read DOM ref as fallback in case browser autofill populated the input without firing onChange
    const effectivePassword = password || passwordInputRef.current?.value || '';
    const effectiveConfirm = confirmPassword || confirmInputRef.current?.value || '';

    if (authStatus?.setupRequired) {
      if (effectivePassword.length < 8) {
        setAuthError('Password must be at least 8 characters.');
        return;
      }
      if (effectivePassword !== effectiveConfirm) {
        setAuthError('Passwords do not match.');
        return;
      }
    } else if (!effectivePassword) {
      setAuthError('Please enter your admin password.');
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint = authStatus?.setupRequired
        ? '/api/admin/auth/setup'
        : '/api/admin/auth/login';

      const res = await fetchWithAdminMutation(endpoint, {
        method: 'POST',
        body: JSON.stringify({ password: effectivePassword }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.adminToken) {
        setAuthError(data?.error || 'Authentication failed.');
        await checkAuthStatus();
        return;
      }

      onSetAdminToken(data.adminToken);
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setAuthStatus({
        setupRequired: false,
        envConfigured: Boolean(authStatus?.envConfigured),
        authenticated: true,
      });
    } catch {
      setAuthError('Unable to reach authentication service.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchWithAdminMutation('/api/admin/auth/logout', { method: 'POST' });
    } catch {
      // Clear local memory token regardless
    }
    onSetAdminToken('');
    checkAuthStatus();
  };

  const openCreateEditor = () => {
    setEditingArticleId(null);
    setUseCustomImageUrl(false);
    setFormState({
      title: '',
      excerpt: '',
      bodyText: '',
      category: 'politics',
      tags: ['Breaking', 'Editorial'],
      imageUrl: CURATED_IMAGES[0].url,
      authorName: 'LightNews Desk',
      authorRole: 'Editorial Staff',
      readTimeMinutes: 4,
      isBreaking: false,
      isFeatured: false,
    });
    setTagsText('Breaking, Editorial');
    setEditorOpen(true);
  };

  const openEditEditor = (article: ArticleViewModel) => {
    const plainBody = article.bodyHtml
      .replace(/<\/p>\s*<p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    const isCurated = CURATED_IMAGES.some((img) => img.url === article.imageUrl);
    setUseCustomImageUrl(!isCurated);
    setEditingArticleId(article.id);
    setFormState({
      title: article.title,
      excerpt: article.excerpt,
      bodyText: plainBody,
      category: article.category,
      tags: article.tags,
      imageUrl: article.imageUrl,
      authorName: article.author.name,
      authorRole: article.author.role,
      readTimeMinutes: article.readTimeMinutes,
      isBreaking: article.isBreaking,
      isFeatured: article.isFeatured,
    });
    setTagsText(article.tags.join(', '));
    setEditorOpen(true);
  };

  const handleSaveArticle = async (e: FormEvent) => {
    e.preventDefault();
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: AdminArticleInput = {
      ...formState,
      tags,
    };

    try {
      const url = editingArticleId
        ? `/api/admin/articles/${encodeURIComponent(editingArticleId)}`
        : '/api/admin/articles';
      const method = editingArticleId ? 'PATCH' : 'POST';

      const res = await fetchWithAdminMutation(url, {
        method,
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) {
          onSetAdminToken('');
          return;
        }
        notify('err', data?.error || 'Failed to save article.');
        return;
      }

      setEditorOpen(false);
      notify('ok', editingArticleId ? 'Article updated.' : 'Article published to live feed.');
      await loadAdminData();
      onPortalUpdated();
    } catch {
      notify('err', 'Network error while saving article.');
    }
  };

  const handleToggleFlag = async (
    article: ArticleViewModel,
    field: 'isBreaking' | 'isFeatured'
  ) => {
    try {
      const nextVal = !article[field];
      const res = await fetchWithAdminMutation(
        `/api/admin/articles/${encodeURIComponent(article.id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ [field]: nextVal }),
        }
      );
      if (res.ok) {
        notify(
          'ok',
          field === 'isBreaking'
            ? nextVal
              ? 'Added to Breaking News ticker.'
              : 'Removed from Breaking News ticker.'
            : nextVal
            ? 'Promoted to Hero section.'
            : 'Moved to standard feed.'
        );
        await loadAdminData();
        onPortalUpdated();
      } else if (res.status === 401) {
        onSetAdminToken('');
      }
    } catch {
      notify('err', 'Could not update article status.');
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      const res = await fetchWithAdminMutation(
        `/api/admin/articles/${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setConfirmDeleteId(null);
        notify('ok', 'Article deleted.');
        await loadAdminData();
        onPortalUpdated();
      } else if (res.status === 401) {
        onSetAdminToken('');
      }
    } catch {
      notify('err', 'Failed to delete article.');
    }
  };

  const handleAddSubscriber = async (e: FormEvent) => {
    e.preventDefault();
    const email = newSubscriberEmail.trim().toLowerCase();
    if (!email) return;

    setAddingSubscriber(true);
    try {
      const res = await fetchWithAdminMutation('/api/admin/subscribers', {
        method: 'POST',
        body: JSON.stringify({ email, lang: newSubscriberLang }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) {
          onSetAdminToken('');
          return;
        }
        notify('err', data?.error || 'Could not add subscriber.');
        return;
      }
      setNewSubscriberEmail('');
      notify(
        'ok',
        data?.alreadySubscribed
          ? `${email} is already subscribed.`
          : `Added ${email} to Daily Briefing list.`
      );
      await loadAdminData();
    } catch {
      notify('err', 'Network error while adding subscriber.');
    } finally {
      setAddingSubscriber(false);
    }
  };

  const handleRemoveSubscriber = async (email: string) => {
    try {
      const res = await fetchWithAdminMutation('/api/admin/subscribers', {
        method: 'DELETE',
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        notify('ok', `Removed ${email}.`);
        await loadAdminData();
      } else if (res.status === 401) {
        onSetAdminToken('');
      }
    } catch {
      notify('err', 'Could not remove subscriber.');
    }
  };

  const handleExportSubscribersCsv = () => {
    if (subscribers.length === 0) return;
    const rows = [
      'email,language,subscribed_at',
      ...subscribers.map(
        (s) =>
          `"${s.email.replace(/"/g, '""')}","${s.lang}","${new Date(s.subscribedAt).toISOString()}"`
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lightnews-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('ok', `Exported ${subscribers.length} subscriber(s) to CSV.`);
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAdminMutation('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(siteConfig),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.siteConfig) {
          setSiteConfig(data.siteConfig);
          onApplyDefaultLanguage?.(data.siteConfig.defaultLanguage);
        }
        notify('ok', 'Portal settings saved and applied live.');
        onPortalUpdated();
      } else if (res.status === 401) {
        onSetAdminToken('');
      } else {
        notify('err', 'Failed to update portal settings.');
      }
    } catch {
      notify('err', 'Network error saving settings.');
    }
  };

  const handleRotateClaimedPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newAdminPassword.length < 8) {
      notify('err', 'New password must be at least 8 characters.');
      return;
    }
    if (newAdminPassword !== confirmNewAdminPassword) {
      notify('err', 'Passwords do not match.');
      return;
    }

    setRotatingPassword(true);
    try {
      const res = await fetchWithAdminMutation('/api/admin/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword: newAdminPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        notify('err', data?.error || 'Could not update password.');
        return;
      }
      setNewAdminPassword('');
      setConfirmNewAdminPassword('');
      notify('ok', 'Admin password updated.');
    } catch {
      notify('err', 'Network error updating password.');
    } finally {
      setRotatingPassword(false);
    }
  };

  const filteredArticles = useMemo(() => {
    const q = articleQuery.trim().toLowerCase();
    return articles.filter((a) => {
      if (articleCategoryFilter !== 'all' && a.category !== articleCategoryFilter) return false;
      if (articleStatusFilter === 'breaking' && !a.isBreaking) return false;
      if (articleStatusFilter === 'featured' && !a.isFeatured) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.author.name.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [articles, articleQuery, articleCategoryFilter, articleStatusFilter]);

  const filteredSubscribers = useMemo(() => {
    const q = subscriberQuery.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) => s.email.toLowerCase().includes(q));
  }, [subscribers, subscriberQuery]);

  if (!isOpen) return null;

  // =========================================================================
  // Auth Gate (Loading / First-Run Setup / Login)
  // =========================================================================
  if (!adminToken) {
    const isSetup = Boolean(authStatus?.setupRequired);

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="LightNews Admin Authentication"
        className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col"
      >
        <div className="h-14 px-5 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">LightNews</span> / Admin Console
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Portal</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
            {authChecking && !authStatus ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                <RefreshCw className="w-6 h-6 text-[#0070FF] animate-spin" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Checking Admin Console status...
                </p>
              </div>
            ) : authStatusError && !authStatus ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Unable to reach Admin service
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Make sure the LightNews server is running and try again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={checkAuthStatus}
                  className="inline-flex items-center gap-2 h-9 px-4 text-xs font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] rounded-lg cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-[#0070FF]/10 text-[#0070FF] dark:text-[#3894FF] flex items-center justify-center mb-4">
                  {isSetup ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>

                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  {isSetup ? 'Claim Admin Access' : 'Admin Console Sign In'}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  {isSetup
                    ? 'Set an initial administrator password for this preview instance (minimum 8 characters). In production, configure ADMIN_PASSCODE in Settings → Secrets.'
                    : authStatus?.envConfigured
                    ? 'Enter the ADMIN_PASSCODE configured in your Settings → Secrets panel to manage articles, breaking alerts, subscribers, and portal controls.'
                    : 'Enter your administrator password to manage LightNews articles, breaking alerts, subscribers, and portal controls.'}
                </p>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="admin-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      {isSetup ? 'New Admin Password' : 'Admin Password'}
                    </label>
                    <div className="relative">
                      <input
                        ref={passwordInputRef}
                        id="admin-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isSetup ? 'new-password' : 'current-password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (authError) setAuthError('');
                        }}
                        placeholder="••••••••"
                        className="w-full h-10 pl-3.5 pr-10 text-sm rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0070FF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isSetup && (
                    <div>
                      <label
                        htmlFor="admin-confirm-password"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                      >
                        Confirm Password
                      </label>
                      <input
                        ref={confirmInputRef}
                        id="admin-confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (authError) setAuthError('');
                        }}
                        placeholder="••••••••"
                        className="w-full h-10 px-3.5 text-sm rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0070FF]"
                      />
                    </div>
                  )}

                  {authError && (
                    <p
                      role="alert"
                      className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{authError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full h-10 text-sm font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                  >
                    {authLoading
                      ? 'Verifying...'
                      : isSetup
                      ? 'Set Password & Open Console'
                      : 'Sign In'}
                  </button>
                </form>

                {authStatus?.envConfigured && (
                  <p className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Need to update or clear your passcode? Edit <code className="font-mono">ADMIN_PASSCODE</code> in{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Settings → Secrets</span>.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // Authenticated Admin Console Workspace
  // =========================================================================
  const navItems: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'articles', label: 'Articles', icon: FileText },
    { id: 'subscribers', label: 'Subscribers', icon: Mail },
    { id: 'settings', label: 'Site Controls', icon: Settings },
  ];

  const sectionLabel = navItems.find((n) => n.id === section)?.label ?? 'Overview';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="LightNews Admin Console"
      className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col"
    >
      {/* Top Breadcrumb Bar */}
      <header className="h-14 shrink-0 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 truncate">
          <span className="font-bold text-slate-900 dark:text-slate-100">LightNews</span>
          <span aria-hidden="true">/</span>
          <span className="hidden sm:inline">Admin Console</span>
          <span aria-hidden="true" className="hidden sm:inline">/</span>
          <span className="font-semibold text-[#0070FF] dark:text-[#3894FF]">{sectionLabel}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadAdminData}
            aria-label="Refresh admin data"
            className="inline-flex items-center justify-center w-9 h-9 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreateEditor}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Article</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Portal</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 flex-col md:flex-row">
        {/* Sidebar Navigation (240px on desktop) */}
        <aside className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-3 flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#0070FF]/10 text-[#0070FF] dark:bg-[#3894FF]/15 dark:text-[#3894FF] font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Workspace Canvas */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {bannerMessage && (
            <div
              role="status"
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-lg border ${
                bannerMessage.type === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              {bannerMessage.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{bannerMessage.text}</span>
            </div>
          )}

          {/* SECTION 1: OVERVIEW */}
          {section === 'overview' && (
            <div className="space-y-6">
              {dataLoading && !overview ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                overview && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setArticleStatusFilter('all');
                          setSection('articles');
                        }}
                        className="text-left bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-[#0070FF] rounded-xl p-5 transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Published Articles
                        </div>
                        <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-white mt-1">
                          {overview.totalArticles}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono-tabular">
                          {overview.breakingCount} breaking · {overview.featuredCount} featured
                        </div>
                      </button>

                      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Views Today
                        </div>
                        <div className="text-2xl font-bold font-mono-tabular text-[#0070FF] dark:text-[#3894FF] mt-1">
                          {formatCompactNumber(overview.totalViewsToday)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono-tabular">
                          {formatCompactNumber(overview.totalViewsWeek)} this week
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Reader Reactions
                        </div>
                        <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-white mt-1">
                          {formatCompactNumber(overview.totalLikes)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono-tabular">
                          Likes · {overview.totalDislikes} dislikes
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSection('subscribers')}
                        className="text-left bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-[#0070FF] rounded-xl p-5 transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Digest Subscribers
                        </div>
                        <div className="text-2xl font-bold font-mono-tabular text-slate-900 dark:text-white mt-1">
                          {overview.subscriberCount}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Manage briefing list →
                        </div>
                      </button>
                    </div>

                    {/* Quick Editorial Actions */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={openCreateEditor}
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Write New Story</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setArticleStatusFilter('breaking');
                          setSection('articles');
                        }}
                        className="h-9 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-[#0070FF] rounded-lg cursor-pointer"
                      >
                        Breaking Queue ({overview.breakingCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setArticleStatusFilter('featured');
                          setSection('articles');
                        }}
                        className="h-9 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-[#0070FF] rounded-lg cursor-pointer"
                      >
                        Hero Featured ({overview.featuredCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSection('settings')}
                        className="h-9 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-[#0070FF] rounded-lg cursor-pointer"
                      >
                        Portal Controls
                      </button>
                    </div>

                    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Category Performance Breakdown
                        </h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="px-5 py-3 font-semibold">Category</th>
                              <th className="px-5 py-3 font-semibold text-right">Articles</th>
                              <th className="px-5 py-3 font-semibold text-right">Views Today</th>
                              <th className="px-5 py-3 font-semibold text-right">Likes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {overview.byCategory.map((row) => (
                              <tr
                                key={row.category}
                                onClick={() => {
                                  setArticleCategoryFilter(row.category);
                                  setArticleStatusFilter('all');
                                  setSection('articles');
                                }}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                              >
                                <td className="px-5 py-3 font-semibold capitalize text-slate-900 dark:text-slate-100">
                                  {row.category}
                                </td>
                                <td className="px-5 py-3 text-right font-mono-tabular text-slate-600 dark:text-slate-300">
                                  {row.count}
                                </td>
                                <td className="px-5 py-3 text-right font-mono-tabular text-slate-600 dark:text-slate-300">
                                  {formatCompactNumber(row.viewsToday)}
                                </td>
                                <td className="px-5 py-3 text-right font-mono-tabular text-slate-600 dark:text-slate-300">
                                  {formatCompactNumber(row.likes)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          )}

          {/* SECTION 2: ARTICLES CRUD */}
          {section === 'articles' && (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap flex-1 items-center gap-2.5">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={articleQuery}
                      onChange={(e) => setArticleQuery(e.target.value)}
                      placeholder="Filter articles by title, author, or tag..."
                      className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0070FF]"
                    />
                  </div>
                  <select
                    aria-label="Filter by category"
                    value={articleCategoryFilter}
                    onChange={(e) => setArticleCategoryFilter(e.target.value as CategorySlug)}
                    className="h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Categories</option>
                    {ARTICLE_CATEGORIES.map((c) => (
                      <option key={c} value={c} className="capitalize">
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filter by status"
                    value={articleStatusFilter}
                    onChange={(e) => setArticleStatusFilter(e.target.value as ArticleStatusFilter)}
                    className="h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">All Placements</option>
                    <option value="breaking">Breaking Ticker Only</option>
                    <option value="featured">Hero Featured Only</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={openCreateEditor}
                  className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Article</span>
                </button>
              </div>

              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {filteredArticles.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No articles match this filter
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setArticleQuery('');
                        setArticleCategoryFilter('all');
                        setArticleStatusFilter('all');
                      }}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0070FF] rounded-lg cursor-pointer"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Headline</th>
                          <th className="px-4 py-3 font-semibold">Category</th>
                          <th className="px-4 py-3 font-semibold text-center">Breaking</th>
                          <th className="px-4 py-3 font-semibold text-center">Featured</th>
                          <th className="px-4 py-3 font-semibold text-right">Views</th>
                          <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredArticles.map((art) => (
                          <tr key={art.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3 max-w-md">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                                {art.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {art.author.name} · {art.readTimeMinutes}m read
                              </div>
                            </td>
                            <td className="px-4 py-3 capitalize font-medium text-slate-600 dark:text-slate-300">
                              {art.category}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleFlag(art, 'isBreaking')}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded cursor-pointer ${
                                  art.isBreaking
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {art.isBreaking ? 'Live' : 'Off'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleFlag(art, 'isFeatured')}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded cursor-pointer ${
                                  art.isFeatured
                                    ? 'bg-[#0070FF] text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {art.isFeatured ? 'Hero' : 'Feed'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right font-mono-tabular text-slate-700 dark:text-slate-300">
                              {formatCompactNumber(art.viewsToday)}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditEditor(art)}
                                  className="px-2.5 py-1 text-xs font-medium text-[#0070FF] dark:text-[#3894FF] hover:bg-[#0070FF]/10 rounded cursor-pointer"
                                >
                                  Edit
                                </button>
                                {confirmDeleteId === art.id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteArticle(art.id)}
                                      className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(art.id)}
                                    aria-label={`Delete ${art.title}`}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: SUBSCRIBERS */}
          {section === 'subscribers' && (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={subscriberQuery}
                    onChange={(e) => setSubscriberQuery(e.target.value)}
                    placeholder="Search subscriber email..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0070FF]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <form onSubmit={handleAddSubscriber} className="flex items-center gap-2">
                    <input
                      type="email"
                      required
                      value={newSubscriberEmail}
                      onChange={(e) => setNewSubscriberEmail(e.target.value)}
                      placeholder="Add subscriber email..."
                      className="h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0070FF]"
                    />
                    <select
                      aria-label="Subscriber digest language"
                      value={newSubscriberLang}
                      onChange={(e) => setNewSubscriberLang(e.target.value as Language)}
                      className="h-9 px-2.5 text-xs rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <option value="en">EN</option>
                      <option value="az">AZ</option>
                      <option value="ru">RU</option>
                    </select>
                    <button
                      type="submit"
                      disabled={addingSubscriber}
                      className="inline-flex items-center gap-1 h-9 px-3.5 text-xs font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] disabled:opacity-60 rounded-lg whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>

                  <button
                    type="button"
                    disabled={subscribers.length === 0}
                    onClick={handleExportSubscribersCsv}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-[#0070FF] disabled:opacity-50 rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {filteredSubscribers.length === 0 ? (
                  <div className="p-10 text-center space-y-1.5">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No newsletter subscribers captured yet
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Emails submitted through the footer Daily Briefing Digest form or added above will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-5 py-3 font-semibold">Email</th>
                          <th className="px-5 py-3 font-semibold">Language</th>
                          <th className="px-5 py-3 font-semibold">Subscribed</th>
                          <th className="px-5 py-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredSubscribers.map((sub) => (
                          <tr key={sub.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                              {sub.email}
                            </td>
                            <td className="px-5 py-3 uppercase font-mono-tabular text-slate-600 dark:text-slate-300">
                              {sub.lang}
                            </td>
                            <td className="px-5 py-3 font-mono-tabular text-slate-500 dark:text-slate-400">
                              {new Date(sub.subscribedAt).toLocaleString()}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveSubscriber(sub.email)}
                                className="px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: SITE CONTROLS */}
          {section === 'settings' && (
            <div className="max-w-2xl space-y-6">
              <form
                onSubmit={handleSaveSettings}
                className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Portal Runtime Controls
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Changes apply immediately across the public LightNews portal.
                  </p>
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Breaking News Ticker
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Display the scrolling live breaking headlines strip at the top of the portal.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={siteConfig.breakingTickerEnabled}
                      onChange={(e) =>
                        setSiteConfig((prev) => ({
                          ...prev,
                          breakingTickerEnabled: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#0070FF] cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Silent Behavioral Personalization
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Blend session reading affinity into feed order; disable for pure chronological sorting.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={siteConfig.personalizationEnabled}
                      onChange={(e) =>
                        setSiteConfig((prev) => ({
                          ...prev,
                          personalizationEnabled: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-[#0070FF] cursor-pointer"
                    />
                  </label>

                  <div>
                    <label
                      htmlFor="default-lang-select"
                      className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1"
                    >
                      Default Portal Language
                    </label>
                    <select
                      id="default-lang-select"
                      value={siteConfig.defaultLanguage}
                      onChange={(e) =>
                        setSiteConfig((prev) => ({
                          ...prev,
                          defaultLanguage: e.target.value as Language,
                        }))
                      }
                      className="h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="en">English (EN)</option>
                      <option value="az">Azərbaycanca (AZ)</option>
                      <option value="ru">Русский (RU)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="announcement-banner"
                      className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1"
                    >
                      Editorial Announcement Banner
                    </label>
                    <input
                      id="announcement-banner"
                      type="text"
                      maxLength={180}
                      value={siteConfig.announcementBanner}
                      onChange={(e) =>
                        setSiteConfig((prev) => ({
                          ...prev,
                          announcementBanner: e.target.value,
                        }))
                      }
                      placeholder="Optional notice displayed across the top of LightNews (leave empty to hide)"
                      className="w-full h-10 px-3.5 text-sm rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0070FF]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="h-10 px-5 text-sm font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] rounded-lg cursor-pointer"
                  >
                    Save Portal Settings
                  </button>
                </div>
              </form>

              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-[#0070FF] dark:text-[#3894FF]" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Admin Access Credential
                  </h2>
                </div>

                {authStatus?.envConfigured ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Admin authentication is managed by the <code className="font-mono">ADMIN_PASSCODE</code>{' '}
                    environment secret. To rotate the passcode, update <code className="font-mono">ADMIN_PASSCODE</code>{' '}
                    in <span className="font-semibold text-slate-800 dark:text-slate-200">Settings → Secrets</span>.
                  </p>
                ) : (
                  <form onSubmit={handleRotateClaimedPassword} className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Update the claimed preview administrator password (minimum 8 characters).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="password"
                        minLength={8}
                        maxLength={128}
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="New password"
                        className="h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="password"
                        minLength={8}
                        maxLength={128}
                        value={confirmNewAdminPassword}
                        onChange={(e) => setConfirmNewAdminPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={rotatingPassword}
                      className="h-9 px-4 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-60 rounded-lg cursor-pointer"
                    >
                      {rotatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Article Publish / Edit Modal */}
      {editorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingArticleId ? 'Edit Article' : 'Publish Article'}
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          onClick={() => setEditorOpen(false)}
        >
          <form
            onSubmit={handleSaveArticle}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingArticleId ? 'Edit Article' : 'Publish New Article'}
              </h3>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Headline
              </label>
              <input
                type="text"
                required
                minLength={4}
                maxLength={180}
                value={formState.title}
                onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full h-10 px-3 text-sm rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Summary Excerpt
              </label>
              <textarea
                required
                minLength={10}
                maxLength={340}
                rows={2}
                value={formState.excerpt}
                onChange={(e) => setFormState((prev) => ({ ...prev, excerpt: e.target.value }))}
                className="w-full p-3 text-sm rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formState.category}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      category: e.target.value as Exclude<CategorySlug, 'all'>,
                    }))
                  }
                  className="w-full h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {ARTICLE_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={formState.authorName}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, authorName: e.target.value }))
                  }
                  className="w-full h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Author Role
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={formState.authorRole}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, authorRole: e.target.value }))
                  }
                  className="w-full h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Read Time (min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formState.readTimeMinutes}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      readTimeMinutes: Math.max(1, Math.min(30, Number(e.target.value) || 1)),
                    }))
                  }
                  className="w-full h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cover Photography
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomImageUrl((prev) => !prev)}
                    className="text-[11px] font-semibold text-[#0070FF] dark:text-[#3894FF] hover:underline cursor-pointer"
                  >
                    {useCustomImageUrl ? 'Choose Curated Asset' : 'Use Custom HTTPS URL'}
                  </button>
                </div>

                {useCustomImageUrl ? (
                  <input
                    type="url"
                    value={formState.imageUrl}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                ) : (
                  <select
                    value={formState.imageUrl}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                    className="w-full h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {CURATED_IMAGES.map((img) => (
                      <option key={img.url} value={img.url}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                <img
                  src={formState.imageUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="Energy, Markets, Diplomacy"
                className="w-full h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Article Body (separate paragraphs with a blank line)
              </label>
              <textarea
                required
                minLength={20}
                rows={6}
                value={formState.bodyText}
                onChange={(e) => setFormState((prev) => ({ ...prev, bodyText: e.target.value }))}
                className="w-full p-3 text-sm rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.isBreaking}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, isBreaking: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#0070FF]"
                />
                <span>Include in Breaking Ticker</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.isFeatured}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, isFeatured: e.target.checked }))
                  }
                  className="w-4 h-4 accent-[#0070FF]"
                />
                <span>Feature in Hero Section</span>
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-5 text-xs font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] rounded-lg cursor-pointer"
              >
                {editingArticleId ? 'Save Changes' : 'Publish Story'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
