import { describe, expect, it } from 'vitest';
import { combineCgpa, computeGpa, degreeClass } from './cgpa';

describe('computeGpa', () => {
  it('weights grade points by course units', () => {
    // 4×5 + 3×4 + 3×3 + 2×2 = 45 quality points over 12 units
    const result = computeGpa([
      { units: 4, gradePoints: 5 },
      { units: 3, gradePoints: 4 },
      { units: 3, gradePoints: 3 },
      { units: 2, gradePoints: 2 },
    ]);
    expect(result.totalUnits).toBe(12);
    expect(result.totalQualityPoints).toBe(45);
    expect(result.gpa).toBeCloseTo(3.75, 10);
  });

  it('ignores rows with zero or invalid units', () => {
    const result = computeGpa([
      { units: 3, gradePoints: 5 },
      { units: 0, gradePoints: 5 },
      { units: NaN, gradePoints: 5 },
    ]);
    expect(result.totalUnits).toBe(3);
    expect(result.gpa).toBe(5);
  });

  it('returns 0 GPA for an empty semester', () => {
    expect(computeGpa([]).gpa).toBe(0);
  });
});

describe('combineCgpa', () => {
  it('merges a prior CGPA with a new semester', () => {
    // 3.2×60 = 192 prior points; +45 points over 12 units → 237/72 ≈ 3.2917
    const semester = computeGpa([
      { units: 4, gradePoints: 5 },
      { units: 3, gradePoints: 4 },
      { units: 3, gradePoints: 3 },
      { units: 2, gradePoints: 2 },
    ]);
    expect(combineCgpa({ cgpa: 3.2, units: 60 }, semester)).toBeCloseTo(237 / 72, 10);
  });

  it('returns the semester GPA when there is no prior history', () => {
    const semester = computeGpa([{ units: 3, gradePoints: 4 }]);
    expect(combineCgpa({ cgpa: 0, units: 0 }, semester)).toBe(4);
  });
});

describe('degreeClass (5-point scale)', () => {
  it.each([
    [4.5, 'First Class'],
    [4.49, 'Second Class Upper (2:1)'],
    [3.5, 'Second Class Upper (2:1)'],
    [3.49, 'Second Class Lower (2:2)'],
    [2.4, 'Second Class Lower (2:2)'],
    [2.39, 'Third Class'],
    [1.5, 'Third Class'],
    [1.2, 'Pass'],
    [0.9, 'Fail'],
  ])('classifies %f as %s', (cgpa, expected) => {
    expect(degreeClass(cgpa, 5)).toBe(expected);
  });
});

describe('degreeClass (4-point scale)', () => {
  it('classifies boundaries on the 4-point scale', () => {
    expect(degreeClass(3.6, 4)).toBe('First Class');
    expect(degreeClass(3.2, 4)).toBe('Second Class Upper (2:1)');
    expect(degreeClass(2.5, 4)).toBe('Second Class Lower (2:2)');
    expect(degreeClass(1.5, 4)).toBe('Third Class');
    expect(degreeClass(0.5, 4)).toBe('Fail');
  });
});
