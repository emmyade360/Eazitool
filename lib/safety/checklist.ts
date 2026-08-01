import { buildVerdict, type Signal, type SignalSeverity, type Verdict } from './types';

/**
 * The human-answerable projection of the scam rules: each item asks about a
 * signal the automated checker looks for, so the two tools stay in agreement.
 */
export interface ChecklistItem {
  id: string;
  question: string;
  severity: SignalSeverity;
  weight: number;
  whyItMatters: string;
  advice: string;
}

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'asked-for-money',
    question: 'Have you been asked to pay anything — registration, training, medical, courier or any other fee?',
    severity: 'critical',
    weight: 35,
    whyItMatters:
      'Charging candidates is the defining move of recruitment fraud. Legitimate employers never charge you to be hired.',
    advice: 'Do not pay. Withdraw from the process.',
  },
  {
    id: 'no-interview',
    question: 'Were you offered the job without any real interview or assessment?',
    severity: 'high',
    weight: 18,
    whyItMatters:
      'Real hiring evaluates candidates. Instant offers are mass-message templates hunting for victims, not hiring decisions.',
    advice: 'Ask for a formal interview with named staff at a verifiable company address.',
  },
  {
    id: 'chat-app-only',
    question: 'Is all communication happening through WhatsApp or Telegram only?',
    severity: 'medium',
    weight: 12,
    whyItMatters:
      'Chat-only recruitment leaves no accountability. Companies use official email domains and portals.',
    advice: 'Request an official company email address and check its domain.',
  },
  {
    id: 'free-email',
    question: 'Does the recruiter write from a free address like Gmail or Yahoo rather than a company domain?',
    severity: 'medium',
    weight: 10,
    whyItMatters: 'A genuine HR department writes from the company’s own domain.',
    advice: 'Compare the sender domain with the company’s official website.',
  },
  {
    id: 'salary-too-high',
    question: 'Is the salary clearly above the normal market rate for that role and experience level?',
    severity: 'medium',
    weight: 10,
    whyItMatters: 'Inflated salaries are bait to make you overlook the warning signs.',
    advice: 'Check typical pay for the role. Offers far above market deserve extra scrutiny, not excitement.',
  },
  {
    id: 'sensitive-data',
    question: 'Have they asked for your BVN, NIN, card details, PIN or any OTP?',
    severity: 'critical',
    weight: 30,
    whyItMatters: 'No employer needs these to hire you — they are only useful for stealing from you.',
    advice: 'Refuse, and if you already shared banking details, contact your bank immediately.',
  },
  {
    id: 'pressure',
    question: 'Are they pressuring you to decide or pay within hours?',
    severity: 'medium',
    weight: 10,
    whyItMatters: 'Urgency exists to stop you from verifying. Real offers survive a few days of checking.',
    advice: 'Take the time to verify regardless of any stated deadline.',
  },
  {
    id: 'vague-details',
    question: 'Are they unable to name a specific office address, hiring manager, or clear job duties?',
    severity: 'high',
    weight: 15,
    whyItMatters: 'Scammers avoid verifiable specifics because specifics can be checked.',
    advice: 'Ask for the office address and look it up. Ask for the hiring manager’s full name and role.',
  },
  {
    id: 'unverifiable-company',
    question: 'Is the company impossible to find through an independent search — or does the website look newly thrown together?',
    severity: 'high',
    weight: 15,
    whyItMatters:
      'Real employers leave a trail: registrations, reviews, staff on LinkedIn, news mentions. Ghosts do not.',
    advice: 'Search the company name plus the word "scam". Check the CAC registry for Nigerian companies.',
  },
  {
    id: 'link-mismatch',
    question: 'Does the application link differ from the company’s official website domain?',
    severity: 'high',
    weight: 15,
    whyItMatters:
      'Fake portals imitate real employers on lookalike domains to harvest applications and fees.',
    advice: 'Use the Employer Website Checker on the link, and apply only through the official site.',
  },
];

export type ChecklistAnswer = 'yes' | 'no' | 'unsure';

export function scoreChecklist(answers: Record<string, ChecklistAnswer>): Verdict {
  const signals: Signal[] = [];

  for (const item of CHECKLIST_ITEMS) {
    const answer = answers[item.id];
    if (answer !== 'yes' && answer !== 'unsure') continue;
    // "Not sure" carries half weight — uncertainty is information, not proof.
    const weight = answer === 'yes' ? item.weight : Math.round(item.weight / 2);
    signals.push({
      id: item.id,
      title: item.question,
      severity: answer === 'yes' ? item.severity : 'low',
      weight,
      explanation: item.whyItMatters,
      advice: item.advice,
    });
  }

  return buildVerdict(signals);
}
