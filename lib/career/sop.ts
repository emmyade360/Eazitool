/**
 * Statement of purpose drafting. The structured draft is built on-device from
 * the applicant's own answers, so the tool works offline; the AI pass only
 * tightens the prose.
 */

export interface SopAnswers {
  fullName: string;
  programme: string;
  university: string;
  country: string;
  degree: string;
  institution: string;
  grade: string;
  motivation: string;
  experience: string;
  whyProgramme: string;
  careerGoal: string;
  contribution: string;
}

export const SOP_FIELDS: {
  key: keyof SopAnswers;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea';
  required?: boolean;
}[] = [
  { key: 'fullName', label: 'Your full name', placeholder: 'e.g. Adaeze Obi', type: 'text', required: true },
  { key: 'programme', label: 'Programme you are applying for', placeholder: 'e.g. MSc Data Science', type: 'text', required: true },
  { key: 'university', label: 'University', placeholder: 'e.g. University of Leeds', type: 'text', required: true },
  { key: 'country', label: 'Country', placeholder: 'e.g. United Kingdom', type: 'text' },
  { key: 'degree', label: 'Your current/previous degree', placeholder: 'e.g. BSc Statistics', type: 'text', required: true },
  { key: 'institution', label: 'Where you studied it', placeholder: 'e.g. University of Ibadan', type: 'text', required: true },
  { key: 'grade', label: 'Your result', placeholder: 'e.g. Second Class Upper (3.82/5.0)', type: 'text' },
  {
    key: 'motivation',
    label: 'What first drew you to this field?',
    placeholder: 'A specific moment, project or problem — not a general statement.',
    type: 'textarea',
    required: true,
  },
  {
    key: 'experience',
    label: 'Relevant work, research or projects',
    placeholder: 'Roles, responsibilities and what you achieved. Include numbers where you can.',
    type: 'textarea',
    required: true,
  },
  {
    key: 'whyProgramme',
    label: 'Why this specific programme and university?',
    placeholder: 'Named modules, research groups or lecturers — this is where generic statements get rejected.',
    type: 'textarea',
    required: true,
  },
  {
    key: 'careerGoal',
    label: 'What you plan to do after graduating',
    placeholder: 'Short-term role and longer-term ambition.',
    type: 'textarea',
    required: true,
  },
  {
    key: 'contribution',
    label: 'What you will bring to the department (optional)',
    placeholder: 'Perspective, skills, community involvement.',
    type: 'textarea',
  },
];

const clean = (s: string) => s.trim().replace(/\s+/g, ' ');

/** Build the four-part SOP structure entirely offline. */
export function buildSopDraft(a: SopAnswers): string {
  const programme = clean(a.programme) || '[programme]';
  const university = clean(a.university) || '[university]';
  const country = clean(a.country);

  const opening = [
    `My interest in ${programme.replace(/^(MSc|MA|MBA|PhD)\s+/i, '')} began with something concrete rather than abstract.`,
    clean(a.motivation),
    `That experience convinced me to pursue formal graduate training, and it is why I am applying for the ${programme} at ${university}${country ? `, ${country}` : ''}.`,
  ]
    .filter(Boolean)
    .join(' ');

  const background = [
    `I hold a ${clean(a.degree) || '[degree]'} from ${clean(a.institution) || '[institution]'}${a.grade.trim() ? `, graduating with ${clean(a.grade)}` : ''}.`,
    clean(a.experience),
    'This combination of academic grounding and practical work has shown me both what I can already do and precisely where I need deeper training.',
  ]
    .filter(Boolean)
    .join(' ');

  const fit = [
    `${university} is my clear choice for this next stage.`,
    clean(a.whyProgramme),
    'I am confident the structure and focus of this programme match the gaps I have identified in my own preparation.',
  ]
    .filter(Boolean)
    .join(' ');

  const goals = [
    clean(a.careerGoal),
    a.contribution.trim()
      ? clean(a.contribution)
      : '',
    `I would welcome the opportunity to bring this focus to ${university}, and I am committed to making full use of the training the programme offers.`,
  ]
    .filter(Boolean)
    .join(' ');

  return [opening, background, fit, goals].join('\n\n');
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
