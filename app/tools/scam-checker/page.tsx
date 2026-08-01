'use client';

import { useState } from 'react';
import {
  applyRedactions,
  detectPii,
  type RedactionResult,
} from '@/lib/privacy/redact';
import { analyseMessage } from '@/lib/safety/scam-rules';
import { checkDomain, extractDomains } from '@/lib/safety/domain-check';
import { buildVerdict, type Verdict } from '@/lib/safety/types';
import { VerdictCard } from '@/components/safety/VerdictCard';
import { ErrorBanner } from '@/components/tool-ui/ToolStatus';

interface Analysis {
  redaction: RedactionResult;
  enabled: Set<string>;
  verdict: Verdict;
  domainSignals: number;
}

export default function ScamCheckerPage() {
  const [text, setText] = useState('');
  const [userNames, setUserNames] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const [aiText, setAiText] = useState('');
  const [aiSource, setAiSource] = useState<'ai' | 'template' | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  function analyse() {
    const trimmed = text.trim();
    if (trimmed.length < 20) {
      setError('Paste the full message — at least a sentence or two.');
      return;
    }
    setError('');
    setAiText('');
    setAiSource(null);

    const names = userNames.split(',').map((n) => n.trim()).filter(Boolean);
    const redaction = detectPii(trimmed, { userNames: names });

    // Rules run on the original text locally (nothing leaves the device);
    // domain findings from any links are merged into one combined verdict.
    const signals = [...analyseMessage(trimmed).signals];
    let domainSignals = 0;
    for (const domain of extractDomains(trimmed).slice(0, 5)) {
      for (const signal of checkDomain(domain).verdict.signals) {
        if (signal.weight > 0 && !signals.some((s) => s.id === signal.id)) {
          signals.push(signal);
          domainSignals++;
        }
      }
    }
    const verdict = buildVerdict(signals);

    setAnalysis({ redaction, enabled: new Set(redaction.defaultEnabled), verdict, domainSignals });
  }

  function toggleDetection(id: string) {
    setAnalysis((prev) => {
      if (!prev) return prev;
      const enabled = new Set(prev.enabled);
      if (enabled.has(id)) enabled.delete(id);
      else enabled.add(id);
      return { ...prev, enabled };
    });
  }

  async function explainWithAi() {
    if (!analysis) return;
    setAiLoading(true);
    setAiText('');
    try {
      const redactedText = applyRedactions(
        analysis.redaction.original,
        analysis.redaction.detections,
        analysis.enabled,
      ).slice(0, 4000);

      const res = await fetch('/api/safety/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          redactedText,
          level: analysis.verdict.level,
          signalIds: analysis.verdict.signals.map((s) => s.id),
        }),
      });
      const payload = await res.json();
      if (res.ok && payload.ok) {
        setAiText(payload.explanation);
        setAiSource(payload.source);
      } else {
        setAiText(payload.error ?? 'Explanation unavailable right now — the verdict above stands on its own.');
        setAiSource('template');
      }
    } catch {
      setAiText('You appear to be offline — the verdict above was produced on your device and stands on its own.');
      setAiSource('template');
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Scam Message Checker</h1>
            <p className="text-sm text-slate-500">
              Analysis runs on your device. Personal details are hidden before anything is sent.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label htmlFor="scam-text" className="mb-2 block text-sm font-bold uppercase tracking-widest text-slate-700">
              Paste the message
            </label>
            <textarea
              id="scam-text"
              name="scam-text"
              rows={8}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste the full job offer or recruitment message here..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-800 transition-colors focus:border-rose-300 focus:bg-white focus:outline-none"
            />
            <div className="mt-3">
              <label htmlFor="your-names" className="mb-1.5 block text-xs font-medium text-slate-500">
                Your name(s) — so we can hide them (comma-separated)
              </label>
              <input
                id="your-names"
                name="your-names"
                type="text"
                value={userNames}
                onChange={(event) => setUserNames(event.target.value)}
                placeholder="e.g. Adaeze, Ada Obi"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-rose-300 focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={analyse}
              disabled={!text.trim()}
              className="mt-4 w-full rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-100 transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check This Message
            </button>
          </div>

          <ErrorBanner message={error} onDismiss={() => setError('')} />

          {analysis && (
            <>
              <VerdictCard verdict={analysis.verdict} />

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                  Privacy preview
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Highlighted parts are hidden if you request an AI explanation. Tap any highlight
                  to keep or hide it. We hide what we can spot — check the preview yourself, because
                  anything not highlighted would be sent as-is. Links stay visible so they can be
                  analysed.
                </p>
                <div className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {analysis.redaction.segments.map((segment, index) =>
                    segment.kind === 'text' ? (
                      <span key={index}>{segment.text}</span>
                    ) : (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleDetection(segment.detection.id)}
                        title={`${segment.detection.category} — tap to ${analysis.enabled.has(segment.detection.id) ? 'keep visible' : 'hide'}`}
                        className={`rounded px-1 font-medium transition-colors ${
                          analysis.enabled.has(segment.detection.id)
                            ? 'bg-rose-100 text-rose-700 line-through decoration-rose-400'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {analysis.enabled.has(segment.detection.id)
                          ? segment.detection.label
                          : segment.text}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                    Plain-language explanation
                  </h2>
                  {aiSource && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      {aiSource === 'ai' ? 'Explained with AI' : 'Explained offline'}
                    </span>
                  )}
                </div>
                {aiText ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{aiText}</p>
                ) : (
                  <>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Optional: sends only the redacted preview above for a conversational
                      explanation. Works only when online — the verdict above never depends on it.
                    </p>
                    <button
                      type="button"
                      onClick={explainWithAi}
                      disabled={aiLoading}
                      className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                    >
                      {aiLoading ? 'Explaining...' : 'Explain in plain language'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
