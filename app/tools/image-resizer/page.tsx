'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FileDropZone } from '@/components/tool-ui/FileDropZone';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const copy = {
  title: "Image Resizer",
  subtitle: "Resize to exact dimensions with live preview updates.",
  uploadTitle: "Upload an image to get started",
  uploadHint: "JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG accepted",
  clickToChange: "Click to change",
  dimensions: "Dimensions",
  percentage: "Percentage",
  width: "Width",
  height: "Height",
  original: "Original",
  fitMode: "Fit Mode",
  outputFormat: "Output Format",
  quality: "Quality",
  smallest: "10% smallest file",
  bestQuality: "100% highest quality",
  result: "Result",
  preview: "Preview",
  previewPlaceholder: "Upload an image to preview",
  target: "Target",
  resize: "Resize Image",
  loadingMessages: [
    "Hold on, we are finalizing your task.",
    "Sit tight while we finish your work.",
    "Great, your result is almost ready.",
  ],
  ready: "Great, your result is ready.",
  download: "Download Result",
} as const;


const OUTPUT_FORMATS = ['png', 'jpeg', 'webp', 'avif', 'tiff'] as const;
type OutputFmt = typeof OUTPUT_FORMATS[number];

const FORMAT_LABEL: Record<OutputFmt, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
  avif: 'AVIF',
  tiff: 'TIFF',
};

const FIT_OPTIONS = [
  { value: 'inside', label: 'Fit Inside', desc: 'Preserve aspect ratio and fit within the box. Output may be smaller than the exact width and height.' },
  { value: 'cover', label: 'Cover', desc: 'Fill the exact box by cropping edges, like CSS background-size: cover.' },
  { value: 'contain', label: 'Contain', desc: 'Fit entirely inside the box with transparent or white padding.' },
  { value: 'fill', label: 'Stretch', desc: 'Stretch to exact dimensions, ignoring aspect ratio.' },
  { value: 'outside', label: 'Fit Outside', desc: 'Preserve aspect ratio and scale until one side matches. Output may exceed the exact width and height.' },
] as const;
type FitValue = typeof FIT_OPTIONS[number]['value'];

const VALID_INPUT = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif',
  'image/gif', 'image/tiff', 'image/heif', 'image/heic', 'image/svg+xml',
]);

interface ImageMeta {
  width: number;
  height: number;
  name: string;
  sizeKB: number;
}

function getPreviewDrawBox(
  fit: FitValue,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  if (fit === 'fill') {
    return { x: 0, y: 0, width: targetWidth, height: targetHeight };
  }

  const widthRatio = targetWidth / sourceWidth;
  const heightRatio = targetHeight / sourceHeight;
  const containRatio = Math.min(widthRatio, heightRatio);
  const coverRatio = Math.max(widthRatio, heightRatio);

  let ratio = containRatio;
  if (fit === 'cover' || fit === 'outside') ratio = coverRatio;
  if (fit === 'inside') ratio = Math.min(containRatio, 1);

  const width = sourceWidth * ratio;
  const height = sourceHeight * ratio;
  return {
    x: (targetWidth - width) / 2,
    y: (targetHeight - height) / 2,
    width,
    height,
  };
}

export default function ImageResizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const [preview, setPreview] = useState('');
  const [renderedPreview, setRenderedPreview] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [usePercent, setUsePercent] = useState(false);
  const [resizePercent, setResizePercent] = useState(100);
  const [fit, setFit] = useState<FitValue>('contain');
  const [format, setFormat] = useState<OutputFmt>('png');
  const [quality, setQuality] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ w: number; h: number } | null>(null);
  const { result: downloadInfo, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();
  const aspectRef = useRef<number>(1);

  function readMeta(f: File, dataUrl: string) {
    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      aspectRef.current = naturalWidth / naturalHeight;
      setMeta({ width: naturalWidth, height: naturalHeight, name: f.name, sizeKB: f.size / 1024 });
      setWidth(String(naturalWidth));
      setHeight(String(naturalHeight));
    };
    img.src = dataUrl;
  }

  function applyPercent(percent: number) {
    if (!meta) return;
    const nextWidth = Math.max(1, Math.round(meta.width * (percent / 100)));
    const nextHeight = Math.max(1, Math.round(meta.height * (percent / 100)));
    setWidth(String(nextWidth));
    setHeight(String(nextHeight));
  }

  function switchMode(nextUsePercent: boolean) {
    setUsePercent(nextUsePercent);
    if (nextUsePercent && meta) {
      applyPercent(resizePercent);
    }
  }

  function handleFile(f: File) {
    setError('');
    setDone(null);
    setFile(f);
    setUsePercent(false);
    setResizePercent(100);
    setRenderedPreview('');
    clearResult();

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setPreview(url);
      readMeta(f, url);
    };
    reader.readAsDataURL(f);
  }

  function onWidthChange(value: string) {
    if (usePercent) setUsePercent(false);
    setWidth(value);
  }

  function onHeightChange(value: string) {
    if (usePercent) setUsePercent(false);
    setHeight(value);
  }

  useEffect(() => {
    if (!usePercent || !meta) return;
    const nextWidth = Math.max(1, Math.round(meta.width * (resizePercent / 100)));
    const nextHeight = Math.max(1, Math.round(meta.height * (resizePercent / 100)));
    setWidth(String(nextWidth));
    setHeight(String(nextHeight));
  }, [meta, resizePercent, usePercent]);

  useEffect(() => {
    if (!preview || !meta) {
      setRenderedPreview('');
      return;
    }

    const targetWidth = Number.parseInt(width, 10);
    const targetHeight = Number.parseInt(height, 10);

    if (!Number.isFinite(targetWidth) || !Number.isFinite(targetHeight) || targetWidth < 1 || targetHeight < 1) {
      setRenderedPreview(preview);
      return;
    }

    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;

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
      const drawBox = getPreviewDrawBox(
        fit,
        img.naturalWidth,
        img.naturalHeight,
        canvasWidth,
        canvasHeight
      );
      ctx.drawImage(img, drawBox.x, drawBox.y, drawBox.width, drawBox.height);
      setRenderedPreview(canvas.toDataURL('image/png'));
    };

    img.src = preview;
    return () => {
      cancelled = true;
    };
  }, [fit, height, meta, preview, width]);

  async function resize() {
    if (!file) return;

    const parsedWidth = width ? Number.parseInt(width, 10) : undefined;
    const parsedHeight = height ? Number.parseInt(height, 10) : undefined;

    if (!parsedWidth && !parsedHeight) {
      setError('Enter at least a width or height.');
      return;
    }

    if ((parsedWidth && parsedWidth < 1) || (parsedHeight && parsedHeight < 1)) {
      setError('Dimensions must be positive integers.');
      return;
    }

    setLoading(true);
    setError('');
    setDone(null);
    clearResult();

    try {
      const form = new FormData();
      form.append('file', file);
      if (parsedWidth) form.append('width', String(parsedWidth));
      if (parsedHeight) form.append('height', String(parsedHeight));
      form.append('fit', fit);
      form.append('format', format);
      form.append('quality', String(quality));

      const res = await fetch('/api/image/resize', { method: 'POST', body: form });
      if (!res.ok) {
        const payload = await res.json() as { error?: string };
        throw new Error(payload.error ?? 'Resize failed');
      }

      const outWidth = Number(res.headers.get('X-Output-Width'));
      const outHeight = Number(res.headers.get('X-Output-Height'));

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="((?:\\.|[^"\\])*)"/) || disposition.match(/filename=([^;\s]+)/);
      const filename = match ? match[1] : `resized.${format}`;

      setResultFromBlob(blob, filename);
      setDone({ w: outWidth, h: outHeight });
      promptReview(`image-resizer-${format}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const hasQuality = format === 'jpeg' || format === 'webp' || format === 'avif' || format === 'tiff';
  const activeFitDesc = FIT_OPTIONS.find((option) => option.value === fit)?.desc ?? '';

  return (
    <>
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{copy.title}</h1>
              <p className="text-sm text-slate-500">{copy.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <FileDropZone
              accept=".jpg,.jpeg,.png,.webp,.avif,.gif,.tiff,.tif,.heif,.heic,.svg"
              allowedTypes={VALID_INPUT}
              title={copy.uploadTitle}
              hint={copy.uploadHint}
              files={file ? [file] : []}
              onFiles={(picked) => handleFile(picked[0])}
              onReject={(reason, rejected) =>
                setError(
                  reason === 'type'
                    ? `"${rejected.name}" is not a supported image type.`
                    : `"${rejected.name}" is too large.`
                )
              }
            />

            {file && (
              <>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Dimensions (px)</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={!usePercent}
                    onClick={() => switchMode(false)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      !usePercent
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {copy.dimensions}
                  </button>
                  <button
                    type="button"
                    aria-pressed={usePercent}
                    onClick={() => switchMode(true)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      usePercent
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {copy.percentage}
                  </button>
                </div>
              </div>

              {!usePercent ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="resize-width" className="block text-xs text-slate-500 mb-1.5 font-medium">{copy.width}</label>
                    <input
                      id="resize-width"
                      name="resize-width"
                      type="number"
                      min={1}
                      max={16000}
                      value={width}
                      onChange={(event) => onWidthChange(event.target.value)}
                      placeholder={meta ? String(meta.width) : 'e.g. 1920'}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="resize-height" className="block text-xs text-slate-500 mb-1.5 font-medium">{copy.height}</label>
                    <input
                      id="resize-height"
                      name="resize-height"
                      type="number"
                      min={1}
                      max={16000}
                      value={height}
                      onChange={(event) => onHeightChange(event.target.value)}
                      placeholder={meta ? String(meta.height) : 'e.g. 1080'}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    id="resize-percent"
                    name="resize-percent"
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    value={resizePercent}
                    disabled={!meta}
                    onChange={(event) => setResizePercent(Number(event.target.value))}
                    className="w-full accent-indigo-600 disabled:opacity-50"
                    aria-label="Resize percentage"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">10% of original</span>
                    <span className="font-bold text-indigo-600">{resizePercent}%</span>
                    <span className="text-slate-400">100% original</span>
                  </div>
                  {meta && (
                    <p className="mt-3 text-xs text-slate-400">
                      Result: {width || '?'} x {height || '?'} px
                    </p>
                  )}
                </div>
              )}

              {meta && (
                <p className="mt-3 text-xs text-slate-400">
                  {copy.original}: {meta.width} x {meta.height} px
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">{copy.fitMode}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FIT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFit(option.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      fit === option.value
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">{activeFitDesc}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">{copy.outputFormat}</h2>
              <div className="grid grid-cols-5 gap-2">
                {OUTPUT_FORMATS.map((outputFormat) => (
                  <button
                    key={outputFormat}
                    type="button"
                    onClick={() => setFormat(outputFormat)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      format === outputFormat
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                    }`}
                  >
                    {FORMAT_LABEL[outputFormat]}
                  </button>
                ))}
              </div>
            </div>

            {hasQuality && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">{copy.quality}</h2>
                  <span className="text-sm font-bold text-indigo-600">{quality}%</span>
                </div>
                <input
                  id="quality-range"
                  name="quality"
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="w-full accent-indigo-600"
                  aria-label={copy.quality}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{copy.smallest}</span>
                  <span>{copy.bestQuality}</span>
                </div>
              </div>
            )}
              </>
            )}

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {done && (
              <SuccessBanner title={copy.ready}>
                <p>{copy.result}: {done.w} x {done.h} px.</p>
                {downloadInfo && (
                  <a
                    href={downloadInfo.url}
                    download={downloadInfo.name}
                    className="inline-flex mt-3 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                  >
                    {copy.download}
                  </a>
                )}
              </SuccessBanner>
            )}

            {loading && <LoadingBanner messages={copy.loadingMessages} />}

            <button
              type="button"
              onClick={resize}
              disabled={!file || loading || (!width && !height)}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-100"
            >
              {loading ? `${copy.resize}...` : `${copy.resize} ->`}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">{copy.preview}</h2>
              {meta && (
                <span className="text-xs text-slate-400">{meta.width} x {meta.height} px - {meta.sizeKB.toFixed(1)} KB</span>
              )}
            </div>
            <div className="p-6 flex items-center justify-center min-h-[420px]">
              {preview ? (
                <div className="w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={renderedPreview || preview}
                    alt="Preview"
                    className="max-w-full max-h-72 mx-auto rounded-xl object-contain shadow-sm"
                  />
                  {meta && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                        <p className="text-xs text-slate-400 mb-1">{copy.original}</p>
                        <p className="text-sm font-bold text-slate-700">{meta.width} x {meta.height}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{meta.sizeKB.toFixed(0)} KB</p>
                      </div>
                      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-center">
                        <p className="text-xs text-indigo-400 mb-1">{copy.target}</p>
                        <p className="text-sm font-bold text-indigo-700">{width || '?'} x {height || '?'}</p>
                        <p className="text-xs text-indigo-400 mt-0.5">
                          {usePercent ? `${resizePercent}% scale` : FORMAT_LABEL[format]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  <p className="text-slate-300 text-sm">{copy.previewPlaceholder}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    <ReviewModal {...reviewModalProps} />
    </>
  );
}
