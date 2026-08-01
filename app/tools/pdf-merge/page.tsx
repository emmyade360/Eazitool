'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileDropZone } from '@/components/tool-ui/FileDropZone';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const PDF_TYPES = new Set(['application/pdf']);

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function PdfMergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  function addFiles(picked: File[]) {
    setError('');
    clearResult();
    setFiles((prev) => [...prev, ...picked].slice(0, 20));
  }

  function move(index: number, delta: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    clearResult();
  }

  function remove(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    clearResult();
  }

  async function merge() {
    if (files.length < 2) {
      setError('Add at least two PDF files to merge.');
      return;
    }
    setLoading(true);
    setError('');
    clearResult();

    try {
      const { mergePdfs } = await import('@/lib/pdf/merge');
      const inputs = await Promise.all(
        files.map(async (f) => new Uint8Array(await f.arrayBuffer())),
      );
      const merged = await mergePdfs(inputs);
      setResultFromBlob(new Blob([merged as BlobPart], { type: 'application/pdf' }), 'merged.pdf');
      promptReview('pdf-merge');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merging failed — one file may be corrupted or password-protected.');
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
                  d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.03.75.057 1.123.08 1.131.094 1.977 1.057 1.977 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">PDF Merger</h1>
              <p className="text-sm text-slate-500">
                Combine PDFs in your chosen order — files never leave your device.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <FileDropZone
              accept=".pdf"
              allowedTypes={PDF_TYPES}
              multiple
              maxFiles={20}
              title="Add PDF files"
              hint="Up to 20 PDFs — merged entirely in your browser"
              files={files}
              onFiles={addFiles}
              accent="violet"
              onReject={(reason, rejected) =>
                setError(reason === 'type' ? `"${rejected.name}" is not a PDF.` : `Too many files — the limit is 20.`)
              }
            />

            {files.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 px-2 text-sm font-bold uppercase tracking-widest text-slate-700">
                  Merge order
                </h2>
                <ul className="space-y-1.5">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <span className="w-6 text-center text-xs font-bold text-slate-400">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                        {file.name}
                      </span>
                      <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0}
                        aria-label={`Move ${file.name} up`}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                      </button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === files.length - 1}
                        aria-label={`Move ${file.name} down`}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                      <button type="button" onClick={() => remove(index)}
                        aria-label={`Remove ${file.name}`}
                        className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && (
              <SuccessBanner title="Merged PDF ready.">
                <p>{files.length} files combined{result.sizeBytes ? ` — ${formatSize(result.sizeBytes)}` : ''}.</p>
                <a href={result.url} download={result.name}
                  className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download merged.pdf
                </a>
              </SuccessBanner>
            )}

            {loading && <LoadingBanner messages={['Combining your PDFs...']} />}

            <button
              type="button"
              onClick={merge}
              disabled={files.length < 2 || loading}
              className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-100 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Merging...' : `Merge ${files.length || ''} PDFs`}
            </button>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
