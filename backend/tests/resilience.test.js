import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker, withRetry, isRetryable } from '../src/lib/resilience.js';
import { safeEqual, hashClient } from '../src/lib/hash.js';

describe('withRetry', () => {
  it('gives up immediately on a 4xx — retrying sends the same bad request', async () => {
    const fn = vi.fn(async () => {
      const e = new Error('bad request');
      e.status = 400;
      throw e;
    });

    await expect(withRetry(fn, { retries: 3, baseMs: 1 })).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a 5xx and returns the eventual success', async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls += 1;
      if (calls < 3) {
        const e = new Error('upstream down');
        e.status = 503;
        throw e;
      }
      return 'recovered';
    });

    await expect(withRetry(fn, { retries: 3, baseMs: 1 })).resolves.toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('treats a timeout and a 429 as worth retrying, a 401 as not', () => {
    expect(isRetryable({ name: 'AbortError' })).toBe(true);
    expect(isRetryable({ status: 429 })).toBe(true);
    expect(isRetryable({ status: 500 })).toBe(true);
    expect(isRetryable({ status: 401 })).toBe(false);
  });
});

describe('CircuitBreaker', () => {
  const boom = () => {
    const e = new Error('upstream');
    e.status = 503;
    throw e;
  };

  it('opens after the threshold and then fails fast without calling through', async () => {
    const breaker = new CircuitBreaker({ name: 't', failureThreshold: 3, resetTimeoutMs: 60_000 });
    const upstream = vi.fn(boom);

    for (let i = 0; i < 3; i += 1) {
      await expect(breaker.execute(upstream)).rejects.toThrow();
    }
    expect(breaker.snapshot().state).toBe('open');

    await expect(breaker.execute(upstream)).rejects.toMatchObject({ status: 503 });
    // The fourth call never reached the upstream — that is the whole value.
    expect(upstream).toHaveBeenCalledTimes(3);
  });

  it('does not open on our own bad requests', async () => {
    const breaker = new CircuitBreaker({ name: 't', failureThreshold: 2 });
    const badRequest = async () => {
      const e = new Error('nope');
      e.status = 400;
      throw e;
    };

    await expect(breaker.execute(badRequest)).rejects.toThrow();
    await expect(breaker.execute(badRequest)).rejects.toThrow();
    expect(breaker.snapshot().state).toBe('closed');
  });

  it('probes once after the reset window and closes on success', async () => {
    const breaker = new CircuitBreaker({ name: 't', failureThreshold: 1, resetTimeoutMs: 0 });
    await expect(breaker.execute(boom)).rejects.toThrow();
    expect(breaker.snapshot().state).toBe('open');

    await expect(breaker.execute(async () => 'ok')).resolves.toBe('ok');
    expect(breaker.snapshot().state).toBe('closed');
  });
});

describe('hash utilities', () => {
  it('compares equal and unequal secrets correctly', () => {
    expect(safeEqual('apperception', 'apperception')).toBe(true);
    expect(safeEqual('apperception', 'apperceptio')).toBe(false);
    expect(safeEqual('a', 'a-much-longer-value')).toBe(false);
  });

  it('produces a stable, non-reversible client hash', () => {
    const a = hashClient('203.0.113.7');
    expect(a).toBe(hashClient('203.0.113.7'));
    expect(a).not.toContain('203.0.113.7');
    expect(a).not.toBe(hashClient('203.0.113.8'));
  });
});
