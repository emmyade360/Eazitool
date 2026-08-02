import { describe, expect, it } from 'vitest';
import { extractAdvertTerms, matchCvToAdvert } from './job-match';

const ADVERT = `We are recruiting a Customer Service Officer for our Lagos branch.
The successful candidate will handle customer service enquiries, resolve
complaints, and maintain accurate records in Salesforce. Requirements:
a degree in any discipline, at least two years of customer service
experience, strong communication skills, and proficiency in Salesforce
and Microsoft Excel. Reconciliation experience is an advantage.`;

describe('extractAdvertTerms', () => {
  const terms = extractAdvertTerms(ADVERT);

  it('picks up repeated multi-word phrases', () => {
    expect(terms).toContain('customer service');
  });

  it('picks up named tools mentioned repeatedly', () => {
    expect(terms).toContain('salesforce');
  });

  it('drops generic recruitment filler', () => {
    for (const filler of ['candidate', 'requirements', 'experience', 'the', 'and']) {
      expect(terms).not.toContain(filler);
    }
  });

  it('respects the term limit', () => {
    expect(extractAdvertTerms(ADVERT, 5).length).toBeLessThanOrEqual(5);
  });
});

describe('matchCvToAdvert', () => {
  it('separates covered terms from gaps', () => {
    const cv = 'Handled customer service enquiries for two years. Skilled in Microsoft Excel.';
    const report = matchCvToAdvert(cv, ADVERT);
    expect(report.matched).toContain('customer service');
    expect(report.missing).toContain('salesforce');
  });

  it('reports full coverage when the CV echoes the advert', () => {
    const report = matchCvToAdvert(ADVERT, ADVERT);
    expect(report.missing).toHaveLength(0);
    expect(report.coverage).toBe(1);
  });

  it('reports zero coverage for an unrelated CV', () => {
    const report = matchCvToAdvert('Poultry farmer. Managed feed schedules.', ADVERT);
    expect(report.coverage).toBeLessThan(0.3);
  });

  it('matches case-insensitively', () => {
    const report = matchCvToAdvert('SALESFORCE administrator', ADVERT);
    expect(report.matched).toContain('salesforce');
  });

  it('handles an empty advert without dividing by zero', () => {
    expect(matchCvToAdvert('some cv text', '').coverage).toBe(0);
  });
});
