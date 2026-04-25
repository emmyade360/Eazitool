/**
 * ATS Scoring Engine for CVs
 * Evaluates CVs against ATS-friendly criteria and provides actionable feedback
 */

import { detectCVSections, extractExperienceBullets, getWordCount } from '@/lib/cv-parser';
import type { ImprovedBullet } from '@/lib/bullet-rewriter';

export type ATSIssue = {
  category: 'critical' | 'warning' | 'tip';
  severity: number; // 1-10
  title: string;
  description: string;
  suggestion: string;
  line?: number;
  section?: string;
};

export type ATSResult = {
  overallScore: number; // 0-100
  categoryScores: {
    format: number;
    keywords: number;
    structure: number;
    content: number;
    readability: number;
  };
  issues: ATSIssue[];
  strengths: string[];
  estimatedPassRate: number; // percentage chance of passing ATS
};

export type RoleTarget = {
  role: string;
  keywords: string[];
  priorities: string[];
};

const ROLE_KEYWORDS: Record<string, string[]> = {
  'software engineer': ['api', 'backend', 'frontend', 'fullstack', 'react', 'node', 'python', 'java', 'typescript', 'javascript', 'database', 'sql', 'nosql', 'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'microservices', 'rest', 'graphql'],
  'data scientist': ['python', 'r', 'sql', 'machine learning', 'ml', 'ai', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'statistics', 'modeling', 'data analysis', 'deep learning', 'nlp'],
  'product manager': ['product', 'roadmap', 'strategy', 'stakeholder', 'agile', 'scrum', 'user research', 'analytics', 'metrics', 'delivery', 'launch'],
  'designer': ['ui', 'ux', 'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'wireframe', 'prototype', 'user research', 'usability'],
  'marketing': ['seo', 'sem', 'analytics', 'campaign', 'content', 'social media', 'brand', 'conversion', 'growth', 'digital marketing'],
  'devops': ['aws', 'azure', 'kubernetes', 'docker', 'terraform', 'ci/cd', 'jenkins', 'gitlab', 'monitoring', 'infrastructure', 'automation', 'linux'],
  'analyst': ['sql', 'excel', 'tableau', 'power bi', 'analysis', 'reporting', 'data visualization', 'dashboard', 'business intelligence'],
};

const CRITICAL_KEYWORDS = [
  'email', 'phone', 'linkedin', 'github',
  'experience', 'education', 'skills', 'summary'
];

const COMMON_ISSUES = {
  NO_CONTACT: {
    title: 'Missing Contact Information',
    description: 'Your CV lacks clear contact details (email, phone) that recruiters need to reach you.',
    suggestion: 'Add your email address and phone number clearly at the top of your CV.',
    category: 'critical' as const,
    severity: 9,
  },
  NO_LOCATION: {
    title: 'Missing Location',
    description: 'Recruiters need to know your location or willingness to relocate.',
    suggestion: 'Add your city/country or "Remote" if you\'re open to remote work.',
    category: 'warning' as const,
    severity: 7,
  },
  NO_SUMMARY: {
    title: 'Missing Professional Summary',
    description: 'A summary helps recruiters quickly understand your value proposition.',
    suggestion: 'Add a 2-3 sentence professional summary at the top highlighting your key skills and experience.',
    category: 'tip' as const,
    severity: 5,
  },
  SHORT_EXPERIENCE: {
    title: 'Insufficient Experience Details',
    description: 'Your experience section lacks specific achievements and responsibilities.',
    suggestion: 'Expand each role with 3-5 bullet points starting with strong action verbs and including quantifiable results.',
    category: 'warning' as const,
    severity: 6,
  },
  NO_SKILLS: {
    title: 'No Skills Section Found',
    description: 'Recruiters and ATS systems look for a clear skills section.',
    suggestion: 'Add a dedicated skills section with technical and soft skills relevant to your target role.',
    category: 'warning' as const,
    severity: 5,
  },
  LONG_PARAGRAPHS: {
    title: 'Dense Text Blocks',
    description: 'Large blocks of text are less scannable and may be skipped by recruiters.',
    suggestion: 'Break long paragraphs into bullet points. Keep descriptions concise and scannable.',
    category: 'tip' as const,
    severity: 4,
  },
  UNFORMATTED_DATES: {
    title: 'Inconsistent Date Formatting',
    description: 'Dates should be consistent and clear throughout your CV.',
    suggestion: 'Use a consistent format like "MMM YYYY" (e.g., "Jan 2020 - Present") for all dates.',
    category: 'tip' as const,
    severity: 3,
  },
  NO_ACHIEVEMENTS: {
    title: 'Missing Quantifiable Achievements',
    description: 'Generic descriptions without metrics are less impactful.',
    suggestion: 'Add numbers to your achievements: revenue increased, time saved, team size managed, percentage improvements.',
    category: 'warning' as const,
    severity: 6,
  },
  PAGINATION_ISSUES: {
    title: 'Pagination Problems',
    description: 'Content that gets cut off between pages looks unprofessional.',
    suggestion: 'Ensure section headers don\'t get split across pages. Keep related content together.',
    category: 'tip' as const,
    severity: 3,
  },
  EMAIL_UNPROFESSIONAL: {
    title: 'Unprofessional Email Address',
    description: 'Email addresses with nicknames or informal names can hurt your credibility.',
    suggestion: 'Use a professional email format like firstname.lastname@email.com, ideally with your name.',
    category: 'critical' as const,
    severity: 8,
  },
  TYPOGRAPHY: {
    title: 'Inconsistent Formatting',
    description: 'Inconsistent fonts, sizes, or spacing makes your CV look unpolished.',
    suggestion: 'Use consistent fonts, sizes, and spacing. Stick to professional fonts and maintain hierarchy.',
    category: 'tip' as const,
    severity: 4,
  },
};

/**
 * Calculate format score (10 points)
 */
function scoreFormat(text: string, pages: number): { score: number; issues: ATSIssue[] } {
  let score = 10;
  const issues: ATSIssue[] = [];
  const lines = text.split('\n');

  // Check for overly long lines (poor formatting when parsed)
  const longLines = lines.filter(l => l.length > 150);
  if (longLines.length > 5) {
    score -= 2;
    issues.push({
      ...COMMON_ISSUES.LONG_PARAGRAPHS,
      line: -1,
      section: 'general'
    });
  }

  // Check pagination
  if (pages > 3) {
    score -= 1;
    issues.push({
      ...COMMON_ISSUES.PAGINATION_ISSUES,
      line: -1,
      section: 'general'
    });
  }

  score = Math.max(0, score);
  return { score, issues };
}

/**
 * Calculate keyword score (20 points)
 */
function scoreKeywords(text: string, targetRole?: string): { score: number; issues: ATSIssue[]; keywords: string[] } {
  let score = 20;
  const issues: ATSIssue[] = [];
  const foundKeywords: Set<string> = new Set();
  const lowerText = text.toLowerCase();

  // Check for critical keywords
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  const hasLocation = /(london|manchester|birmingham|\b(?:new york|san francisco|los angeles|chicago|toronto|vancouver|sydney|melbourne|berlin|paris|tokyo)\b|remote|hybrid|on.site)/i.test(text);

  if (!hasEmail) {
    score -= 5;
    issues.push({ ...COMMON_ISSUES.NO_CONTACT, line: -1, section: 'contact' });
  } else {
    foundKeywords.add('email');
  }

  if (!hasLocation) {
    score -= 2;
    issues.push({ ...COMMON_ISSUES.NO_LOCATION, line: -1, section: 'contact' });
  }

  // Check for email professionalism
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    const email = emailMatch[0];
    const localPart = email.split('@')[0];
    if (localPart.includes('123') || localPart.match(/^[0-9]+$/) || localPart.length < 3 || 
        /(baby|cutie|hot|cool|awesome|gamer|ninja)/i.test(localPart)) {
      score -= 3;
      issues.push({ ...COMMON_ISSUES.EMAIL_UNPROFESSIONAL, line: -1, section: 'contact' });
    }
  }

  // Target role keywords
  let roleKeywords: string[] = [];
  if (targetRole) {
    const normalizedRole = targetRole.toLowerCase();
    for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
      if (normalizedRole.includes(role.replace(' ', '').replace('/', '')) || 
          normalizedRole.includes(role.split(' ')[0])) {
        roleKeywords = keywords;
        break;
      }
    }
  }

  // Check for keywords
  const keywordsToCheck = roleKeywords.length > 0 ? roleKeywords : CRITICAL_KEYWORDS;
  for (const keyword of keywordsToCheck) {
    if (lowerText.includes(keyword)) {
      foundKeywords.add(keyword);
    }
  }

  if (foundKeywords.size < 3 && keywordsToCheck.length > 0) {
    score -= 3;
    issues.push({
      category: 'warning',
      severity: 5,
      title: 'Limited Keywords',
      description: `Your CV has few industry-specific keywords. ATS systems rely on these to match your CV to roles${
        targetRole ? ` like "${targetRole}"` : ''
      }.`,
      suggestion: `Add more relevant keywords: ${keywordsToCheck.slice(0, 5).join(', ')}`,
      line: -1,
      section: 'skills/experience'
    });
  }

  score = Math.max(0, score);
  return { score, issues, keywords: Array.from(foundKeywords) };
}

/**
 * Calculate structure score (25 points)
 */
function scoreStructure(text: string): { score: number; issues: ATSIssue[] } {
  let score = 25;
  const issues: ATSIssue[] = [];
  const sections = detectCVSections(text);

  // Check for essential sections
  if (!sections.some(s => ['summary', 'objective', 'profile'].includes(s))) {
    score -= 3;
    issues.push({ ...COMMON_ISSUES.NO_SUMMARY, line: -1, section: 'summary' });
  }

  if (!sections.some(s => ['experience', 'work', 'employment'].includes(s))) {
    score -= 5;
    issues.push({
      category: 'critical' as const,
      severity: 8,
      title: 'No Experience Section',
      description: 'Your CV has no work experience section, which is crucial for most roles.',
      suggestion: 'Add a work experience section with your relevant roles and responsibilities.',
      line: -1,
      section: 'experience'
    });
  }

  if (!sections.some(s => ['education', 'qualifications'].includes(s))) {
    score -= 2;
    issues.push({
      category: 'warning' as const,
      severity: 4,
      title: 'Missing Education Section',
      description: 'Education is typically expected on a CV.',
      suggestion: 'Add your educational background with institutions, degrees, and dates.',
      line: -1,
      section: 'education'
    });
  }

  if (!sections.some(s => ['skills', 'competency', 'technical'].includes(s))) {
    score -= 3;
    issues.push({ ...COMMON_ISSUES.NO_SKILLS, line: -1, section: 'skills' });
  }

  score = Math.max(0, score);
  return { score, issues };
}

/**
 * Calculate content score (25 points)
 */
function scoreContent(text: string): { score: number; issues: ATSIssue[]; strengths: string[] } {
  let score = 25;
  const issues: ATSIssue[] = [];
  const strengths: string[] = [];
  const lines = text.split('\n');

  // Extract experience bullets
  const bullets = extractExperienceBullets(text);
  const expBullets = lines.filter(l => l.match(/^(-|•|✦|\*|–)\s+/));

  if (bullets.length === 0 && expBullets.length === 0) {
    score -= 5;
    issues.push({ ...COMMON_ISSUES.SHORT_EXPERIENCE, line: -1, section: 'experience' });
  } else if (bullets.length < 3) {
    score -= 2;
  }

  // Check for action verbs in bullets
  const actionVerbs = ['achieved', 'developed', 'led', 'managed', 'implemented', 'created', 'designed', 'built', 'improved', 'increased', 'reduced', 'launched', 'spearheaded', 'engineered', 'optimized', 'delivered', 'coordinated', 'facilitated', 'mentored'];
  const bulletText = bullets.join(' ').toLowerCase();
  const usedVerbs = actionVerbs.filter(v => bulletText.includes(v));

  if (usedVerbs.length === 0) {
    score -= 3;
    issues.push({
      category: 'warning' as const,
      severity: 5,
      title: 'Weak Action Verbs',
      description: 'Experience bullets don\'t start with strong action verbs, making your achievements less impactful.',
      suggestion: 'Start each bullet point with strong verbs like: spearheaded, engineered, managed, increased, reduced, launched.',
      line: -1,
      section: 'experience'
    });
  } else if (usedVerbs.length >= 3) {
    strengths.push('Strong action verbs in experience bullets');
  }

  // Check for quantifiable achievements
  const quantPatterns = [/\d+%/, /\d+\+?\s*(?:employees|people|team)/i, /\$[\d,]+[kmb]?/i, /\d+\s*(?:hours|days|weeks|months)/i, /by\s+\d+%/, /increased\s+by\s+\d+%|reduced\s+by\s+\d+%/i];
  let hasQuantification = false;
  for (const pattern of quantPatterns) {
    if (pattern.test(text)) {
      hasQuantification = true;
      break;
    }
  }

  if (!hasQuantification && bullets.length > 2) {
    score -= 3;
    issues.push({ ...COMMON_ISSUES.NO_ACHIEVEMENTS, line: -1, section: 'experience' });
  } else if (hasQuantification) {
    strengths.push('Quantifiable achievements included');
  }

  // Check content length
  const wordCount = getWordCount(text);
  if (wordCount < 150) {
    score -= 3;
    issues.push({
      category: 'warning' as const,
      severity: 4,
      title: 'CV Too Short',
      description: `Your CV is only ${wordCount} words, which may not provide enough detail about your experience.`,
      suggestion: 'Expand on your responsibilities and achievements. Aim for 300-500 words for most professional CVs.',
      line: -1,
      section: 'general'
    });
  } else if (wordCount > 1200) {
    score -= 2;
    issues.push({
      category: 'tip' as const,
      severity: 2,
      title: 'CV Too Long',
      description: 'Your CV may be too detailed. Recruiters typically spend 6-7 seconds on initial review.',
      suggestion: 'Focus on the most recent and relevant experience. Trim older or less relevant roles.',
      line: -1,
      section: 'general'
    });
  } else {
    strengths.push('Good content length');
  }

  score = Math.max(0, score);
  return { score, issues, strengths };
}

/**
 * Calculate readability score (20 points)
 */
function scoreReadability(text: string): { score: number; issues: ATSIssue[] } {
  let score = 20;
  const issues: ATSIssue[] = [];
  const lines = text.split('\n');

  // Check for excessive ALL CAPS (besides section headers)
  const allCapsLines = lines.filter(l => l.length > 20 && l === l.toUpperCase() && !l.match(/^##/));
  if (allCapsLines.length > 3) {
    score -= 2;
    issues.push({
      category: 'tip' as const,
      severity: 2,
      title: 'Excessive Capitalization',
      description: 'Too much ALL CAPS text reduces readability.',
      suggestion: 'Use standard capitalization. Reserve ALL CAPS for section headers only.',
      line: -1,
      section: 'general'
    });
  }

  // Check for very short lines (inconsistent formatting)
  const shortLines = lines.filter(l => l.length > 0 && l.length < 10 && !l.match(/^[#*-]/));
  if (shortLines.length > lines.length * 0.3) {
    score -= 2;
    issues.push({
      category: 'tip' as const,
      severity: 2,
      title: 'Inconsistent Line Lengths',
      description: 'Many very short lines suggest formatting inconsistencies.',
      suggestion: 'Review your CV formatting for consistency. Ensure bullet points have similar lengths.',
      line: -1,
      section: 'general'
    });
  }

  score = Math.max(0, score);
  return { score, issues };
}

/**
 * Analyze a CV and return ATS score with detailed feedback
 */
export function analyzeCV(text: string, pages: number = 1, targetRole?: string): ATSResult {
  const formatScore = scoreFormat(text, pages);
  const keywordScore = scoreKeywords(text, targetRole);
  const structureScore = scoreStructure(text);
  const contentScore = scoreContent(text);
  const readabilityScore = scoreReadability(text);

  const allIssues = [
    ...formatScore.issues,
    ...keywordScore.issues,
    ...structureScore.issues,
    ...contentScore.issues,
    ...readabilityScore.issues,
  ];

  // Sort issues by severity (critical first, then by severity number)
  allIssues.sort((a, b) => {
    const priority = { critical: 0, warning: 1, tip: 2 };
    const catDiff = priority[a.category] - priority[b.category];
    if (catDiff !== 0) return catDiff;
    return b.severity - a.severity;
  });

  // Take top 10 most important issues
  const topIssues = allIssues.slice(0, 10);

  const categoryScores = {
    format: formatScore.score,
    keywords: keywordScore.score,
    structure: structureScore.score,
    content: contentScore.score,
    readability: readabilityScore.score,
  };

  const overallScore = Math.round(
    (formatScore.score * 0.1) +
    (keywordScore.score * 0.2) +
    (structureScore.score * 0.25) +
    (contentScore.score * 0.25) +
    (readabilityScore.score * 0.2)
  );

  // Estimate pass rate (simplified - more issues = lower chance)
  let estimatedPassRate = 100;
  const criticalCount = topIssues.filter(i => i.category === 'critical').length;
  const warningCount = topIssues.filter(i => i.category === 'warning').length;
  estimatedPassRate -= criticalCount * 25;
  estimatedPassRate -= warningCount * 10;
  estimatedPassRate = Math.max(0, Math.min(100, estimatedPassRate));

  // Generate additional strengths
  const allStrengths = [
    ...contentScore.strengths,
  ];

  if (keywordScore.keywords.length >= 5) {
    allStrengths.push('Good keyword coverage');
  }

  if (categoryScores.structure >= 20) {
    allStrengths.push('Well-structured with all essential sections');
  }

  if (allStrengths.length === 0) {
    allStrengths.push('CV shows potential with room for improvement');
  }

  return {
    overallScore,
    categoryScores,
    issues: topIssues,
    strengths: allStrengths,
    estimatedPassRate,
  };
}

/**
 * Check if text contains specific role keywords
 */
export function matchRoleKeywords(text: string, role: string): { matched: string[]; missing: string[]; score: number } {
  const lowerText = text.toLowerCase();
  const normalizedRole = role.toLowerCase();

  let keywords: string[] = [];
  for (const [r, kws] of Object.entries(ROLE_KEYWORDS)) {
    if (normalizedRole.includes(r.replace(' ', '').replace('/', '')) || 
        normalizedRole.includes(r.split(' ')[0])) {
      keywords = kws;
      break;
    }
  }

  if (keywords.length === 0) {
    // Fallback to general keywords
    keywords = Object.values(ROLE_KEYWORDS).flat();
  }

  const matched = keywords.filter(kw => lowerText.includes(kw));
  const missing = keywords.filter(kw => !lowerText.includes(kw));

  const score = keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 0;

  return { matched, missing, score };
}

/**
 * Create improved CV text from original and improved bullets
 */
export function createImprovedCV(originalText: string, improvedBullets: ImprovedBullet[]): string {
  let improved = originalText;
  
  improvedBullets.forEach(({ original, improved: improvedBullet }) => {
    // Escape special regex characters in original
    const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedOriginal, 'gi');
    improved = improved.replace(regex, improvedBullet);
  });
  
  return improved;
}
