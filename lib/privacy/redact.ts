/**
 * Client-side PII detection and redaction. Runs entirely in the browser so
 * personal details are hidden before any text leaves the device.
 *
 * Honest limitation: automatic detection is best-effort — names especially.
 * The UI must let users add their own redactions and must never claim the
 * output is "fully anonymous".
 */

export type PiiCategory =
  | 'email'
  | 'phone'
  | 'url'
  | 'handle'
  | 'bank_account'
  | 'card'
  | 'iban'
  | 'national_id'
  | 'crypto_wallet'
  | 'person_name';

export interface Detection {
  id: string;
  category: PiiCategory;
  start: number;
  end: number;
  raw: string;
  label: string;
  confidence: 'high' | 'medium' | 'low';
  /** True when leaving the value visible helps analysis (URLs). */
  keepRecommended?: boolean;
  userAdded?: boolean;
}

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'pii'; text: string; detection: Detection };

export interface RedactionResult {
  original: string;
  detections: Detection[];
  segments: Segment[];
  /** Detection ids that should start toggled ON. */
  defaultEnabled: Set<string>;
}

export interface DetectOptions {
  /** Names supplied by the user — redacted wherever they appear. */
  userNames?: string[];
  maxLength?: number;
}

interface RawMatch {
  category: PiiCategory;
  start: number;
  end: number;
  confidence: Detection['confidence'];
  keepRecommended?: boolean;
}

// Higher number wins when spans overlap.
const PRIORITY: Record<PiiCategory, number> = {
  url: 100,
  email: 90,
  iban: 85,
  card: 80,
  national_id: 75,
  crypto_wallet: 70,
  bank_account: 60,
  phone: 50,
  handle: 40,
  person_name: 30,
};

const LABELS: Record<PiiCategory, string> = {
  email: 'EMAIL',
  phone: 'PHONE',
  url: 'LINK',
  handle: 'HANDLE',
  bank_account: 'ACCOUNT',
  card: 'CARD',
  iban: 'IBAN',
  national_id: 'ID_NUMBER',
  crypto_wallet: 'WALLET',
  person_name: 'NAME',
};

function luhnValid(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function ibanMod97(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const value = /[0-9]/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const digit of value) remainder = (remainder * 10 + (digit.charCodeAt(0) - 48)) % 97;
  }
  return remainder === 1;
}

function collect(text: string, pattern: RegExp, map: (m: RegExpExecArray) => RawMatch | null): RawMatch[] {
  const out: RawMatch[] = [];
  for (const m of text.matchAll(pattern)) {
    const mapped = map(m as RegExpExecArray);
    if (mapped) out.push(mapped);
  }
  return out;
}

function detectAll(text: string, options: DetectOptions): RawMatch[] {
  const matches: RawMatch[] = [];

  // URLs — detected so the UI can offer the toggle, but kept by default:
  // the scammer's link is the primary evidence for the domain checker.
  matches.push(
    ...collect(text, /(?:https?:\/\/|www\.)[^\s<>"']+/gi, (m) => ({
      category: 'url', start: m.index, end: m.index + m[0].length, confidence: 'high', keepRecommended: true,
    })),
  );

  matches.push(
    ...collect(text, /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, (m) => ({
      category: 'email', start: m.index, end: m.index + m[0].length, confidence: 'high',
    })),
  );

  // IBAN (mod-97 verified)
  matches.push(
    ...collect(text, /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g, (m) =>
      ibanMod97(m[0]) ? { category: 'iban', start: m.index, end: m.index + m[0].length, confidence: 'high' } : null,
    ),
  );

  // Card numbers: 13–19 digits (with separators) passing Luhn.
  matches.push(
    ...collect(text, /\b(?:\d[ -]?){13,19}\b/g, (m) => {
      const digits = m[0].replace(/[ -]/g, '');
      if (digits.length < 13 || digits.length > 19 || !luhnValid(digits)) return null;
      return { category: 'card', start: m.index, end: m.index + m[0].length, confidence: 'high' };
    }),
  );

  // National IDs — keyword-anchored only (bare 11-digit runs are usually phones).
  matches.push(
    ...collect(text, /\b(?:nin|bvn)\s*(?:no\.?|number|:|is)?\s*[:\-]?\s*(\d{11})\b/gi, (m) => {
      const start = m.index + m[0].indexOf(m[1]);
      return { category: 'national_id', start, end: start + m[1].length, confidence: 'high' };
    }),
  );
  matches.push(
    ...collect(text, /\bGHA-\d{9}-\d\b/g, (m) => ({
      category: 'national_id', start: m.index, end: m.index + m[0].length, confidence: 'high',
    })),
  );

  // Crypto wallets
  matches.push(
    ...collect(text, /\b(?:bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-fA-F0-9]{40}|T[A-Za-z1-9]{33})\b/g, (m) => ({
      category: 'crypto_wallet', start: m.index, end: m.index + m[0].length, confidence: 'high',
    })),
  );

  // Bank accounts: 10-digit NUBAN, or 8–17 digits near account keywords.
  matches.push(
    ...collect(text, /\b(?:acc(?:oun)?t\s*(?:no\.?|number|:)?|a\/c)\s*[:\-]?\s*(\d[\d ]{7,18}\d)\b/gi, (m) => {
      const start = m.index + m[0].indexOf(m[1]);
      return { category: 'bank_account', start, end: start + m[1].length, confidence: 'high' };
    }),
  );
  matches.push(
    ...collect(text, /\b\d{10}\b/g, (m) => ({
      category: 'bank_account', start: m.index, end: m.index + m[0].length, confidence: 'medium',
    })),
  );

  // Phones: international and common local shapes. Runs after card/account so
  // overlap resolution prefers the more specific categories.
  matches.push(
    ...collect(text, /(?:\+|00)\d{1,3}[ -]?\d(?:[ -]?\d){6,11}/g, (m) => ({
      category: 'phone', start: m.index, end: m.index + m[0].length, confidence: 'high',
    })),
  );
  matches.push(
    ...collect(text, /\b0[789][01]\d{8}\b/g, (m) => ({
      category: 'phone', start: m.index, end: m.index + m[0].length, confidence: 'high',
    })),
  );

  // Handles and chat links
  matches.push(
    ...collect(text, /(?:^|[\s(])@([a-zA-Z0-9._]{3,30})\b/g, (m) => {
      const start = m.index + m[0].indexOf('@');
      return { category: 'handle', start, end: m.index + m[0].length, confidence: 'medium' };
    }),
  );

  // Names — context anchors only. High precision, modest recall by design.
  // Keyword alternation covers both cases explicitly so the captured name
  // group stays case-sensitive (an /i flag would swallow lowercase words).
  const nameAnchor =
    /\b(?:[Dd]ear|[Hh]i|[Hh]ello|[Mm]r|[Mm]rs|[Mm]s|[Dd]r|[Ee]ngr|[Aa]lhaji|[Cc]hief|[Pp]astor)\.?[ \t]+([A-Z][a-z]{1,20}(?:[ \t][A-Z][a-z]{1,20})?)/g;
  matches.push(
    ...collect(text, nameAnchor, (m) => {
      const start = m.index + m[0].length - m[1].length;
      return { category: 'person_name', start, end: start + m[1].length, confidence: 'medium' };
    }),
  );
  matches.push(
    ...collect(text, /\b[Mm]y name is[ \t]+([A-Z][a-z]{1,20}(?:[ \t][A-Z][a-z]{1,20}){0,2})/g, (m) => {
      const start = m.index + m[0].length - m[1].length;
      return { category: 'person_name', start, end: start + m[1].length, confidence: 'high' };
    }),
  );

  // User-supplied names — the reliable path. Every occurrence, case-insensitive.
  for (const name of options.userNames ?? []) {
    const trimmed = name.trim();
    if (trimmed.length < 2) continue;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    matches.push(
      ...collect(text, new RegExp(`\\b${escaped}\\b`, 'gi'), (m) => ({
        category: 'person_name', start: m.index, end: m.index + m[0].length, confidence: 'high',
      })),
    );
  }

  return matches;
}

function resolveOverlaps(matches: RawMatch[]): RawMatch[] {
  const sorted = [...matches].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const priority = PRIORITY[b.category] - PRIORITY[a.category];
    if (priority !== 0) return priority;
    return b.end - a.end;
  });

  const kept: RawMatch[] = [];
  for (const match of sorted) {
    const clash = kept.find((k) => match.start < k.end && k.start < match.end);
    if (!clash) {
      kept.push(match);
      continue;
    }
    // Replace the kept match only when this one clearly outranks it.
    if (
      PRIORITY[match.category] > PRIORITY[clash.category] ||
      (PRIORITY[match.category] === PRIORITY[clash.category] && match.end - match.start > clash.end - clash.start)
    ) {
      kept.splice(kept.indexOf(clash), 1, match);
    }
  }
  return kept.sort((a, b) => a.start - b.start);
}

function buildResult(text: string, resolved: RawMatch[]): RedactionResult {
  const labelIndex = new Map<string, number>();
  const labelByRaw = new Map<string, string>();
  const detections: Detection[] = resolved.map((match) => {
    const raw = text.slice(match.start, match.end);
    const rawKey = `${match.category}:${raw.toLowerCase()}`;
    let label = labelByRaw.get(rawKey);
    if (!label) {
      const n = (labelIndex.get(match.category) ?? 0) + 1;
      labelIndex.set(match.category, n);
      label = `[${LABELS[match.category]}_${n}]`;
      labelByRaw.set(rawKey, label);
    }
    return {
      id: `${match.category}:${match.start}:${match.end}`,
      category: match.category,
      start: match.start,
      end: match.end,
      raw,
      label,
      confidence: match.confidence,
      keepRecommended: match.keepRecommended,
    };
  });

  const segments: Segment[] = [];
  let cursor = 0;
  for (const detection of detections) {
    if (detection.start > cursor) segments.push({ kind: 'text', text: text.slice(cursor, detection.start) });
    segments.push({ kind: 'pii', text: detection.raw, detection });
    cursor = detection.end;
  }
  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) });

  const defaultEnabled = new Set(detections.filter((d) => !d.keepRecommended).map((d) => d.id));

  return { original: text, detections, segments, defaultEnabled };
}

export function detectPii(text: string, options: DetectOptions = {}): RedactionResult {
  const capped = text.slice(0, options.maxLength ?? 20_000);
  return buildResult(capped, resolveOverlaps(detectAll(capped, options)));
}

export function applyRedactions(
  text: string,
  detections: Detection[],
  enabled: Set<string>,
): string {
  let out = '';
  let cursor = 0;
  for (const detection of [...detections].sort((a, b) => a.start - b.start)) {
    out += text.slice(cursor, detection.start);
    out += enabled.has(detection.id) ? detection.label : text.slice(detection.start, detection.end);
    cursor = detection.end;
  }
  return out + text.slice(cursor);
}

export function addUserDetection(
  result: RedactionResult,
  start: number,
  end: number,
): RedactionResult {
  if (end <= start) return result;
  const match: RawMatch = { category: 'person_name', start, end, confidence: 'high' };
  const raws: RawMatch[] = result.detections.map((d) => ({
    category: d.category, start: d.start, end: d.end, confidence: d.confidence, keepRecommended: d.keepRecommended,
  }));
  const rebuilt = buildResult(result.original, resolveOverlaps([...raws, match]));
  return rebuilt;
}

/** Server-side guard: true when text still contains high-confidence PII. */
export function containsHighConfidencePii(text: string): boolean {
  return detectPii(text).detections.some((d) => d.confidence === 'high' && !d.keepRecommended);
}
