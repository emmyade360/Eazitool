import { describe, expect, it } from 'vitest';
import {
  computeAnnualPaye,
  computeNetSalary,
  computeRentRelief,
} from './paye';

describe('computeRentRelief', () => {
  it('grants 20% of annual rent', () => {
    expect(computeRentRelief(1_200_000)).toBe(240_000);
  });

  it('caps relief at 500,000', () => {
    expect(computeRentRelief(10_000_000)).toBe(500_000);
  });

  it('returns 0 for no rent or invalid input', () => {
    expect(computeRentRelief(0)).toBe(0);
    expect(computeRentRelief(-5)).toBe(0);
    expect(computeRentRelief(NaN)).toBe(0);
  });
});

describe('computeAnnualPaye (2026 bands)', () => {
  it('charges nothing on the first 800,000', () => {
    expect(computeAnnualPaye(700_000).total).toBe(0);
    expect(computeAnnualPaye(800_000).total).toBe(0);
  });

  it('computes tax at the 3,000,000 boundary', () => {
    // 0 on 800k + 15% of 2.2m = 330,000
    expect(computeAnnualPaye(3_000_000).total).toBe(330_000);
  });

  it('computes tax on 15,000,000 across four bands', () => {
    // 0 + 330,000 + 18%×9m (1,620,000) + 21%×3m (630,000) = 2,580,000
    const result = computeAnnualPaye(15_000_000);
    expect(result.total).toBe(2_580_000);
    expect(result.bands).toHaveLength(4);
  });

  it('computes tax on 60,000,000 across all six bands', () => {
    // 0 + 330k + 1.62m + 21%×13m (2.73m) + 23%×25m (5.75m) + 25%×10m (2.5m)
    expect(computeAnnualPaye(60_000_000).total).toBe(12_930_000);
  });

  it('treats negative taxable income as zero', () => {
    expect(computeAnnualPaye(-100).total).toBe(0);
  });
});

describe('computeNetSalary', () => {
  it('applies pension, NHF and rent relief before tax', () => {
    // gross 5m, pension 400k, rent 1.2m → relief 240k → taxable 4.36m
    // PAYE = 330,000 + 18% × 1,360,000 = 574,800
    const result = computeNetSalary({
      grossAnnual: 5_000_000,
      pensionAnnual: 400_000,
      nhfAnnual: 0,
      annualRent: 1_200_000,
    });

    expect(result.taxableAnnual).toBe(4_360_000);
    expect(result.payeAnnual).toBe(574_800);
    expect(result.netAnnual).toBe(5_000_000 - 400_000 - 574_800);
    expect(result.netMonthly).toBeCloseTo(result.netAnnual / 12, 6);
  });

  it('leaves a minimum-wage-level income untaxed', () => {
    const result = computeNetSalary({
      grossAnnual: 780_000,
      pensionAnnual: 0,
      nhfAnnual: 0,
      annualRent: 0,
    });
    expect(result.payeAnnual).toBe(0);
    expect(result.netAnnual).toBe(780_000);
  });

  it('never lets deductions exceed gross', () => {
    const result = computeNetSalary({
      grossAnnual: 1_000_000,
      pensionAnnual: 2_000_000,
      nhfAnnual: 500_000,
      annualRent: 0,
    });
    expect(result.pensionAnnual).toBe(1_000_000);
    expect(result.nhfAnnual).toBe(0);
    expect(result.taxableAnnual).toBe(0);
  });

  it('reports effective rate as a share of gross', () => {
    const result = computeNetSalary({
      grossAnnual: 3_000_000,
      pensionAnnual: 0,
      nhfAnnual: 0,
      annualRent: 0,
    });
    expect(result.effectiveRate).toBeCloseTo(330_000 / 3_000_000, 10);
  });
});
