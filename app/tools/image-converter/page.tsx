'use client';

import { Suspense, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });
import { submitReview } from '@/lib/supabase';

const copy = {
  title: "Image Converter",
  subtitle: "Convert between modern image formats in a few clicks.",
  convertTo: "Convert To",
  quality: "Quality",
  smallest: "10% - smallest file",
  bestQuality: "100% - best quality",
  dropTitle: "Drop your image here",
  fileAccepted: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG accepted",
  clickToChange: "Click to change",
  preview: "Preview",
  previewPlaceholder: "Image preview will appear here",
  previewUnavailable: "Preview not available for this format",
  done: "Done! Your converted image is downloading.",
  loading: "Converting...",
  convertingTo: "converting to",
} as const;


const FORMATS = ['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff', 'heif'] as const;
type Fmt = typeof FORMATS[number];

const FORMAT_LABEL: Record<Fmt, string> = {
  jpeg: 'JPEG',
  png: 'PNG',
  webp: 'WebP',
  avif: 'AVIF',
  gif: 'GIF',
  tiff: 'TIFF',
  heif: 'HEIF',
};

const FORMAT_DESC: Record<Fmt, string> = {
  jpeg: 'Lossy compression, universal support - best for photos',
  png: 'Lossless with transparency - best for graphics and UI',
  webp: 'Modern web format with smaller files and strong quality',
  avif: 'Next-gen format with excellent compression',
  gif: 'Animated images and stickers',
  tiff: 'Lossless format for print and pro workflows',
  heif: 'High Efficiency Image Format for modern device photos',
};

const ACCEPT_ALL = '.jpg,.jpeg,.png,.webp,.avif,.gif,.tiff,.tif,.heif,.heic,.svg';

const FORMAT_ACCEPT: Record<Fmt, string> = {
  jpeg: ACCEPT_ALL,
  png: ACCEPT_ALL,
  webp: ACCEPT_ALL,
  avif: ACCEPT_ALL,
  gif: ACCEPT_ALL,
  tiff: ACCEPT_ALL,
  heif: ACCEPT_ALL,
};

const HAS_QUALITY = new Set<Fmt>(['jpeg', 'webp', 'avif', 'tiff', 'heif']);

function ImageConverterInner() {
  const params = useSearchParams();
  const initTo = (params.get('to') ?? 'webp') as Fmt;

  const [targetFmt, setTargetFmt] = useState<Fmt>(FORMATS.includes(initTo) ? initTo : 'webp');
  const [quality, setQuality] = useState(85);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDocType, setReviewDocType] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const VALID_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/tiff',
    'image/heif',
    'image/heic',
    'image/svg+xml',
  ]);

  function handleFile(nextFile: File) {
    if (!VALID_IMAGE_TYPES.has(nextFile.type)) {
      setError(`"${nextFile.name}" is not a supported image file.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setFile(nextFile);
    setDone(false);
    setError('');

    const previewable = /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(nextFile.name);
    if (!previewable) {
      setPreview('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => setPreview(event.target?.result as string);
    reader.readAsDataURL(nextFile);
  }

  async function convert() {
    if (!file) return;

    setLoading(true);
    setError('');
    setDone(false);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('to', targetFmt);
      form.append('quality', String(quality));

      const res = await fetch('/api/convert/image', { method: 'POST', body: form });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? 'Conversion failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="((?:\\.|[^"\\])*)"/) || disposition.match(/filename=([^;\s]+)/);
      anchor.download = match ? match[1] : `converted.${targetFmt}`;
      anchor.href = url;
      anchor.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setReviewDocType(`image-${targetFmt}`);
      setShowReviewModal(true);

      window.setTimeout(() => {
        setFile(null);
        setPreview('');
        setDone(false);
        if (inputRef.current) inputRef.current.value = '';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewSubmit(review: { rating: number; comment: string; documentType: string }) {
    try {
      await submitReview({ document_type: review.documentType, rating: review.rating, comment: review.comment || undefined });
    } catch {}
    setShowReviewModal(false);
  }

  return (
    <>
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{copy.title}</h1>
              <p className="text-sm text-slate-500">{copy.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">{copy.convertTo}</h2>
              <div className="grid grid-cols-4 gap-2">
                {FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setTargetFmt(fmt)}
                    className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                      targetFmt === fmt
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    {FORMAT_LABEL[fmt]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">{FORMAT_DESC[targetFmt]}</p>
            </div>

            {HAS_QUALITY.has(targetFmt) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">{copy.quality}</h2>
                  <span className="text-sm font-bold text-emerald-600">{quality}%</span>
                </div>
                <input
                  id="quality-range"
                  name="quality"
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="w-full accent-emerald-600"
                  aria-label={copy.quality}
                />
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>{copy.smallest}</span>
                  <span>{copy.bestQuality}</span>
                </div>
              </div>
            )}

            <div
              className="cursor-pointer rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-10 text-center transition-colors hover:bg-emerald-100"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const droppedFile = event.dataTransfer.files[0];
                if (droppedFile) handleFile(droppedFile);
              }}
            >
              <input
                ref={inputRef}
                id="image-file-upload"
                name="image-file-upload"
                type="file"
                className="hidden"
                aria-label="Upload image"
                accept={FORMAT_ACCEPT[targetFmt]}
                onChange={(event) => {
                  const chosenFile = event.target.files?.[0];
                  if (chosenFile) handleFile(chosenFile);
                }}
              />
              <svg className="mx-auto mb-3 h-10 w-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {file ? (
                <div>
                  <p className="text-sm font-bold text-emerald-700">{file.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB - {copy.clickToChange}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-emerald-700">{copy.dropTitle}</p>
                  <p className="mt-1 text-xs text-slate-400">{copy.fileAccepted}</p>
                </div>
              )}
            </div>

            {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

            {done && (
              <div className="flex items-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {copy.done}
              </div>
            )}

            <button
              type="button"
              onClick={convert}
              disabled={!file || loading}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? copy.loading : `${copy.convertTo} ${FORMAT_LABEL[targetFmt]} ->`}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-bold text-slate-700">{copy.preview}</h2>
            </div>
            <div className="flex min-h-[400px] items-center justify-center p-6">
              {file && !preview ? (
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  <p className="mt-0.5 text-xs text-slate-400">{copy.previewUnavailable}</p>
                </div>
              ) : preview ? (
                <div className="relative w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="mx-auto max-h-80 max-w-full rounded-xl object-contain shadow-sm" />
                  <div className="mt-3 text-center">
                    <p className="text-xs text-slate-400">{file?.name}</p>
                    <p className="text-xs text-slate-400">
                      {file ? `${(file.size / 1024).toFixed(1)} KB` : ''} - {copy.convertingTo} {FORMAT_LABEL[targetFmt]}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="mx-auto mb-3 h-16 w-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-slate-300">{copy.previewPlaceholder}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    <ReviewModal
      isOpen={showReviewModal}
      onClose={() => setShowReviewModal(false)}
      onSubmit={handleReviewSubmit}
      documentType={reviewDocType}
    />
    </>
  );
}

export default function ImageConverterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading...</div>}>
      <ImageConverterInner />
    </Suspense>
  );
}
