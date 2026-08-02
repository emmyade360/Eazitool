'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { SignaturePad, type SignaturePadHandle } from '@/components/tool-ui/SignaturePad';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';
import { NigerianGuide } from '@/components/NigerianGuide';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const INKS = [
  { id: 'black', color: '#111111', label: 'Black' },
  { id: 'blue', color: '#1d4ed8', label: 'Blue' },
] as const;

const SIZE_LIMITS = [
  { id: 'none', label: 'No limit', kb: null },
  { id: '20', label: 'Under 20KB', kb: 20 },
  { id: '50', label: 'Under 50KB', kb: 50 },
] as const;

export default function SignatureMakerPage() {
  const padRef = useRef<SignaturePadHandle>(null);
  const [ink, setInk] = useState<string>(INKS[0].color);
  const [penWidth, setPenWidth] = useState(4);
  const [format, setFormat] = useState<'png' | 'jpeg'>('jpeg');
  const [sizeLimit, setSizeLimit] = useState<(typeof SIZE_LIMITS)[number]['id']>('50');
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState('');
  const [exportedKB, setExportedKB] = useState<number | null>(null);
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  async function exportSignature() {
    const exported = await padRef.current?.exportPng();
    if (!exported) {
      setError('Draw your signature first.');
      return;
    }
    setError('');

    try {
      let blob = exported.blob;
      const limit = SIZE_LIMITS.find((s) => s.id === sizeLimit)?.kb ?? null;

      // JPEG has no transparency, so flatten onto white before encoding.
      if (format === 'jpeg' || limit) {
        const bitmap = await createImageBitmap(exported.blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed.'))), 'image/jpeg', 0.92),
        );
      }

      if (limit && blob.size > limit * 1024) {
        const { compressImageToSize } = await import('@/lib/image/compress-to-size');
        blob = (await compressImageToSize(blob, { targetBytes: limit * 1024 })).blob;
      }

      const usePng = format === 'png' && !limit;
      setExportedKB(blob.size / 1024);
      setResultFromBlob(blob, `signature.${usePng ? 'png' : 'jpg'}`);
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
              <h1 className="text-2xl font-bold text-slate-800">Signature Maker</h1>
              <p className="text-sm text-slate-500">
                Draw your signature and download it at the size portals accept.
              </p>
            </div>
          </div>

          <NigerianGuide
            title="For JAMB, NYSC and bank forms"
            english="Most portals want a JPEG signature between 10KB and 50KB on a white background. Check the exact limit on the portal, pick it below, and the export will fit."
            pidgin="Plenty portal want JPEG signature between 10KB and 50KB with white background. Check the size wey dem talk, pick am for down, e go fit."
          />

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <SignaturePad
                ref={padRef}
                color={ink}
                penWidth={penWidth}
                onInkChange={(present) => {
                  setHasInk(present);
                  if (!present) {
                    clearResult();
                    setExportedKB(null);
                  }
                }}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">Ink</h2>
                <div className="flex gap-2">
                  {INKS.map((option) => (
                    <button key={option.id} type="button" onClick={() => setInk(option.color)}
                      aria-pressed={ink === option.color}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                        ink === option.color
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}>
                      <span className="h-3.5 w-3.5 rounded-full" style={{ background: option.color }} />
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                    <span>Pen thickness</span>
                    <span className="font-bold text-emerald-600">{penWidth}px</span>
                  </div>
                  <input id="pen-width" name="pen-width" type="range" min={2} max={10} value={penWidth}
                    onChange={(event) => setPenWidth(Number(event.target.value))}
                    className="w-full accent-emerald-600" aria-label="Pen thickness" />
                </div>
                <p className="mt-2 text-[11px] leading-4 text-slate-400">
                  Colour and thickness apply to the next stroke you draw.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">Export format</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormat('jpeg')}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      format === 'jpeg'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}>
                    JPEG (white)
                  </button>
                  <button type="button" onClick={() => setFormat('png')}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      format === 'png'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}>
                    PNG (transparent)
                  </button>
                </div>

                <h2 className="mb-3 mt-4 text-sm font-bold uppercase tracking-widest text-slate-700">Size limit</h2>
                <div className="grid grid-cols-3 gap-2">
                  {SIZE_LIMITS.map((option) => (
                    <button key={option.id} type="button" onClick={() => setSizeLimit(option.id)}
                      className={`rounded-xl border py-2 text-[11px] font-bold transition-all ${
                        sizeLimit === option.id
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}>
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-4 text-slate-400">
                  Size-limited exports are saved as JPEG, which is what JAMB, NYSC and most portals expect.
                </p>
              </div>
            </div>

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && exportedKB !== null && (
              <SuccessBanner title="Signature ready.">
                <p>{exportedKB.toFixed(1)} KB — trimmed to your signature with clean edges.</p>
                <a href={result.url} download={result.name}
                  className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download {result.name}
                </a>
              </SuccessBanner>
            )}

            <button type="button" onClick={exportSignature} disabled={!hasInk}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
              Download Signature
            </button>

            <p className="px-1 text-xs leading-5 text-slate-400">
              Need it on a document? Use{' '}
              <a href="/tools/sign-pdf" className="font-semibold text-emerald-600 hover:underline">Sign PDF</a>{' '}
              to place your signature directly onto a PDF page.
            </p>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
