/**
 * Nigerian personal income tax (PAYE) under the Nigeria Tax Act 2025,
 * effective 1 January 2026.
 *
 * Key changes from the old regime: the consolidated relief allowance is gone,
 * the first ₦800,000 of taxable income is tax-free, and a rent relief of 20%
 * of annual rent (capped at ₦500,000) replaces it. All figures are annual naira.
 *
 * This is an estimate for planning, not tax advice — allowance structure and
 * additional reliefs (NHIS, life insurance) can shift the real figure.
 */

export interface TaxBand {
  /** Upper bound of the band as cumulative annual taxable income. */
  upTo: number;
  rate: number;
}

export const PAYE_BANDS_2026: TaxBand[] = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
];

export const RENT_RELIEF_RATE = 0.2;
export const RENT_RELIEF_CAP = 500_000;

export interface BandBreakdown {
  rate: number;
  /** Portion of taxable income that fell in this band. */
  amount: number;
  tax: number;
}

export interface PayeResult {
  total: number;
  bands: BandBreakdown[];
}

export function computeRentRelief(annualRent: number): number {
  if (!Number.isFinite(annualRent) || annualRent <= 0) return 0;
  return Math.min(annualRent * RENT_RELIEF_RATE, RENT_RELIEF_CAP);
}

export function computeAnnualPaye(taxableIncome: number): PayeResult {
  const taxable = Math.max(0, taxableIncome);
  const bands: BandBreakdown[] = [];
  let total = 0;
  let lowerBound = 0;

  for (const band of PAYE_BANDS_2026) {
    if (taxable <= lowerBound) break;
    const amount = Math.min(taxable, band.upTo) - lowerBound;
    const tax = amount * band.rate;
    bands.push({ rate: band.rate, amount, tax });
    total += tax;
    lowerBound = band.upTo;
  }

  return { total, bands };
}

export interface SalaryInput {
  grossAnnual: number;
  /** Annual employee pension contribution (statutory default is 8%). */
  pensionAnnual: number;
  /** Annual NHF contribution (2.5% of basic, where applicable). */
  nhfAnnual: number;
  /** Annual rent paid, used for the rent relief. */
  annualRent: number;
}

export interface SalaryResult {
  grossAnnual: number;
  pensionAnnual: number;
  nhfAnnual: number;
  rentRelief: number;
  taxableAnnual: number;
  payeAnnual: number;
  netAnnual: number;
  netMonthly: number;
  /** PAYE as a share of gross (0 when gross is 0). */
  effectiveRate: number;
  bands: BandBreakdown[];
}

export function computeNetSalary(input: SalaryInput): SalaryResult {
  const gross = Math.max(0, input.grossAnnual);
  const pension = Math.min(Math.max(0, input.pensionAnnual), gross);
  const nhf = Math.min(Math.max(0, input.nhfAnnual), gross - pension);
  const rentRelief = computeRentRelief(input.annualRent);

  const taxableAnnual = Math.max(0, gross - pension - nhf - rentRelief);
  const paye = computeAnnualPaye(taxableAnnual);
  const netAnnual = gross - pension - nhf - paye.total;

  return {
    grossAnnual: gross,
    pensionAnnual: pension,
    nhfAnnual: nhf,
    rentRelief,
    taxableAnnual,
    payeAnnual: paye.total,
    netAnnual,
    netMonthly: netAnnual / 12,
    effectiveRate: gross > 0 ? paye.total / gross : 0,
    bands: paye.bands,
  };
}
