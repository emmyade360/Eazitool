/**
 * GPA / CGPA arithmetic for the Nigerian 5-point scale (with a 4-point option).
 */

export type GradeScale = 5 | 4;

export interface GradeOption {
  label: string;
  points: number;
}

export const GRADE_OPTIONS: Record<GradeScale, GradeOption[]> = {
  5: [
    { label: 'A (70–100)', points: 5 },
    { label: 'B (60–69)', points: 4 },
    { label: 'C (50–59)', points: 3 },
    { label: 'D (45–49)', points: 2 },
    { label: 'E (40–44)', points: 1 },
    { label: 'F (0–39)', points: 0 },
  ],
  4: [
    { label: 'A', points: 4 },
    { label: 'B', points: 3 },
    { label: 'C', points: 2 },
    { label: 'D', points: 1 },
    { label: 'F', points: 0 },
  ],
};

export interface CourseEntry {
  units: number;
  gradePoints: number;
}

export interface GpaResult {
  gpa: number;
  totalUnits: number;
  totalQualityPoints: number;
}

export function computeGpa(courses: CourseEntry[]): GpaResult {
  let totalUnits = 0;
  let totalQualityPoints = 0;

  for (const course of courses) {
    if (!Number.isFinite(course.units) || course.units <= 0) continue;
    totalUnits += course.units;
    totalQualityPoints += course.units * course.gradePoints;
  }

  return {
    gpa: totalUnits > 0 ? totalQualityPoints / totalUnits : 0,
    totalUnits,
    totalQualityPoints,
  };
}

/** Combine a previous CGPA (with its unit count) with a new semester. */
export function combineCgpa(
  prior: { cgpa: number; units: number },
  semester: GpaResult,
): number {
  const priorPoints = prior.cgpa * prior.units;
  const units = prior.units + semester.totalUnits;
  if (units <= 0) return 0;
  return (priorPoints + semester.totalQualityPoints) / units;
}

/**
 * Class-of-degree bands. Boundaries follow the common NUC convention on the
 * 5-point scale; individual institutions can vary slightly.
 */
export function degreeClass(cgpa: number, scale: GradeScale): string {
  if (scale === 5) {
    if (cgpa >= 4.5) return 'First Class';
    if (cgpa >= 3.5) return 'Second Class Upper (2:1)';
    if (cgpa >= 2.4) return 'Second Class Lower (2:2)';
    if (cgpa >= 1.5) return 'Third Class';
    if (cgpa >= 1.0) return 'Pass';
    return 'Fail';
  }
  if (cgpa >= 3.5) return 'First Class';
  if (cgpa >= 3.0) return 'Second Class Upper (2:1)';
  if (cgpa >= 2.0) return 'Second Class Lower (2:2)';
  if (cgpa >= 1.0) return 'Third Class';
  return 'Fail';
}
