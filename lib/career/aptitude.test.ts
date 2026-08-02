import { describe, expect, it } from 'vitest';
import { generatePaper, scorePaper, type Section } from './aptitude';

describe('generatePaper', () => {
  it('produces the requested number of questions', () => {
    const paper = generatePaper({ sections: ['numerical', 'verbal', 'logical'], count: 15, seed: 42 });
    expect(paper).toHaveLength(15);
  });

  it('is reproducible for a given seed', () => {
    const a = generatePaper({ sections: ['numerical'], count: 8, seed: 7 });
    const b = generatePaper({ sections: ['numerical'], count: 8, seed: 7 });
    expect(a.map((q) => q.prompt)).toEqual(b.map((q) => q.prompt));
  });

  it('varies between seeds', () => {
    const a = generatePaper({ sections: ['numerical'], count: 8, seed: 1 });
    const b = generatePaper({ sections: ['numerical'], count: 8, seed: 2 });
    expect(a.map((q) => q.prompt)).not.toEqual(b.map((q) => q.prompt));
  });

  it('only includes the requested sections', () => {
    const paper = generatePaper({ sections: ['verbal'], count: 6, seed: 3 });
    expect(new Set(paper.map((q) => q.section))).toEqual(new Set<Section>(['verbal']));
  });

  it('gives every question a valid answer index and unique id', () => {
    const paper = generatePaper({ sections: ['numerical', 'verbal', 'logical'], count: 24, seed: 99 });
    const ids = new Set<string>();
    for (const question of paper) {
      expect(question.options.length).toBeGreaterThanOrEqual(3);
      expect(question.answerIndex).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex).toBeLessThan(question.options.length);
      expect(question.explanation.length).toBeGreaterThan(0);
      ids.add(question.id);
    }
    expect(ids.size).toBe(paper.length);
  });

  it('never repeats the correct option among distractors', () => {
    const paper = generatePaper({ sections: ['numerical'], count: 24, seed: 5 });
    for (const question of paper) {
      const correct = question.options[question.answerIndex];
      expect(question.options.filter((o) => o === correct)).toHaveLength(1);
    }
  });
});

describe('scorePaper', () => {
  const paper = generatePaper({ sections: ['numerical', 'verbal'], count: 6, seed: 11 });

  it('scores a perfect paper', () => {
    const answers = Object.fromEntries(paper.map((q) => [q.id, q.answerIndex]));
    const score = scorePaper(paper, answers);
    expect(score.correct).toBe(paper.length);
    expect(score.percent).toBe(100);
  });

  it('scores an empty attempt as zero', () => {
    const score = scorePaper(paper, {});
    expect(score.correct).toBe(0);
    expect(score.percent).toBe(0);
  });

  it('breaks results down by section', () => {
    const answers = Object.fromEntries(paper.map((q) => [q.id, q.answerIndex]));
    const score = scorePaper(paper, answers);
    const totals = Object.values(score.bySection).reduce((sum, s) => sum + s.total, 0);
    expect(totals).toBe(paper.length);
  });
});
