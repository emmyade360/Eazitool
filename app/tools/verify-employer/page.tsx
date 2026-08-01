'use client';

import { useState } from 'react';
import { checkDomain, type DomainCheck } from '@/lib/safety/domain-check';
import { VerdictCard } from '@/components/safety/VerdictCard';

const VERIFY_STEPS = [
  'Search the company name in a search engine and find its website yourself — never rely on the link in the message.',
  'Compare the domain in the message with the official one, reading from the right: the true owner is the last two or three parts of the address.',
  'Look for the job on the company’s own careers page. If it is not listed there, ask the company directly through contacts from the official site.',
  'Search the company name together with the word "scam" and check recent results.',
  'For Nigerian companies, confirm registration on the CAC public search portal.',
];

export default function VerifyEmployerPage() {
  const [input, setInput] = useState('');
  const [report, setReport] = useState<DomainCheck | null>(null);

  function run() {
    if (!input.trim()) return;
    setReport(checkDomain(input));
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Employer Website Checker</h1>
            <p className="text-sm text-slate-500">
              A pattern check on the address itself — not a live safety database.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label htmlFor="check-url" className="mb-2 block text-sm font-bold uppercase tracking-widest text-slate-700">
              Paste the link or domain
            </label>
            <div className="flex gap-2">
              <input
                id="check-url"
                name="check-url"
                type="text"
                inputMode="url"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') run();
                }}
                placeholder="e.g. https://mtn.jobs-portal.xyz/apply"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 transition-colors focus:border-rose-300 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={run}
                disabled={!input.trim()}
                className="rounded-xl bg-rose-600 px-5 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                Check
              </button>
            </div>
          </div>

          {report && (
            <>
              {report.hostname && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">
                    How this address reads
                  </h2>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Full address</dt>
                      <dd className="break-all text-right font-mono text-xs text-slate-800">{report.hostname}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Actually owned by</dt>
                      <dd className="font-mono text-xs font-bold text-slate-900">
                        {report.registrableDomain ?? 'unknown'}
                      </dd>
                    </div>
                    {report.brandMatch && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">{report.brandMatch.brand} official domain</dt>
                        <dd className="font-mono text-xs text-slate-800">
                          {report.brandMatch.officialDomains[0]}
                          {report.brandMatch.kind === 'official' && (
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              MATCHES
                            </span>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              <VerdictCard verdict={report.verdict} />

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">
                  Verify it yourself
                </h2>
                <ol className="space-y-3">
                  {VERIFY_STEPS.map((step, index) => (
                    <li key={index} className="flex gap-3 text-sm leading-6 text-slate-600">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-400">
                  This tool checks patterns in the address only. A clean result does not guarantee a
                  site is genuine, and a warning does not prove it is fake — if a result looks wrong,
                  use the Report an Issue option in the menu.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
