import { BRANDS } from './brands';
import { buildVerdict, type Signal, type Verdict } from './types';

/**
 * Pattern-based checks on a URL or domain — lookalikes, misleading subdomains,
 * suspicious endings. Entirely offline: no WHOIS, DNS or reputation lookups,
 * and the UI must present results as patterns to verify, not verdicts of fact.
 */

export interface DomainCheck {
  input: string;
  hostname: string | null;
  registrableDomain: string | null;
  subdomains: string[];
  isIpLiteral: boolean;
  isPunycode: boolean;
  hasUserInfo: boolean;
  brandMatch?: {
    brand: string;
    officialDomains: string[];
    kind: 'official' | 'subdomain-impersonation' | 'typo' | 'lookalike';
  };
  verdict: Verdict;
}

/**
 * Multi-part public suffixes relevant to this audience, so eTLD+1 extraction
 * gets `.com.ng`-style domains right. Anything not listed falls back to the
 * last label. Deliberately small instead of shipping the full PSL (~200KB).
 */
const MULTI_PART_SUFFIXES = new Set([
  'com.ng', 'org.ng', 'gov.ng', 'edu.ng', 'net.ng', 'sch.ng', 'name.ng', 'mil.ng',
  'co.ke', 'or.ke', 'go.ke', 'ac.ke', 'ne.ke',
  'co.za', 'org.za', 'gov.za', 'ac.za', 'web.za', 'net.za',
  'com.gh', 'org.gh', 'gov.gh', 'edu.gh',
  'co.tz', 'go.tz', 'or.tz', 'ac.tz',
  'co.ug', 'or.ug', 'go.ug', 'ac.ug',
  'com.eg', 'org.eg', 'gov.eg',
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk',
  'com.au', 'com.br', 'co.in', 'co.jp',
]);

const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'icu', 'cfd', 'sbs', 'click', 'link', 'rest', 'zip', 'quest',
  'buzz', 'work', 'gq', 'tk', 'ml', 'cf', 'ga', 'monster', 'lol', 'cyou',
]);

const CONFUSABLES: Record<string, string> = {
  '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g',
  а: 'a', е: 'e', о: 'o', р: 'p', с: 'c', х: 'x', у: 'y', і: 'i', ѕ: 's',
  ο: 'o', ρ: 'p', α: 'a', ν: 'v',
};

/** Reduce a label to a lookalike skeleton so `f1rstbank` matches `firstbank`. */
export function skeleton(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split('')
    .map((ch) => CONFUSABLES[ch] ?? ch)
    .join('')
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w');
}

export function damerauLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

export function splitRegistrable(hostname: string): {
  registrableDomain: string | null;
  subdomains: string[];
} {
  const labels = hostname.split('.').filter(Boolean);
  if (labels.length < 2) return { registrableDomain: null, subdomains: [] };

  const lastTwo = labels.slice(-2).join('.');
  const suffixLen = MULTI_PART_SUFFIXES.has(lastTwo) ? 2 : 1;
  if (labels.length < suffixLen + 1) return { registrableDomain: null, subdomains: [] };

  const registrableDomain = labels.slice(-(suffixLen + 1)).join('.');
  return { registrableDomain, subdomains: labels.slice(0, -(suffixLen + 1)) };
}

export function extractDomains(text: string): string[] {
  const pattern = /(?:https?:\/\/[^\s<>"')\]]+)|(?:\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9][a-z0-9-]*)+\b(?:\/[^\s<>"')\]]*)?)/gi;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of text.match(pattern) ?? []) {
    const cleaned = match.replace(/[.,;:!?]+$/, '');
    // Skip bare email addresses — the free-email rule handles those.
    if (/^[^/]*@/.test(cleaned)) continue;
    if (!seen.has(cleaned.toLowerCase())) {
      seen.add(cleaned.toLowerCase());
      out.push(cleaned);
    }
  }
  return out;
}

export function checkDomain(input: string): DomainCheck {
  const trimmed = input.trim();
  const signals: Signal[] = [];

  let url: URL | null = null;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return {
      input: trimmed,
      hostname: null,
      registrableDomain: null,
      subdomains: [],
      isIpLiteral: false,
      isPunycode: false,
      hasUserInfo: false,
      verdict: buildVerdict([
        {
          id: 'unparseable',
          title: 'Not a valid web address',
          severity: 'info',
          weight: 0,
          explanation: 'This text could not be read as a web address, so no checks could run.',
          advice: 'Paste the full link, for example https://careers.example.com/apply.',
        },
      ]),
    };
  }

  const hostname = url.hostname.toLowerCase();
  const hasUserInfo = url.username !== '' || url.password !== '';
  const isIpLiteral = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.startsWith('[');
  const isPunycode = hostname.split('.').some((l) => l.startsWith('xn--'));
  const { registrableDomain, subdomains } = splitRegistrable(hostname);

  if (url.protocol === 'http:') {
    signals.push({
      id: 'no-https',
      title: 'Not a secure (https) address',
      severity: 'medium',
      weight: 10,
      explanation: 'Legitimate application portals use https. An http-only page offers no protection for anything you type.',
      advice: 'Never enter personal details on an http page.',
    });
  }

  if (hasUserInfo) {
    signals.push({
      id: 'userinfo-trick',
      title: `The real destination is ${hostname}`,
      severity: 'critical',
      weight: 35,
      explanation: `This link contains an "@" trick: everything before the @ is decoration, and the browser actually visits ${hostname}.`,
      advice: 'Treat this link as hostile — the visible name is camouflage.',
    });
  }

  if (isIpLiteral) {
    signals.push({
      id: 'ip-literal',
      title: 'Address is a raw IP number',
      severity: 'high',
      weight: 20,
      explanation: 'Companies use named domains. Raw IP addresses are typical of throwaway scam infrastructure.',
      advice: 'Do not enter any information on this site.',
    });
  }

  if (isPunycode) {
    signals.push({
      id: 'punycode',
      title: 'Uses disguised international characters',
      severity: 'critical',
      weight: 30,
      explanation: 'The address contains encoded lookalike characters (punycode), a technique used to imitate real domain names.',
      advice: 'Assume impersonation. Find the official site through a search engine instead.',
    });
  }

  const tld = hostname.split('.').pop() ?? '';
  if (SUSPICIOUS_TLDS.has(tld)) {
    signals.push({
      id: 'suspicious-tld',
      title: `Ends in .${tld}`,
      severity: 'medium',
      weight: 10,
      explanation: `Domains ending in .${tld} are cheap or free, which makes them popular for short-lived scam sites. Legitimate sites use them too, so this alone proves nothing.`,
      advice: 'Weigh this together with the other findings rather than on its own.',
    });
  }

  if (subdomains.length > 3) {
    signals.push({
      id: 'deep-subdomains',
      title: 'Unusually deep chain of subdomains',
      severity: 'low',
      weight: 5,
      explanation: 'Long subdomain chains are often used to push a convincing name into the visible part of the address bar.',
      advice: 'Read the address from the right: the true owner is the last two or three parts.',
    });
  }

  // ── Brand analysis ──────────────────────────────────────────────────────────
  let brandMatch: DomainCheck['brandMatch'];
  const registrableSld = registrableDomain?.split('.')[0] ?? '';
  const hostSkeleton = skeleton(hostname.replace(/\./g, ''));

  for (const brand of BRANDS) {
    const officialSet = new Set(brand.officialDomains.map((d) => d.toLowerCase()));
    const isOfficial =
      registrableDomain !== null &&
      (officialSet.has(registrableDomain) ||
        brand.officialDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`)));

    const tokenInHost = brand.tokens.some((t) => hostSkeleton.includes(skeleton(t)));
    if (!tokenInHost) {
      // Typosquatting: registrable SLD close to an official SLD.
      const typo = brand.officialDomains.some((d) => {
        const sld = d.split('.')[0];
        return (
          sld.length >= 5 &&
          registrableSld.length >= 4 &&
          damerauLevenshtein(skeleton(registrableSld), skeleton(sld)) === 1
        );
      });
      if (typo && !isOfficial) {
        brandMatch = { brand: brand.name, officialDomains: brand.officialDomains, kind: 'typo' };
        signals.push({
          id: 'typosquat',
          title: `One letter away from ${brand.name}'s official domain`,
          severity: 'high',
          weight: 25,
          explanation: `"${registrableDomain}" differs from ${brand.name}'s official domain by a single character — the classic typosquatting pattern.`,
          advice: `Type the official address yourself: ${brand.officialDomains[0]}.`,
        });
        break;
      }
      continue;
    }

    if (isOfficial) {
      brandMatch = { brand: brand.name, officialDomains: brand.officialDomains, kind: 'official' };
      break;
    }

    const tokenInSubdomain = subdomains.some((s) =>
      brand.tokens.some((t) => skeleton(s).includes(skeleton(t))),
    );
    if (tokenInSubdomain) {
      brandMatch = {
        brand: brand.name,
        officialDomains: brand.officialDomains,
        kind: 'subdomain-impersonation',
      };
      signals.push({
        id: 'subdomain-impersonation',
        title: `"${brand.name}" appears in the subdomain, but the site belongs to ${registrableDomain}`,
        severity: 'critical',
        weight: 35,
        explanation: `Anyone who owns ${registrableDomain} can create a subdomain containing "${brand.name}". The real owner of this address is ${registrableDomain}, not ${brand.name}.`,
        advice: `This does not match the official domain we have on record (${brand.officialDomains[0]}). Verify independently before entering anything.`,
      });
      break;
    }

    brandMatch = { brand: brand.name, officialDomains: brand.officialDomains, kind: 'lookalike' };
    signals.push({
      id: 'brand-lookalike',
      title: `Contains "${brand.name}" but is not the official domain`,
      severity: 'high',
      weight: 25,
      explanation: `The address invokes ${brand.name}, but it does not match the official domain we have on record (${brand.officialDomains.join(', ')}). Lookalike registrations are a standard impersonation technique.`,
      advice: `Reach ${brand.name} through ${brand.officialDomains[0]} — typed by you, not clicked from a message.`,
    });
    break;
  }

  if (registrableSld.includes('-') && /careers?|jobs?|recruit|vacanc|apply|portal|verify|secure|login/.test(registrableSld)) {
    signals.push({
      id: 'keyword-hyphen-domain',
      title: 'Recruitment keywords bolted into the domain name',
      severity: 'medium',
      weight: 10,
      explanation: 'Domains like "brand-careers-portal" are typically registered by third parties, since companies host careers pages on their main domain.',
      advice: 'Find the careers page by navigating from the company homepage instead.',
    });
  }

  return {
    input: trimmed,
    hostname,
    registrableDomain,
    subdomains,
    isIpLiteral,
    isPunycode,
    hasUserInfo,
    brandMatch,
    verdict: buildVerdict(signals),
  };
}
