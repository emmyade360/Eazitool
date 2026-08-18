'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });
import { submitReview } from '@/lib/reviews';

const copy = {
  title: "Image Enlarger",
  subtitle: "Enlarge images up to 4x with high-quality resampling — not generative AI.",
  scaleFactor: "Scale Factor",
  outputFormat: "Output Format",
  quality: "Quality",
  smallest: "10% - smallest file",
  bestQuality: "100% - best quality",
  dropTitle: "Drop your image here",
  dropHint: "JPEG, PNG, WebP, AVIF, TIFF, HEIF accepted",
  clickToChange: "Click to change",
  preview: "Preview",
  previewPlaceholder: "Upload an image to preview",
  original: "Original",
  output: "Output",
  done: "Done! Your upscaled image is downloading.",
  loading: "Upscaling...",
  button: "Enlarge",
} as const;


const SCALES = [2, 3, 4] as const;
type Scale = typeof SCALES[number];

const OUTPUT_FORMATS = ['png', 'jpeg', 'webp', 'avif'] as const;
type OutputFmt = typeof OUTPUT_FORMATS[number];

const FORMAT_LABEL: Record<OutputFmt, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
  avif: 'AVIF',
};

const FORMAT_DESC: Record<OutputFmt, string> = {
  png: 'Lossless output for graphics and sharp edges',
  jpeg: 'Smaller photo-friendly output',
  webp: 'Modern web format with efficient compression',
  avif: 'Next-gen format with strong compression',
};

const VALID_INPUT = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/tiff',
  'image/heif',
  'image/heic',
]);

interface ImageMeta {
  width: number;
  height: number;
  name: string;
  sizeKB: number;
}

export default function ImageUpscalerPage() {
  const [scale, setScale] = useState<Scale>(2);
  const [format, setFormat] = useState<OutputFmt>('png');
  const [quality, setQuality] = useState(90);
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const [preview, setPreview] = useState('');
  const [renderedPreview, setRenderedPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ w: number; h: number } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDocType, setReviewDocType] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function readMeta(nextFile: File, dataUrl: string) {
    const img = new Image();
    img.onload = () => {
      setMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: nextFile.name,
        sizeKB: nextFile.size / 1024,
      });
    };
    img.src = dataUrl;
  }

  function handleFile(nextFile: File) {
    if (!VALID_INPUT.has(nextFile.type)) {
      setError(`"${nextFile.name}" is not a supported image.`);
      return;
    }

    setError('');
    setDone(null);
    setFile(nextFile);
    setRenderedPreview('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setPreview(url);
      readMeta(nextFile, url);
    };
    reader.readAsDataURL(nextFile);
  }

  useEffect(() => {
    if (!preview || !meta) {
      setRenderedPreview('');
      return;
    }

    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;

      const targetWidth = Math.max(1, meta.width * scale);
      const targetHeight = Math.max(1, meta.height * scale);
      const maxPreviewEdge = 900;
      const previewScale = Math.min(1, maxPreviewEdge / Math.max(targetWidth, targetHeight));
      const canvasWidth = Math.max(1, Math.round(targetWidth * previewScale));
      const canvasHeight = Math.max(1, Math.round(targetHeight * previewScale));
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setRenderedPreview(preview);
        return;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      setRenderedPreview(canvas.toDataURL('image/png'));
    };

    img.src = preview;
    return () => {
      cancelled = true;
    };
  }, [meta, preview, scale]);

  async function upscale() {
    if (!file) return;

    setLoading(true);
    setError('');
    setDone(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('scale', String(scale));
      form.append('format', format);
      form.append('quality', String(quality));

      const res = await fetch('/api/image/upscale', { method: 'POST', body: form });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? 'Upscale failed');
      }

      const outWidth = Number(res.headers.get('X-Output-Width'));
      const outHeight = Number(res.headers.get('X-Output-Height'));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="((?:\\.|[^"\\])*)"/) || disposition.match(/filename=([^;\s]+)/);
      anchor.download = match ? match[1] : `upscaled.${format}`;
      anchor.href = url;
      anchor.click();
      URL.revokeObjectURL(url);
      setDone({ w: outWidth, h: outHeight });
      setReviewDocType(`image-upscale-${format}`);
      setShowReviewModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewSubmit(review: { rating: number; comment: string; documentType: string }) {
    await submitReview({ document_type: review.documentType, rating: review.rating, comment: review.comment || undefined });
    setShowReviewModal(false);
  }

  const hasQuality = format === 'jpeg' || format === 'webp' || format === 'avif';

  return (
    <>
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
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
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">{copy.scaleFactor}</h2>
              <div className="grid grid-cols-3 gap-3">
                {SCALES.map((nextScale) => (
                  <button
                    key={nextScale}
                    type="button"
                    onClick={() => setScale(nextScale)}
                    className={`rounded-xl border py-3 text-sm font-bold transition-all ${
                      scale === nextScale
                        ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {nextScale}x
                    {meta && (
                      <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                        {meta.width * nextScale} x {meta.height * nextScale}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {meta && (
                <p className="mt-3 text-xs text-slate-400">
                  {copy.original}: {meta.width} x {meta.height} px - {copy.output}: {meta.width * scale} x {meta.height * scale} px
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">{copy.outputFormat}</h2>
              <div className="grid grid-cols-4 gap-2">
                {OUTPUT_FORMATS.map((nextFormat) => (
                  <button
                    key={nextFormat}
                    type="button"
                    onClick={() => setFormat(nextFormat)}
                    className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                      format === nextFormat
                        ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {FORMAT_LABEL[nextFormat]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">{FORMAT_DESC[format]}</p>
            </div>

            {hasQuality && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">{copy.quality}</h2>
                  <span className="text-sm font-bold text-orange-500">{quality}%</span>
                </div>
                <input
                  id="quality-range"
                  name="quality"
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="w-full accent-orange-500"
                  aria-label={copy.quality}
                />
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>{copy.smallest}</span>
                  <span>{copy.bestQuality}</span>
                </div>
              </div>
            )}

            <div
              role="button"
              tabIndex={0}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 p-10 text-center transition-colors hover:bg-orange-100"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') inputRef.current?.click();
              }}
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
                accept=".jpg,.jpeg,.png,.webp,.avif,.tiff,.tif,.heif,.heic"
                onChange={(event) => {
                  const chosenFile = event.target.files?.[0];
                  if (chosenFile) handleFile(chosenFile);
                }}
              />
              <svg className="mx-auto mb-3 h-10 w-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {file ? (
                <div>
                  <p className="text-sm font-bold text-orange-700">{file.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB - {copy.clickToChange}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-orange-700">{copy.dropTitle}</p>
                  <p className="mt-1 text-xs text-slate-400">{copy.dropHint}</p>
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
              onClick={upscale}
              disabled={!file || loading}
              className="w-full rounded-xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-100 transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? copy.loading : `${copy.button} ${scale}x ->`}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-bold text-slate-700">{copy.preview}</h2>
              {meta && <span className="text-xs text-slate-400">{meta.width} x {meta.height} px - {meta.sizeKB.toFixed(1)} KB</span>}
            </div>
            <div className="flex min-h-[420px] items-center justify-center p-6">
              {preview ? (
                <div className="w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={renderedPreview || preview} alt="Preview" className="mx-auto max-h-80 max-w-full rounded-xl object-contain shadow-sm" />
                  {meta && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                        <p className="mb-1 text-xs text-slate-400">{copy.original}</p>
                        <p className="text-sm font-bold text-slate-700">{meta.width} x {meta.height}</p>
                      </div>
                      <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-center">
                        <p className="mb-1 text-xs text-orange-400">{copy.output} ({scale}x)</p>
                        <p className="text-sm font-bold text-orange-700">{meta.width * scale} x {meta.height * scale}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <svg className="mx-auto mb-3 h-16 w-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
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
