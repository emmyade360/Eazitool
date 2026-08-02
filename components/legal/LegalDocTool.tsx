'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { LegalTemplate } from '@/lib/docs/legal-templates';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-violet-400 focus:bg-white focus:outline-none';

interface LegalDocToolProps {
  toolId: string;
  title: string;
  subtitle: string;
  templates: LegalTemplate[];
  disclaimer: string;
}

export function LegalDocTool({ toolId, title, subtitle, templates, disclaimer }: LegalDocToolProps) {
  const [templateId, setTemplateId] = useState(templates[0].id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  const template = templates.find((t) => t.id === templateId) ?? templates[0];

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearResult();
  }

  async function exportPdf() {
    const missing = template.fields.filter((f) => f.required && !values[f.key]?.trim());
    if (missing.length > 0) {
      setError(`Fill in: ${missing.map((f) => f.label).join(', ')}.`);
      return;
    }
    setLoading(true);
    setError('');
    clearResult();
    try {
      const { renderLegalPdf } = await import('@/lib/docs/legal-templates');
      const bytes = await renderLegalPdf(template.build(values));
      setResultFromBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `${template.id}.pdf`);
      promptReview(toolId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate the document.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>

          <div className="space-y-5">
            {templates.length > 1 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">
                  Document type
                </h2>
                <div className="space-y-1.5">
                  {templates.map((option) => (
                    <button key={option.id} type="button"
                      onClick={() => { setTemplateId(option.id); clearResult(); setError(''); }}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        templateId === option.id
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}>
                      <p className="text-sm font-bold text-slate-800">{option.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">
                {template.label} details
              </h2>
              <div className="space-y-3">
                {template.fields.map((field) => (
                  <div key={field.key}>
                    <label htmlFor={`legal-${field.key}`} className="mb-1 block text-xs font-medium text-slate-500">
                      {field.label}
                      {field.required && <span className="text-rose-400"> *</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea id={`legal-${field.key}`} name={field.key} rows={3}
                        value={values[field.key] ?? ''} placeholder={field.placeholder}
                        onChange={(e) => setValue(field.key, e.target.value)} className={inputClass} />
                    ) : (
                      <input id={`legal-${field.key}`} name={field.key}
                        type={field.type === 'number' ? 'number' : field.type}
                        value={values[field.key] ?? ''} placeholder={field.placeholder}
                        onChange={(e) => setValue(field.key, e.target.value)} className={inputClass} />
                    )}
                    {field.hint && <p className="mt-1 text-[11px] text-slate-400">{field.hint}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
              {disclaimer}
            </div>

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && (
              <SuccessBanner title="Your document is ready.">
                <a href={result.url} download={result.name}
                  className="mt-2 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download {result.name}
                </a>
              </SuccessBanner>
            )}

            {loading && <LoadingBanner messages={['Formatting your document...']} />}

            <button type="button" onClick={exportPdf} disabled={loading}
              className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-100 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Generating...' : `Download ${template.label} PDF`}
            </button>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
