'use client';

import { useState } from 'react';
import { computeNetSalary } from '@/lib/career/paye';

const copy = {
  title: 'Nigerian Salary Calculator',
  subtitle: 'Take-home pay under the 2026 PAYE bands (Nigeria Tax Act 2025).',
  grossLabel: 'Gross Salary',
  monthly: 'Monthly',
  annual: 'Annual',
  pensionLabel: 'Pension contribution (8% default)',
  nhfLabel: 'NHF contribution (2.5%)',
  rentLabel: 'Annual rent (for rent relief)',
  disclaimer:
    'This is an estimate under the Nigeria Tax Act 2025 bands effective January 2026. Your employer or a tax professional gives the authoritative figure — allowance structure, NHIS and other reliefs can shift the result.',
} as const;

function naira(value: number): string {
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function SalaryCalculatorPage() {
  const [grossInput, setGrossInput] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [includePension, setIncludePension] = useState(true);
  const [includeNhf, setIncludeNhf] = useState(false);
  const [rentInput, setRentInput] = useState('');

  const grossRaw = Number.parseFloat(grossInput.replace(/,/g, ''));
  const grossAnnual = Number.isFinite(grossRaw) && grossRaw > 0
    ? period === 'monthly' ? grossRaw * 12 : grossRaw
    : 0;
  const annualRent = Number.parseFloat(rentInput.replace(/,/g, '')) || 0;

  const result = grossAnnual > 0
    ? computeNetSalary({
        grossAnnual,
        pensionAnnual: includePension ? grossAnnual * 0.08 : 0,
        nhfAnnual: includeNhf ? grossAnnual * 0.025 : 0,
        annualRent,
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{copy.title}</h1>
            <p className="text-sm text-slate-500">{copy.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                  {copy.grossLabel}
                </h2>
                <div className="flex gap-1">
                  {(['monthly', 'annual'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={period === option}
                      onClick={() => setPeriod(option)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        period === option
                          ? 'border-blue-200 bg-blue-50 text-blue-600'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {option === 'monthly' ? copy.monthly : copy.annual}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  ₦
                </span>
                <input
                  id="gross-salary"
                  name="gross-salary"
                  type="text"
                  inputMode="decimal"
                  value={grossInput}
                  onChange={(event) => setGrossInput(event.target.value)}
                  placeholder={period === 'monthly' ? 'e.g. 350,000' : 'e.g. 4,200,000'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-3 text-base font-semibold text-slate-800 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">
                Deductions & Relief
              </h2>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">{copy.pensionLabel}</span>
                  <input
                    type="checkbox"
                    name="include-pension"
                    checked={includePension}
                    onChange={(event) => setIncludePension(event.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">{copy.nhfLabel}</span>
                  <input
                    type="checkbox"
                    name="include-nhf"
                    checked={includeNhf}
                    onChange={(event) => setIncludeNhf(event.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
                <div>
                  <label htmlFor="annual-rent" className="mb-1.5 block text-sm text-slate-600">
                    {copy.rentLabel}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      ₦
                    </span>
                    <input
                      id="annual-rent"
                      name="annual-rent"
                      type="text"
                      inputMode="decimal"
                      value={rentInput}
                      onChange={(event) => setRentInput(event.target.value)}
                      placeholder="e.g. 1,200,000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-3 text-sm text-slate-800 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Relief is 20% of your annual rent, capped at ₦500,000.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              {copy.disclaimer}
            </div>
          </div>

          <div className="space-y-5">
            {result ? (
              <>
                <div className="rounded-2xl border border-blue-100 bg-blue-600 p-6 text-white shadow-lg shadow-blue-100">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                    Monthly Take-Home
                  </p>
                  <p className="mt-1 text-3xl font-bold">{naira(result.netMonthly)}</p>
                  <p className="mt-2 text-sm text-blue-100">
                    {naira(result.netAnnual)} per year · effective tax{' '}
                    {(result.effectiveRate * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">
                    Annual Breakdown
                  </h2>
                  <dl className="space-y-2 text-sm">
                    {[
                      ['Gross income', result.grossAnnual],
                      ['Pension', -result.pensionAnnual],
                      ['NHF', -result.nhfAnnual],
                      ['Rent relief', -result.rentRelief],
                      ['Taxable income', result.taxableAnnual],
                      ['PAYE tax', -result.payeAnnual],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex justify-between">
                        <dt className="text-slate-500">{label}</dt>
                        <dd
                          className={`font-semibold ${
                            (value as number) < 0 ? 'text-red-500' : 'text-slate-800'
                          }`}
                        >
                          {(value as number) < 0 ? `− ${naira(-(value as number))}` : naira(value as number)}
                        </dd>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <dt className="font-bold text-slate-700">Net income</dt>
                      <dd className="font-bold text-green-600">{naira(result.netAnnual)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">
                    Tax Bands Applied
                  </h2>
                  <div className="space-y-1.5 text-sm">
                    {result.bands.map((band, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-slate-500">
                          {(band.rate * 100).toFixed(0)}% on {naira(band.amount)}
                        </span>
                        <span className="font-semibold text-slate-800">{naira(band.tax)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm text-slate-300">
                  Enter your gross salary to see your take-home pay.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
