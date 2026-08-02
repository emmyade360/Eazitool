'use client';

import { useState } from 'react';
import { matchCvToAdvert, type MatchReport } from '@/lib/career/job-match';
import { ErrorBanner, LoadingBanner } from '@/components/tool-ui/ToolStatus';
import { NigerianGuide } from '@/components/NigerianGuide';

interface AiSections {
  summary: string;
  bullets: string;
  letter: string;
  questions: string;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-800 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none';

export default function CvTailorPage() {
  const [cvText, setCvText] = useState('');
  const [advert, setAdvert] = useState('');
  const [report, setReport] = useState<MatchReport | null>(null);
  const [aiSections, setAiSections] = useState<AiSections | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');

  async function extractCvFromPdf(file: File) {
    setExtracting(true);
    setError('');
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.mjs';
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const parts: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        parts.push(
          content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' '),
        );
      }
      await doc.destroy();
      const text = parts.join('\n').replace(/\s+/g, ' ').trim();
      if (text.length < 100) {
        setError('Could not read text from this PDF — it may be a scan. Paste your CV text instead.');
      } else {
        setCvText(text);
      }
    } catch {
      setError('Could not read this PDF. Paste your CV text instead.');
    } finally {
      setExtracting(false);
    }
  }

  function analyse() {
    if (cvText.trim().length < 100 || advert.trim().length < 50) {
      setError('Paste both your CV text and the full job advert first.');
      return;
    }
    setError('');
    setAiSections(null);
    setAiUnavailable(false);
    setReport(matchCvToAdvert(cvText, advert));
  }

  async function tailorWithAi() {
    if (!report) return;
    setAiLoading(true);
    setAiUnavailable(false);
    try {
      const res = await fetch('/api/cv/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ cvText, advert, missingKeywords: report.missing }),
      });
      const payload = await res.json();
      if (res.ok && payload.ok && payload.source === 'ai') {
        setAiSections(payload.sections);
      } else {
        setAiUnavailable(true);
      }
    } catch {
      setAiUnavailable(true);
    } finally {
      setAiLoading(false);
    }
  }

  const coveragePct = report ? Math.round(report.coverage * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">CV Tailor</h1>
            <p className="text-sm text-slate-500">
              See what a specific advert wants that your CV doesn&apos;t show — then fix it.
            </p>
          </div>
        </div>

        <NigerianGuide
          title="Why tailoring matters"
          english="Recruiters and ATS software compare your CV against each advert. One generic CV for 20 applications is the main reason strong candidates never hear back."
          pidgin="Recruiter dey compare your CV with the advert. If you dey send the same CV everywhere, na why dem no dey reply you."
        />

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="cv-text" className="text-sm font-bold uppercase tracking-widest text-slate-700">
                Your CV
              </label>
              <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700">
                {extracting ? 'Reading PDF...' : 'Upload CV PDF instead'}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) extractCvFromPdf(file);
                    event.target.value = '';
                  }}
                />
              </label>
            </div>
            <textarea id="cv-text" name="cv-text" rows={7} value={cvText}
              onChange={(event) => setCvText(event.target.value)}
              placeholder="Paste the full text of your CV here..."
              className={inputClass} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label htmlFor="advert-text" className="mb-2 block text-sm font-bold uppercase tracking-widest text-slate-700">
              The job advert
            </label>
            <textarea id="advert-text" name="advert-text" rows={7} value={advert}
              onChange={(event) => setAdvert(event.target.value)}
              placeholder="Paste the full job advert, including requirements and responsibilities..."
              className={inputClass} />
          </div>

          <ErrorBanner message={error} onDismiss={() => setError('')} />

          <button type="button" onClick={analyse}
            disabled={!cvText.trim() || !advert.trim() || extracting}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            Compare CV Against Advert
          </button>

          {report && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                    Keyword coverage
                  </h2>
                  <span className={`text-2xl font-bold ${coveragePct >= 70 ? 'text-green-600' : coveragePct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                    {coveragePct}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${coveragePct >= 70 ? 'bg-green-500' : coveragePct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(4, coveragePct)}%` }}
                  />
                </div>

                {report.missing.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-red-500">
                      Missing from your CV ({report.missing.length})
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {report.missing.map((term) => (
                        <span key={term} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-inset ring-red-100">
                          {term}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Work the terms you genuinely have experience with into your CV wording — never
                      claim skills you don&apos;t have.
                    </p>
                  </div>
                )}

                {report.matched.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-green-600">
                      Already covered ({report.matched.length})
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {report.matched.map((term) => (
                        <span key={term} className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-100">
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!aiSections && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                    Tailor it with AI
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Get a rewritten summary, bullet suggestions based only on your real experience,
                    a matching application letter, and likely interview questions. Needs internet.
                  </p>
                  {aiUnavailable && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      AI tailoring is not available right now — the keyword analysis above still
                      shows you exactly what to work into your CV.
                    </p>
                  )}
                  <button type="button" onClick={tailorWithAi} disabled={aiLoading}
                    className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50">
                    {aiLoading ? 'Tailoring...' : 'Tailor My CV to This Advert'}
                  </button>
                </div>
              )}

              {aiLoading && <LoadingBanner messages={['Rewriting your summary...', 'Aligning bullets to the advert...', 'Drafting your letter...']} />}

              {aiSections && (
                <div className="space-y-4">
                  {(
                    [
                      ['Tailored professional summary', aiSections.summary],
                      ['Bullet point suggestions', aiSections.bullets],
                      ['Application letter draft', aiSections.letter],
                      ['Likely interview questions', aiSections.questions],
                    ] as const
                  )
                    .filter(([, content]) => content)
                    .map(([title, content]) => (
                      <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">{title}</h2>
                          <button type="button"
                            onClick={() => navigator.clipboard?.writeText(content)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                            Copy
                          </button>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{content}</p>
                      </div>
                    ))}
                  <p className="px-1 text-xs leading-5 text-slate-400">
                    Review every suggestion before using it — only keep claims that are true of your
                    actual experience.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
