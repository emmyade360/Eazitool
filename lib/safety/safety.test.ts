import { describe, expect, it } from 'vitest';
import { analyseMessage } from './scam-rules';
import { scoreChecklist, CHECKLIST_ITEMS } from './checklist';
import { checkDomain, damerauLevenshtein, extractDomains, skeleton, splitRegistrable } from './domain-check';

const SCAM_MESSAGE = `CONGRATULATIONS!!! You have been SELECTED for the MTN recruitment 2026.
No experience needed. Salary N450,000 monthly. To secure your slot pay a
registration fee of N5,500 to account number 0123456789 (Kuda Bank) before
24 hours. Send your NIN number 12345678901 and BVN for verification.
Contact HR on WhatsApp +2348012345678 or visit mtn.jobs-portal.xyz/apply`;

const LEGIT_MESSAGE = `Dear candidate, thank you for applying to the Analyst role at Sterling
Partners. We would like to invite you to a first interview at our office at
12 Adeola Odeku Street, Victoria Island, on Tuesday at 10am. Please reply to
confirm, or suggest another time that works for you. Regards, Funke — People
Operations. This role pays within our published band and there is no cost to
you at any stage of the process.`;

describe('analyseMessage', () => {
  it('flags a classic recruitment scam as almost certain', () => {
    const verdict = analyseMessage(SCAM_MESSAGE);
    expect(verdict.level).toBe('almost-certainly-a-scam');
    const ids = verdict.signals.map((s) => s.id);
    expect(ids).toContain('upfront-fee');
    expect(ids).toContain('sensitive-data-request');
    expect(ids).toContain('hired-without-interview');
    expect(ids).toContain('whatsapp-only');
  });

  it('does not flag a legitimate interview invitation', () => {
    const verdict = analyseMessage(LEGIT_MESSAGE);
    expect(verdict.level).toBe('safe');
  });

  it('caps the language family contribution at 5 points', () => {
    const shouty = 'HELLO EVERYONE AMAZING OPPORTUNITY WAITING FOR SERIOUS PEOPLE!!! APPLY NOW GREAT PAY!!!';
    const verdict = analyseMessage(shouty);
    const languagePoints = verdict.signals
      .filter((s) => s.id === 'shouting-caps' || s.id === 'excessive-exclamation')
      .reduce((sum, s) => sum + s.weight, 0);
    expect(languagePoints).toBeLessThanOrEqual(5);
  });

  it('floors the level at high-risk when a critical rule fires alone', () => {
    const verdict = analyseMessage('Kindly send your OTP to confirm your employment record.');
    expect(['high-risk', 'almost-certainly-a-scam']).toContain(verdict.level);
  });
});

describe('scoreChecklist', () => {
  it('scores all-no answers as safe', () => {
    const answers = Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i.id, 'no' as const]));
    expect(scoreChecklist(answers).level).toBe('safe');
  });

  it('escalates when money was requested', () => {
    const verdict = scoreChecklist({ 'asked-for-money': 'yes', 'no-interview': 'yes' });
    expect(['high-risk', 'almost-certainly-a-scam']).toContain(verdict.level);
  });

  it('gives unsure answers half weight', () => {
    const sure = scoreChecklist({ 'no-interview': 'yes' });
    const unsure = scoreChecklist({ 'no-interview': 'unsure' });
    expect(unsure.score).toBe(Math.round(sure.score / 2));
  });
});

describe('domain-check helpers', () => {
  it('extracts registrable domains through multi-part suffixes', () => {
    expect(splitRegistrable('careers.gtbank.com.ng')).toEqual({
      registrableDomain: 'gtbank.com.ng',
      subdomains: ['careers'],
    });
    expect(splitRegistrable('mtn.jobs-portal.xyz')).toEqual({
      registrableDomain: 'jobs-portal.xyz',
      subdomains: ['mtn'],
    });
  });

  it('computes edit distance with transpositions', () => {
    expect(damerauLevenshtein('firstbank', 'fristbank')).toBe(1);
    expect(damerauLevenshtein('mtn', 'mtn')).toBe(0);
  });

  it('skeletonizes confusable characters', () => {
    expect(skeleton('f1rstbank')).toBe('flrstbank'.replace('l', 'l')); // 1 → l
    expect(skeleton('MTN')).toBe('mtn');
  });

  it('finds domains in message text', () => {
    const found = extractDomains('Apply at https://mtn.jobs-portal.xyz/apply or bit.ly/x now');
    expect(found.some((d) => d.includes('jobs-portal.xyz'))).toBe(true);
    expect(found.some((d) => d.includes('bit.ly'))).toBe(true);
  });
});

describe('checkDomain', () => {
  it('flags brand-in-subdomain impersonation as critical', () => {
    const report = checkDomain('https://mtn.jobs-portal.xyz/apply');
    expect(report.brandMatch?.kind).toBe('subdomain-impersonation');
    expect(['high-risk', 'almost-certainly-a-scam']).toContain(report.verdict.level);
  });

  it('recognizes an official domain without warnings', () => {
    const report = checkDomain('https://careers.mtn.ng/openings');
    expect(report.brandMatch?.kind).toBe('official');
    expect(report.verdict.signals.find((s) => s.id === 'brand-lookalike')).toBeUndefined();
  });

  it('exposes the @ userinfo trick', () => {
    const report = checkDomain('https://mtn.com@evil.xyz/login');
    expect(report.hostname).toBe('evil.xyz');
    expect(report.verdict.signals.some((s) => s.id === 'userinfo-trick')).toBe(true);
  });

  it('flags lookalike registrable domains', () => {
    const report = checkDomain('https://gtbank-careers.com');
    expect(report.brandMatch?.kind).toBe('lookalike');
  });

  it('handles unparseable input gracefully', () => {
    const report = checkDomain('not a url at all $$$');
    expect(report.hostname).toBeNull();
    expect(report.verdict.level).toBe('safe');
  });
});
