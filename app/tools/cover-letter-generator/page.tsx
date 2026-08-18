'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBanner, LoadingBanner, SuccessBanner } from '@/components/tool-ui/ToolStatus';
import { useDownloadResult } from '@/lib/hooks/use-download-result';
import { useReviewPrompt } from '@/lib/hooks/use-review-prompt';

const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none';

export default function CoverLetterGeneratorPage() {
  const [applicantName, setApplicantName] = useState('');
  const [applicantAddress, setApplicantAddress] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [employerAddress, setEmployerAddress] = useState('');
  const [role, setRole] = useState('');
  const [background, setBackground] = useState('');
  const [jobPost, setJobPost] = useState('');
  const [body, setBody] = useState('');
  const [bodyGenerated, setBodyGenerated] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const { result, setResultFromBlob, clear: clearResult } = useDownloadResult();
  const { promptReview, reviewModalProps } = useReviewPrompt();

  const canTailor = Boolean(
    applicantName.trim() &&
      (applicantEmail.trim() || applicantPhone.trim()) &&
      role.trim() &&
      background.trim().length >= 30 &&
      jobPost.trim().length >= 80,
  );

  function clearPdfResult() {
    clearResult();
    setError('');
  }

  function resetTailoredLetter() {
    clearPdfResult();
    if (bodyGenerated) {
      setBody('');
      setBodyGenerated(false);
    }
  }

  async function generateTailoredLetter() {
    if (!canTailor) {
      setError('Complete your details, role, background and full hiring post before tailoring the letter.');
      return;
    }

    setTailoring(true);
    setError('');
    clearResult();
    try {
      const response = await fetch('/api/career/generate-application-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          applicantName,
          applicantEmail,
          applicantPhone,
          employerName,
          role,
          background,
          jobPost,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok || typeof payload.letter !== 'string') {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Could not tailor your letter.');
      }
      setBody(payload.letter);
      setBodyGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not tailor your letter.');
    } finally {
      setTailoring(false);
    }
  }

  async function exportPdf() {
    if (!applicantName.trim() || !role.trim() || !body.trim()) {
      setError('Generate your tailored letter before downloading the PDF.');
      return;
    }
    setExporting(true);
    setError('');
    clearResult();
    try {
      const { renderLetterPdf } = await import('@/lib/docs/render-letter');
      const bytes = await renderLetterPdf({
        applicantName: applicantName.trim(),
        applicantAddressLines: applicantAddress.split('\n').filter(Boolean),
        applicantPhone: applicantPhone || undefined,
        applicantEmail: applicantEmail || undefined,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        employerName: employerName.trim() || 'The Hiring Manager',
        employerAddressLines: employerAddress.split('\n').filter(Boolean),
        role: role.trim(),
        body: body.trim(),
      });
      setResultFromBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), 'application-letter.pdf');
      promptReview('cover-letter-generator');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate the letter.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Application Letter Generator</h1>
              <p className="text-sm text-slate-500">
                Share your details and the hiring post, then get a letter tailored to that role.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">1. Your Details</h2>
                <div className="space-y-2.5">
                  <input type="text" name="applicant-name" placeholder="Full name *" aria-label="Your full name"
                    value={applicantName} onChange={(e) => { setApplicantName(e.target.value); resetTailoredLetter(); }} className={inputClass} />
                  <textarea name="applicant-address" placeholder={'Your address\n(one line per row)'} aria-label="Your address" rows={2}
                    value={applicantAddress} onChange={(e) => { setApplicantAddress(e.target.value); clearPdfResult(); }} className={inputClass} />
                  <input type="text" name="applicant-phone" placeholder="Phone (or email) *" aria-label="Your phone"
                    value={applicantPhone} onChange={(e) => { setApplicantPhone(e.target.value); resetTailoredLetter(); }} className={inputClass} />
                  <input type="email" name="applicant-email" placeholder="Email (or phone) *" aria-label="Your email"
                    value={applicantEmail} onChange={(e) => { setApplicantEmail(e.target.value); resetTailoredLetter(); }} className={inputClass} />
                  <textarea name="applicant-background" placeholder="Your relevant experience, qualifications, skills and achievements *" aria-label="Your relevant background" rows={4}
                    value={background} onChange={(e) => { setBackground(e.target.value); resetTailoredLetter(); }} className={inputClass} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">2. Role &amp; Employer</h2>
                <div className="space-y-2.5">
                  <input type="text" name="role" placeholder="Position, e.g. Accountant *" aria-label="Position"
                    value={role} onChange={(e) => { setRole(e.target.value); resetTailoredLetter(); }} className={inputClass} />
                  <input type="text" name="employer-name" placeholder="Company / employer name" aria-label="Employer name"
                    value={employerName} onChange={(e) => { setEmployerName(e.target.value); resetTailoredLetter(); }} className={inputClass} />
                  <textarea name="employer-address" placeholder={'Employer address\n(one line per row)'} aria-label="Employer address" rows={2}
                    value={employerAddress} onChange={(e) => { setEmployerAddress(e.target.value); clearPdfResult(); }} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label htmlFor="hiring-post" className="mb-2 block text-sm font-bold uppercase tracking-widest text-slate-700">
                3. Paste the Hiring Post <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="hiring-post"
                name="hiring-post"
                aria-label="Hiring post"
                rows={8}
                value={jobPost}
                onChange={(e) => { setJobPost(e.target.value); resetTailoredLetter(); }}
                className={`${inputClass} leading-6`}
                placeholder="Paste the complete job post here, including the responsibilities, requirements and preferred skills..."
              />
              <p className="mt-2 text-xs text-slate-400">
                The AI uses this post to understand what the employer needs. It only uses the experience and facts you provide above.
              </p>
            </div>

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            {result && (
              <SuccessBanner title="Your application letter is ready.">
                <a href={result.url} download={result.name}
                  className="mt-2 inline-flex rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700">
                  Download application-letter.pdf
                </a>
              </SuccessBanner>
            )}

            <button type="button" onClick={generateTailoredLetter} disabled={tailoring || exporting || !canTailor}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {tailoring ? 'Tailoring your letter...' : 'Generate Tailored Application Letter'}
            </button>

            {tailoring && <LoadingBanner messages={['Reading the hiring post...', 'Matching your experience to the role...', 'Writing your application letter...']} />}

            {bodyGenerated && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">Your Tailored Letter</h2>
                  <span className="text-xs font-semibold text-blue-600">Edit before downloading</span>
                </div>
                <textarea
                  name="letter-body"
                  aria-label="Tailored letter body"
                  rows={11}
                  value={body}
                  onChange={(e) => { setBody(e.target.value); clearPdfResult(); }}
                  className={`${inputClass} leading-6`}
                />
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Review every claim and personalise the wording before submitting your application.
                </p>
              </div>
            )}

            {exporting && <LoadingBanner messages={['Formatting your letter...']} />}

            <button type="button" onClick={exportPdf} disabled={tailoring || exporting || !body.trim()}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {exporting ? 'Preparing PDF...' : 'Download Letter as PDF'}
            </button>
          </div>
        </div>
      </div>

      <ReviewModal {...reviewModalProps} />
    </>
  );
}
