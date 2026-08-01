'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FileDropZone } from '@/components/tool-ui/FileDropZone';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';
import type { EnhanceMode, Point } from '@/lib/scanner/pipeline';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SOURCE_EDGE = 2200;
const HANDLE_HIT_RADIUS = 28;

const MODES: { id: EnhanceMode; label: string; hint: string }[] = [
  { id: 'scan', label: 'Scan (B&W)', hint: 'Crisp black-and-white — best for text documents' },
  { id: 'grayscale', label: 'Grayscale', hint: 'Softer look for photos on documents' },
  { id: 'color', label: 'Color', hint: 'Keep original colors, straightened' },
];

interface ScannedPage {
  id: number;
  blob: Blob;
  previewUrl: string;
}

let nextPageId = 1;

export default function DocumentScannerPage() {
  const [source, setSource] = useState<{ data: ImageData; width: number; height: number } | null>(null);
  const [corners, setCorners] = useState<Point[]>([]);
  const [mode, setMode] = useState<EnhanceMode>('scan');
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragIndex = useRef<number>(-1);
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  // Draw the source image with the corner overlay.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(source.data, 0, 0);

    if (corners.length === 4) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.95)';
      ctx.lineWidth = Math.max(2, source.width / 300);
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i <= 4; i++) ctx.lineTo(corners[i % 4].x, corners[i % 4].y);
      ctx.stroke();

      for (const corner of corners) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, Math.max(8, source.width / 80), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, Math.max(3, source.width / 220), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [source, corners]);

  useEffect(() => {
    return () => {
      for (const page of pages) URL.revokeObjectURL(page.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFile(picked: File) {
    setError('');
    try {
      const bitmap = await createImageBitmap(picked);
      const scale = Math.min(1, MAX_SOURCE_EDGE / Math.max(bitmap.width, bitmap.height));
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      setSource({ data: ctx.getImageData(0, 0, width, height), width, height });
      // Default corners: 5% inset — always draggable, never a gate.
      const inset = 0.05;
      setCorners([
        { x: width * inset, y: height * inset },
        { x: width * (1 - inset), y: height * inset },
        { x: width * (1 - inset), y: height * (1 - inset) },
        { x: width * inset, y: height * (1 - inset) },
      ]);
    } catch {
      setError('Could not read this image.');
    }
  }

  function canvasPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!source) return;
    const point = canvasPoint(event);
    const scaledHit = (HANDLE_HIT_RADIUS / 600) * source.width;
    let best = -1;
    let bestDist = Infinity;
    corners.forEach((corner, index) => {
      const dist = Math.hypot(corner.x - point.x, corner.y - point.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    if (bestDist <= Math.max(scaledHit, 40)) {
      dragIndex.current = best;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (dragIndex.current < 0 || !source) return;
    const point = canvasPoint(event);
    setCorners((prev) =>
      prev.map((corner, index) =>
        index === dragIndex.current
          ? {
              x: Math.min(source.width, Math.max(0, point.x)),
              y: Math.min(source.height, Math.max(0, point.y)),
            }
          : corner,
      ),
    );
  }

  function onPointerUp() {
    dragIndex.current = -1;
  }

  async function capturePage() {
    if (!source || corners.length !== 4) return;
    setProcessing(true);
    setError('');
    clearResult();

    try {
      // Yield a frame so the busy state paints before the heavy loop.
      await new Promise((resolve) => setTimeout(resolve, 30));
      const { scanPage } = await import('@/lib/scanner/pipeline');
      const output = scanPage(source.data, corners, mode);

      const canvas = document.createElement('canvas');
      canvas.width = output.width;
      canvas.height = output.height;
      canvas.getContext('2d')!.putImageData(output, 0, 0);

      // Keep whichever encoding is smaller — bilevel scans usually win as PNG.
      const jpeg: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('Encoding failed.'))), 'image/jpeg', 0.8),
      );
      const png: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('Encoding failed.'))), 'image/png'),
      );
      const blob = mode === 'scan' && png.size < jpeg.size ? png : jpeg;

      setPages((prev) => [
        ...prev,
        { id: nextPageId++, blob, previewUrl: URL.createObjectURL(blob) },
      ]);
      setSource(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scanning failed.');
    } finally {
      setProcessing(false);
    }
  }

  function removePage(id: number) {
    setPages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
    clearResult();
  }

  async function exportPdf() {
    if (pages.length === 0) return;
    setExporting(true);
    setError('');
    try {
      const { imagesToPdf } = await import('@/lib/scanner/pipeline');
      const bytes = await imagesToPdf(pages.map((p) => p.blob));
      setResultFromBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), 'scanned-document.pdf');
      promptReview('document-scanner');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Document Scanner</h1>
              <p className="text-sm text-slate-500">
                Photo → straightened, clean scan → PDF. Drag the corners to fit the page.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {!source && (
              <FileDropZone
                accept="image/*"
                allowedTypes={IMAGE_TYPES}
                capture="environment"
                title={pages.length ? 'Add the next page' : 'Photograph or upload a document'}
                hint="On a phone this opens your camera — processed entirely on your device"
                onFiles={(picked) => handleFile(picked[0])}
                accent="violet"
                onReject={(_, rejected) => setError(`"${rejected.name}" is not a supported image.`)}
              />
            )}

            {source && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <canvas
                  ref={canvasRef}
                  width={source.width}
                  height={source.height}
                  className="w-full touch-none rounded-xl"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  aria-label="Document photo — drag the corner handles to the page edges"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Drag the four green handles to the corners of the document.
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {MODES.map((option) => (
                    <button key={option.id} type="button" onClick={() => setMode(option.id)}
                      title={option.hint}
                      className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                        mode === option.id
                          ? 'border-violet-600 bg-violet-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}>
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setSource(null)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">
                    Cancel
                  </button>
                  <button type="button" onClick={capturePage} disabled={processing}
                    className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-50">
                    {processing ? 'Straightening & cleaning...' : 'Scan This Page'}
                  </button>
                </div>
              </div>
            )}

            {pages.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-widest text-slate-700">
                  Scanned pages ({pages.length})
                </h2>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {pages.map((page, index) => (
                    <div key={page.id} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={page.previewUrl} alt={`Scanned page ${index + 1}`}
                        className="w-full rounded-lg border border-slate-200 object-cover" />
                      <span className="absolute left-1.5 top-1.5 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {index + 1}
                      </span>
                      <button type="button" onClick={() => removePage(page.id)}
                        aria-label={`Remove page ${index + 1}`}
                        className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-slate-500 shadow hover:text-red-500">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && (
              <SuccessBanner title="Scanned PDF ready.">
                <p>{pages.length} page{pages.length === 1 ? '' : 's'}{result.sizeBytes ? ` — ${(result.sizeBytes / 1024).toFixed(0)}KB` : ''}.</p>
                <a href={result.url} download={result.name}
                  className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download scanned-document.pdf
                </a>
              </SuccessBanner>
            )}

            {exporting && <LoadingBanner messages={['Assembling your PDF...']} />}

            {pages.length > 0 && !source && (
              <button type="button" onClick={exportPdf} disabled={exporting}
                className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-100 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                {exporting ? 'Exporting...' : `Download ${pages.length}-Page PDF`}
              </button>
            )}
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
