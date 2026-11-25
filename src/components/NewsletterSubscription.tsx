import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { FormEvent, useId, useState } from 'react';
import { UI_COPY } from '../data/i18n';
import { Language } from '../types/news';

interface NewsletterSubscriptionProps {
  lang: Language;
  sessionToken: string;
  csrfToken: string;
  onEnsureSession: () => Promise<{ sessionToken: string; csrfToken: string } | null>;
}

const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

export function NewsletterSubscription({
  lang,
  sessionToken,
  csrfToken,
  onEnsureSession,
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'duplicate' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const inputId = useId();
  const feedbackId = useId();
  const copy = UI_COPY[lang];

  const validateEmail = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return copy.newsletterErrorEmpty;
    if (trimmed.length > 254 || !EMAIL_PATTERN.test(trimmed)) {
      return copy.newsletterErrorInvalid;
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setStatus('error');
      setErrorMessage(validationError);
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      let activeSessionToken = sessionToken;
      let activeCsrfToken = csrfToken;

      if (!activeCsrfToken || !activeSessionToken) {
        const refreshed = await onEnsureSession();
        if (refreshed) {
          activeSessionToken = refreshed.sessionToken;
          activeCsrfToken = refreshed.csrfToken;
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeCsrfToken) headers['X-CSRF-Token'] = activeCsrfToken;
      if (activeSessionToken) headers.Authorization = `Bearer ${activeSessionToken}`;

      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          lang,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data?.error || copy.newsletterErrorServer);
        return;
      }

      if (data?.alreadySubscribed) {
        setStatus('duplicate');
      } else {
        setStatus('success');
        setEmail('');
      }
    } catch {
      setStatus('error');
      setErrorMessage(copy.newsletterErrorServer);
    }
  };

  const isInvalid = status === 'error';

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-[#0070FF]/10 dark:bg-[#3894FF]/15 text-[#0070FF] dark:text-[#3894FF] flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
            {copy.newsletterHeading}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            {copy.newsletterSubtitle}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <label htmlFor={inputId} className="sr-only">
            {copy.newsletterHeading}
          </label>
          <input
            id={inputId}
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== 'idle' && status !== 'submitting') {
                setStatus('idle');
                setErrorMessage('');
              }
            }}
            placeholder={copy.newsletterPlaceholder}
            aria-invalid={isInvalid}
            aria-describedby={status !== 'idle' ? feedbackId : undefined}
            className={`flex-1 min-w-0 h-10 px-3.5 text-sm rounded-lg bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border transition-colors focus:outline-none focus:ring-2 focus:ring-[#0070FF] ${
              isInvalid
                ? 'border-rose-500 dark:border-rose-400'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="h-10 px-5 text-sm font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] disabled:opacity-60 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0070FF]"
          >
            {status === 'submitting' ? copy.newsletterSubscribing : copy.newsletterButton}
          </button>
        </div>

        {status === 'error' && (
          <p
            id={feedbackId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </p>
        )}

        {(status === 'success' || status === 'duplicate') && (
          <p
            id={feedbackId}
            role="status"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              {status === 'duplicate' ? copy.newsletterAlreadySubscribed : copy.newsletterSuccess}
            </span>
          </p>
        )}

        {status === 'idle' && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {copy.newsletterPrivacyNote}
          </p>
        )}
      </form>
    </div>
  );
}
