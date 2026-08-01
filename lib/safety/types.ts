export type RiskLevel = 'safe' | 'caution' | 'high-risk' | 'almost-certainly-a-scam';
export type SignalSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface Signal {
  id: string;
  title: string;
  severity: SignalSeverity;
  weight: number;
  /** Plain-language explanation — must make sense offline, with no AI. */
  explanation: string;
  advice: string;
}

export interface Verdict {
  /** 0–100, higher is worse. */
  score: number;
  level: RiskLevel;
  signals: Signal[];
  topAdvice: string[];
  engine: 'rules';
}

export const RISK_BANDS: { min: number; level: RiskLevel }[] = [
  { min: 75, level: 'almost-certainly-a-scam' },
  { min: 45, level: 'high-risk' },
  { min: 20, level: 'caution' },
  { min: 0, level: 'safe' },
];

export function riskLevel(score: number, hasCritical: boolean): RiskLevel {
  const band = RISK_BANDS.find((b) => score >= b.min)?.level ?? 'safe';
  // Any critical signal floors the level at high-risk regardless of score.
  if (hasCritical && (band === 'safe' || band === 'caution')) return 'high-risk';
  return band;
}

export function buildVerdict(signals: Signal[]): Verdict {
  const score = Math.min(100, Math.round(signals.reduce((sum, s) => sum + s.weight, 0)));
  const hasCritical = signals.some((s) => s.severity === 'critical');
  const ordered = [...signals].sort((a, b) => b.weight - a.weight);

  return {
    score,
    level: riskLevel(score, hasCritical),
    signals: ordered,
    topAdvice: ordered.slice(0, 3).map((s) => s.advice),
    engine: 'rules',
  };
}

export const RISK_LEVEL_COPY: Record<RiskLevel, { label: string; summary: string }> = {
  safe: {
    label: 'No strong warning signs',
    summary:
      'Nothing in this check matched common scam patterns. Still verify the employer independently before sharing documents or attending interviews.',
  },
  caution: {
    label: 'Be careful',
    summary:
      'Some details match patterns used in recruitment scams. Verify the company through its official website before going further.',
  },
  'high-risk': {
    label: 'High risk',
    summary:
      'Several strong scam warning signs are present. Do not send money, documents or personal details until you have independently verified this employer.',
  },
  'almost-certainly-a-scam': {
    label: 'Almost certainly a scam',
    summary:
      'This matches the pattern of known recruitment scams closely. Do not respond, do not pay anything, and warn anyone else who received it.',
  },
};
