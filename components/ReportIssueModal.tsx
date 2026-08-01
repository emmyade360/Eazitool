'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const ISSUE_TYPES = [
  'Bug / Something broke',
  'Tool not working',
  'File conversion failed',
  'Slow or unresponsive',
  'Wrong output / bad result',
  'UI / display problem',
  'Other',
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ReportIssueModal({ open, onClose }: Props) {
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // Reset the form when the modal transitions to open, without an effect.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setIssueType('');
      setDescription('');
      setEmail('');
      setStatus('idle');
    }
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issueType || !description.trim()) return;

    setStatus('sending');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
          subject: `[Eazitool Bug] ${issueType}`,
          from_name: 'Eazitool User',
          email: email.trim() || 'noreply@eazitool.com',
          message: `Issue Type: ${issueType}\nPage: ${pathname}\n\n${description.trim()}`,
          botcheck: '',
        }),
      });

      const data = await res.json();
      setStatus(data.success ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-blue-100 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-blue-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <h2 id="report-title" className="text-sm font-bold text-blue-900">Report an Issue</h2>
              <p className="text-xs text-blue-400">Help us fix bugs faster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-300 transition-colors hover:bg-blue-50 hover:text-blue-600"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {status === 'success' ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <svg className="h-7 w-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-base font-bold text-blue-900">Report received!</h3>
            <p className="text-sm text-blue-500">Thanks for letting us know. We&apos;ll look into it.</p>
            <button onClick={onClose} className="mt-6 rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-blue-400">
                Issue type <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-2.5 text-sm text-blue-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select issue type...</option>
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-blue-400">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe what happened, what you expected, and what tool you were using..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full resize-none rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-2.5 text-sm text-blue-900 outline-none transition placeholder:text-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-blue-300">
                Page: <span className="font-medium text-blue-400">{pathname}</span>
              </p>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-blue-400">
                Your email <span className="text-blue-300 normal-case font-normal">(optional — for follow-up)</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-2.5 text-sm text-blue-900 outline-none transition placeholder:text-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {status === 'error' && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
                Failed to send. Please try again or email us directly.
              </p>
            )}

            {/* Honeypot — hidden from real users */}
            <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} aria-hidden="true" />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-blue-100 py-2.5 text-sm font-semibold text-blue-500 transition-colors hover:bg-blue-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {status === 'sending' ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : 'Send Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
