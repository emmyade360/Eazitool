'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/language-context';
import dynamic from 'next/dynamic';
const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });
import { submitReview } from '@/lib/supabase';

const FORMATS = ['pdf', 'docx', 'txt'] as const;
type Format = typeof FORMATS[number];

const LABELS: Record<Format, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  txt: 'TXT',
};

const ACCEPT_BY_FORMAT: Record<Format, string> = {
  pdf: '.pdf',
  docx: '.doc,.docx',
  txt: '.txt',
};

const PAGE_COPY = {
  en: {
    title: 'Document Converter',
    subtitle: 'Convert PDF, DOCX, and TXT files online in a few clicks.',
    from: 'From',
    to: 'To',
    upload: 'Upload your file',
    accepted: 'PDF, DOCX, and TXT files are supported',
    change: 'Click to change',
    button: 'Convert file',
    loading: 'Converting...',
    preview: 'Selected conversion',
    done: 'Your converted document is downloading.',
  },
  fr: {
    title: 'Convertisseur de documents',
    subtitle: 'Convertissez des fichiers PDF, DOCX et TXT en quelques clics.',
    from: 'Depuis',
    to: 'Vers',
    upload: 'Importez votre fichier',
    accepted: 'Les fichiers PDF, DOCX et TXT sont pris en charge',
    change: 'Cliquez pour changer',
    button: 'Convertir le fichier',
    loading: 'Conversion...',
    preview: 'Conversion selectionnee',
    done: 'Votre document converti est en cours de telechargement.',
  },
  es: {
    title: 'Convertidor de documentos',
    subtitle: 'Convierte archivos PDF, DOCX y TXT online en pocos clics.',
    from: 'Desde',
    to: 'Hacia',
    upload: 'Sube tu archivo',
    accepted: 'Se admiten archivos PDF, DOCX y TXT',
    change: 'Haz clic para cambiar',
    button: 'Convertir archivo',
    loading: 'Convirtiendo...',
    preview: 'Conversion seleccionada',
    done: 'Tu documento convertido se esta descargando.',
  },
  pt: {
    title: 'Conversor de documentos',
    subtitle: 'Converta ficheiros PDF, DOCX e TXT online em poucos cliques.',
    from: 'De',
    to: 'Para',
    upload: 'Carregue o seu ficheiro',
    accepted: 'Ficheiros PDF, DOCX e TXT sao suportados',
    change: 'Clique para alterar',
    button: 'Converter ficheiro',
    loading: 'A converter...',
    preview: 'Conversao selecionada',
    done: 'O seu documento convertido esta a transferir.',
  },
  ar: {
    title: 'Document Converter',
    subtitle: 'Convert PDF, DOCX, and TXT files online in a few clicks.',
    from: 'From',
    to: 'To',
    upload: 'Upload your file',
    accepted: 'PDF, DOCX, and TXT files are supported',
    change: 'Click to change',
    button: 'Convert file',
    loading: 'Converting...',
    preview: 'Selected conversion',
    done: 'Your converted document is downloading.',
  },
  sw: {
    title: 'Kibadilishi cha hati',
    subtitle: 'Badilisha faili za PDF, DOCX na TXT mtandaoni kwa mibofyo michache.',
    from: 'Kutoka',
    to: 'Kwenda',
    upload: 'Pakia faili yako',
    accepted: 'Faili za PDF, DOCX na TXT zinaungwa mkono',
    change: 'Bonyeza kubadilisha',
    button: 'Badilisha faili',
    loading: 'Inabadilisha...',
    preview: 'Badiliko lililochaguliwa',
    done: 'Hati yako iliyobadilishwa inapakuliwa.',
  },
} as const;

function DocumentConverterInner() {
  const { language } = useLanguage();
  const copy = PAGE_COPY[language] ?? PAGE_COPY.en;
  const params = useSearchParams();
  const initialFrom = (params.get('from') ?? 'pdf') as Format;
  const initialTo = (params.get('to') ?? 'docx') as Format;
  const [from, setFrom] = useState<Format>(FORMATS.includes(initialFrom) ? initialFrom : 'pdf');
  const [to, setTo] = useState<Format>(FORMATS.includes(initialTo) ? initialTo : 'docx');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDocType, setReviewDocType] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const acceptedInput = useMemo(() => ACCEPT_BY_FORMAT[from], [from]);

  async function convert() {
    if (!file) return;

    setLoading(true);
    setError('');
    setDone(false);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('from', from);
      form.append('to', to);

      const res = await fetch('/api/convert/document', { method: 'POST', body: form });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? 'Conversion failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      anchor.download = match ? match[1] : `converted.${to}`;
      anchor.href = url;
      anchor.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setReviewDocType(`document-${to}`);
      setShowReviewModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewSubmit(review: { rating: number; comment: string; documentType: string }) {
    try {
      await submitReview({ document_type: review.documentType, rating: review.rating, comment: review.comment || undefined });
    } catch {}
    setShowReviewModal(false);
  }

  return (
    <>
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{copy.title}</h1>
              <p className="text-sm text-slate-500">{copy.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">{copy.from}</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {FORMATS.map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => {
                          setFrom(format);
                          if (format === to) {
                            setTo(format === 'pdf' ? 'docx' : 'pdf');
                          }
                          setFile(null);
                          if (inputRef.current) inputRef.current.value = '';
                        }}
                        className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                          from === format
                            ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
                        }`}
                      >
                        {LABELS[format]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">{copy.to}</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {FORMATS.map((format) => (
                      <button
                        key={format}
                        type="button"
                        disabled={format === from}
                        onClick={() => setTo(format)}
                        className={`rounded-xl border py-2.5 text-sm font-bold transition-all ${
                          to === format
                            ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {LABELS[format]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className="cursor-pointer rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 p-10 text-center transition-colors hover:bg-violet-100"
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept={acceptedInput}
                className="hidden"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0];
                  if (nextFile) {
                    setFile(nextFile);
                    setDone(false);
                    setError('');
                  }
                }}
              />
              <svg className="mx-auto mb-3 h-10 w-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {file ? (
                <div>
                  <p className="text-sm font-bold text-violet-700">{file.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB - {copy.change}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-violet-700">{copy.upload}</p>
                  <p className="mt-1 text-xs text-slate-400">{copy.accepted}</p>
                </div>
              )}
            </div>

            {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
            {done && <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">{copy.done}</div>}

            <button
              type="button"
              onClick={convert}
              disabled={!file || loading || from === to}
              className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? copy.loading : `${copy.button} ->`}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-sm font-bold text-slate-700">{copy.preview}</h2>
            </div>
            <div className="flex min-h-[380px] items-center justify-center p-6">
              <div className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-violet-100 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{copy.from}</p>
                    <p className="mt-2 text-xl font-bold text-slate-800">{LABELS[from]}</p>
                  </div>
                  <div className="rounded-xl border border-violet-100 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{copy.to}</p>
                    <p className="mt-2 text-xl font-bold text-slate-800">{LABELS[to]}</p>
                  </div>
                </div>
                <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-500">
                    {file ? file.name : copy.accepted}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ReviewModal
      isOpen={showReviewModal}
      onClose={() => setShowReviewModal(false)}
      onSubmit={handleReviewSubmit}
      documentType={reviewDocType}
    />
    </>
  );
}

export default function DocumentConverterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading...</div>}>
      <DocumentConverterInner />
    </Suspense>
  );
}
