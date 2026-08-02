'use client';

import { useMemo, useState } from 'react';
import { SOP_FIELDS, buildSopDraft, wordCount, type SopAnswers } from '@/lib/career/sop';
import { ErrorBanner, LoadingBanner } from '@/components/tool-ui/ToolStatus';
import { NigerianGuide } from '@/components/NigerianGuide';

const EMPTY: SopAnswers = {
  fullName: '', programme: '', university: '', country: '', degree: '', institution: '',
  grade: '', motivation: '', experience: '', whyProgramme: '', careerGoal: '', contribution: '',
};

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-800 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none';

export default function SopWriterPage() {
  const [answers, setAnswers] = useState<SopAnswers>(EMPTY);
  const [showDraft, setShowDraft] = useState(false);
  const [edited, setEdited] = useState('');
  const [polished, setPolished] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [error, setError] = useState('');

  const draft = useMemo(() => buildSopDraft(answers), [answers]);
  const activeText = polished || edited || draft;

  function generate() {
    const missing = SOP_FIELDS.filter((f) => f.required && !answers[f.key].trim());
    if (missing.length > 0) {
      setError(`Please answer: ${missing.map((f) => f.label).join(', ')}.`);
      return;
    }
    setError('');
    setEdited(buildSopDraft(answers));
    setPolished('');
    setAiUnavailable(false);
    setShowDraft(true);
  }

  async function polish() {
    setLoading(true);
    setAiUnavailable(false);
    try {
      const res = await fetch('/api/career/polish-sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ draft: edited || draft, programme: answers.programme }),
      });
      const payload = await res.json();
      if (res.ok && payload.ok && payload.source === 'ai') setPolished(payload.polished);
      else setAiUnavailable(true);
    } catch {
      setAiUnavailable(true);
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const blob = new Blob([activeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'statement-of-purpose.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">SOP / Personal Statement Writer</h1>
            <p className="text-sm text-slate-500">Answer the questions — the structure is handled for you.</p>
          </div>
        </div>

        <NigerianGuide
          title="What admissions officers actually look for"
          english="Specifics. Naming the exact modules, research groups or lecturers that drew you to the programme is what separates an accepted statement from a generic one."
          pidgin="Na correct details dey work. Mention the exact course, research group or lecturer wey make you choose the school — generic story no dey impress dem."
        />

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">
              Your details
            </h2>
            <div className="space-y-3">
              {SOP_FIELDS.map((field) => (
                <div key={field.key}>
                  <label htmlFor={`sop-${field.key}`} className="mb-1 block text-xs font-medium text-slate-500">
                    {field.label}
                    {field.required && <span className="text-rose-400"> *</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea id={`sop-${field.key}`} name={field.key} rows={3}
                      value={answers[field.key]} placeholder={field.placeholder}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className={inputClass} />
                  ) : (
                    <input id={`sop-${field.key}`} name={field.key} type="text"
                      value={answers[field.key]} placeholder={field.placeholder}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className={inputClass} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <ErrorBanner message={error} onDismiss={() => setError('')} />

          <button type="button" onClick={generate}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700">
            Build My Statement Draft
          </button>

          {showDraft && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                    {polished ? 'Polished statement' : 'Your draft'}
                  </h2>
                  <span className="text-xs text-slate-400">{wordCount(activeText)} words</span>
                </div>
                <textarea
                  aria-label="Statement of purpose"
                  name="sop-draft"
                  rows={16}
                  value={activeText}
                  onChange={(e) => { if (polished) setPolished(e.target.value); else setEdited(e.target.value); }}
                  className={`${inputClass} leading-7`}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => navigator.clipboard?.writeText(activeText)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">
                    Copy
                  </button>
                  <button type="button" onClick={download}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">
                    Download as text
                  </button>
                  {polished && (
                    <button type="button" onClick={() => setPolished('')}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">
                      Back to my draft
                    </button>
                  )}
                </div>
              </div>

              {!polished && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                    Polish the language with AI
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Tightens flow and tone without changing your facts. Needs internet.
                  </p>
                  {aiUnavailable && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Polishing is unavailable right now — your structured draft above is complete
                      and ready to edit by hand.
                    </p>
                  )}
                  <button type="button" onClick={polish} disabled={loading}
                    className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50">
                    {loading ? 'Polishing...' : 'Polish My Statement'}
                  </button>
                </div>
              )}

              {loading && <LoadingBanner messages={['Tightening your statement...']} />}

              <p className="px-1 text-xs leading-5 text-slate-400">
                Edit this into your own voice before submitting. Universities expect a personal
                statement written by you — submitting unedited AI text is both detectable and
                against many admissions policies.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
