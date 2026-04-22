'use client';

import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const FORMATS = ['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff', 'heif'] as const;
type Fmt = typeof FORMATS[number];

const FORMAT_LABEL: Record<Fmt, string> = {
  jpeg: 'JPEG',
  png:  'PNG',
  webp: 'WebP',
  avif: 'AVIF',
  gif:  'GIF',
  tiff: 'TIFF',
  heif: 'HEIF',
};

const FORMAT_DESC: Record<Fmt, string> = {
  jpeg: 'Lossy compression, universal support — best for photos',
  png:  'Lossless, transparency support — best for graphics & UI',
  webp: 'Modern web format, smaller than JPEG/PNG with great quality',
  avif: 'Next-gen format, excellent compression at high quality',
  gif:  'Animated images, palette-based — legacy web & stickers',
  tiff: 'Lossless with LZW compression — print & professional workflows',
  heif: 'High Efficiency Image Format (AV1) — Apple/Android photos',
};

// All formats Sharp can read as input
const ACCEPT_ALL = '.jpg,.jpeg,.png,.webp,.avif,.gif,.tiff,.tif,.heif,.heic,.svg';

const FORMAT_ACCEPT: Record<Fmt, string> = {
  jpeg: ACCEPT_ALL,
  png:  ACCEPT_ALL,
  webp: ACCEPT_ALL,
  avif: ACCEPT_ALL,
  gif:  ACCEPT_ALL,
  tiff: ACCEPT_ALL,
  heif: ACCEPT_ALL,
};

// Formats that support a quality slider
const HAS_QUALITY = new Set<Fmt>(['jpeg', 'webp', 'avif', 'tiff', 'heif']);

function ImageConverterInner() {
  const params  = useSearchParams();
  const initTo  = (params.get('to') ?? 'webp') as Fmt;

  const [targetFmt, setTargetFmt] = useState<Fmt>(FORMATS.includes(initTo) ? initTo : 'webp');
  const [quality,   setQuality]   = useState(85);
  const [file,      setFile]      = useState<File | null>(null);
  const [preview,   setPreview]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const VALID_IMAGE_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'image/gif',  'image/tiff', 'image/heif', 'image/heic',
    'image/svg+xml',
  ]);

  function handleFile(f: File) {
    if (!VALID_IMAGE_TYPES.has(f.type)) {
      setError(`"${f.name}" is not a recognised image file. Please upload a JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, or SVG.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(f);
    setDone(false);
    setError('');
    // SVG and TIFF/HEIF may not preview well in <img> — show a filename placeholder instead
    const previewable = /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(f.name);
    if (previewable) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview('');
    }
  }

  async function convert() {
    if (!file) return;
    setLoading(true); setError(''); setDone(false);
    try {
      const form = new FormData();
      form.append('file',    file);
      form.append('to',      targetFmt);
      form.append('quality', String(quality));

      const res = await fetch('/api/convert/image', { method: 'POST', body: form });

      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? 'Conversion failed');
      }

      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      const disp  = res.headers.get('Content-Disposition') ?? '';
      const match = disp.match(/filename="([^"]+)"/);
      a.download  = match ? match[1] : `converted.${targetFmt}`;
      a.href      = url;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => {
        setFile(null);
        setPreview('');
        setDone(false);
        if (inputRef.current) inputRef.current.value = '';
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Image Converter</h1>
              <p className="text-sm text-slate-500">JPEG · PNG · WebP · AVIF · GIF · TIFF · HEIF · SVG — powered by Sharp</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Left: controls */}
          <div className="space-y-5">

            {/* Target format grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">Convert To</h2>
              <div className="grid grid-cols-4 gap-2">
                {FORMATS.map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setTargetFmt(fmt)}
                    className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      targetFmt === fmt
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                    }`}
                  >
                    {FORMAT_LABEL[fmt]}
                  </button>
                ))}
              </div>
              {/* Format description */}
              <p className="mt-3 text-xs text-slate-400 leading-relaxed">{FORMAT_DESC[targetFmt]}</p>
            </div>

            {/* Quality slider */}
            {HAS_QUALITY.has(targetFmt) && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Quality</h2>
                  <span className="text-sm font-bold text-emerald-600">{quality}%</span>
                </div>
                <input
                  type="range" min={10} max={100} value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>10% — smallest file</span>
                  <span>100% — best quality</span>
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-10 text-center cursor-pointer transition-colors hover:bg-emerald-100"
              onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <input
                ref={inputRef} type="file" className="hidden"
                accept={FORMAT_ACCEPT[targetFmt]}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <svg className="w-10 h-10 mx-auto mb-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {file ? (
                <div>
                  <p className="font-bold text-sm text-emerald-700">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-sm text-emerald-700">Drop your image here</p>
                  <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP, AVIF, GIF, TIFF, HEIF, SVG accepted</p>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            {done && (
              <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Done! Your {FORMAT_LABEL[targetFmt]} file is downloading.
              </div>
            )}

            <button
              onClick={convert}
              disabled={!file || loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-200"
            >
              {loading ? 'Converting…' : `Convert to ${FORMAT_LABEL[targetFmt]} →`}
            </button>
          </div>

          {/* Right: preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-700">Preview</h2>
            </div>
            <div className="p-6 flex items-center justify-center min-h-[400px]">
              {file && !preview ? (
                /* Non-previewable format (TIFF, HEIF) — show file info card */
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="font-semibold text-sm text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  <p className="text-xs text-slate-400 mt-0.5">Preview not available for this format</p>
                </div>
              ) : preview ? (
                <div className="relative w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="max-w-full max-h-80 mx-auto rounded-xl object-contain shadow-sm" />
                  <div className="mt-3 text-center">
                    <p className="text-xs text-slate-400">{file?.name}</p>
                    <p className="text-xs text-slate-400">{file ? `${(file.size / 1024).toFixed(1)} KB` : ''} · converting to {FORMAT_LABEL[targetFmt]}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-slate-300 text-sm">Image preview will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImageConverterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading…</div>}>
      <ImageConverterInner />
    </Suspense>
  );
}
