import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import crypto from 'crypto';
import { Language } from '../src/types/news';

const SUMMARY_MODEL = 'gemini-4-hydrogen';

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  az: 'Azerbaijani',
  ru: 'Russian',
};

const summaryCache = new Map<string, string[]>();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'GEMINI_API_KEY is not configured. Please add it in the Settings -> Secrets panel.'
    ) as Error & { status?: number };
    err.status = 503;
    throw err;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|blockquote|div|h\d)>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeBullets(rawBullets: unknown): string[] {
  if (!Array.isArray(rawBullets)) return [];
  return rawBullets
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/^[\s•\-*\d.)]+/, '').trim())
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

function parseApiError(error: unknown): { status: number; message: string } {
  const errObj = error as { status?: number; code?: number; message?: string };
  let rawMessage = errObj?.message || 'Unable to generate summary right now.';
  let parsedStatus: number | undefined;

  if (rawMessage.trim().startsWith('{')) {
    try {
      const parsedJson = JSON.parse(rawMessage) as {
        error?: { code?: number; message?: string };
        message?: string;
      };
      if (parsedJson?.error?.message) {
        rawMessage = parsedJson.error.message;
      } else if (parsedJson?.message) {
        rawMessage = parsedJson.message;
      }
      if (typeof parsedJson?.error?.code === 'number') {
        parsedStatus = parsedJson.error.code;
      }
    } catch {
      // Keep original string if not valid JSON
    }
  }

  const statusCode =
    typeof errObj?.status === 'number'
      ? errObj.status
      : typeof errObj?.code === 'number'
      ? errObj.code
      : parsedStatus ?? 502;

  if (
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('PERMISSION_DENIED') ||
    statusCode === 403 ||
    statusCode === 400
  ) {
    return {
      status: 502,
      message:
        'Gemini API key authorization failed. Please check your GEMINI_API_KEY in Settings -> Secrets.',
    };
  }

  if (rawMessage.includes('RESOURCE_EXHAUSTED') || statusCode === 429) {
    return {
      status: 429,
      message: 'AI summary quota temporarily reached. Please try again in a moment.',
    };
  }

  return {
    status: statusCode >= 400 && statusCode < 600 ? statusCode : 502,
    message: rawMessage,
  };
}

export async function summarizeArticleWithGemini(params: {
  articleId: string;
  lang: Language;
  title: string;
  excerpt: string;
  bodyHtml: string;
}): Promise<{ bullets: string[]; cached: boolean }> {
  const plainBody = htmlToPlainText(params.bodyHtml);
  const contentHash = crypto
    .createHash('sha256')
    .update(`${params.title}\n${plainBody}`)
    .digest('hex')
    .slice(0, 16);
  const cacheKey = `${params.articleId}:${params.lang}:${contentHash}`;

  const cachedBullets = summaryCache.get(cacheKey);
  if (cachedBullets && cachedBullets.length === 3) {
    return { bullets: cachedBullets, cached: true };
  }

  const ai = getGeminiClient();
  const targetLanguage = LANGUAGE_NAMES[params.lang] || 'English';

  const prompt = [
    `Article Headline: ${params.title}`,
    params.excerpt ? `Lead: ${params.excerpt}` : '',
    'Article Body:',
    plainBody.slice(0, 14000),
  ]
    .filter(Boolean)
    .join('\n\n');

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: SUMMARY_MODEL,
        contents: prompt,
        config: {
          systemInstruction: `You are a senior news editor at LightNews. Summarize the provided article into exactly 3 concise, factual bullet points in ${targetLanguage}. Each bullet must be a single clear sentence (15-28 words) capturing the core facts, numbers, or implications strictly from the article text without speculation or markdown bullets.`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bullets: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 3 concise factual summary bullet points.',
              },
            },
            required: ['bullets'],
          },
        },
      });

      const jsonText = (response.text ?? '').trim();
      const parsed = JSON.parse(jsonText) as { bullets?: unknown };
      const bullets = normalizeBullets(parsed?.bullets);

      if (bullets.length === 0) {
        throw new Error('Model returned an empty summary.');
      }

      if (bullets.length === 3) {
        summaryCache.set(cacheKey, bullets);
      }

      return { bullets, cached: false };
    } catch (err) {
      lastError = err;
      const parsedErr = parseApiError(err);
      if (parsedErr.status === 429 || parsedErr.status === 403 || parsedErr.message.includes('API key')) {
        break;
      }
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }
  }

  const finalError = parseApiError(lastError);
  const thrown = new Error(finalError.message) as Error & { status?: number };
  thrown.status = finalError.status;
  throw thrown;
}
