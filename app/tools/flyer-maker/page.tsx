'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  LAYOUTS,
  PALETTES,
  drawFlyer,
  flyerToBlob,
  type FlyerLayout,
  type PriceRow,
} from '@/lib/image/flyer';
import { ErrorBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';
import { NigerianGuide } from '@/components/NigerianGuide';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-amber-400 focus:bg-white focus:outline-none';

let nextRowId = 1;
const makeRow = (): PriceRow & { id: number } => ({ id: nextRowId++, item: '', price: '' });

export default function FlyerMakerPage() {
  const [layout, setLayout] = useState<FlyerLayout>('promo');
  const [businessName, setBusinessName] = useState('');
  const [headline, setHeadline] = useState('');
  const [subhead, setSubhead] = useState('');
  const [footer, setFooter] = useState('');
  const [rows, setRows] = useState<(PriceRow & { id: number })[]>(() => [makeRow(), makeRow(), makeRow()]);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  const palette = PALETTES[paletteIndex];

  // Live preview redraw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawFlyer(canvas, {
      layout,
      businessName,
      headline,
      subhead,
      items: rows,
      footer,
      primary: palette.primary,
      accent: palette.accent,
      logoImage: logo,
    });
    clearResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, businessName, headline, subhead, rows, footer, paletteIndex, logo]);

  function loadLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => setLogo(img);
      img.onerror = () => setError('Could not read that logo image.');
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await flyerToBlob(canvas);
      setResultFromBlob(blob, 'flyer.jpg');
      promptReview('flyer-maker');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    }
  }

  const usesItems = layout !== 'promo';

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Flyer Maker</h1>
              <p className="text-sm text-slate-500">Square flyers sized for WhatsApp status and Instagram.</p>
            </div>
          </div>

          <NigerianGuide
            title="Made for WhatsApp marketing"
            english="Flyers export at 1080×1080 — the square size that displays sharply on WhatsApp status without cropping. Post daily with a fresh offer to stay visible."
            pidgin="The flyer na 1080×1080, the exact size wey dey show well for WhatsApp status without cutting. Post new offer everyday make people no forget you."
          />

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">Layout</h2>
                <div className="grid grid-cols-3 gap-2">
                  {LAYOUTS.map((option) => (
                    <button key={option.id} type="button" onClick={() => setLayout(option.id)}
                      className={`rounded-xl border p-2.5 text-center transition-all ${
                        layout === option.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}>
                      <p className="text-xs font-bold text-slate-800">{option.label}</p>
                      <p className="mt-0.5 text-[10px] leading-3 text-slate-500">{option.description}</p>
                    </button>
                  ))}
                </div>

                <h2 className="mb-2 mt-5 text-sm font-bold uppercase tracking-widest text-slate-700">Colours</h2>
                <div className="flex flex-wrap gap-2">
                  {PALETTES.map((option, index) => (
                    <button key={option.name} type="button" onClick={() => setPaletteIndex(index)}
                      aria-label={option.name}
                      className={`h-10 w-10 overflow-hidden rounded-lg ring-2 transition-all ${
                        paletteIndex === index ? 'ring-slate-900' : 'ring-transparent'
                      }`}
                      style={{ background: option.primary }}>
                      <span className="block h-3 w-full" style={{ background: option.accent }} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">Content</h2>
                <div className="space-y-3">
                  <input type="text" name="business-name" value={businessName} aria-label="Business name"
                    onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name" className={inputClass} />
                  <input type="text" name="headline" value={headline} aria-label="Headline"
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder={layout === 'price-list' ? 'PRICE LIST' : 'e.g. WEEKEND SALE — 30% OFF'}
                    className={inputClass} />
                  {layout !== 'price-list' && (
                    <input type="text" name="subhead" value={subhead} aria-label="Subheading"
                      onChange={(e) => setSubhead(e.target.value)}
                      placeholder="Supporting line, e.g. Valid till Sunday" className={inputClass} />
                  )}
                  <input type="text" name="footer" value={footer} aria-label="Footer contact"
                    onChange={(e) => setFooter(e.target.value)}
                    placeholder="Call / WhatsApp: 080…" className={inputClass} />
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-500">Logo (optional)</span>
                    <input type="file" accept="image/*" aria-label="Logo"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) loadLogo(f); }}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-600" />
                  </label>
                </div>
              </div>

              {usesItems && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">
                    {layout === 'price-list' ? 'Items & prices' : 'Services offered'}
                  </h2>
                  <div className="space-y-2">
                    {rows.map((row, index) => (
                      <div key={row.id} className="flex gap-2">
                        <input type="text" name={`item-${row.id}`} value={row.item}
                          aria-label={`Item ${index + 1}`}
                          onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, item: e.target.value } : r)))}
                          placeholder={layout === 'price-list' ? 'Item name' : 'Service'}
                          className={`${inputClass} min-w-0 flex-1`} />
                        {layout === 'price-list' && (
                          <input type="text" name={`price-${row.id}`} value={row.price}
                            aria-label={`Price ${index + 1}`}
                            onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, price: e.target.value } : r)))}
                            placeholder="₦5,000" className={`${inputClass} w-28`} />
                        )}
                        <button type="button" onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                          disabled={rows.length <= 1} aria-label={`Remove row ${index + 1}`}
                          className="rounded-lg px-2 text-slate-300 hover:text-red-500 disabled:opacity-30">✕</button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setRows((prev) => [...prev, makeRow()])}
                    disabled={rows.length >= 8}
                    className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-100 disabled:opacity-40">
                    + Add row
                  </button>
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <canvas ref={canvasRef}
                  className="w-full rounded-xl border border-slate-100"
                  style={{ aspectRatio: '1 / 1' }}
                  aria-label="Flyer preview" />
                <p className="mt-2 text-center text-xs text-slate-400">1080 × 1080 preview</p>
              </div>

              <ErrorBanner message={error} onDismiss={() => setError('')} />

              {result && (
                <div className="mt-4">
                  <SuccessBanner title="Flyer ready.">
                    <a href={result.url} download={result.name}
                      className="mt-2 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                      Download flyer.jpg
                    </a>
                  </SuccessBanner>
                </div>
              )}

              <button type="button" onClick={download}
                className="mt-4 w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-100 transition-colors hover:bg-amber-600">
                Download Flyer
              </button>
            </div>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
