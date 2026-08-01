'use client';

import { useEffect, useState, type ReactNode } from 'react';

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 text-red-400 transition-colors hover:text-red-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-4 text-sm text-green-700">
      <div className="mb-2 flex items-center gap-2">
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-semibold">{title}</span>
      </div>
      {children}
    </div>
  );
}

/**
 * Cycles through status messages while work is in flight. Unlike the previous
 * per-tool implementation this never delays the result — it only labels the
 * wait that actually happens.
 */
export function LoadingBanner({
  messages,
  stepMs = 2500,
  hint,
}: {
  messages: readonly string[];
  stepMs?: number;
  hint?: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, messages.length - 1));
    }, stepMs);
    return () => window.clearInterval(timer);
  }, [messages.length, stepMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-amber-800 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-6 items-end gap-1" aria-hidden>
          <span className="h-3 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:0ms]" />
          <span className="h-5 w-1.5 animate-bounce rounded-full bg-amber-600 [animation-delay:120ms]" />
          <span className="h-4 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:240ms]" />
        </div>
        <div>
          <p className="font-semibold">{messages[Math.min(step, messages.length - 1)]}</p>
          {hint && <p className="mt-1 text-xs text-amber-700">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
