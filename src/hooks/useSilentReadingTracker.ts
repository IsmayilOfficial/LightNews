import { useEffect, useRef } from 'react';
import { ArticleViewModel, TelemetryEventPayload } from '../types/news';

interface TrackerOptions {
  article: ArticleViewModel | null;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  sessionToken: string;
  csrfToken: string;
  onScrollProgress?: (pct: number) => void;
  onProfileSynced?: () => void;
}

export function useSilentReadingTracker({
  article,
  scrollContainerRef,
  sessionToken,
  csrfToken,
  onScrollProgress,
  onProfileSynced,
}: TrackerOptions): void {
  const milestonesSentRef = useRef<Set<number>>(new Set());
  const activeSecondsRef = useRef<number>(0);

  useEffect(() => {
    if (!article) return;

    milestonesSentRef.current = new Set();
    activeSecondsRef.current = 0;

    const dispatchTelemetry = (payload: TelemetryEventPayload) => {
      if (!csrfToken) return;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      };
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      fetch('/api/telemetry/event', {
        method: 'POST',
        keepalive: true,
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (res.ok && onProfileSynced) {
            onProfileSynced();
          }
        })
        .catch(() => {
          // Silent background tracking never interrupts reading UX
        });
    };

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        activeSecondsRef.current += 1;
      }
    }, 1000);

    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const maxScrollable = container.scrollHeight - container.clientHeight;
      const pct =
        maxScrollable <= 10
          ? 100
          : Math.min(100, Math.max(0, Math.round((container.scrollTop / maxScrollable) * 100)));

      if (onScrollProgress) {
        onScrollProgress(pct);
      }

      const checkpoints = [30, 60, 90];
      for (const checkpoint of checkpoints) {
        if (pct >= checkpoint && !milestonesSentRef.current.has(checkpoint)) {
          milestonesSentRef.current.add(checkpoint);
          dispatchTelemetry({
            articleId: article.id,
            category: article.category,
            tags: article.tags,
            eventType: 'scroll_milestone',
            scrollDepthPct: checkpoint,
          });
        }
      }
    };

    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger initial calculation in case content fits cleanly without scrolling
    const initTimer = window.setTimeout(handleScroll, 450);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(initTimer);
      container?.removeEventListener('scroll', handleScroll);

      if (activeSecondsRef.current >= 5) {
        dispatchTelemetry({
          articleId: article.id,
          category: article.category,
          tags: article.tags,
          eventType: 'dwell',
          dwellSeconds: activeSecondsRef.current,
        });
      }
    };
  }, [article?.id, csrfToken, sessionToken]);
}
