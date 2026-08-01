'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FileDropZone } from '@/components/tool-ui/FileDropZone';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';
import { PASSPORT_PRESETS, presetPixels, type PassportPreset } from '@/lib/image/passport';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SIZE_CAPS = [
  { label: 'No size cap', kb: null },
  { label: 'Under 50KB', kb: 50 },
  { label: 'Under 100KB', kb: 100 },
] as const;

export default function PassportPhotoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [preset, setPreset] = useState<PassportPreset>(PASSPORT_PRESETS[0]);
  const [zoom, setZoom] = useState(1); // multiplier on top of cover scale
  const [center, setCenter] = useState({ x: 0.5, y: 0.45 }); // crop centre in source fractions
  const [sizeCap, setSizeCap] = useState<(typeof SIZE_CAPS)[number]>(SIZE_CAPS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportedInfo, setExportedInfo] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; center: { x: number; y: number } } | null>(null);
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  const frameAspect = preset.widthMm / preset.heightMm;

  function cropRect(bmp: ImageBitmap) {
    // The visible crop is the largest frame-aspect rect at zoom=1, shrinking as zoom rises.
    const srcAspect = bmp.width / bmp.height;
    let sw: number;
    let sh: number;
    if (srcAspect > frameAspect) {
      sh = bmp.height / zoom;
      sw = sh * frameAspect;
    } else {
      sw = bmp.width / zoom;
      sh = sw / frameAspect;
    }
    const sx = Math.min(Math.max(center.x * bmp.width - sw / 2, 0), bmp.width - sw);
    const sy = Math.min(Math.max(center.y * bmp.height - sh / 2, 0), bmp.height - sh);
    return { sx, sy, sw, sh };
  }

  // Redraw the preview with the oval face guide whenever inputs change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { sx, sy, sw, sh } = cropRect(bitmap);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // Face guide: oval ~55% of frame height, centred slightly above middle.
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.75)';
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height * 0.44, canvas.width * 0.28, canvas.height * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bitmap, zoom, center, preset]);

  async function handleFile(picked: File) {
    setError('');
    clearResult();
    setExportedInfo('');
    try {
      const bmp = await createImageBitmap(picked);
      setFile(picked);
      setBitmap(bmp);
      setZoom(1);
      setCenter({ x: 0.5, y: 0.45 });
    } catch {
      setError('Could not read this image.');
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, center };
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas || !bitmap) return;
    const rect = canvas.getBoundingClientRect();
    const { sw, sh } = cropRect(bitmap);
    const dx = ((event.clientX - drag.startX) / rect.width) * (sw / bitmap.width);
    const dy = ((event.clientY - drag.startY) / rect.height) * (sh / bitmap.height);
    setCenter({
      x: Math.min(1, Math.max(0, drag.center.x - dx)),
      y: Math.min(1, Math.max(0, drag.center.y - dy)),
    });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  async function exportPhoto() {
    if (!bitmap || !file) return;
    setLoading(true);
    setError('');
    clearResult();

    try {
      const { renderPassportPhoto } = await import('@/lib/image/passport');
      let blob = await renderPassportPhoto(bitmap, preset, cropRect(bitmap));
      const px = presetPixels(preset);

      if (sizeCap.kb && blob.size > sizeCap.kb * 1024) {
        const { compressImageToSize } = await import('@/lib/image/compress-to-size');
        blob = (await compressImageToSize(blob, { targetBytes: sizeCap.kb * 1024 })).blob;
      }

      setExportedInfo(`${px.width} × ${px.height}px at ${preset.dpi} DPI — ${(blob.size / 1024).toFixed(1)}KB`);
      setResultFromBlob(blob, `passport-${preset.id}.jpg`);
      promptReview('passport-photo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Passport Photo Maker</h1>
              <p className="text-sm text-slate-500">
                Crop to exact passport dimensions with a face guide — all on your device.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {!bitmap && (
              <FileDropZone
                accept=".jpg,.jpeg,.png,.webp"
                allowedTypes={IMAGE_TYPES}
                title="Upload a photo"
                hint="Plain background, facing forward — JPEG, PNG or WebP"
                files={file ? [file] : []}
                onFiles={(picked) => handleFile(picked[0])}
                accent="emerald"
                onReject={(_, rejected) => setError(`"${rejected.name}" is not a supported image.`)}
              />
            )}

            {bitmap && (
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <canvas
                    ref={canvasRef}
                    width={Math.round(360 * frameAspect) * 2}
                    height={720}
                    className="mx-auto w-auto max-w-full cursor-move touch-none rounded-xl border border-slate-100"
                    style={{ maxHeight: 420, aspectRatio: `${preset.widthMm} / ${preset.heightMm}` }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    aria-label="Photo crop preview — drag to reposition"
                  />
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Zoom</span>
                      <span className="font-bold text-emerald-600">{zoom.toFixed(2)}×</span>
                    </div>
                    <input type="range" name="zoom" min={1} max={3} step={0.01} value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-emerald-600" aria-label="Zoom" />
                    <p className="mt-1 text-xs text-slate-400">
                      Drag the photo so the head fills the dashed oval; eyes around the upper third.
                    </p>
                  </div>
                  <button type="button"
                    onClick={() => { setBitmap(null); setFile(null); clearResult(); }}
                    className="mt-3 text-xs font-semibold text-slate-400 hover:text-slate-600">
                    ← Choose a different photo
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Size preset</h2>
                    <div className="space-y-1.5">
                      {PASSPORT_PRESETS.map((option) => (
                        <button key={option.id} type="button" onClick={() => setPreset(option)}
                          className={`w-full rounded-xl border p-2.5 text-left transition-all ${
                            preset.id === option.id
                              ? 'border-emerald-600 bg-emerald-50'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                          }`}>
                          <p className="text-xs font-bold text-slate-800">{option.label}</p>
                          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{option.note}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">File size</h2>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SIZE_CAPS.map((cap) => (
                        <button key={cap.label} type="button" onClick={() => setSizeCap(cap)}
                          className={`rounded-lg border py-2 text-[10px] font-bold transition-all ${
                            sizeCap.label === cap.label
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}>
                          {cap.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && (
              <SuccessBanner title="Passport photo ready.">
                <p>{exportedInfo}</p>
                <a href={result.url} download={result.name}
                  className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download {result.name}
                </a>
              </SuccessBanner>
            )}

            {loading && <LoadingBanner messages={['Rendering at print resolution...']} />}

            {bitmap && (
              <button type="button" onClick={exportPhoto} disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? 'Exporting...' : 'Export Passport Photo'}
              </button>
            )}
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
