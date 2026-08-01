import { describe, expect, it } from 'vitest';
import { checkRateLimit, clientKey, exceedsBodyLimit } from './rate-limit';

function request(ip: string, headers: Record<string, string> = {}) {
  return new Request('https://example.com/api/thing', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, ...headers },
  });
}

describe('clientKey', () => {
  it('uses the first hop of x-forwarded-for', () => {
    expect(clientKey(request('1.2.3.4, 5.6.7.8'))).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('https://example.com', { headers: { 'x-real-ip': '9.9.9.9' } });
    expect(clientKey(req)).toBe('9.9.9.9');
  });

  it('falls back to anon when no client hint is present', () => {
    expect(clientKey(new Request('https://example.com'))).toBe('anon');
  });
});

describe('checkRateLimit', () => {
  const rule = { key: 'test-basic', windowMs: 60_000, max: 3 };

  it('allows up to max then rejects', () => {
    const ip = '10.0.0.1';
    expect(checkRateLimit(request(ip), rule).ok).toBe(true);
    expect(checkRateLimit(request(ip), rule).ok).toBe(true);
    const third = checkRateLimit(request(ip), rule);
    expect(third.ok).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = checkRateLimit(request(ip), rule);
    expect(fourth.ok).toBe(false);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });

  it('tracks each client independently', () => {
    const scoped = { key: 'test-isolation', windowMs: 60_000, max: 1 };
    expect(checkRateLimit(request('10.0.0.2'), scoped).ok).toBe(true);
    expect(checkRateLimit(request('10.0.0.2'), scoped).ok).toBe(false);
    expect(checkRateLimit(request('10.0.0.3'), scoped).ok).toBe(true);
  });

  it('keeps separate counters per rule key', () => {
    const a = { key: 'test-rule-a', windowMs: 60_000, max: 1 };
    const b = { key: 'test-rule-b', windowMs: 60_000, max: 1 };
    const ip = '10.0.0.4';
    expect(checkRateLimit(request(ip), a).ok).toBe(true);
    expect(checkRateLimit(request(ip), b).ok).toBe(true);
    expect(checkRateLimit(request(ip), a).ok).toBe(false);
  });

  it('resets once the window elapses', async () => {
    const fast = { key: 'test-window', windowMs: 30, max: 1 };
    const ip = '10.0.0.5';
    expect(checkRateLimit(request(ip), fast).ok).toBe(true);
    expect(checkRateLimit(request(ip), fast).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 45));
    expect(checkRateLimit(request(ip), fast).ok).toBe(true);
  });
});

describe('exceedsBodyLimit', () => {
  it('rejects an oversized declared body', () => {
    const req = request('1.1.1.1', { 'content-length': '2048' });
    expect(exceedsBodyLimit(req, 1024)).toBe(true);
  });

  it('accepts a body within the limit', () => {
    const req = request('1.1.1.1', { 'content-length': '512' });
    expect(exceedsBodyLimit(req, 1024)).toBe(false);
  });

  it('does not reject when content-length is absent', () => {
    expect(exceedsBodyLimit(request('1.1.1.1'), 1024)).toBe(false);
  });
});
