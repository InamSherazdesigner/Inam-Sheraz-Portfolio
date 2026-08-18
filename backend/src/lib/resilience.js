/**
 * RESILIENCE — timeout, retry, circuit breaker.
 *
 * ElevenLabs is a third party on the critical path of one feature. If it slows
 * down, this service must not slow down with it; if it goes down, this service
 * must stop hammering it and start failing fast with a clear message.
 *
 * Deliberately dependency-free. These are ~120 lines of well-understood logic
 * and a library would be a larger supply-chain surface than the problem.
 */

import { ApiError } from './ApiError.js';

/* -------------------------------------------------------------------------- */
/* Timeout                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * fetch with a hard deadline. Without this a hung upstream socket holds a
 * Node request open indefinitely and exhausts the event loop under load.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------------------------------------------------- */
/* Retry                                                                       */
/* -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Retry with exponential backoff and full jitter.
 *
 * Jitter matters more than the backoff curve does: without it, every client
 * that failed at the same moment retries at the same moment and the upstream
 * gets a second synchronised wave exactly when it is least able to take one.
 *
 * @param {() => Promise<T>} fn
 * @param {object} [opts]
 * @param {number} [opts.retries=2]      Attempts *after* the first.
 * @param {number} [opts.baseMs=200]
 * @param {number} [opts.maxMs=2000]
 * @param {(e: unknown) => boolean} [opts.retryable] Defaults to network + 5xx.
 * @template T
 */
export async function withRetry(fn, opts = {}) {
  const { retries = 2, baseMs = 200, maxMs = 2000, retryable = isRetryable, onRetry } = opts;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === retries || !retryable(error)) break;
      const ceiling = Math.min(maxMs, baseMs * 2 ** attempt);
      const delay = Math.random() * ceiling; // full jitter
      onRetry?.({ attempt: attempt + 1, delay, error });
      await sleep(delay);
    }
  }
  throw lastError;
}

/**
 * A 4xx from ElevenLabs means we sent something wrong — retrying sends the
 * same wrong thing again. Only transport failures and 5xx/429 are worth a
 * second attempt.
 */
export function isRetryable(error) {
  if (error?.name === 'AbortError') return true;
  if (error?.status) return error.status >= 500 || error.status === 429;
  return true; // network-level: DNS, ECONNRESET, TLS
}

/* -------------------------------------------------------------------------- */
/* Circuit breaker                                                             */
/* -------------------------------------------------------------------------- */

const State = Object.freeze({ CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' });

/**
 * Three states:
 *   closed     — calls pass through, failures are counted.
 *   open       — calls fail immediately. Nothing reaches the upstream.
 *   half-open  — one probe is allowed through to see whether it recovered.
 *
 * The point is not to protect the upstream. It is to stop *this* service
 * spending ten seconds per request waiting for something already known to be
 * down, and to give the visitor an honest answer in milliseconds instead.
 */
export class CircuitBreaker {
  constructor({ name, failureThreshold = 5, resetTimeoutMs = 30_000, logger } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.logger = logger;

    this.state = State.CLOSED;
    this.failures = 0;
    this.openedAt = 0;
    this.successes = 0;
    this.trips = 0;
  }

  async execute(fn) {
    if (this.state === State.OPEN) {
      if (Date.now() - this.openedAt < this.resetTimeoutMs) {
        throw new ApiError(
          503,
          'UPSTREAM_UNAVAILABLE',
          'The voice agent is temporarily unavailable. Please try again in a minute.',
          { retryAfterSeconds: Math.ceil((this.resetTimeoutMs - (Date.now() - this.openedAt)) / 1000) }
        );
      }
      this.#transition(State.HALF_OPEN);
    }

    try {
      const result = await fn();
      this.#onSuccess();
      return result;
    } catch (error) {
      this.#onFailure(error);
      throw error;
    }
  }

  #onSuccess() {
    this.successes += 1;
    if (this.state === State.HALF_OPEN) this.#transition(State.CLOSED);
    this.failures = 0;
  }

  #onFailure(error) {
    // A rejection caused by our own bad request says nothing about upstream
    // health, so it must not push the breaker toward open.
    if (error?.status && error.status < 500 && error.status !== 429) return;

    this.failures += 1;
    if (this.state === State.HALF_OPEN || this.failures >= this.failureThreshold) {
      this.openedAt = Date.now();
      this.trips += 1;
      this.#transition(State.OPEN);
    }
  }

  #transition(next) {
    if (this.state === next) return;
    const previous = this.state;
    this.state = next;
    if (next === State.CLOSED) this.failures = 0;
    this.logger?.warn(
      { breaker: this.name, from: previous, to: next, failures: this.failures },
      'circuit breaker state change'
    );
  }

  /** Surfaced on /health/ready and the metrics endpoint. */
  snapshot() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      trips: this.trips,
      successes: this.successes,
    };
  }
}
