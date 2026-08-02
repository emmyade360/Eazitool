/**
 * Offline CV ↔ job-advert keyword matching. Runs entirely on-device so the
 * gap analysis works without network; the AI pass only adds prose on top.
 */

export interface MatchReport {
  /** Advert terms found in the CV. */
  matched: string[];
  /** Advert terms absent from the CV — the gaps to close honestly. */
  missing: string[];
  /** matched / (matched + missing), 0..1. */
  coverage: number;
}

const STOPWORDS = new Set(
  (
    'a an and are as at be been but by for from has have if in into is it its of on or such that the their ' +
    'there these they this to was we were will with you your would should could than then so not no nor do ' +
    'does did done can may might must our us who whom whose what which when where why how all any both each ' +
    'few more most other some only own same too very just also able about above after again against before ' +
    'below between during over under while candidate candidates applicant applicants role position job ' +
    'company organisation organization work working team teams successful ideal required requirements ' +
    'requirement responsibilities responsibility duties duty apply application applications experience years ' +
    'year including include includes preferred must-have qualified qualification qualifications skills skill ' +
    'knowledge strong good excellent ability etc per within across ensure ensures ensuring provide providing ' +
    'salary benefits location deadline interested please email send cv resume'
  ).split(/\s+/),
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[-./]+|[-./]+$/g, ''))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

/**
 * Extract the advert's significant terms: repeated single words plus
 * two-word phrases that appear more than once (e.g. "customer service").
 */
export function extractAdvertTerms(advert: string, limit = 25): string[] {
  const words = tokenize(advert);
  const counts = new Map<string, number>();

  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([term, count]) => (term.includes(' ') ? count >= 2 : count >= 2 || term.length >= 6))
    .sort((a, b) => {
      // Phrases first (more specific), then by frequency.
      const phraseDelta = Number(b[0].includes(' ')) - Number(a[0].includes(' '));
      if (phraseDelta !== 0) return phraseDelta;
      return b[1] - a[1];
    })
    .map(([term]) => term)
    .filter((term, index, all) => {
      // Drop single words already covered by a kept phrase.
      if (term.includes(' ')) return true;
      return !all.slice(0, index).some((kept) => kept.includes(' ') && kept.includes(term));
    })
    .slice(0, limit);
}

export function matchCvToAdvert(cvText: string, advert: string): MatchReport {
  const terms = extractAdvertTerms(advert);
  const cvLower = ` ${cvText.toLowerCase().replace(/\s+/g, ' ')} `;

  const matched: string[] = [];
  const missing: string[] = [];
  for (const term of terms) {
    if (cvLower.includes(term)) matched.push(term);
    else missing.push(term);
  }

  const total = matched.length + missing.length;
  return { matched, missing, coverage: total > 0 ? matched.length / total : 0 };
}
