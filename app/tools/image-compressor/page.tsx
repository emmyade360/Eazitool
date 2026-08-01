'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileDropZone } from '@/components/tool-ui/FileDropZone';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';
import { NigerianGuide } from '@/components/NigerianGuide';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const copy = {
  title: 'Image Compressor',
  subtitle: 'Compress a photo to fit an exact limit like 50KB — right on your device.',
  uploadTitle: 'Upload the photo to compress',
  uploadHint: 'JPEG, PNG or WebP — processed in your browser, never uploaded',
  targetLabel: 'Target Size',
  customLabel: 'Custom (KB)',
  formatLabel: 'Output Format',
  button: 'Compress Image',
  ready: 'Done — your image fits the limit.',
  missed: 'Compressed as far as possible',
  download: 'Download Compressed Image',
  loadingMessages: ['Searching for the best quality that fits your limit...'],
} as const;

const TARGET_PRESETS_KB = [20, 50, 100, 200, 500] as const;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function ImageCompressorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetKB, setTargetKB] = useState<number>(50);
  const [customKB, setCustomKB] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState<{
    beforeBytes: number;
    afterBytes: number;
    width: number;
    height: number;
    hitTarget: boolean;
  } | null>(null);
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  const effectiveTargetKB = useCustom ? Number.parseInt(customKB, 10) : targetKB;

  function handleFile(picked: File) {
    setFile(picked);
    setError('');
    setOutcome(null);
    clearResult();
  }

  async function compress() {
    if (!file) return;
    if (!Number.isFinite(effectiveTargetKB) || effectiveTargetKB < 1) {
      setError('Enter a target size of at least 1KB.');
      return;
    }

    setLoading(true);
    setError('');
    setOutcome(null);
    clearResult();

    try {
      const { compressImageToSize } = await import('@/lib/image/compress-to-size');
      const compressed = await compressImageToSize(file, {
        targetBytes: effectiveTargetKB * 1024,
        mimeType: format,
      });

      const ext = format === 'image/webp' ? 'webp' : 'jpg';
      const baseName = file.name.replace(/\.[^.]+$/, '');
      setResultFromBlob(compressed.blob, `${baseName}_${effectiveTargetKB}kb.${ext}`);
      setOutcome({
        beforeBytes: file.size,
        afterBytes: compressed.blob.size,
        width: compressed.width,
        height: compressed.height,
        hitTarget: compressed.hitTarget,
      });
      promptReview('image-compressor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9h4.5M15 9V4.5M15 9l5.25-5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{copy.title}</h1>
              <p className="text-sm text-slate-500">{copy.subtitle}</p>
            </div>
          </div>

          <NigerianGuide
            title="For JAMB, NYSC and recruitment uploads"
            english="Use the exact file limit shown on the portal. If the portal says 50KB, choose 50KB here and open the downloaded file once before uploading it."
            pidgin="Use the exact size wey the portal show. If dem write 50KB, choose 50KB here and open the file once before you upload am."
          />

          <div className="space-y-5">
            <FileDropZone
              accept=".jpg,.jpeg,.png,.webp"
              allowedTypes={ALLOWED_TYPES}
              title={copy.uploadTitle}
              hint={copy.uploadHint}
              files={file ? [file] : []}
              onFiles={(picked) => handleFile(picked[0])}
              accent="emerald"
              onReject={(reason, rejected) =>
                setError(
                  reason === 'type'
                    ? `"${rejected.name}" is not a JPEG, PNG or WebP image. If it is a HEIC photo, convert it with the Image Converter first.`
                    : `"${rejected.name}" could not be accepted.`,
                )
              }
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">
                {copy.targetLabel}
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {TARGET_PRESETS_KB.map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => {
                      setTargetKB(kb);
                      setUseCustom(false);
                    }}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      !useCustom && targetKB === kb
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    {kb}KB
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                    useCustom
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600'
                  }`}
                >
                  Custom
                </button>
              </div>
              {useCustom && (
                <div className="mt-4">
                  <label htmlFor="custom-kb" className="mb-1.5 block text-xs font-medium text-slate-500">
                    {copy.customLabel}
                  </label>
                  <input
                    id="custom-kb"
                    name="custom-kb"
                    type="number"
                    min={1}
                    max={10240}
                    value={customKB}
                    onChange={(event) => setCustomKB(event.target.value)}
                    placeholder="e.g. 40"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-emerald-400 focus:bg-white focus:outline-none"
                  />
                </div>
              )}
              <p className="mt-3 text-xs text-slate-400">
                JAMB, NYSC and most recruitment portals list their limit next to the upload field —
                pick that number here.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">
                {copy.formatLabel}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['image/jpeg', 'JPEG (most portals)'],
                    ['image/webp', 'WebP (smaller)'],
                  ] as const
                ).map(([mime, label]) => (
                  <button
                    key={mime}
                    type="button"
                    onClick={() => setFormat(mime)}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      format === mime
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {outcome && result && (
              <SuccessBanner title={outcome.hitTarget ? copy.ready : copy.missed}>
                <p>
                  {formatKB(outcome.beforeBytes)} → <strong>{formatKB(outcome.afterBytes)}</strong>{' '}
                  ({outcome.width} × {outcome.height} px,{' '}
                  {Math.max(0, Math.round((1 - outcome.afterBytes / outcome.beforeBytes) * 100))}%
                  smaller)
                </p>
                {!outcome.hitTarget && (
                  <p className="mt-1 text-xs">
                    The image could not fit {effectiveTargetKB}KB even at minimum quality and size —
                    this is the smallest achievable version.
                  </p>
                )}
                <a
                  href={result.url}
                  download={result.name}
                  className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700"
                >
                  {copy.download}
                </a>
              </SuccessBanner>
            )}

            {loading && <LoadingBanner messages={copy.loadingMessages} />}

            <button
              type="button"
              onClick={compress}
              disabled={!file || loading || (useCustom && !customKB)}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? `${copy.button}...` : copy.button}
            </button>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
