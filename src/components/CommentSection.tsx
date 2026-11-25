import { AlertCircle, CornerDownRight, MessageSquare, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useId, useMemo, useState } from 'react';
import { UI_COPY } from '../data/i18n';
import { ArticleComment, Language } from '../types/news';
import { formatNewsTimestamp } from '../utils/formatters';

interface CommentSectionProps {
  articleId: string;
  lang: Language;
  sessionToken: string;
  csrfToken: string;
  onEnsureSession: (
    forceRefresh?: boolean
  ) => Promise<{ sessionToken: string; csrfToken: string } | null>;
}

interface CommentNode extends ArticleComment {
  replies: CommentNode[];
}

function buildCommentTree(flat: ArticleComment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const item of flat) {
    byId.set(item.id, { ...item, replies: [] });
  }

  for (const item of flat) {
    const node = byId.get(item.id)!;
    if (item.parentId && byId.has(item.parentId)) {
      byId.get(item.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'R';
}

export function CommentSection({
  articleId,
  lang,
  sessionToken,
  csrfToken,
  onEnsureSession,
}: CommentSectionProps) {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyErrorMsg, setReplyErrorMsg] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const nameInputId = useId();
  const bodyInputId = useId();
  const copy = UI_COPY[lang];

  // Reset per-article draft & active reply state when switching articles
  useEffect(() => {
    setBody('');
    setErrorMsg('');
    setReplyingToId(null);
    setReplyBody('');
    setReplyErrorMsg('');
  }, [articleId]);

  const fetchComments = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        let activeSession = sessionToken;
        if (!activeSession) {
          const auth = await onEnsureSession();
          if (auth?.sessionToken) activeSession = auth.sessionToken;
        }

        const headers: Record<string, string> = {};
        if (activeSession) {
          headers.Authorization = `Bearer ${activeSession}`;
        }

        const res = await fetch(`/api/news/${encodeURIComponent(articleId)}/comments`, {
          credentials: 'same-origin',
          headers,
          signal,
        });

        if (!signal?.aborted && res.ok) {
          const data = await res.json();
          setComments(Array.isArray(data?.comments) ? data.comments : []);
        }
      } catch {
        if (!signal?.aborted) {
          setComments([]);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [articleId, sessionToken, onEnsureSession]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchComments(controller.signal);
    return () => controller.abort();
  }, [fetchComments]);

  const authorizedFetch = useCallback(
    async (url: string, init: RequestInit): Promise<Response> => {
      let activeSession = sessionToken;
      let activeCsrf = csrfToken;

      if (!activeSession || !activeCsrf) {
        const refreshed = await onEnsureSession();
        if (refreshed) {
          activeSession = refreshed.sessionToken;
          activeCsrf = refreshed.csrfToken;
        }
      }

      const buildHeaders = (sToken: string, cToken: string): Record<string, string> => {
        const h: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (sToken) h.Authorization = `Bearer ${sToken}`;
        if (cToken) h['X-CSRF-Token'] = cToken;
        return h;
      };

      let res = await fetch(url, {
        ...init,
        credentials: 'same-origin',
        headers: buildHeaders(activeSession, activeCsrf),
      });

      if (res.status === 403) {
        const refreshed = await onEnsureSession(true);
        if (refreshed) {
          res = await fetch(url, {
            ...init,
            credentials: 'same-origin',
            headers: buildHeaders(refreshed.sessionToken, refreshed.csrfToken),
          });
        }
      }

      return res;
    },
    [sessionToken, csrfToken, onEnsureSession]
  );

  const handleCreateComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanName = authorName.trim();
    const cleanBody = body.trim();

    if (cleanName.length < 2) {
      setErrorMsg(copy.commentsErrorName);
      return;
    }
    if (cleanBody.length < 2) {
      setErrorMsg(copy.commentsErrorEmpty);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await authorizedFetch(
        `/api/news/${encodeURIComponent(articleId)}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            authorName: cleanName,
            body: cleanBody,
            parentId: null,
          }),
        }
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMsg(data?.error || copy.commentsErrorServer);
        return;
      }

      if (Array.isArray(data?.comments)) {
        setComments(data.comments);
      } else if (data?.comment) {
        setComments((prev) => [...prev, data.comment]);
      }
      setBody('');
    } catch {
      setErrorMsg(copy.commentsErrorServer);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: FormEvent<HTMLFormElement>, parentId: string) => {
    e.preventDefault();
    const cleanName = authorName.trim();
    const cleanBody = replyBody.trim();

    if (cleanName.length < 2) {
      setReplyErrorMsg(copy.commentsErrorName);
      return;
    }
    if (cleanBody.length < 2) {
      setReplyErrorMsg(copy.commentsErrorEmpty);
      return;
    }

    setReplySubmitting(true);
    setReplyErrorMsg('');
    try {
      const res = await authorizedFetch(
        `/api/news/${encodeURIComponent(articleId)}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            authorName: cleanName,
            body: cleanBody,
            parentId,
          }),
        }
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setReplyErrorMsg(data?.error || copy.commentsErrorServer);
        return;
      }

      if (Array.isArray(data?.comments)) {
        setComments(data.comments);
      } else if (data?.comment) {
        setComments((prev) => [...prev, data.comment]);
      }
      setReplyBody('');
      setReplyingToId(null);
    } catch {
      setReplyErrorMsg(copy.commentsErrorServer);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const res = await authorizedFetch(
        `/api/news/${encodeURIComponent(articleId)}/comments/${encodeURIComponent(commentId)}`,
        { method: 'DELETE' }
      );
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.comments)) {
        setComments(data.comments);
      }
    } catch {
      // Ignore network failure gracefully
    } finally {
      setDeletingId(null);
    }
  };

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  const renderCommentNode = (node: CommentNode, depth: number) => {
    const isReplying = replyingToId === node.id;
    const indentClass =
      depth > 0
        ? 'ml-4 sm:ml-7 pl-3.5 sm:pl-4 border-l-2 border-slate-200 dark:border-slate-800'
        : '';

    return (
      <div key={node.id} className={indentClass}>
        <div className="py-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                aria-hidden="true"
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  node.isOwn
                    ? 'bg-[#0070FF] text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                {getInitials(node.authorName)}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {node.authorName}
                </span>
                {node.isOwn && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#0070FF]/12 text-[#0070FF] dark:bg-[#3894FF]/20 dark:text-[#3894FF]">
                    {copy.commentsYouBadge}
                  </span>
                )}
                <span className="text-[11px] font-mono-tabular text-slate-400 dark:text-slate-500">
                  {formatNewsTimestamp(
                    node.createdAt,
                    lang,
                    copy.todayPrefix,
                    copy.yesterdayPrefix
                  )}
                </span>
              </div>
            </div>

            {node.isOwn && (
              <button
                type="button"
                disabled={deletingId === node.id}
                onClick={() => handleDeleteComment(node.id)}
                aria-label={copy.commentsDeleteAction}
                title={copy.commentsDeleteAction}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">{copy.commentsDeleteAction}</span>
              </button>
            )}
          </div>

          <p className="mt-2 pl-9.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words">
            {node.body}
          </p>

          <div className="mt-2 pl-9.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (isReplying) {
                  setReplyingToId(null);
                  setReplyBody('');
                  setReplyErrorMsg('');
                } else {
                  setReplyingToId(node.id);
                  setReplyBody('');
                  setReplyErrorMsg('');
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0070FF] dark:hover:text-[#3894FF] transition-colors cursor-pointer"
            >
              <CornerDownRight className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isReplying ? copy.commentsCancel : copy.commentsReplyAction}</span>
            </button>
          </div>

          {isReplying && (
            <form
              onSubmit={(e) => handleSubmitReply(e, node.id)}
              className="mt-3 ml-9.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span>
                  {copy.commentsReplyingTo}{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{node.authorName}</strong>
                </span>
              </div>

              {authorName.trim().length < 2 && (
                <input
                  type="text"
                  maxLength={40}
                  value={authorName}
                  onChange={(e) => {
                    setAuthorName(e.target.value);
                    if (replyErrorMsg) setReplyErrorMsg('');
                  }}
                  placeholder={copy.commentsNamePlaceholder}
                  aria-label={copy.commentsNameLabel}
                  className="w-full h-9 px-3 text-xs rounded-lg bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0070FF]"
                />
              )}

              <textarea
                rows={2}
                maxLength={1000}
                autoFocus
                value={replyBody}
                onChange={(e) => {
                  setReplyBody(e.target.value);
                  if (replyErrorMsg) setReplyErrorMsg('');
                }}
                placeholder={copy.commentsReplyPlaceholder}
                aria-label={copy.commentsReplyPlaceholder}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0070FF] resize-y"
              />

              {replyErrorMsg && (
                <p
                  role="alert"
                  className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{replyErrorMsg}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyBody('');
                    setReplyErrorMsg('');
                  }}
                  className="px-3 h-8 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {copy.commentsCancel}
                </button>
                <button
                  type="submit"
                  disabled={replySubmitting}
                  className="inline-flex items-center gap-1.5 px-3.5 h-8 text-xs font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" aria-hidden="true" />
                  <span>{replySubmitting ? copy.commentsPosting : copy.commentsReplyAction}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {node.replies.length > 0 && (
          <div className="space-y-0">
            {node.replies.map((reply) => renderCommentNode(reply, Math.min(depth + 1, 2)))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      aria-label={copy.commentsTitle}
      className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <MessageSquare
            className="w-4 h-4 text-[#0070FF] dark:text-[#3894FF]"
            aria-hidden="true"
          />
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {copy.commentsTitle}
          </h2>
          <span className="px-2 py-0.5 text-xs font-mono-tabular font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {comments.length}
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>{copy.commentsSessionNote}</span>
        </span>
      </div>

      {/* Top-Level Comment Form */}
      <form
        onSubmit={handleCreateComment}
        className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3"
      >
        <div>
          <label
            htmlFor={nameInputId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {copy.commentsNameLabel}
          </label>
          <input
            id={nameInputId}
            type="text"
            maxLength={40}
            value={authorName}
            onChange={(e) => {
              setAuthorName(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder={copy.commentsNamePlaceholder}
            className="w-full sm:max-w-xs h-9 px-3 text-xs sm:text-sm rounded-lg bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0070FF]"
          />
        </div>

        <div>
          <label htmlFor={bodyInputId} className="sr-only">
            {copy.commentsBodyPlaceholder}
          </label>
          <textarea
            id={bodyInputId}
            rows={3}
            maxLength={1000}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder={copy.commentsBodyPlaceholder}
            className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0070FF] resize-y"
          />
        </div>

        {errorMsg && (
          <p
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono-tabular text-slate-400 dark:text-slate-500">
            {body.length}/1000
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 h-9 text-xs font-semibold text-white bg-[#0070FF] hover:bg-[#005CE6] disabled:opacity-60 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070FF]"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{submitting ? copy.commentsPosting : copy.commentsPostAction}</span>
          </button>
        </div>
      </form>

      {/* Threaded Comments List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
            />
          ))}
        </div>
      ) : commentTree.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-7 px-4 text-center">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {copy.commentsEmpty}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
          {commentTree.map((rootNode) => renderCommentNode(rootNode, 0))}
        </div>
      )}
    </section>
  );
}
