import { RISK_LEVEL_COPY, type Verdict } from '@/lib/safety/types';

const LEVEL_STYLES = {
  safe: { bar: 'bg-green-500', card: 'border-green-200 bg-green-50', text: 'text-green-800' },
  caution: { bar: 'bg-amber-500', card: 'border-amber-200 bg-amber-50', text: 'text-amber-800' },
  'high-risk': { bar: 'bg-orange-500', card: 'border-orange-200 bg-orange-50', text: 'text-orange-800' },
  'almost-certainly-a-scam': { bar: 'bg-red-600', card: 'border-red-200 bg-red-50', text: 'text-red-800' },
} as const;

const SEVERITY_CHIP = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
  info: 'bg-slate-100 text-slate-500',
} as const;

export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const styles = LEVEL_STYLES[verdict.level];
  const copy = RISK_LEVEL_COPY[verdict.level];

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-6 ${styles.card}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-lg font-bold ${styles.text}`}>{copy.label}</p>
            <p className={`mt-1 text-sm leading-6 ${styles.text}`}>{copy.summary}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-3xl font-bold ${styles.text}`}>{verdict.score}</p>
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${styles.text} opacity-70`}>
              Risk / 100
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className={`h-full rounded-full transition-all ${styles.bar}`}
            style={{ width: `${Math.max(4, verdict.score)}%` }}
          />
        </div>
      </div>

      {verdict.signals.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-700">
            What was found ({verdict.signals.length})
          </h2>
          <div className="space-y-4">
            {verdict.signals.map((signal) => (
              <article key={signal.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-800">{signal.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_CHIP[signal.severity]}`}
                  >
                    {signal.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{signal.explanation}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">→ {signal.advice}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
