/**
 * Original aptitude questions in the style of Nigerian graduate-recruitment
 * tests (Dragnet/GSE-style). Numerical items are generated from seeded
 * parameters so every attempt differs; verbal and logical items are authored.
 *
 * Deliberately original — no past-question text is reproduced.
 */

export type Section = 'numerical' | 'verbal' | 'logical';

export interface Question {
  id: string;
  section: Section;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export const SECTION_LABELS: Record<Section, string> = {
  numerical: 'Numerical Reasoning',
  verbal: 'Verbal Reasoning',
  logical: 'Logical Reasoning',
};

/** Small deterministic PRNG so a seed reproduces a paper exactly. */
function makeRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

const pick = <T,>(rand: () => number, items: readonly T[]): T => items[Math.floor(rand() * items.length)];
const between = (rand: () => number, min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

/**
 * Build the option list, dropping distractors that collide with the correct
 * answer (arithmetic sometimes produces duplicates) and topping up with
 * numeric variants so every question keeps four distinct choices.
 */
function shuffleWithAnswer(rand: () => number, correct: string, distractors: string[]) {
  const seen = new Set([correct]);
  const options = [correct];

  for (const distractor of distractors) {
    if (seen.has(distractor)) continue;
    seen.add(distractor);
    options.push(distractor);
  }

  // Top up by nudging the digits in the correct answer.
  let attempt = 0;
  while (options.length < 4 && attempt < 40) {
    attempt++;
    const factor = 1 + (attempt % 2 === 0 ? 1 : -1) * (0.07 * Math.ceil(attempt / 2) + rand() * 0.05);
    const candidate = correct.replace(/[\d,]+(\.\d+)?/, (match) => {
      const value = Number.parseFloat(match.replace(/,/g, ''));
      if (!Number.isFinite(value) || value === 0) return match;
      const scaled = Math.round(value * factor);
      return match.includes(',') ? scaled.toLocaleString('en-NG') : String(scaled);
    });
    if (candidate === correct || seen.has(candidate)) continue;
    seen.add(candidate);
    options.push(candidate);
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, answerIndex: options.indexOf(correct) };
}

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

type Generator = (rand: () => number, id: string) => Question;

const NUMERICAL_GENERATORS: Generator[] = [
  // Percentage increase/decrease
  (rand, id) => {
    const base = between(rand, 20, 90) * 1000;
    const pct = pick(rand, [5, 10, 12, 15, 20, 25]);
    const rising = rand() > 0.5;
    const result = rising ? base * (1 + pct / 100) : base * (1 - pct / 100);
    const correct = naira(Math.round(result));
    return {
      id,
      section: 'numerical',
      prompt: `A trader's monthly sales were ${naira(base)}. Sales ${rising ? 'increased' : 'decreased'} by ${pct}% the following month. What were the new sales?`,
      explanation: `${pct}% of ${naira(base)} is ${naira(Math.round((base * pct) / 100))}. ${rising ? 'Adding' : 'Subtracting'} gives ${correct}.`,
      ...shuffleWithAnswer(rand, correct, [
        naira(Math.round(rising ? base * (1 - pct / 100) : base * (1 + pct / 100))),
        naira(Math.round(base + (base * pct) / 50)),
        naira(Math.round(base * (1 + pct / 200))),
      ]),
    };
  },
  // Ratio sharing
  (rand, id) => {
    const a = between(rand, 2, 5);
    const b = between(rand, 2, 6);
    const c = between(rand, 1, 4);
    const unit = between(rand, 4, 15) * 1000;
    const total = (a + b + c) * unit;
    const correct = naira(b * unit);
    return {
      id,
      section: 'numerical',
      prompt: `${naira(total)} is shared among three partners in the ratio ${a}:${b}:${c}. How much does the second partner receive?`,
      explanation: `Total parts = ${a}+${b}+${c} = ${a + b + c}. One part = ${naira(unit)}. The second partner gets ${b} × ${naira(unit)} = ${correct}.`,
      ...shuffleWithAnswer(rand, correct, [naira(a * unit), naira(c * unit), naira(Math.round(total / 3))]),
    };
  },
  // Simple interest
  (rand, id) => {
    const principal = between(rand, 50, 250) * 1000;
    const rate = pick(rand, [5, 7.5, 10, 12, 15]);
    const years = between(rand, 2, 5);
    const interest = (principal * rate * years) / 100;
    const correct = naira(Math.round(interest));
    return {
      id,
      section: 'numerical',
      prompt: `${naira(principal)} is invested at ${rate}% simple interest per annum for ${years} years. How much interest is earned?`,
      explanation: `Interest = P×R×T/100 = ${naira(principal)} × ${rate} × ${years} / 100 = ${correct}.`,
      ...shuffleWithAnswer(rand, correct, [
        naira(Math.round(interest / years)),
        naira(Math.round(principal + interest)),
        naira(Math.round(interest * 1.5)),
      ]),
    };
  },
  // Speed / distance / time
  (rand, id) => {
    const speed = between(rand, 40, 110);
    const hours = between(rand, 2, 7);
    const distance = speed * hours;
    const correct = `${distance} km`;
    return {
      id,
      section: 'numerical',
      prompt: `A vehicle travels at an average speed of ${speed} km/h for ${hours} hours. What distance does it cover?`,
      explanation: `Distance = speed × time = ${speed} × ${hours} = ${distance} km.`,
      ...shuffleWithAnswer(rand, correct, [`${speed + hours} km`, `${Math.round(distance / 2)} km`, `${Math.round(speed * (hours + 1))} km`]),
    };
  },
  // Profit percentage
  (rand, id) => {
    const cost = between(rand, 3, 20) * 500;
    const pct = pick(rand, [10, 20, 25, 30, 40, 50]);
    const selling = cost * (1 + pct / 100);
    const correct = `${pct}%`;
    return {
      id,
      section: 'numerical',
      prompt: `An item bought for ${naira(cost)} is sold for ${naira(Math.round(selling))}. What is the percentage profit?`,
      explanation: `Profit = ${naira(Math.round(selling - cost))}. Percentage profit = profit ÷ cost × 100 = ${pct}%.`,
      ...shuffleWithAnswer(rand, correct, [`${Math.round(pct / 2)}%`, `${pct + 10}%`, `${Math.round(pct * 0.8)}%`]),
    };
  },
  // Work rate
  (rand, id) => {
    const workers = between(rand, 3, 8);
    const days = between(rand, 6, 20);
    const newWorkers = workers + between(rand, 1, 4);
    const newDays = (workers * days) / newWorkers;
    const correct = `${newDays.toFixed(newDays % 1 === 0 ? 0 : 1)} days`;
    return {
      id,
      section: 'numerical',
      prompt: `${workers} workers complete a job in ${days} days. Working at the same rate, how long would ${newWorkers} workers take?`,
      explanation: `Total work = ${workers} × ${days} = ${workers * days} worker-days. With ${newWorkers} workers: ${workers * days} ÷ ${newWorkers} = ${correct}.`,
      ...shuffleWithAnswer(rand, correct, [`${days} days`, `${(days + newWorkers).toFixed(0)} days`, `${((days * newWorkers) / workers).toFixed(1)} days`]),
    };
  },
  // Averages
  (rand, id) => {
    const count = between(rand, 4, 6);
    const values = Array.from({ length: count }, () => between(rand, 40, 95));
    const sum = values.reduce((s, v) => s + v, 0);
    const avg = sum / count;
    const correct = avg.toFixed(avg % 1 === 0 ? 0 : 2);
    return {
      id,
      section: 'numerical',
      prompt: `A student scored ${values.join(', ')} in ${count} subjects. What is the average score?`,
      explanation: `Sum = ${sum}. Average = ${sum} ÷ ${count} = ${correct}.`,
      ...shuffleWithAnswer(rand, correct, [String(sum), (avg + 5).toFixed(1), (avg - 3).toFixed(1)]),
    };
  },
  // Discount
  (rand, id) => {
    const marked = between(rand, 5, 40) * 1000;
    const discount = pick(rand, [5, 10, 15, 20, 25, 30]);
    const pay = marked * (1 - discount / 100);
    const correct = naira(Math.round(pay));
    return {
      id,
      section: 'numerical',
      prompt: `An item marked ${naira(marked)} is sold at a ${discount}% discount. How much does the customer pay?`,
      explanation: `Discount = ${naira(Math.round((marked * discount) / 100))}. Amount paid = ${naira(marked)} − discount = ${correct}.`,
      ...shuffleWithAnswer(rand, correct, [naira(Math.round((marked * discount) / 100)), naira(Math.round(marked * (1 + discount / 100))), naira(Math.round(pay * 0.9))]),
    };
  },
];

const VERBAL_BANK: Omit<Question, 'id'>[] = [
  {
    section: 'verbal',
    prompt: 'Choose the word most nearly OPPOSITE in meaning to: PRUDENT',
    options: ['Cautious', 'Reckless', 'Thrifty', 'Sensible'],
    answerIndex: 1,
    explanation: 'Prudent means careful and wise. Reckless — acting without care — is its opposite; the others are near-synonyms.',
  },
  {
    section: 'verbal',
    prompt: 'Choose the word most nearly SIMILAR in meaning to: ARDUOUS',
    options: ['Effortless', 'Demanding', 'Pleasant', 'Brief'],
    answerIndex: 1,
    explanation: 'Arduous means requiring great effort — demanding is the closest match.',
  },
  {
    section: 'verbal',
    prompt: 'Complete the analogy: DOCTOR is to HOSPITAL as TEACHER is to ___',
    options: ['Student', 'Textbook', 'School', 'Lesson'],
    answerIndex: 2,
    explanation: 'The relationship is professional-to-workplace. A doctor works in a hospital; a teacher works in a school.',
  },
  {
    section: 'verbal',
    prompt:
      'Read: "The committee postponed the decision because the report was incomplete, although members had already reviewed the budget." Which statement must be TRUE?',
    options: [
      'The budget was rejected.',
      'The report was incomplete.',
      'The committee will never decide.',
      'Members had not seen the budget.',
    ],
    answerIndex: 1,
    explanation:
      'Only the incompleteness of the report is stated directly. The other options add claims the passage does not support.',
  },
  {
    section: 'verbal',
    prompt: 'Choose the correctly spelled word.',
    options: ['Occurence', 'Occurrance', 'Occurrence', 'Ocurrence'],
    answerIndex: 2,
    explanation: '"Occurrence" takes double c, double r, and ends in -ence.',
  },
  {
    section: 'verbal',
    prompt: 'Choose the grammatically correct sentence.',
    options: [
      'Neither the manager nor the staff were informed.',
      'Neither the manager nor the staff was informed.',
      'Neither the manager or the staff were informed.',
      'Neither the manager nor the staff is informed about it yesterday.',
    ],
    answerIndex: 0,
    explanation:
      'With "neither…nor", the verb agrees with the nearer subject. "Staff" here is plural, so "were" is correct.',
  },
  {
    section: 'verbal',
    prompt: 'Choose the word most nearly SIMILAR in meaning to: CANDID',
    options: ['Deceitful', 'Frank', 'Reserved', 'Hesitant'],
    answerIndex: 1,
    explanation: 'Candid means open and straightforward — frank is the direct synonym.',
  },
  {
    section: 'verbal',
    prompt: 'Complete the analogy: SCARCE is to PLENTIFUL as OBSCURE is to ___',
    options: ['Hidden', 'Famous', 'Vague', 'Dim'],
    answerIndex: 1,
    explanation: 'The relationship is antonym-to-antonym. Scarce opposes plentiful; obscure opposes famous.',
  },
];

const LOGICAL_BANK: Omit<Question, 'id'>[] = [
  {
    section: 'logical',
    prompt: 'What comes next in the sequence: 3, 6, 12, 24, ___ ?',
    options: ['30', '36', '48', '42'],
    answerIndex: 2,
    explanation: 'Each term doubles the previous one: 24 × 2 = 48.',
  },
  {
    section: 'logical',
    prompt: 'What comes next: 2, 5, 10, 17, 26, ___ ?',
    options: ['35', '37', '38', '41'],
    answerIndex: 1,
    explanation: 'Differences are 3, 5, 7, 9 — the next difference is 11, so 26 + 11 = 37.',
  },
  {
    section: 'logical',
    prompt:
      'All accountants in the firm are ICAN members. Bola is not an ICAN member. Which conclusion follows?',
    options: [
      'Bola is an accountant.',
      'Bola is not an accountant in the firm.',
      'Some accountants are not ICAN members.',
      'Bola works elsewhere.',
    ],
    answerIndex: 1,
    explanation:
      'If every accountant in the firm is an ICAN member, someone who is not a member cannot be an accountant in that firm.',
  },
  {
    section: 'logical',
    prompt:
      'Five friends sit in a row. Ada is directly left of Bode. Chidi is at the far right. Emeka is directly right of Bode. Where can Femi sit?',
    options: ['Far right', 'Directly right of Emeka', 'Far left', 'Between Ada and Bode'],
    answerIndex: 2,
    explanation:
      'Chidi holds the far-right seat and Ada–Bode–Emeka form a fixed block. The only remaining seat is the far left, so Femi sits there.',
  },
  {
    section: 'logical',
    prompt: 'If some traders are importers and all importers pay duty, which must be TRUE?',
    options: [
      'All traders pay duty.',
      'Some traders pay duty.',
      'No trader pays duty.',
      'Only importers are traders.',
    ],
    answerIndex: 1,
    explanation:
      'The traders who are importers must pay duty, so at least some traders pay duty. Nothing is established about the rest.',
  },
  {
    section: 'logical',
    prompt: 'What comes next in the letter series: B, D, G, K, ___ ?',
    options: ['N', 'O', 'P', 'M'],
    answerIndex: 2,
    explanation: 'Gaps grow by one: B+2=D, D+3=G, G+4=K, K+5=P.',
  },
  {
    section: 'logical',
    prompt:
      'A shop is open every day except Sunday. Today the shop is closed. Which conclusion is valid?',
    options: [
      'Today is Sunday.',
      'Today may be Sunday or a day the shop closed for another reason.',
      'The shop never opens.',
      'Tomorrow is Monday.',
    ],
    answerIndex: 1,
    explanation:
      'The rule says it closes on Sundays, not that Sunday is the only possible cause of closure. Concluding it must be Sunday is affirming the consequent.',
  },
  {
    section: 'logical',
    prompt: 'What comes next: 1, 4, 9, 16, 25, ___ ?',
    options: ['30', '36', '35', '49'],
    answerIndex: 1,
    explanation: 'These are perfect squares: 1², 2², 3², 4², 5², so the next is 6² = 36.',
  },
];

export interface PaperOptions {
  sections: Section[];
  count: number;
  seed?: number;
}

export function generatePaper({ sections, count, seed }: PaperOptions): Question[] {
  const rand = makeRandom(seed ?? Date.now());
  const perSection = Math.max(1, Math.floor(count / sections.length));
  const questions: Question[] = [];

  for (const section of sections) {
    if (section === 'numerical') {
      for (let i = 0; i < perSection; i++) {
        const generator = NUMERICAL_GENERATORS[i % NUMERICAL_GENERATORS.length];
        questions.push(generator(rand, `num-${i}-${Math.floor(rand() * 1e6)}`));
      }
    } else {
      const bank = section === 'verbal' ? VERBAL_BANK : LOGICAL_BANK;
      const shuffled = [...bank].sort(() => rand() - 0.5);
      for (let i = 0; i < perSection; i++) {
        const item = shuffled[i % shuffled.length];
        questions.push({ ...item, id: `${section}-${i}-${Math.floor(rand() * 1e6)}` });
      }
    }
  }

  return questions.sort(() => rand() - 0.5).slice(0, count);
}

export interface ScoreResult {
  correct: number;
  total: number;
  percent: number;
  bySection: Record<string, { correct: number; total: number }>;
}

export function scorePaper(questions: Question[], answers: Record<string, number>): ScoreResult {
  const bySection: Record<string, { correct: number; total: number }> = {};
  let correct = 0;

  for (const question of questions) {
    const bucket = (bySection[question.section] ??= { correct: 0, total: 0 });
    bucket.total++;
    if (answers[question.id] === question.answerIndex) {
      correct++;
      bucket.correct++;
    }
  }

  return {
    correct,
    total: questions.length,
    percent: questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0,
    bySection,
  };
}
