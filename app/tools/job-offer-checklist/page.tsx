'use client';

import { useState } from 'react';
import { CHECKLIST_ITEMS, scoreChecklist, type ChecklistAnswer } from '@/lib/safety/checklist';
import { VerdictCard } from '@/components/safety/VerdictCard';

const ANSWER_OPTIONS: { value: ChecklistAnswer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
];

export default function JobOfferChecklistPage() {
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>({});

  const answeredCount = Object.keys(answers).length;
  const verdict = answeredCount > 0 ? scoreChecklist(answers) : null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Job Offer Safety Checklist</h1>
            <p className="text-sm text-slate-500">
              Answer honestly about the offer you received — everything stays on your device.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {CHECKLIST_ITEMS.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium leading-6 text-slate-800">
                  <span className="mr-2 text-xs font-bold text-slate-300">{index + 1}</span>
                  {item.question}
                </p>
                <div className="mt-3 flex gap-2">
                  {ANSWER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={answers[item.id] === option.value}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [item.id]: option.value }))
                      }
                      className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                        answers[item.id] === option.value
                          ? option.value === 'yes'
                            ? 'border-rose-600 bg-rose-600 text-white'
                            : option.value === 'no'
                              ? 'border-green-600 bg-green-600 text-white'
                              : 'border-amber-500 bg-amber-500 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {answers[item.id] === 'yes' && (
                  <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
                    {item.whyItMatters}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            {verdict ? (
              <div className="space-y-3">
                <VerdictCard verdict={verdict} />
                <p className="px-1 text-xs leading-5 text-slate-400">
                  {answeredCount} of {CHECKLIST_ITEMS.length} questions answered. The score updates
                  as you answer — nothing is sent anywhere.
                </p>
              </div>
            ) : (
              <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm text-slate-300">
                  Answer the questions to see the risk assessment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
