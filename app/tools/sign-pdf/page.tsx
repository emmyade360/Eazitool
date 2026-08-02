'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { FileDropZone } from '@/components/tool-ui/FileDropZone';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { SignaturePad, type SignaturePadHandle } from '@/components/tool-ui/SignaturePad';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';
import { NigerianGuide } from '@/components/NigerianGuide';
import type { Placement } from '@/lib/pdf/sign';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const PDF_TYPES = new Set(['application/pdf']);
const PREVIEW_WIDTH = 700;

interface PageRender {
  index: number;
  dataUrl: string;
  width: number;
  height: number;
}

export default function SignPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageRender[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [sigWidthPct, setSigWidthPct] = useState(0.25);
  const [hasInk, setHasInk] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const padRef = useRef<SignaturePadHandle>(null);
  const sigPreview = useRef<string>('');
  const [sigPreviewUrl, setSigPreviewUrl] = useState('');
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  async function handleFile(picked: File) {
    setError('');
    setRendering(true);
    setPlacements([]);
    clearResult();
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.mjs';
      const bytes = new Uint8Array(await picked.arrayBuffer());
      const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;

      const rendered: PageRender[] = [];
      for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
        const page = await doc.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: PREVIEW_WIDTH / base.width });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        rendered.push({ index: i - 1, dataUrl: canvas.toDataURL('image/jpeg', 0.7), width: canvas.width, height: canvas.height });
      }
      await doc.destroy();

      setFile(picked);
      setPages(rendered);
    } catch {
      setError('Could not read this PDF — it may be corrupted or password-protected.');
    } finally {
      setRendering(false);
    }
  }

  async function refreshSignaturePreview() {
    const exported = await padRef.current?.exportPng();
    if (!exported) return null;
    if (sigPreview.current) URL.revokeObjectURL(sigPreview.current);
    const url = URL.createObjectURL(exported.blob);
    sigPreview.current = url;
    setSigPreviewUrl(url);
    return exported;
  }

  async function placeOnPage(pageIndex: number, event: React.MouseEvent<HTMLDivElement>) {
    if (!hasInk) {
      setError('Draw your signature first, then click where it should go.');
      return;
    }
    setError('');
    if (!sigPreviewUrl) await refreshSignaturePreview();

    const rect = event.currentTarget.getBoundingClientRect();
    const xPct = (event.clientX - rect.left) / rect.width;
    const yPct = (event.clientY - rect.top) / rect.height;
    setPlacements((prev) => [...prev, { pageIndex, xPct, yPct, widthPct: sigWidthPct }]);
    clearResult();
  }

  async function applySignature() {
    if (!file || placements.length === 0) return;
    setSigning(true);
    setError('');
    try {
      const exported = await padRef.current?.exportPng();
      if (!exported) {
        setError('Draw your signature first.');
        return;
      }
      const { signPdf } = await import('@/lib/pdf/sign');
      const signed = await signPdf(
        new Uint8Array(await file.arrayBuffer()),
        new Uint8Array(await exported.blob.arrayBuffer()),
        placements,
      );
      const baseName = file.name.replace(/\.pdf$/i, '');
      setResultFromBlob(new Blob([signed as BlobPart], { type: 'application/pdf' }), `${baseName}_signed.pdf`);
      promptReview('sign-pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signing failed.');
    } finally {
      setSigning(false);
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
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897l12.682-12.68z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Sign PDF</h1>
              <p className="text-sm text-slate-500">
                Draw once, click where it belongs — no printing or scanning.
              </p>
            </div>
          </div>

          <NigerianGuide
            title="No more print, sign, scan"
            english="Draw your signature below, then click the exact spot on the page where it should appear. The document never leaves your phone or laptop."
            pidgin="Draw your signature for down, then click the place wey e suppose land for the paper. The document no dey leave your phone at all."
          />

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">
                1 · Your signature
              </h2>
              <SignaturePad ref={padRef} onInkChange={(ink) => { setHasInk(ink); if (!ink) setSigPreviewUrl(''); }} />
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Signature size on the page</span>
                  <span className="font-bold text-violet-600">{Math.round(sigWidthPct * 100)}% of width</span>
                </div>
                <input type="range" name="sig-width" min={0.1} max={0.5} step={0.01} value={sigWidthPct}
                  onChange={(e) => setSigWidthPct(Number(e.target.value))}
                  className="w-full accent-violet-600" aria-label="Signature width" />
              </div>
            </div>

            {!file && (
              <FileDropZone
                accept=".pdf"
                allowedTypes={PDF_TYPES}
                title="2 · Upload the PDF to sign"
                hint="Up to 30 pages — processed entirely on your device"
                onFiles={(picked) => handleFile(picked[0])}
                accent="violet"
                onReject={(_, rejected) => setError(`"${rejected.name}" is not a PDF.`)}
              />
            )}

            {rendering && <LoadingBanner messages={['Opening your PDF...']} />}

            {pages.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                    3 · Click where to sign
                  </h2>
                  <div className="flex items-center gap-2">
                    {placements.length > 0 && (
                      <button type="button" onClick={() => { setPlacements([]); clearResult(); }}
                        className="text-xs font-semibold text-slate-400 hover:text-red-500">
                        Clear {placements.length} placement{placements.length === 1 ? '' : 's'}
                      </button>
                    )}
                    <button type="button" onClick={() => { setFile(null); setPages([]); setPlacements([]); clearResult(); }}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600">
                      Change PDF
                    </button>
                  </div>
                </div>

                <div className="max-h-[520px] space-y-4 overflow-y-auto">
                  {pages.map((page) => (
                    <div key={page.index}>
                      <p className="mb-1 px-1 text-xs font-semibold text-slate-400">Page {page.index + 1}</p>
                      <div
                        className="relative cursor-crosshair overflow-hidden rounded-lg border border-slate-200"
                        onClick={(event) => placeOnPage(page.index, event)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={page.dataUrl} alt={`Page ${page.index + 1}`} className="w-full" />
                        {placements
                          .filter((p) => p.pageIndex === page.index)
                          .map((placement, i) => (
                            <div
                              key={i}
                              className="pointer-events-none absolute"
                              style={{
                                left: `${placement.xPct * 100}%`,
                                top: `${placement.yPct * 100}%`,
                                width: `${placement.widthPct * 100}%`,
                              }}
                            >
                              {sigPreviewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={sigPreviewUrl} alt="Signature placement" className="w-full" />
                              ) : (
                                <div className="h-8 rounded border-2 border-dashed border-violet-500 bg-violet-100/60" />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 px-1 text-xs text-slate-400">
                  Click anywhere on a page to drop your signature there. You can sign several pages.
                </p>
              </div>
            )}

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && (
              <SuccessBanner title="Signed PDF ready.">
                <p>{placements.length} signature{placements.length === 1 ? '' : 's'} placed.</p>
                <a href={result.url} download={result.name}
                  className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download {result.name}
                </a>
              </SuccessBanner>
            )}

            {signing && <LoadingBanner messages={['Applying your signature...']} />}

            {pages.length > 0 && (
              <button type="button" onClick={applySignature}
                disabled={signing || placements.length === 0 || !hasInk}
                className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-100 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                {signing ? 'Signing...' : 'Apply Signature & Download'}
              </button>
            )}
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
