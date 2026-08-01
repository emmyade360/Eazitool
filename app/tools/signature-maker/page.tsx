'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const copy = {
  title: 'Signature Maker',
  subtitle: 'Draw your signature and download it at the size portals accept.',
  padHint: 'Sign inside the box with your finger or mouse',
  inkLabel: 'Ink',
  thicknessLabel: 'Pen Thickness',
  formatLabel: 'Export Format',
  sizeLabel: 'Size Limit',
  undo: 'Undo',
  clear: 'Clear',
  button: 'Download Signature',
  ready: 'Signature ready.',
} as const;

// Internal drawing resolution — CSS scales it responsively.
const PAD_WIDTH = 900;
const PAD_HEIGHT = 300;

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[] };

const INKS = [
  { id: 'black', color: '#111111', label: 'Black' },
  { id: 'blue', color: '#1d4ed8', label: 'Blue' },
] as const;

const SIZE_LIMITS = [
  { id: 'none', label: 'No limit', kb: null },
  { id: '20', label: 'Under 20KB', kb: 20 },
  { id: '50', label: 'Under 50KB', kb: 50 },
] as const;

function drawStrokes(canvas: HTMLCanvasElement, strokes: Stroke[], background: string | null) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (const point of stroke.points.slice(1)) ctx.lineTo(point.x, point.y);
    if (stroke.points.length === 1) ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y);
    ctx.stroke();
  }
}

/** Bounding box of drawn ink, so exports are trimmed to the signature. */
function inkBounds(strokes: Stroke[]): { x: number; y: number; w: number; h: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const point of stroke.points) {
      const r = stroke.width / 2;
      minX = Math.min(minX, point.x - r);
      minY = Math.min(minY, point.y - r);
      maxX = Math.max(maxX, point.x + r);
      maxY = Math.max(maxY, point.y + r);
    }
  }
  if (!Number.isFinite(minX)) return null;
  const pad = 14;
  const x = Math.max(0, minX - pad);
  const y = Math.max(0, minY - pad);
  return {
    x,
    y,
    w: Math.min(PAD_WIDTH, maxX + pad) - x,
    h: Math.min(PAD_HEIGHT, maxY + pad) - y,
  };
}

export default function SignatureMakerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeStroke = useRef<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [ink, setInk] = useState<string>(INKS[0].color);
  const [penWidth, setPenWidth] = useState(4);
  const [format, setFormat] = useState<'png' | 'jpeg'>('jpeg');
  const [sizeLimit, setSizeLimit] = useState<(typeof SIZE_LIMITS)[number]['id']>('50');
  const [error, setError] = useState('');
  const [exportedKB, setExportedKB] = useState<number | null>(null);
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  // Redraw the visible pad whenever strokes change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawStrokes(canvas, strokes, '#ffffff');
  }, [strokes]);

  function padPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * PAD_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * PAD_HEIGHT,
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    activeStroke.current = { color: ink, width: penWidth, points: [padPoint(event)] };
    setStrokes((prev) => [...prev, activeStroke.current!]);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const stroke = activeStroke.current;
    if (!stroke) return;
    stroke.points.push(padPoint(event));
    // The active stroke object is already in `strokes` (pushed on pointerdown)
    // and mutated in place, so a direct redraw skips a re-render per point.
    const canvas = canvasRef.current;
    if (canvas) drawStrokes(canvas, strokes, '#ffffff');
  }

  function onPointerUp() {
    activeStroke.current = null;
    // Commit the mutated points array to state so undo/export see them.
    setStrokes((prev) => [...prev]);
  }

  function undo() {
    activeStroke.current = null;
    setStrokes((prev) => prev.slice(0, -1));
    clearResult();
    setExportedKB(null);
  }

  function clearPad() {
    activeStroke.current = null;
    setStrokes([]);
    clearResult();
    setExportedKB(null);
    setError('');
  }

  async function exportSignature() {
    if (strokes.length === 0) {
      setError('Draw your signature first.');
      return;
    }
    setError('');

    try {
      const bounds = inkBounds(strokes);
      if (!bounds) throw new Error('Draw your signature first.');

      const full = document.createElement('canvas');
      full.width = PAD_WIDTH;
      full.height = PAD_HEIGHT;
      drawStrokes(full, strokes, format === 'jpeg' ? '#ffffff' : null);

      const trimmed = document.createElement('canvas');
      trimmed.width = Math.max(1, Math.round(bounds.w));
      trimmed.height = Math.max(1, Math.round(bounds.h));
      const ctx = trimmed.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available in this browser.');
      ctx.drawImage(full, bounds.x, bounds.y, bounds.w, bounds.h, 0, 0, trimmed.width, trimmed.height);

      let blob: Blob = await new Promise((resolve, reject) =>
        trimmed.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Export failed.'))),
          format === 'png' ? 'image/png' : 'image/jpeg',
          0.92,
        ),
      );

      const limit = SIZE_LIMITS.find((s) => s.id === sizeLimit)?.kb ?? null;
      if (limit && blob.size > limit * 1024) {
        const { compressImageToSize } = await import('@/lib/image/compress-to-size');
        const compressed = await compressImageToSize(blob, {
          targetBytes: limit * 1024,
          mimeType: 'image/jpeg',
        });
        blob = compressed.blob;
      }

      setExportedKB(blob.size / 1024);
      setResultFromBlob(blob, `signature.${format === 'png' && !limit ? 'png' : 'jpg'}`);
      promptReview('signature-maker');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
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
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897l12.682-12.68z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{copy.title}</h1>
              <p className="text-sm text-slate-500">{copy.subtitle}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <canvas
                ref={canvasRef}
                width={PAD_WIDTH}
                height={PAD_HEIGHT}
                className="w-full touch-none rounded-xl border-2 border-dashed border-slate-200 bg-white"
                style={{ aspectRatio: `${PAD_WIDTH} / ${PAD_HEIGHT}` }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-label="Signature drawing pad"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-400">{copy.padHint}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={strokes.length === 0}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"
                  >
                    {copy.undo}
                  </button>
                  <button
                    type="button"
                    onClick={clearPad}
                    disabled={strokes.length === 0}
                    className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-100 disabled:opacity-40"
                  >
                    {copy.clear}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">
                  {copy.inkLabel}
                </h2>
                <div className="flex gap-2">
                  {INKS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setInk(option.color)}
                      aria-pressed={ink === option.color}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                        ink === option.color
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="h-3.5 w-3.5 rounded-full" style={{ background: option.color }} />
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                    <span>{copy.thicknessLabel}</span>
                    <span className="font-bold text-emerald-600">{penWidth}px</span>
                  </div>
                  <input
                    id="pen-width"
                    name="pen-width"
                    type="range"
                    min={2}
                    max={10}
                    value={penWidth}
                    onChange={(event) => setPenWidth(Number(event.target.value))}
                    className="w-full accent-emerald-600"
                    aria-label={copy.thicknessLabel}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">
                  {copy.formatLabel}
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('jpeg')}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      format === 'jpeg'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    JPEG (white)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('png')}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      format === 'png'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    PNG (transparent)
                  </button>
                </div>

                <h2 className="mb-3 mt-4 text-sm font-bold uppercase tracking-widest text-slate-700">
                  {copy.sizeLabel}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {SIZE_LIMITS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSizeLimit(option.id)}
                      className={`rounded-xl border py-2 text-[11px] font-bold transition-all ${
                        sizeLimit === option.id
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-4 text-slate-400">
                  Size-limited exports are saved as JPEG, which is what JAMB, NYSC and most portals
                  expect.
                </p>
              </div>
            </div>

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && exportedKB !== null && (
              <SuccessBanner title={copy.ready}>
                <p>
                  {exportedKB.toFixed(1)} KB — trimmed to your signature with clean edges.
                </p>
                <a
                  href={result.url}
                  download={result.name}
                  className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700"
                >
                  Download {result.name}
                </a>
              </SuccessBanner>
            )}

            <button
              type="button"
              onClick={exportSignature}
              disabled={strokes.length === 0}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copy.button}
            </button>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
