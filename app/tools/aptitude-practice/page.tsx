'use client';

import { useEffect, useState } from 'react';
import {
  SECTION_LABELS,
  generatePaper,
  scorePaper,
  type Question,
  type Section,
} from '@/lib/career/aptitude';
import { NigerianGuide } from '@/components/NigerianGuide';

const SECTIONS: Section[] = ['numerical', 'verbal', 'logical'];
const LENGTHS = [10, 15, 20, 30] as const;

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AptitudePracticePage() {
  const [selected, setSelected] = useState<Section[]>([...SECTIONS]);
  const [length, setLength] = useState<number>(15);
  const [timed, setTimed] = useState(true);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // Countdown while a timed paper is in progress. The auto-submit happens
  // inside the tick callback so the effect body itself never sets state.
  useEffect(() => {
    if (!questions || submitted || !timed || remaining <= 0) return;
    const timer = window.setTimeout(() => {
      setRemaining((r) => {
        const next = r - 1;
        if (next <= 0) setSubmitted(true);
        return Math.max(0, next);
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [questions, submitted, timed, remaining]);

  function start() {
    if (selected.length === 0) return;
    const paper = generatePaper({ sections: selected, count: length });
    setQuestions(paper);
    setAnswers({});
    setCurrent(0);
    setSubmitted(false);
    setRemaining(paper.length * 60);
  }

  function reset() {
    setQuestions(null);
    setSubmitted(false);
    setAnswers({});
  }

  const score = questions && submitted ? scorePaper(questions, answers) : null;

  if (!questions) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Aptitude Test Practice</h1>
              <p className="text-sm text-slate-500">CBT-style drilling for graduate and bank recruitment tests.</p>
            </div>
          </div>

          <NigerianGuide
            title="How recruitment tests work"
            english="Bank, oil-and-gas and graduate schemes screen with timed aptitude tests before any interview. Most allow about one minute per question, so speed matters as much as accuracy."
            pidgin="Bank and big company go first give you timed test before interview. Na like one minute per question, so speed matter like correctness."
          />

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">Sections</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {SECTIONS.map((section) => (
                  <button key={section} type="button"
                    aria-pressed={selected.includes(section)}
                    onClick={() =>
                      setSelected((prev) =>
                        prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
                      )
                    }
                    className={`rounded-xl border p-3 text-sm font-bold transition-all ${
                      selected.includes(section)
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}>
                    {SECTION_LABELS[section]}
                  </button>
                ))}
              </div>

              <h2 className="mb-3 mt-5 text-sm font-bold uppercase tracking-widest text-slate-700">Questions</h2>
              <div className="grid grid-cols-4 gap-2">
                {LENGTHS.map((n) => (
                  <button key={n} type="button" onClick={() => setLength(n)}
                    className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                      length === n
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-between">
                <span className="text-sm text-slate-600">
                  Timed mode <span className="text-xs text-slate-400">(1 minute per question)</span>
                </span>
                <input type="checkbox" name="timed" checked={timed}
                  onChange={(e) => setTimed(e.target.checked)} className="h-4 w-4 accent-blue-600" />
              </label>
            </div>

            <button type="button" onClick={start} disabled={selected.length === 0}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700 disabled:opacity-50">
              Start Practice Test
            </button>

            <p className="px-1 text-xs leading-5 text-slate-400">
              These are original questions written in the style and difficulty of common Nigerian
              recruitment tests — not reproduced past questions. Numerical items are freshly
              generated each attempt, so you can drill repeatedly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted && score) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className={`rounded-2xl border p-6 text-white shadow-lg ${score.percent >= 60 ? 'border-green-200 bg-green-600' : 'border-amber-200 bg-amber-500'}`}>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Your score</p>
            <p className="mt-1 text-4xl font-bold">{score.percent}%</p>
            <p className="mt-1 text-sm opacity-90">{score.correct} of {score.total} correct</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(score.bySection).map(([section, stat]) => (
                <span key={section} className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  {SECTION_LABELS[section as Section]}: {stat.correct}/{stat.total}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((question, index) => {
              const given = answers[question.id];
              const right = given === question.answerIndex;
              return (
                <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-6 text-slate-800">
                      <span className="mr-2 text-xs font-bold text-slate-300">{index + 1}</span>
                      {question.prompt}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${right ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {right ? 'CORRECT' : given === undefined ? 'SKIPPED' : 'WRONG'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {question.options.map((option, i) => (
                      <div key={i}
                        className={`rounded-lg px-3 py-1.5 text-sm ${
                          i === question.answerIndex
                            ? 'bg-green-50 font-semibold text-green-700'
                            : i === given
                              ? 'bg-red-50 text-red-600 line-through'
                              : 'text-slate-500'
                        }`}>
                        {option}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                    {question.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={reset}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Change settings
            </button>
            <button type="button" onClick={start}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700">
              New test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[current];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-500">
            Question {current + 1} of {questions.length}
          </span>
          {timed && (
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${remaining < 60 ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-700'}`}>
              {formatClock(remaining)}
            </span>
          )}
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
            {SECTION_LABELS[question.section]}
          </span>
          <p className="mt-3 text-base leading-7 text-slate-800">{question.prompt}</p>
          <div className="mt-4 space-y-2">
            {question.options.map((option, i) => (
              <button key={i} type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: i }))}
                className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${
                  answers[question.id] === i
                    ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}>
                <span className="mr-2 font-bold text-slate-400">{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40">
            Back
          </button>
          {current < questions.length - 1 ? (
            <button type="button" onClick={() => setCurrent((c) => c + 1)}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700">
              Next
            </button>
          ) : (
            <button type="button" onClick={() => setSubmitted(true)}
              className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700">
              Submit ({answeredCount}/{questions.length} answered)
            </button>
          )}
        </div>

        <button type="button" onClick={() => setSubmitted(true)}
          className="mt-3 w-full text-xs font-semibold text-slate-400 hover:text-slate-600">
          End test and see results
        </button>
      </div>
    </div>
  );
}
