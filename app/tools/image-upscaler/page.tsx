'use client';

import { useState, useRef } from 'react';

const SCALES = [2, 3, 4] as const;
type Scale = typeof SCALES[number];

const OUTPUT_FORMATS = ['png', 'jpeg', 'webp', 'avif'] as const;
type OutputFmt = typeof OUTPUT_FORMATS[number];

const FORMAT_LABEL: Record<OutputFmt, string> = {
  png:  'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
  avif: 'AVIF',
};

const FORMAT_DESC: Record<OutputFmt, string> = {
  png:  'Lossless — best for graphics with sharp edges',
  jpeg: 'Lossy compression — best for photographs',
  webp: 'Modern web format — smaller than PNG/JPEG',
  avif: 'Next-gen format — best compression at high quality',
};

const VALID_INPUT = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff', 'image/heif', 'image/heic',
]);

interface ImageMeta { width: number; height: number; name: string; sizeKB: number; }

export default function ImageUpscalerPage() {
  const [scale,     setScale]     = useState<Scale>(2);
  const [format,    setFormat]    = useState<OutputFmt>('png');
  const [quality,   setQuality]   = useState(90);
  const [file,      setFile]      = useState<File | null>(null);
  const [meta,      setMeta]      = useState<ImageMeta | null>(null);
  const [preview,   setPreview]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState<{ w: number; h: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function readMeta(f: File, dataUrl: string) {
    const img = new Image();
    img.onload = () =>
      setMeta({ width: img.naturalWidth, height: img.naturalHeight, name: f.name, sizeKB: f.size / 1024 });
    img.src = dataUrl;
  }

  function handleFile(f: File) {
    if (!VALID_INPUT.has(f.type)) {
      setError(`"${f.name}" is not a supported image. Please upload a JPEG, PNG, WebP, AVIF, TIFF, or HEIF.`);
      return;
    }
    setError(''); setDone(null); setFile(f);
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      setPreview(url);
      readMeta(f, url);
    };
    reader.readAsDataURL(f);
  }

  async function upscale() {
    if (!file) return;
    setLoading(true); setError(''); setDone(null);
    try {
      const form = new FormData();
      form.append('file',    file);
      form.append('scale',   String(scale));
      form.append('format',  format);
      form.append('quality', String(quality));

      const res = await fetch('/api/image/upscale', { method: 'POST', body: form });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? 'Upscale failed');
      }

      const outW = Number(res.headers.get('X-Output-Width'));
      const outH = Number(res.headers.get('X-Output-Height'));

      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      const disp  = res.headers.get('Content-Disposition') ?? '';
      const match = disp.match(/filename="([^"]+)"/);
      a.download  = match ? match[1] : `upscaled.${format}`;
      a.href      = url;
      a.click();
      URL.revokeObjectURL(url);
      setDone({ w: outW, h: outH });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const hasQuality = format === 'jpeg' || format === 'webp' || format === 'avif';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Image Upscaler</h1>
              <p className="text-sm text-slate-500">Enlarge images up to 4× using Lanczos3 resampling — no quality loss</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* Controls */}
          <div className="space-y-5">

            {/* Scale selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">Scale Factor</h2>
              <div className="grid grid-cols-3 gap-3">
                {SCALES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                      scale === s
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                    }`}
                  >
                    {s}×
                    {meta && (
                      <span className="block text-[10px] font-normal mt-0.5 opacity-70">
                        {meta.width * s} × {meta.height * s}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {meta && (
                <p className="mt-3 text-xs text-slate-400">
                  Original: {meta.width} × {meta.height} px → Output: {meta.width * scale} × {meta.height * scale} px
                </p>
              )}
            </div>

            {/* Output format */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">Output Format</h2>
              <div className="grid grid-cols-4 gap-2">
                {OUTPUT_FORMATS.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      format === f
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                    }`}
                  >
                    {FORMAT_LABEL[f]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">{FORMAT_DESC[format]}</p>
            </div>

            {/* Quality — only for lossy formats */}
            {hasQuality && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Quality</h2>
                  <span className="text-sm font-bold text-orange-500">{quality}%</span>
                </div>
                <input
                  type="range" min={10} max={100} value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>10% — smallest file</span>
                  <span>100% — lossless</span>
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              role="button"
              tabIndex={0}
              className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 p-10 text-center cursor-pointer transition-colors hover:bg-orange-100"
              onClick={() => inputRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            >
              <input
                ref={inputRef} type="file" className="hidden"
                accept=".jpg,.jpeg,.png,.webp,.avif,.tiff,.tif,.heif,.heic"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <svg className="w-10 h-10 mx-auto mb-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {file ? (
                <div>
                  <p className="font-bold text-sm text-orange-700">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-sm text-orange-700">Drop your image here</p>
                  <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP, AVIF, TIFF, HEIF accepted</p>
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
                Done! Output: {done.w} × {done.h} px — downloading now.
              </div>
            )}

            <button
              type="button"
              onClick={upscale}
              disabled={!file || loading}
              className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-lg shadow-orange-100"
            >
              {loading ? 'Upscaling…' : `Upscale ${scale}× →`}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">Preview</h2>
              {meta && (
                <span className="text-xs text-slate-400">{meta.width} × {meta.height} px · {meta.sizeKB.toFixed(1)} KB</span>
              )}
            </div>
            <div className="p-6 flex items-center justify-center min-h-[420px]">
              {preview ? (
                <div className="w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview} alt="Preview"
                    className="max-w-full max-h-80 mx-auto rounded-xl object-contain shadow-sm"
                  />
                  {meta && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                        <p className="text-xs text-slate-400 mb-1">Original</p>
                        <p className="text-sm font-bold text-slate-700">{meta.width} × {meta.height}</p>
                      </div>
                      <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
                        <p className="text-xs text-orange-400 mb-1">Output ({scale}×)</p>
                        <p className="text-sm font-bold text-orange-700">{meta.width * scale} × {meta.height * scale}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  <p className="text-slate-300 text-sm">Upload an image to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
