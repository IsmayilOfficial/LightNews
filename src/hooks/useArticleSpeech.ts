import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Language } from '../types/news';

export type SpeechStatus = 'idle' | 'playing' | 'paused';
export type SpeechSpeed = 0.75 | 1 | 1.25 | 1.5 | 2;

export const SPEECH_SPEEDS: SpeechSpeed[] = [0.75, 1, 1.25, 1.5, 2];

const LANG_LOCALE_MAP: Record<Language, string[]> = {
  en: ['en-US', 'en-GB', 'en'],
  az: ['az-AZ', 'az', 'tr-TR', 'tr'],
  ru: ['ru-RU', 'ru'],
};

function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const paragraphs = Array.from(doc.body.querySelectorAll('p, li, blockquote'));
    if (paragraphs.length > 0) {
      return paragraphs
        .map((el) => el.textContent?.trim() ?? '')
        .filter(Boolean)
        .join('. ');
    }
    return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
  return html
    .replace(/<\/(p|li|blockquote)>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoSpeechChunks(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const rawSentences = cleaned.split(/(?<=[.!?…])\s+/);
  const chunks: string[] = [];
  let buffer = '';

  for (const sentence of rawSentences) {
    const s = sentence.trim();
    if (!s) continue;

    if (s.length > 220) {
      if (buffer) {
        chunks.push(buffer);
        buffer = '';
      }
      const subParts = s.split(/(?<=[,;:])\s+/);
      for (const part of subParts) {
        if (!part.trim()) continue;
        if ((buffer + ' ' + part).trim().length <= 220) {
          buffer = (buffer ? `${buffer} ` : '') + part.trim();
        } else {
          if (buffer) chunks.push(buffer);
          buffer = part.trim();
        }
      }
      continue;
    }

    if ((buffer + ' ' + s).trim().length <= 220) {
      buffer = (buffer ? `${buffer} ` : '') + s;
    } else {
      if (buffer) chunks.push(buffer);
      buffer = s;
    }
  }

  if (buffer) {
    chunks.push(buffer);
  }

  return chunks;
}

export function useArticleSpeech(params: {
  articleId: string | null;
  title: string;
  excerpt: string;
  bodyHtml: string;
  lang: Language;
}) {
  const { articleId, title, excerpt, bodyHtml, lang } = params;

  const supported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [rate, setRateState] = useState<SpeechSpeed>(1);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const statusRef = useRef<SpeechStatus>('idle');
  const rateRef = useRef<SpeechSpeed>(1);
  const chunkIndexRef = useRef(0);
  const runIdRef = useRef(0);

  const chunks = useMemo(() => {
    if (!articleId) return [];
    const bodyText = htmlToPlainText(bodyHtml);
    const fullText = [title, excerpt, bodyText].filter(Boolean).join('. ');
    return splitIntoSpeechChunks(fullText);
  }, [articleId, title, excerpt, bodyHtml]);

  useEffect(() => {
    if (!supported) return;
    const syncVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length > 0) setVoices(list);
    };
    syncVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', syncVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', syncVoices);
    };
  }, [supported]);

  const pickVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;
    const preferredLocales = LANG_LOCALE_MAP[lang];
    for (const locale of preferredLocales) {
      const exact = voices.find((v) => v.lang.toLowerCase() === locale.toLowerCase());
      if (exact) return exact;
      const prefix = voices.find((v) =>
        v.lang.toLowerCase().startsWith(locale.toLowerCase().split('-')[0])
      );
      if (prefix) return prefix;
    }
    return null;
  }, [voices, lang]);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    statusRef.current = 'idle';
    chunkIndexRef.current = 0;
    setStatus('idle');
    setCurrentChunkIndex(0);
    if (supported) {
      window.speechSynthesis.cancel();
    }
  }, [supported]);

  // Stop playback and reset UI state whenever article switches, language switches, or modal unmounts
  useEffect(() => {
    runIdRef.current += 1;
    statusRef.current = 'idle';
    chunkIndexRef.current = 0;
    setStatus('idle');
    setCurrentChunkIndex(0);
    if (supported) {
      window.speechSynthesis.cancel();
    }

    return () => {
      runIdRef.current += 1;
      statusRef.current = 'idle';
      chunkIndexRef.current = 0;
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [articleId, lang, supported]);

  const speakChunk = useCallback(
    (index: number, runId: number, speedOverride?: SpeechSpeed) => {
      if (!supported) return;
      if (runId !== runIdRef.current) return;

      if (index >= chunks.length) {
        statusRef.current = 'idle';
        chunkIndexRef.current = 0;
        setStatus('idle');
        setCurrentChunkIndex(0);
        return;
      }

      chunkIndexRef.current = index;
      setCurrentChunkIndex(index);

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      const matchedVoice = pickVoice();
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = LANG_LOCALE_MAP[lang][0];
      }
      utterance.rate = speedOverride ?? rateRef.current;

      utterance.onend = () => {
        if (runId !== runIdRef.current) return;
        if (statusRef.current === 'playing') {
          speakChunk(index + 1, runId);
        }
      };

      utterance.onerror = (event) => {
        if (runId !== runIdRef.current) return;
        if (event.error === 'interrupted' || event.error === 'canceled') return;
        statusRef.current = 'idle';
        setStatus('idle');
      };

      window.speechSynthesis.speak(utterance);
    },
    [supported, chunks, pickVoice, lang]
  );

  const play = useCallback(() => {
    if (!supported || chunks.length === 0) return;

    if (statusRef.current === 'paused') {
      statusRef.current = 'playing';
      setStatus('playing');
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        return;
      }
      runIdRef.current += 1;
      const runId = runIdRef.current;
      window.speechSynthesis.cancel();
      speakChunk(chunkIndexRef.current, runId);
      return;
    }

    runIdRef.current += 1;
    const runId = runIdRef.current;
    statusRef.current = 'playing';
    setStatus('playing');
    window.speechSynthesis.cancel();
    speakChunk(chunkIndexRef.current, runId);
  }, [supported, chunks.length, speakChunk]);

  const pause = useCallback(() => {
    if (!supported || statusRef.current !== 'playing') return;
    statusRef.current = 'paused';
    setStatus('paused');
    window.speechSynthesis.pause();
  }, [supported]);

  const togglePlayPause = useCallback(() => {
    if (statusRef.current === 'playing') {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const setRate = useCallback(
    (nextRate: SpeechSpeed) => {
      rateRef.current = nextRate;
      setRateState(nextRate);

      if (supported && statusRef.current === 'playing') {
        runIdRef.current += 1;
        const runId = runIdRef.current;
        window.speechSynthesis.cancel();
        speakChunk(chunkIndexRef.current, runId, nextRate);
      }
    },
    [supported, speakChunk]
  );

  const progressPct =
    chunks.length > 0 && status !== 'idle'
      ? Math.min(100, Math.round(((currentChunkIndex + 1) / chunks.length) * 100))
      : 0;

  return {
    supported,
    status,
    rate,
    progressPct,
    hasContent: chunks.length > 0,
    togglePlayPause,
    stop,
    setRate,
  };
}
