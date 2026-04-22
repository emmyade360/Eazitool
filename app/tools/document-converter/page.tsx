'use client';

import { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const CONVERSIONS = [
  { from: 'pdf',  to: 'docx', label: 'PDF → DOCX', accept: '.pdf',       desc: 'Convert PDF to editable Word document',   color: 'blue' },
  { from: 'docx', to: 'pdf',  label: 'DOCX → PDF',  accept: '.docx,.doc', desc: 'Convert Word document to PDF',            color: 'violet' },
  { from: 'pdf',  to: 'txt',  label: 'PDF → TXT',   accept: '.pdf',       desc: 'Extract plain text from PDF',             color: 'amber' },
  { from: 'txt',  to: 'pdf',  label: 'TXT → PDF',   accept: '.txt',       desc: 'Convert plain text file to PDF',          color: 'emerald' },
  { from: 'docx', to: 'txt',  label: 'DOCX → TXT',  accept: '.docx,.doc', desc: 'Extract plain text from Word document',   color: 'rose' },
] as const;

type Conv = typeof CONVERSIONS[number];

const COLORS: Record<string, { bg: string; text: string; border: string; btn: string; badge: string }> = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    btn: 'bg-blue-600 hover:bg-blue-700',    badge: 'bg-blue-100 text-blue-700' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  btn: 'bg-violet-600 hover:bg-violet-700', badge: 'bg-violet-100 text-violet-700' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   btn: 'bg-amber-500 hover:bg-amber-600',   badge: 'bg-amber-100 text-amber-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', btn: 'bg-emerald-600 hover:bg-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    btn: 'bg-rose-600 hover:bg-rose-700',    badge: 'bg-rose-100 text-rose-700' },
};

function ConverterInner() {
  const params   = useSearchParams();
  const initFrom = params.get('from') ?? 'pdf';
  const initTo   = params.get('to')   ?? 'docx';

  const initial = CONVERSIONS.find(c => c.from === initFrom && c.to === initTo) ?? CONVERSIONS[0];
  const [selected, setSelected] = useState<Conv>(initial);
  const [file,     setFile]     = useState<File | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const c = COLORS[selected.color];

  const VALID_TYPES: Record<string, { mime: Set<string>; label: string }> = {
    pdf:  { mime: new Set(['application/pdf']),
            label: 'a PDF (.pdf)' },
    docx: { mime: new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']),
            label: 'a Word document (.docx / .doc)' },
    txt:  { mime: new Set(['text/plain']),
            label: 'a plain-text file (.txt)' },
  };

  function handleFile(f: File) {
    const expected = VALID_TYPES[selected.from];
    if (expected && !expected.mime.has(f.type)) {
      setError(`"${f.name}" is not the right file type. Please upload ${expected.label}.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(f);
    setError('');
    setDone(false);
  }

  function pick(conv: Conv) {
    setSelected(conv);
    setFile(null);
    setError('');
    setDone(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function readErrorMessage(res: Response) {
    const contentType = res.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const payload = await res.json() as { error?: string };
      return payload.error ?? 'Conversion failed';
    }

    const text = await res.text();
    const cleaned = text
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return 'Conversion failed';
    if (cleaned.length > 220) return `${cleaned.slice(0, 217)}...`;
    return cleaned;
  }

  async function convert() {
    if (!file) return;
    setLoading(true); setError(''); setDone(false);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('from', selected.from);
      form.append('to',   selected.to);

      const res = await fetch('/api/convert/document', { method: 'POST', body: form });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res));
      }

      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      const disp     = res.headers.get('Content-Disposition') ?? '';
      const match    = disp.match(/filename="([^"]+)"/);
      a.download     = match ? match[1] : `converted.${selected.to}`;
      a.href         = url;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => {
        setFile(null);
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
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Document Converter</h1>
              <p className="text-sm text-slate-500">PDF · DOCX · TXT — fast, private, no file size limits</p>
            </div>
          </div>
        </div>

        {/* Conversion type selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CONVERSIONS.map(conv => {
            const cc = COLORS[conv.color];
            const active = conv.from === selected.from && conv.to === selected.to;
            return (
              <button
                key={`${conv.from}-${conv.to}`}
                onClick={() => pick(conv)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  active
                    ? `${cc.bg} ${cc.text} ${cc.border} shadow-sm`
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {conv.label}
              </button>
            );
          })}
        </div>

        {/* Drop zone */}
        <div className={`rounded-2xl border-2 border-dashed transition-all ${c.border} ${c.bg} p-12 text-center mb-6 cursor-pointer`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <input ref={inputRef} type="file" accept={selected.accept} className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <svg className={`w-12 h-12 mx-auto mb-3 ${c.text} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {file ? (
            <div>
              <p className={`font-bold text-sm ${c.text}`}>{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
            </div>
          ) : (
            <div>
              <p className={`font-semibold text-sm ${c.text}`}>Drop your {selected.from.toUpperCase()} file here</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse · accepts {selected.accept}</p>
            </div>
          )}
        </div>

        {/* Selected conversion info */}
        <div className={`rounded-xl px-5 py-4 mb-6 flex items-center gap-3 ${c.bg} border ${c.border}`}>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{selected.label}</span>
          <p className={`text-sm ${c.text}`}>{selected.desc}</p>
        </div>

        {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 mb-4">{error}</div>}

        {done && (
          <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Conversion complete — your file is downloading.
          </div>
        )}

        <button
          onClick={convert}
          disabled={!file || loading}
          className={`w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg ${c.btn}`}
        >
          {loading ? 'Converting…' : `Convert to ${selected.to.toUpperCase()} →`}
        </button>
      </div>
    </div>
  );
}

export default function DocumentConverterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading…</div>}>
      <ConverterInner />
    </Suspense>
  );
}
