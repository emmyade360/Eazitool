import { describe, expect, it } from 'vitest';
import { computeTotals, formatMinor, lineTotalMinor, parseMoneyToMinor } from './business';

describe('money arithmetic (integer minor units)', () => {
  it('computes line totals without float drift', () => {
    expect(lineTotalMinor({ description: '', quantity: 3, unitPriceMinor: 12_345 })).toBe(37_035);
  });

  it('computes subtotal, 7.5% VAT and total', () => {
    const totals = computeTotals({
      items: [
        { description: 'Design work', quantity: 2, unitPriceMinor: 5_000_000 }, // ₦50,000 each
        { description: 'Hosting', quantity: 1, unitPriceMinor: 1_500_000 },
      ],
      taxRatePct: 7.5,
    });
    expect(totals.subtotalMinor).toBe(11_500_000);
    expect(totals.taxMinor).toBe(862_500);
    expect(totals.totalMinor).toBe(12_362_500);
  });

  it('handles zero tax', () => {
    const totals = computeTotals({
      items: [{ description: 'x', quantity: 1, unitPriceMinor: 100 }],
      taxRatePct: 0,
    });
    expect(totals.taxMinor).toBe(0);
    expect(totals.totalMinor).toBe(100);
  });

  it('rounds tax to the nearest minor unit', () => {
    const totals = computeTotals({
      items: [{ description: 'x', quantity: 1, unitPriceMinor: 101 }],
      taxRatePct: 7.5,
    });
    expect(totals.taxMinor).toBe(8); // 7.575 → 8
  });
});

describe('parseMoneyToMinor', () => {
  it('parses formatted amounts', () => {
    expect(parseMoneyToMinor('1,500.50')).toBe(150_050);
    expect(parseMoneyToMinor('₦2,000')).toBe(200_000);
    expect(parseMoneyToMinor('0.01')).toBe(1);
  });

  it('returns 0 for junk or negatives', () => {
    expect(parseMoneyToMinor('abc')).toBe(0);
    expect(parseMoneyToMinor('')).toBe(0);
  });
});

describe('formatMinor', () => {
  it('formats naira with two decimals', () => {
    expect(formatMinor(12_362_500, 'NGN')).toBe('₦123,625.00');
  });
});
