import { buildVerdict, type Signal, type SignalSeverity, type Verdict } from './types';

export interface RuleContext {
  text: string;
  lower: string;
}

interface ScamRule extends Omit<Signal, 'id'> {
  id: string;
  family: 'fee' | 'rails' | 'urgency' | 'harvest' | 'too-good' | 'channel' | 'process' | 'language';
  match: (ctx: RuleContext) => boolean;
}

function keywordRule(
  id: string,
  family: ScamRule['family'],
  severity: SignalSeverity,
  weight: number,
  patterns: RegExp[],
  meta: { title: string; explanation: string; advice: string },
): ScamRule {
  return {
    id,
    family,
    severity,
    weight,
    ...meta,
    match: (ctx) => patterns.some((p) => p.test(ctx.lower)),
  };
}

export const SCAM_RULES: ScamRule[] = [
  // ── Advance fees — the defining scam move ──────────────────────────────────
  keywordRule(
    'upfront-fee',
    'fee',
    'critical',
    35,
    [
      /\b(registration|application|processing|training|medical|screening|verification|documentation|logistics?|courier|delivery|clearance|activation)\s*(fee|charge|payment|levy)\b/,
      /\bpay\b[^.]{0,40}\b(before|to)\s+(secure|confirm|process|activate)\b/,
      /\b(refundable|caution)\s*(fee|deposit)\b/,
    ],
    {
      title: 'Asks for an upfront fee',
      explanation:
        'Legitimate employers never charge candidates to apply, train, register or receive equipment. Charging a fee before employment is the defining move of recruitment fraud.',
      advice: 'Do not pay anything. Real employers pay you, not the other way round.',
    },
  ),
  keywordRule(
    'visa-travel-fee',
    'fee',
    'critical',
    30,
    [/\b(visa|work permit|flight|ticket|travel)\s*(fee|payment|processing)\b/, /\bpay\b[^.]{0,40}\bvisa\b/],
    {
      title: 'Charges for visa or travel processing',
      explanation:
        'Overseas-job scams collect "visa and flight" fees for jobs that do not exist. Genuine international employers handle immigration through official channels and rarely ask candidates to prepay.',
      advice: 'Verify any overseas offer with the embassy of the destination country before paying anyone.',
    },
  ),

  // ── Payment rails favoured by fraudsters ───────────────────────────────────
  keywordRule(
    'transfer-to-account',
    'rails',
    'high',
    20,
    [/\b(transfer|send|pay)\b[^.]{0,50}\b(account\s*(number|no)|acct)\b/, /\bpay(ment)?\s+into\b[^.]{0,40}\baccount\b/],
    {
      title: 'Asks you to pay into a personal account',
      explanation:
        'Payments to an individual’s bank account are untraceable once sent. Companies invoice through official channels, not personal transfers.',
      advice: 'Never transfer money to an account sent to you in a job message.',
    },
  ),
  keywordRule(
    'crypto-giftcard',
    'rails',
    'high',
    20,
    [/\b(bitcoin|btc|usdt|crypto(currency)?|gift\s*card|itunes|steam\s*card)\b/],
    {
      title: 'Mentions crypto or gift cards',
      explanation:
        'Cryptocurrency and gift cards are irreversible payment methods that fraudsters prefer precisely because victims cannot get the money back.',
      advice: 'Treat any employment conversation involving crypto or gift cards as fraudulent.',
    },
  ),

  // ── Personal-data harvesting ───────────────────────────────────────────────
  keywordRule(
    'sensitive-data-request',
    'harvest',
    'critical',
    30,
    [/\b(bvn|nin\b|national\s+identity\s+number)\b[^.]{0,60}\b(send|provide|submit|share|forward)\b/, /\b(send|provide|submit|share|forward)\b[^.]{0,60}\b(bvn|nin\b)\b/, /\b(otp|one.?time\s+password|card\s+pin|atm\s+pin)\b/],
    {
      title: 'Requests BVN, NIN, OTP or PIN',
      explanation:
        'No employer needs your BVN, card PIN or a one-time password to hire you. These requests exist to empty bank accounts or steal identities.',
      advice: 'Never share your BVN, PIN or any OTP with a recruiter. Banks and employers will never ask.',
    },
  ),
  keywordRule(
    'bank-details-early',
    'harvest',
    'medium',
    12,
    [/\b(bank\s+(details|information)|account\s+(number|details))\b[^.]{0,50}\b(send|provide|submit|share)\b/, /\b(send|provide|submit|share)\b[^.]{0,50}\bbank\s+(details|information)\b/],
    {
      title: 'Asks for bank details before employment',
      explanation:
        'Salary account details are collected after you sign a contract, through official onboarding — not in a chat message before any interview.',
      advice: 'Only share account details after a signed offer, through official HR channels.',
    },
  ),

  // ── Pressure and urgency ───────────────────────────────────────────────────
  keywordRule(
    'urgency',
    'urgency',
    'medium',
    10,
    [/\b(urgent(ly)?|immediately|within\s+24\s*hours?|today\s+only|slots?\s+(are\s+)?(limited|filling)|expires?\s+(today|soon)|act\s+fast|last\s+chance)\b/],
    {
      title: 'Creates artificial urgency',
      explanation:
        'Deadline pressure is designed to stop you from checking. Real recruitment gives you time to consider offers and verify details.',
      advice: 'Slow down deliberately. Any offer that cannot survive a day of verification was not real.',
    },
  ),

  // ── Too good to be true ────────────────────────────────────────────────────
  keywordRule(
    'no-requirements',
    'too-good',
    'high',
    15,
    [/\bno\s+(experience|qualifications?|interview|cv|resume)\s+(is\s+)?(needed|required|necessary)\b/, /\banyone\s+can\s+apply\b/],
    {
      title: 'No experience, CV or interview required',
      explanation:
        'Jobs that require nothing from every applicant are not hiring for work — the applicants themselves are the target.',
      advice: 'Ask what the actual job duties are and who the hiring manager is; scammers cannot answer specifically.',
    },
  ),
  keywordRule(
    'hired-without-interview',
    'process',
    'high',
    18,
    [/\b(congratulations?|you\s+have\s+been)\b[^.]{0,60}\b(selected|shortlisted|offered|employed|hired)\b/, /\bautomatic(ally)?\s+(selected|qualified|employed)\b/],
    {
      title: 'Claims you were selected without applying properly',
      explanation:
        '"Congratulations, you have been shortlisted" for a role you barely applied to — or never applied to — is a mass-message template, not a hiring decision.',
      advice: 'Ask where you applied and when. If you cannot trace your own application, it is not yours.',
    },
  ),
  keywordRule(
    'daily-pay-promise',
    'too-good',
    'medium',
    12,
    [/\b(earn|make|get\s+paid)\b[^.]{0,30}\b(daily|per\s+day|weekly)\b/, /\bwork\s+from\s+home\b[^.]{0,40}\b(earn|make)\b/],
    {
      title: 'Promises easy daily or weekly earnings',
      explanation:
        'Guaranteed effortless income is the bait of task scams and pyramid schemes, which eventually require deposits to "unlock" your earnings.',
      advice: 'Any platform that pays you only after you deposit money is a scam by design.',
    },
  ),

  // ── Channel smells ─────────────────────────────────────────────────────────
  keywordRule(
    'whatsapp-only',
    'channel',
    'medium',
    12,
    [/\b(message|chat|contact|dm|reach)\b[^.]{0,30}\b(whatsapp|telegram)\b/, /\bwhatsapp\s*(only|number|us|me)\b/, /\bwa\.me\//, /\bt\.me\//],
    {
      title: 'Recruits through WhatsApp or Telegram only',
      explanation:
        'Serious employers use official email addresses and application portals. Chat-app-only recruitment leaves no trace and no accountability.',
      advice: 'Ask for an official company email address and verify its domain before continuing.',
    },
  ),
  keywordRule(
    'free-email-hr',
    'channel',
    'medium',
    10,
    [/\b(hr|recruit(er|ment)|careers?|admin)[a-z0-9._-]*@(gmail|yahoo|outlook|hotmail|aol)\.com\b/],
    {
      title: 'Recruiter uses a free email address',
      explanation:
        'A real company HR department writes from the company’s own domain, not a Gmail or Yahoo address dressed up with the word "HR".',
      advice: 'Compare the sender’s domain against the company’s official website.',
    },
  ),
  keywordRule(
    'link-shortener',
    'channel',
    'low',
    6,
    [/\b(bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|shorturl\.at|t\.co)\//],
    {
      title: 'Uses a shortened link',
      explanation:
        'Link shorteners hide the real destination, which is often a fake portal built to harvest your details.',
      advice: 'Do not open shortened links from unknown senders. Find the site through a search engine instead.',
    },
  ),

  // ── Language family — deliberately capped at ~5 points total.
  // Informal writing is normal for many legitimate SME employers, so this can
  // only ever nudge the score, never drive it.
  keywordRule(
    'shouting-caps',
    'language',
    'info',
    3,
    [/[A-Z]{6,}(\s+[A-Z]{4,}){2,}/],
    {
      title: 'Heavy use of capital letters',
      explanation: 'Mass scam broadcasts often shout in capitals to grab attention.',
      advice: 'Judge the message by its requests, not its tone — but note the pattern.',
    },
  ),
  keywordRule(
    'excessive-exclamation',
    'language',
    'info',
    2,
    [/!{3,}/],
    {
      title: 'Excessive exclamation marks',
      explanation: 'Overexcited punctuation is common in bulk scam messages.',
      advice: 'Focus on what the message asks you to do.',
    },
  ),
];

// The caps rule needs the original casing, so give it a custom matcher.
const capsRule = SCAM_RULES.find((r) => r.id === 'shouting-caps')!;
capsRule.match = (ctx) => /[A-Z]{6,}(\s+[A-Z]{4,}){2,}/.test(ctx.text);

const LANGUAGE_FAMILY_CAP = 5;

export function analyseMessage(text: string): Verdict {
  const ctx: RuleContext = { text, lower: text.toLowerCase() };
  const matched = SCAM_RULES.filter((rule) => rule.match(ctx));

  // Cap the language family's total contribution.
  let languagePoints = 0;
  const signals: Signal[] = [];
  for (const rule of matched) {
    let weight = rule.weight;
    if (rule.family === 'language') {
      weight = Math.min(weight, Math.max(0, LANGUAGE_FAMILY_CAP - languagePoints));
      languagePoints += weight;
      if (weight === 0) continue;
    }
    signals.push({
      id: rule.id,
      title: rule.title,
      severity: rule.severity,
      weight,
      explanation: rule.explanation,
      advice: rule.advice,
    });
  }

  return buildVerdict(signals);
}

export function getSignalById(id: string): Signal | undefined {
  const rule = SCAM_RULES.find((r) => r.id === id);
  if (!rule) return undefined;
  const { title, severity, weight, explanation, advice } = rule;
  return { id, title, severity, weight, explanation, advice };
}
