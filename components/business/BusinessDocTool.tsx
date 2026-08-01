'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  CURRENCIES,
  DOC_KIND_COPY,
  computeTotals,
  formatMinor,
  parseMoneyToMinor,
  type BusinessDocKind,
  type CurrencyCode,
} from '@/lib/docs/business';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';
import { NigerianGuide } from '@/components/NigerianGuide';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const PROFILE_KEY = 'eazitool_business_profile';

interface ItemRow {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface Profile {
  name: string;
  address: string;
  phone: string;
  email: string;
  bankDetails: string;
}

let nextItemId = 1;
const makeItem = (): ItemRow => ({ id: nextItemId++, description: '', quantity: '1', unitPrice: '' });

function loadProfile(): Profile {
  if (typeof window === 'undefined') return { name: '', address: '', phone: '', email: '', bankDetails: '' };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { name: '', address: '', phone: '', email: '', bankDetails: '', ...JSON.parse(raw) };
  } catch {}
  return { name: '', address: '', phone: '', email: '', bankDetails: '' };
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-amber-400 focus:bg-white focus:outline-none';

export function BusinessDocTool({ kind }: { kind: BusinessDocKind }) {
  const copy = DOC_KIND_COPY[kind];
  const today = new Date().toISOString().slice(0, 10);

  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [docNumber, setDocNumber] = useState(
    `${kind === 'invoice' ? 'INV' : kind === 'receipt' ? 'RCP' : 'QUO'}-${String(Date.now()).slice(-6)}`,
  );
  const [date, setDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('NGN');
  const [taxRate, setTaxRate] = useState('0');
  const [items, setItems] = useState<ItemRow[]>(() => [makeItem()]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  function updateProfile(patch: Partial<Profile>) {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function updateItem(id: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    clearResult();
  }

  const parsedItems = items
    .filter((item) => item.description.trim() || item.unitPrice.trim())
    .map((item) => ({
      description: item.description.trim(),
      quantity: Math.max(0, Number.parseFloat(item.quantity) || 0),
      unitPriceMinor: parseMoneyToMinor(item.unitPrice),
    }));

  const taxRatePct = Math.max(0, Math.min(100, Number.parseFloat(taxRate) || 0));
  const totals = computeTotals({ items: parsedItems, taxRatePct });

  async function exportPdf() {
    if (parsedItems.length === 0) {
      setError('Add at least one item with a description and price.');
      return;
    }
    setLoading(true);
    setError('');
    clearResult();

    try {
      const { renderBusinessPdf } = await import('@/lib/docs/render-business');
      const bytes = await renderBusinessPdf({
        kind,
        number: docNumber,
        date,
        dueDate: dueDate || undefined,
        from: {
          name: profile.name,
          addressLines: profile.address.split('\n').filter(Boolean),
          phone: profile.phone || undefined,
          email: profile.email || undefined,
        },
        to: {
          name: clientName,
          addressLines: clientAddress.split('\n').filter(Boolean),
          phone: clientPhone || undefined,
        },
        items: parsedItems,
        currency,
        taxRatePct,
        notes: notes || undefined,
        bankDetails: kind === 'quotation' ? undefined : profile.bankDetails || undefined,
      });
      setResultFromBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `${docNumber}.pdf`);
      promptReview(`${kind}-generator`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate the PDF.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold capitalize text-slate-800">{kind} Generator</h1>
              <p className="text-sm text-slate-500">
                Your details are saved on this device only, so the next {kind} starts pre-filled.
              </p>
            </div>
          </div>

          {kind === 'invoice' && (
            <NigerianGuide
              title="Quick guide for Nigerian businesses"
              english="Use this to send a clear record of what you sold, the amount due and how the customer can pay. It is a general PDF invoice, not a FIRS-certified e-invoice or tax filing service."
              pidgin="Use am to show wetin you sell, how much customer suppose pay and where dem fit pay. Na normal PDF invoice be this; e no be FIRS-certified e-invoice or tax filing service."
            />
          )}

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">Your Business</h2>
                <div className="space-y-2.5">
                  <input type="text" name="business-name" placeholder="Business name" aria-label="Business name"
                    value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} className={inputClass} />
                  <textarea name="business-address" placeholder="Address (one line per row)" aria-label="Business address" rows={2}
                    value={profile.address} onChange={(e) => updateProfile({ address: e.target.value })} className={inputClass} />
                  <input type="text" name="business-phone" placeholder="Phone" aria-label="Business phone"
                    value={profile.phone} onChange={(e) => updateProfile({ phone: e.target.value })} className={inputClass} />
                  <input type="email" name="business-email" placeholder="Email" aria-label="Business email"
                    value={profile.email} onChange={(e) => updateProfile({ email: e.target.value })} className={inputClass} />
                  {kind !== 'quotation' && (
                    <textarea name="bank-details" placeholder={'Bank details for payment\ne.g. GTBank — 0123456789 — Ada Ventures'}
                      aria-label="Bank details" rows={2}
                      value={profile.bankDetails} onChange={(e) => updateProfile({ bankDetails: e.target.value })} className={inputClass} />
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">{copy.partyLabel}</h2>
                <div className="space-y-2.5">
                  <input type="text" name="client-name" placeholder="Customer / client name" aria-label="Client name"
                    value={clientName} onChange={(e) => { setClientName(e.target.value); clearResult(); }} className={inputClass} />
                  <textarea name="client-address" placeholder="Customer address (optional)" aria-label="Client address" rows={2}
                    value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className={inputClass} />
                  <input type="text" name="client-phone" placeholder="Customer phone (optional)" aria-label="Client phone"
                    value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={inputClass} />
                  <div className="grid grid-cols-2 gap-2.5">
                    <input type="text" name="doc-number" aria-label={copy.numberLabel}
                      value={docNumber} onChange={(e) => setDocNumber(e.target.value)} className={inputClass} />
                    <input type="date" name="doc-date" aria-label="Date"
                      value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                  </div>
                  {kind !== 'receipt' && (
                    <div>
                      <label htmlFor="due-date" className="mb-1 block text-xs text-slate-500">
                        {kind === 'invoice' ? 'Due date (optional)' : 'Valid until (optional)'}
                      </label>
                      <input id="due-date" type="date" name="due-date"
                        value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Items</h2>
                <div className="flex items-center gap-2">
                  <select name="currency" aria-label="Currency" value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700">
                    {Object.entries(CURRENCIES).map(([code, meta]) => (
                      <option key={code} value={code}>{code} ({meta.symbol})</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    Tax %
                    <input type="number" name="tax-rate" min={0} max={100} step={0.5} value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)} aria-label="Tax rate percent"
                      className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700" />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input type="text" name={`item-desc-${item.id}`} placeholder={`Item ${index + 1} description`}
                      aria-label={`Item ${index + 1} description`} value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                      className={`${inputClass} min-w-0 flex-1`} />
                    <input type="number" name={`item-qty-${item.id}`} min={0} placeholder="Qty"
                      aria-label={`Item ${index + 1} quantity`} value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                      className={`${inputClass} w-16`} />
                    <input type="text" inputMode="decimal" name={`item-price-${item.id}`} placeholder="Unit price"
                      aria-label={`Item ${index + 1} unit price`} value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })}
                      className={`${inputClass} w-28`} />
                    <button type="button" onClick={() => setItems((prev) => prev.filter((r) => r.id !== item.id))}
                      disabled={items.length <= 1} aria-label={`Remove item ${index + 1}`}
                      className="rounded-lg p-2 text-slate-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setItems((prev) => [...prev, makeItem()])}
                className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-600 transition-colors hover:bg-amber-100">
                + Add Item
              </button>

              <dl className="mt-5 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="font-semibold text-slate-800">{formatMinor(totals.subtotalMinor, currency)}</dd>
                </div>
                {taxRatePct > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Tax ({taxRatePct}%)</dt>
                    <dd className="font-semibold text-slate-800">{formatMinor(totals.taxMinor, currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-base">
                  <dt className="font-bold text-slate-800">Total</dt>
                  <dd className="font-bold text-amber-600">{formatMinor(totals.totalMinor, currency)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label htmlFor="doc-notes" className="mb-2 block text-sm font-bold uppercase tracking-widest text-slate-700">
                Notes (optional)
              </label>
              <textarea id="doc-notes" name="doc-notes" rows={2} value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={kind === 'quotation' ? 'e.g. Prices valid for 14 days.' : 'e.g. Thank you for your business.'}
                className={inputClass} />
            </div>

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && (
              <SuccessBanner title={`Your ${kind} is ready.`}>
                <a href={result.url} download={result.name}
                  className="mt-2 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download {result.name}
                </a>
              </SuccessBanner>
            )}

            {loading && <LoadingBanner messages={['Laying out your document...']} />}

            <button type="button" onClick={exportPdf} disabled={loading}
              className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-100 transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Generating...' : `Download ${copy.title.charAt(0) + copy.title.slice(1).toLowerCase()} PDF`}
            </button>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
