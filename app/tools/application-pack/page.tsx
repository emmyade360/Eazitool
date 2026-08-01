'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileDropZone } from '@/components/tool-ui/FileDropZone';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';
import { NigerianGuide } from '@/components/NigerianGuide';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const PDF_TYPES = new Set(['application/pdf']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MIXED_TYPES = new Set([...PDF_TYPES, ...IMAGE_TYPES]);

const TARGETS = [
  { label: '1MB', bytes: 1024 * 1024 },
  { label: '2MB', bytes: 2 * 1024 * 1024 },
  { label: '5MB', bytes: 5 * 1024 * 1024 },
  { label: '10MB', bytes: 10 * 1024 * 1024 },
] as const;

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

async function fileToPdfBytes(file: File): Promise<Uint8Array> {
  if (file.type === 'application/pdf') return new Uint8Array(await file.arrayBuffer());
  const { imagesToPdf } = await import('@/lib/scanner/pipeline');
  return imagesToPdf([file]);
}

export default function ApplicationPackPage() {
  const [cv, setCv] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<File[]>([]);
  const [targetIndex, setTargetIndex] = useState(1); // 2MB — the most common portal cap
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [finalSize, setFinalSize] = useState<number | null>(null);
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  const assets = [cv, photo, ...certificates].filter((f): f is File => Boolean(f));
  const totalInput = assets.reduce((sum, f) => sum + f.size, 0);

  async function buildPack() {
    if (!cv) {
      setError('Add your CV first — it leads the pack.');
      return;
    }
    setBuilding(true);
    setError('');
    setFinalSize(null);
    clearResult();

    try {
      const target = TARGETS[targetIndex].bytes;
      const parts: Uint8Array[] = [];

      setProgress('Preparing your CV...');
      parts.push(await fileToPdfBytes(cv));

      if (photo) {
        setProgress('Preparing your passport photo...');
        // Compress the photo page so it never dominates the size budget.
        const { compressImageToSize } = await import('@/lib/image/compress-to-size');
        const compact = await compressImageToSize(photo, { targetBytes: 200 * 1024 });
        const { imagesToPdf } = await import('@/lib/scanner/pipeline');
        parts.push(await imagesToPdf([compact.blob]));
      }

      for (let i = 0; i < certificates.length; i++) {
        setProgress(`Preparing certificate ${i + 1} of ${certificates.length}...`);
        parts.push(await fileToPdfBytes(certificates[i]));
      }

      setProgress('Combining everything into one PDF...');
      const { mergePdfs } = await import('@/lib/pdf/merge');
      let merged = await mergePdfs(parts);

      if (merged.length > target) {
        setProgress('Compressing to fit the size limit...');
        const { compressPdf } = await import('@/lib/pdf/compress');
        const compressed = await compressPdf(merged, {
          mode: 'rasterize',
          targetBytes: target,
          onProgress: (page, total) => setProgress(`Compressing page ${page} of ${total}...`),
        });
        merged = compressed.bytes;
        if (compressed.outputBytes > target) {
          setError(
            'The pack could not fit the target even at maximum compression — remove a certificate or pick a larger limit.',
          );
        }
      }

      setFinalSize(merged.length);
      setResultFromBlob(new Blob([merged as BlobPart], { type: 'application/pdf' }), 'application-pack.pdf');
      promptReview('application-pack');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Building the pack failed.');
    } finally {
      setBuilding(false);
      setProgress('');
    }
  }

  const steps = [
    {
      title: '1 · Your CV (PDF)',
      hint: 'Have a DOCX? Convert it with the Document Converter first (needs internet).',
      content: (
        <FileDropZone
          accept=".pdf"
          allowedTypes={PDF_TYPES}
          title="Add your CV"
          hint="PDF only — it becomes the first pages of the pack"
          files={cv ? [cv] : []}
          onFiles={(picked) => { setCv(picked[0]); clearResult(); }}
          accent="blue"
          onReject={() => setError('The CV must be a PDF.')}
        />
      ),
      done: Boolean(cv),
    },
    {
      title: '2 · Passport photo (optional)',
      hint: 'Added as its own page and compressed automatically.',
      content: (
        <FileDropZone
          accept=".jpg,.jpeg,.png,.webp"
          allowedTypes={IMAGE_TYPES}
          title="Add your passport photo"
          hint="Use the Passport Photo Maker first for exact sizing"
          files={photo ? [photo] : []}
          onFiles={(picked) => { setPhoto(picked[0]); clearResult(); }}
          accent="blue"
          onReject={() => setError('The photo must be a JPEG, PNG or WebP image.')}
        />
      ),
      done: Boolean(photo),
    },
    {
      title: '3 · Certificates & documents (optional)',
      hint: 'Scans or PDFs — use the Document Scanner for paper certificates.',
      content: (
        <>
          <FileDropZone
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            allowedTypes={MIXED_TYPES}
            multiple
            maxFiles={15}
            title="Add certificates"
            hint="Up to 15 files, PDFs or images, in the order they should appear"
            files={certificates}
            onFiles={(picked) => { setCertificates((prev) => [...prev, ...picked].slice(0, 15)); clearResult(); }}
            accent="blue"
            onReject={(reason) => setError(reason === 'count' ? 'Limit is 15 certificate files.' : 'Unsupported file type.')}
          />
          {certificates.length > 0 && (
            <ul className="mt-2 space-y-1">
              {certificates.map((file, index) => (
                <li key={`${file.name}-${index}`}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                  <span className="font-bold text-slate-400">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="text-slate-400">{formatSize(file.size)}</span>
                  <button type="button"
                    onClick={() => { setCertificates((prev) => prev.filter((_, i) => i !== index)); clearResult(); }}
                    aria-label={`Remove ${file.name}`}
                    className="text-slate-300 hover:text-red-500">✕</button>
                </li>
              ))}
            </ul>
          )}
        </>
      ),
      done: certificates.length > 0,
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Application Pack</h1>
              <p className="text-sm text-slate-500">
                CV + photo + certificates → one PDF under the portal limit. Files stay in this tab
                until you download — nothing is uploaded or saved.
              </p>
            </div>
          </div>

          <NigerianGuide
            title="For Nigerian application portals"
            english="Check the portal instructions first, then choose the matching size limit below. Add your CV first, followed by your photo and certificates in the order the portal requests them."
            pidgin="Check wetin the portal ask for first, then choose the correct size below. Put your CV first, add your photo and certificates after am, the same order wey the portal request."
          />

          <div className="space-y-5">
            {steps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">{step.title}</h2>
                  {step.done && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">ADDED</span>
                  )}
                </div>
                {step.content}
                <p className="mt-2 text-xs text-slate-400">{step.hint}</p>
              </div>
            ))}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">4 · Size limit</h2>
                {totalInput > 0 && (
                  <span className="text-xs text-slate-400">Inputs: {formatSize(totalInput)}</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {TARGETS.map((target, index) => (
                  <button key={target.label} type="button" onClick={() => setTargetIndex(index)}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      targetIndex === index
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}>
                    {target.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Most job portals cap uploads at 2MB or 5MB — check the portal and match it here.
              </p>
            </div>

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && finalSize !== null && (
              <SuccessBanner title="Your application pack is ready.">
                <p>
                  {assets.length} document{assets.length === 1 ? '' : 's'} → one PDF,{' '}
                  <strong>{formatSize(finalSize)}</strong>
                  {finalSize <= TARGETS[targetIndex].bytes
                    ? ` — under the ${TARGETS[targetIndex].label} limit.`
                    : '.'}
                </p>
                <a href={result.url} download={result.name}
                  className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download application-pack.pdf
                </a>
              </SuccessBanner>
            )}

            {building && <LoadingBanner messages={[progress || 'Building your pack...']} />}

            <button type="button" onClick={buildPack} disabled={!cv || building}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {building ? 'Building...' : 'Build My Application Pack'}
            </button>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
