import { Language } from '../types/news';

export function formatNewsTimestamp(
  isoDate: string,
  lang: Language,
  todayLabel: string,
  yesterdayLabel: string
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  const timeStr = date.toLocaleTimeString(lang === 'az' ? 'az-AZ' : lang === 'ru' ? 'ru-RU' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isToday) return `${todayLabel} / ${timeStr}`;
  if (isYesterday) return `${yesterdayLabel} / ${timeStr}`;

  const dateStr = date.toLocaleDateString(lang === 'az' ? 'az-AZ' : lang === 'ru' ? 'ru-RU' : 'en-GB', {
    day: '2-digit',
    month: 'short',
  });
  return `${dateStr} / ${timeStr}`;
}

export function formatCompactNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return num.toLocaleString('en-US');
}

export function sanitizeSafeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  return '';
}
