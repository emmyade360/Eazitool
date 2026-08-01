'use client';

import { useState } from 'react';
import {
  GRADE_OPTIONS,
  combineCgpa,
  computeGpa,
  degreeClass,
  type GradeScale,
} from '@/lib/career/cgpa';

const copy = {
  title: 'CGPA Calculator',
  subtitle: 'Semester GPA and cumulative CGPA on the 5.0 or 4.0 scale.',
  coursesTitle: 'This Semester',
  addCourse: 'Add Course',
  priorTitle: 'Previous Record (optional)',
  priorCgpa: 'Current CGPA',
  priorUnits: 'Total units completed',
  scaleLabel: 'Grading Scale',
} as const;

interface CourseRow {
  id: number;
  title: string;
  units: string;
  grade: string;
}

let nextRowId = 1;
function makeRow(): CourseRow {
  return { id: nextRowId++, title: '', units: '', grade: '' };
}

export default function CgpaCalculatorPage() {
  const [scale, setScale] = useState<GradeScale>(5);
  const [rows, setRows] = useState<CourseRow[]>(() => [makeRow(), makeRow(), makeRow()]);
  const [priorCgpa, setPriorCgpa] = useState('');
  const [priorUnits, setPriorUnits] = useState('');

  const gradeOptions = GRADE_OPTIONS[scale];

  const courses = rows
    .filter((row) => row.units !== '' && row.grade !== '')
    .map((row) => ({
      units: Number.parseFloat(row.units),
      gradePoints: Number.parseFloat(row.grade),
    }));

  const semester = computeGpa(courses);

  const prior = {
    cgpa: Number.parseFloat(priorCgpa) || 0,
    units: Number.parseFloat(priorUnits) || 0,
  };
  const hasPrior = prior.cgpa > 0 && prior.units > 0;
  const cumulative = hasPrior ? combineCgpa(prior, semester) : semester.gpa;
  const showResult = semester.totalUnits > 0 || hasPrior;

  function updateRow(id: number, field: 'title' | 'units' | 'grade', value: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function switchScale(next: GradeScale) {
    setScale(next);
    // Grade points differ between scales, so selections reset.
    setRows((prev) => prev.map((row) => ({ ...row, grade: '' })));
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{copy.title}</h1>
            <p className="text-sm text-slate-500">{copy.subtitle}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700">
                  {copy.scaleLabel}
                </h2>
                <div className="flex gap-1">
                  {([5, 4] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={scale === option}
                      onClick={() => switchScale(option)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        scale === option
                          ? 'border-blue-200 bg-blue-50 text-blue-600'
                          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {option}.0 scale
                    </button>
                  ))}
                </div>
              </div>

              <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-700">
                {copy.coursesTitle}
              </h3>
              <div className="space-y-2">
                {rows.map((row, index) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      name={`course-title-${row.id}`}
                      value={row.title}
                      onChange={(event) => updateRow(row.id, 'title', event.target.value)}
                      placeholder={`Course ${index + 1}`}
                      aria-label={`Course ${index + 1} title`}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none"
                    />
                    <input
                      type="number"
                      name={`course-units-${row.id}`}
                      min={1}
                      max={12}
                      value={row.units}
                      onChange={(event) => updateRow(row.id, 'units', event.target.value)}
                      placeholder="Units"
                      aria-label={`Course ${index + 1} units`}
                      className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none"
                    />
                    <select
                      name={`course-grade-${row.id}`}
                      value={row.grade}
                      onChange={(event) => updateRow(row.id, 'grade', event.target.value)}
                      aria-label={`Course ${index + 1} grade`}
                      className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none"
                    >
                      <option value="">Grade</option>
                      {gradeOptions.map((option) => (
                        <option key={option.label} value={option.points}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                      disabled={rows.length <= 1}
                      aria-label={`Remove course ${index + 1}`}
                      className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, makeRow()])}
                className="mt-3 rounded-xl border border-dashed border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100"
              >
                + {copy.addCourse}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-slate-700">
                {copy.priorTitle}
              </h2>
              <p className="mb-4 text-xs text-slate-400">
                Add your existing CGPA and completed units to see your updated cumulative result.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prior-cgpa" className="mb-1.5 block text-xs font-medium text-slate-500">
                    {copy.priorCgpa}
                  </label>
                  <input
                    id="prior-cgpa"
                    name="prior-cgpa"
                    type="number"
                    step="0.01"
                    min={0}
                    max={scale}
                    value={priorCgpa}
                    onChange={(event) => setPriorCgpa(event.target.value)}
                    placeholder="e.g. 3.42"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="prior-units" className="mb-1.5 block text-xs font-medium text-slate-500">
                    {copy.priorUnits}
                  </label>
                  <input
                    id="prior-units"
                    name="prior-units"
                    type="number"
                    min={0}
                    value={priorUnits}
                    onChange={(event) => setPriorUnits(event.target.value)}
                    placeholder="e.g. 78"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {showResult ? (
              <>
                <div className="rounded-2xl border border-blue-100 bg-blue-600 p-6 text-white shadow-lg shadow-blue-100">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                    {hasPrior ? 'Updated CGPA' : 'Semester GPA'}
                  </p>
                  <p className="mt-1 text-4xl font-bold">{cumulative.toFixed(2)}</p>
                  <p className="mt-2 text-sm font-semibold text-blue-100">
                    {degreeClass(cumulative, scale)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Semester GPA</dt>
                      <dd className="font-semibold text-slate-800">{semester.gpa.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Semester units</dt>
                      <dd className="font-semibold text-slate-800">{semester.totalUnits}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Quality points</dt>
                      <dd className="font-semibold text-slate-800">{semester.totalQualityPoints}</dd>
                    </div>
                    {hasPrior && (
                      <div className="flex justify-between border-t border-slate-100 pt-2">
                        <dt className="text-slate-500">Total units after semester</dt>
                        <dd className="font-semibold text-slate-800">
                          {prior.units + semester.totalUnits}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <p className="px-1 text-xs leading-5 text-slate-400">
                  Class boundaries follow the common Nigerian convention — your institution&apos;s
                  handbook is the final authority.
                </p>
              </>
            ) : (
              <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm text-slate-300">
                  Add course units and grades to see your GPA.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
