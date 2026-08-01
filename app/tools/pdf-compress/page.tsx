'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileDropZone } from '@/components/tool-ui/FileDropZone';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';
import type { CompressMode } from '@/lib/pdf/compress';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const PDF_TYPES = new Set(['application/pdf']);
const TARGETS = [
  { label: 'No target', bytes: undefined },
  { label: 'Under 500KB', bytes: 500 * 1024 },
  { label: 'Under 1MB', bytes: 1024 * 1024 },
  { label: 'Under 2MB', bytes: 2 * 1024 * 1024 },
] as const;

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function PdfCompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hasText, setHasText] = useState<boolean | null>(null);
  const [mode, setMode] = useState<CompressMode>('lossless');
  const [confirmedRasterize, setConfirmedRasterize] = useState(false);
  const [targetIndex, setTargetIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState<{ before: number; after: number; textPreserved: boolean; warning?: string } | null>(null);
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  async function handleFile(picked: File) {
    setFile(picked);
    setError('');
    setOutcome(null);
    setConfirmedRasterize(false);
    setHasText(null);
    clearResult();
    try {
      const { pdfHasText } = await import('@/lib/pdf/compress');
      const textual = await pdfHasText(new Uint8Array(await picked.arrayBuffer()));
      setHasText(textual);
      // Scans rasterize for free; text documents default to the safe mode.
      setMode(textual ? 'lossless' : 'rasterize');
    } catch {
      setError('Could not read this PDF — it may be corrupted or password-protected.');
      setFile(null);
    }
  }

  const rasterizeBlocked = mode === 'rasterize' && hasText === true && !confirmedRasterize;

  async function compress() {
    if (!file || rasterizeBlocked) return;
    setLoading(true);
    setError('');
    setOutcome(null);
    clearResult();

    try {
      const { compressPdf } = await import('@/lib/pdf/compress');
      const output = await compressPdf(new Uint8Array(await file.arrayBuffer()), {
        mode,
        targetBytes: mode === 'rasterize' ? TARGETS[targetIndex].bytes : undefined,
        onProgress: (page, total) => setProgress(`Processing page ${page} of ${total}...`),
      });
      const baseName = file.name.replace(/\.pdf$/i, '');
      setResultFromBlob(new Blob([output.bytes as BlobPart], { type: 'application/pdf' }), `${baseName}_compressed.pdf`);
      setOutcome({
        before: output.inputBytes,
        after: output.outputBytes,
        textPreserved: output.textPreserved,
        warning: output.warning,
      });
      promptReview('pdf-compress');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed.');
    } finally {
      setLoading(false);
      setProgress('');
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
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">PDF Compressor</h1>
              <p className="text-sm text-slate-500">
                Shrink PDFs below portal limits — safely for CVs, aggressively for scans.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <FileDropZone
              accept=".pdf"
              allowedTypes={PDF_TYPES}
              title="Upload the PDF to compress"
              hint="Processed entirely on your device"
              files={file ? [file] : []}
              onFiles={(picked) => handleFile(picked[0])}
              accent="violet"
              onReject={(_, rejected) => setError(`"${rejected.name}" is not a PDF.`)}
            />

            {file && hasText !== null && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">
                  Compression mode
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMode('lossless')}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      mode === 'lossless'
                        ? 'border-violet-600 bg-violet-50'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-800">Safe (keeps text)</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Text stays selectable — ATS systems can still read your CV. Modest savings.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('rasterize')}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      mode === 'rasterize'
                        ? 'border-violet-600 bg-violet-50'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-800">Strong (pages become images)</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Big savings and can hit a target size — best for scanned documents.
                    </p>
                  </button>
                </div>

                {hasText === false && (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    This looks like a scanned document, so Strong mode costs nothing extra.
                  </p>
                )}

                {mode === 'rasterize' && hasText === true && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-800">
                      This PDF contains real text — strong compression will turn it into images.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Employers&apos; ATS software will no longer be able to read the text. Do not do
                      this to a CV you plan to submit.
                    </p>
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-semibold text-amber-800">
                      <input
                        type="checkbox"
                        name="confirm-rasterize"
                        checked={confirmedRasterize}
                        onChange={(event) => setConfirmedRasterize(event.target.checked)}
                        className="h-4 w-4 accent-amber-600"
                      />
                      I understand — convert the pages to images anyway
                    </label>
                  </div>
                )}

                {mode === 'rasterize' && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                      Target size
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {TARGETS.map((target, index) => (
                        <button
                          key={target.label}
                          type="button"
                          onClick={() => setTargetIndex(index)}
                          className={`rounded-xl border py-2 text-[11px] font-bold transition-all ${
                            targetIndex === index
                              ? 'border-violet-600 bg-violet-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {target.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {outcome && result && (
              <SuccessBanner title="Compressed PDF ready.">
                <p>
                  {formatSize(outcome.before)} → <strong>{formatSize(outcome.after)}</strong>{' '}
                  ({Math.max(0, Math.round((1 - outcome.after / outcome.before) * 100))}% smaller) ·{' '}
                  {outcome.textPreserved ? 'text still selectable' : 'pages converted to images'}
                </p>
                {outcome.warning && <p className="mt-1 text-xs">{outcome.warning}</p>}
                <a href={result.url} download={result.name}
                  className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download {result.name}
                </a>
              </SuccessBanner>
            )}

            {loading && <LoadingBanner messages={[progress || 'Compressing your PDF...']} />}

            <button
              type="button"
              onClick={compress}
              disabled={!file || hasText === null || loading || rasterizeBlocked}
              className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-100 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Compressing...' : 'Compress PDF'}
            </button>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
