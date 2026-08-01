'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FileDropZone } from '@/components/tool-ui/FileDropZone';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const PDF_TYPES = new Set(['application/pdf']);

export default function PdfSplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [ranges, setRanges] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedCount, setExtractedCount] = useState(0);
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  async function handleFile(picked: File) {
    setFile(picked);
    setError('');
    setPageCount(null);
    setRanges('');
    clearResult();
    try {
      const { getPdfPageCount } = await import('@/lib/pdf/merge');
      setPageCount(await getPdfPageCount(new Uint8Array(await picked.arrayBuffer())));
    } catch {
      setError('Could not read this PDF — it may be corrupted or password-protected.');
      setFile(null);
    }
  }

  async function split() {
    if (!file || !pageCount) return;
    setLoading(true);
    setError('');
    clearResult();

    try {
      const { parsePageRanges, extractPages } = await import('@/lib/pdf/split');
      const indices = parsePageRanges(ranges, pageCount);
      const bytes = await extractPages(new Uint8Array(await file.arrayBuffer()), indices);
      const baseName = file.name.replace(/\.pdf$/i, '');
      setExtractedCount(indices.length);
      setResultFromBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `${baseName}_pages.pdf`);
      promptReview('pdf-split');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Splitting failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">PDF Splitter</h1>
              <p className="text-sm text-slate-500">
                Extract exactly the pages you need — processed in your browser.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <FileDropZone
              accept=".pdf"
              allowedTypes={PDF_TYPES}
              title="Upload the PDF to split"
              hint="Processed entirely on your device"
              files={file ? [file] : []}
              onFiles={(picked) => handleFile(picked[0])}
              accent="violet"
              onReject={(_, rejected) => setError(`"${rejected.name}" is not a PDF.`)}
            />

            {file && pageCount !== null && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                    Pages to extract
                  </h2>
                  <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-600">
                    {pageCount} pages total
                  </span>
                </div>
                <input
                  id="page-ranges"
                  name="page-ranges"
                  type="text"
                  value={ranges}
                  onChange={(event) => setRanges(event.target.value)}
                  placeholder={`e.g. 1-3, 5 (out of ${pageCount})`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 transition-colors focus:border-violet-400 focus:bg-white focus:outline-none"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Use commas for separate pages and dashes for ranges: <code>1-3, 5, 8-10</code>.
                  Pages are extracted in the order you list them.
                </p>
              </div>
            )}

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && (
              <SuccessBanner title="Pages extracted.">
                <p>{extractedCount} page{extractedCount === 1 ? '' : 's'} saved to a new PDF.</p>
                <a href={result.url} download={result.name}
                  className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download {result.name}
                </a>
              </SuccessBanner>
            )}

            {loading && <LoadingBanner messages={['Extracting your pages...']} />}

            <button
              type="button"
              onClick={split}
              disabled={!file || !pageCount || !ranges.trim() || loading}
              className="w-full rounded-xl bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-100 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Splitting...' : 'Extract Pages'}
            </button>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
