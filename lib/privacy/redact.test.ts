import { describe, expect, it } from 'vitest';
import { applyRedactions, addUserDetection, containsHighConfidencePii, detectPii } from './redact';

const SCAM = `Dear Chukwuemeka, congratulations! Send your BVN 12345678901 and pay
N5,000 to account number 0123456789 GTBank. Card 4111 1111 1111 1111 accepted.
Chat +2348012345678 or hr.recruit@gmail.com. Apply: https://mtn.jobs-portal.xyz/go
My name is Adaeze Obi and I am the recruiter.`;

describe('detectPii', () => {
  const result = detectPii(SCAM);
  const byCategory = (cat: string) => result.detections.filter((d) => d.category === cat);

  it('detects the email address', () => {
    expect(byCategory('email')).toHaveLength(1);
    expect(byCategory('email')[0].raw).toBe('hr.recruit@gmail.com');
  });

  it('detects the international and local phone formats', () => {
    expect(byCategory('phone').length).toBeGreaterThanOrEqual(1);
  });

  it('detects the card number via Luhn', () => {
    expect(byCategory('card')).toHaveLength(1);
  });

  it('detects the keyword-anchored BVN', () => {
    expect(byCategory('national_id')).toHaveLength(1);
    expect(byCategory('national_id')[0].raw).toBe('12345678901');
  });

  it('detects the bank account', () => {
    expect(byCategory('bank_account').some((d) => d.raw === '0123456789')).toBe(true);
  });

  it('detects the URL but recommends keeping it', () => {
    const urls = byCategory('url');
    expect(urls).toHaveLength(1);
    expect(urls[0].keepRecommended).toBe(true);
    expect(result.defaultEnabled.has(urls[0].id)).toBe(false);
  });

  it('detects anchored names including uncommon ones', () => {
    const names = byCategory('person_name').map((d) => d.raw);
    expect(names).toContain('Chukwuemeka');
    expect(names.some((n) => n.includes('Adaeze'))).toBe(true);
  });

  it('produces non-overlapping detections in order', () => {
    for (let i = 1; i < result.detections.length; i++) {
      expect(result.detections[i].start).toBeGreaterThanOrEqual(result.detections[i - 1].end);
    }
  });

  it('segments reassemble to the original text', () => {
    expect(result.segments.map((s) => s.text).join('')).toBe(result.original);
  });
});

describe('applyRedactions', () => {
  it('replaces enabled detections with labels and leaves the URL', () => {
    const result = detectPii(SCAM);
    const redacted = applyRedactions(result.original, result.detections, result.defaultEnabled);
    expect(redacted).not.toContain('12345678901');
    expect(redacted).not.toContain('hr.recruit@gmail.com');
    expect(redacted).not.toContain('4111 1111 1111 1111');
    expect(redacted).toContain('https://mtn.jobs-portal.xyz/go');
    expect(redacted).toContain('[ID_NUMBER_1]');
  });

  it('leaves disabled detections in place', () => {
    const result = detectPii('Reach me at test@example.com');
    const redacted = applyRedactions(result.original, result.detections, new Set());
    expect(redacted).toBe('Reach me at test@example.com');
  });
});

describe('user-supplied names', () => {
  it('redacts every occurrence case-insensitively', () => {
    const text = 'hello ahmed, please tell AHMED his slot is ready.';
    const result = detectPii(text, { userNames: ['Ahmed'] });
    const names = result.detections.filter((d) => d.category === 'person_name');
    expect(names).toHaveLength(2);
    const redacted = applyRedactions(text, result.detections, result.defaultEnabled);
    expect(redacted.toLowerCase()).not.toContain('ahmed');
  });
});

describe('addUserDetection', () => {
  it('adds a manual redaction over plain text', () => {
    const result = detectPii('Contact Bola at the office.');
    const start = result.original.indexOf('Bola');
    const updated = addUserDetection(result, start, start + 4);
    expect(updated.detections.some((d) => d.raw === 'Bola')).toBe(true);
  });
});

describe('containsHighConfidencePii', () => {
  it('is true for raw text with PII', () => {
    expect(containsHighConfidencePii('my email is a@b.com')).toBe(true);
  });

  it('is false once text is redacted', () => {
    const result = detectPii(SCAM);
    const redacted = applyRedactions(result.original, result.detections, result.defaultEnabled);
    expect(containsHighConfidencePii(redacted)).toBe(false);
  });
});
