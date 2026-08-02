/**
 * Shared model for invoices, receipts and quotations.
 * All money is in integer minor units (kobo/pesewas/cents) — never floats.
 */

export type BusinessDocKind = 'invoice' | 'receipt' | 'quotation';

export interface Party {
  name: string;
  addressLines: string[];
  phone?: string;
  email?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  /** Price per unit in minor units. */
  unitPriceMinor: number;
}

export interface BusinessDocument {
  kind: BusinessDocKind;
  number: string;
  date: string;
  dueDate?: string;
  from: Party;
  to: Party;
  items: LineItem[];
  currency: CurrencyCode;
  taxRatePct: number;
  notes?: string;
  bankDetails?: string;
  /** Data URL of the business logo, drawn in the document header. */
  logoDataUrl?: string;
}

export type CurrencyCode = 'NGN' | 'GHS' | 'KES' | 'ZAR' | 'USD' | 'GBP' | 'EUR';

export const CURRENCIES: Record<CurrencyCode, { symbol: string; name: string }> = {
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  USD: { symbol: '$', name: 'US Dollar' },
  GBP: { symbol: '£', name: 'British Pound' },
  EUR: { symbol: '€', name: 'Euro' },
};

export const DOC_KIND_COPY: Record<BusinessDocKind, { title: string; numberLabel: string; partyLabel: string }> = {
  invoice: { title: 'INVOICE', numberLabel: 'Invoice No.', partyLabel: 'Bill To' },
  receipt: { title: 'RECEIPT', numberLabel: 'Receipt No.', partyLabel: 'Received From' },
  quotation: { title: 'QUOTATION', numberLabel: 'Quote No.', partyLabel: 'Prepared For' },
};

export interface Totals {
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export function lineTotalMinor(item: LineItem): number {
  return Math.round(item.quantity * item.unitPriceMinor);
}

export function computeTotals(doc: Pick<BusinessDocument, 'items' | 'taxRatePct'>): Totals {
  const subtotalMinor = doc.items.reduce((sum, item) => sum + lineTotalMinor(item), 0);
  const taxMinor = Math.round((subtotalMinor * doc.taxRatePct) / 100);
  return { subtotalMinor, taxMinor, totalMinor: subtotalMinor + taxMinor };
}

export function formatMinor(minor: number, currency: CurrencyCode): string {
  const major = minor / 100;
  return `${CURRENCIES[currency].symbol}${major.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Parse a user-typed money amount ("1,500.50") into minor units. */
export function parseMoneyToMinor(input: string): number {
  const cleaned = input.replace(/[^\d.]/g, '');
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}
