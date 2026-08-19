/**
 * API CLIENT.
 *
 * Every call to the backend goes through here. Three things this centralises:
 *
 *   1. The envelope. The backend answers { ok, data | error, meta } on every
 *      route, so unwrapping it belongs in one place rather than at each call.
 *   2. A timeout. `fetch` has no default one; without an AbortController a
 *      dead API leaves a button spinning forever.
 *   3. Never throwing. Callers get a discriminated result and render a state.
 *      A rejected promise in a component is an unhandled error boundary hit,
 *      and none of these failures are exceptional enough to deserve one.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 12_000;

export interface VoiceSession {
  provider: 'elevenlabs' | 'mock';
  transport: 'websocket';
  signedUrl: string;
  agentId: string;
  expiresAt: string;
  expiresInSeconds: number;
  mock?: boolean;
}

export type ApiResult<T> =
  | ({ ok: true } & T)
  | { ok: false; code: string; message: string; details?: Array<{ field: string; message: string }> };

interface Envelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Array<{ field: string; message: string }> };
  meta?: { requestId?: string };
}

async function call<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ApiResult<{ data: T }>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...init.headers },
      // The API is stateless and cookieless; sending credentials would only
      // widen what CORS has to allow.
      credentials: 'omit',
      cache: 'no-store',
    });

    const body = (await response.json().catch(() => null)) as Envelope<T> | null;

    if (!response.ok || !body?.ok) {
      return {
        ok: false,
        code: body?.error?.code ?? 'INTERNAL',
        message: body?.error?.message ?? 'Something went wrong. Please try again.',
        ...(body?.error?.details ? { details: body.error.details } : {}),
      };
    }

    return { ok: true, data: body.data as T };
  } catch (error) {
    // Aborted, offline, DNS failure, CORS refusal — all indistinguishable from
    // here, and all mean the same thing to a visitor.
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    return {
      ok: false,
      code: aborted ? 'TIMEOUT' : 'NETWORK',
      message: aborted
        ? 'That took too long. Please try again.'
        : 'Could not reach the server. Check your connection and try again.',
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the backend for a voice session.
 *
 * The response contains a signed WebSocket URL and no credential. That is the
 * entire point of the backend: the ElevenLabs API key never enters this
 * bundle, this browser, or this network response. See ADR 0002.
 */
export async function requestVoiceSession(): Promise<
  { ok: true; session: VoiceSession } | { ok: false; code: string; message: string }
> {
  const result = await call<VoiceSession>('/api/v1/voice/session', { method: 'POST' });
  if (!result.ok) return result;
  return { ok: true, session: result.data };
}

export async function sendVoiceChatMessage(payload: {
  messages?: Array<{ role: string; content: string }>;
  message?: string;
  userText?: string;
}): Promise<
  | { ok: true; reply: string; audioBase64?: string; speaker?: string }
  | { ok: false; code: string; message: string }
> {
  const result = await call<{ reply: string; audioBase64?: string; speaker?: string }>('/api/v1/voice/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!result.ok) return result;
  return { ok: true, ...result.data };
}

export async function verifyCatGate(
  password: string
): Promise<{ ok: true; message: string } | { ok: false; code: string; message: string }> {
  const result = await call<{ unlocked: boolean; message: string }>('/api/v1/gate/cat/verify', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  if (!result.ok) return result;
  return { ok: true, message: result.data.message };
}

export interface ContactInput {
  name: string;
  email: string;
  subject?: string;
  body: string;
  /** Honeypot. Always sent, always empty when a human filled the form. */
  website?: string;
}

export async function sendContactMessage(
  input: ContactInput
): Promise<
  | { ok: true; message: string }
  | { ok: false; code: string; message: string; details?: Array<{ field: string; message: string }> }
> {
  const result = await call<{ accepted: boolean; message: string }>('/api/v1/contact/messages', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!result.ok) return result;
  return { ok: true, message: result.data.message };
}
