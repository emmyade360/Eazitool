import 'server-only';
import Groq from 'groq-sdk';
import { GROQ_MODEL } from '@/lib/groq-model';
import type { ATSResult } from '@/lib/ats-scorer';

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

export type ImprovedBullet = {
  original: string;
  improved: string;
  reasoning: string;
};

/**
 * Improve CV bullets using AI for a specific role
 */
export async function improveBulletsWithAI(
  bullets: string[],
  targetRole: string = 'general'
): Promise<ImprovedBullet[]> {
  if (bullets.length === 0) {
    return [];
  }

  const groq = getGroqClient();
  if (!groq) {
    return bullets.map((bullet) => improveBulletRuleBased(bullet));
  }

  const bulletList = bullets
    .map((b, i) => `${i + 1}. ${b}`)
    .join('\n');

  const roleContext = getRoleContext(targetRole);

  const prompt = `You are an expert resume writer specializing in ${targetRole} roles.

Rewrite the following CV bullet points to be more impactful and ATS-friendly. 

${roleContext}

CRITICAL RULES:
- Start each bullet with a STRONG action verb (Spearheaded, Engineered, Optimized, Led, etc.)
- Add quantifiable results whenever possible (percentages, numbers, metrics)
- Focus on IMPACT and RESULTS, not just responsibilities
- Keep bullets concise and scannable (1-2 lines max)
- Use industry keywords naturally
- Remove weak phrases like "Responsible for", "Helped with", "Worked on"
- Maintain the core meaning while dramatically improving impact

BULLETS TO REWRITE:
${bulletList}

Format your response as:
[Original bullet number]. [Improved bullet]

Only provide the rewritten bullets. No preamble or explanation.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: GROQ_MODEL,
      temperature: 0.4,
      max_tokens: 700,
    });

    const response = completion.choices[0]?.message?.content || '';
    return parseImprovedBullets(response, bullets);
  } catch (error) {
    console.error('Error improving bullets:', error);
    // Fallback to rule-based improvements
    return bullets.map((bullet) => improveBulletRuleBased(bullet));
  }
}

export async function generateRoastSummary(
  text: string,
  atsScore: ATSResult,
  targetRole?: string
): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    return buildFallbackRoastSummary(atsScore, targetRole);
  }

  const sample = text.slice(0, 5000);
  const prompt = `You are a blunt but helpful ATS CV reviewer.

Target role: ${targetRole || 'General job search'}
ATS score: ${atsScore.overallScore}/100
Top issues:
${atsScore.issues.slice(0, 4).map((issue, index) => `${index + 1}. ${issue.title}: ${issue.suggestion}`).join('\n')}

CV excerpt:
${sample}

Write:
1. A short roast headline.
2. A short paragraph (max 90 words).
3. Three quick wins, each starting with "- ".

Keep it practical, sharp, and professional.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
      temperature: 0.5,
      max_tokens: 400,
    });

    return completion.choices[0]?.message?.content?.trim() || buildFallbackRoastSummary(atsScore, targetRole);
  } catch (error) {
    console.error('Error generating roast summary:', error);
    return buildFallbackRoastSummary(atsScore, targetRole);
  }
}

/**
 * Parse AI response into structured bullet improvements
 */
function parseImprovedBullets(response: string, originals: string[]): ImprovedBullet[] {
  const lines = response.split('\n').filter(l => l.trim());
  const improved: ImprovedBullet[] = [];

  // Try parsing "X. [text]" format
  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s+(.+)/);
    if (match) {
      const idx = parseInt(match[1]) - 1;
      if (idx >= 0 && idx < originals.length) {
        improved.push({
          original: originals[idx],
          improved: match[2].trim(),
          reasoning: getReasoning(match[2], originals[idx]),
        });
      }
    }
  }

  // If parsing failed, do simple 1:1 mapping
  if (improved.length === 0) {
    const bullets = response.split('\n').filter(l => l.trim().length > 10);
    for (let i = 0; i < Math.min(bullets.length, originals.length); i++) {
      improved.push({
        original: originals[i],
        improved: bullets[i].replace(/^\d+[.)]?\s*/, '').trim(),
        reasoning: getReasoning(bullets[i], originals[i]),
      });
    }
  }

  return improved;
}

/**
 * Generate reasoning for an improvement
 */
function getReasoning(improved: string, original: string): string {
  const hasNumber = /\d+%|\d+\s*(?:employees|users|clients|projects|times|dollars)/i.test(improved);
  const hasStrongVerb = /^(Spearheaded|Engineered|Led|Developed|Implemented|Launched|Optimized|Managed|Directed|Established)/i.test(improved);

  if (!hasStrongVerb) return 'Added strong action verb for impact';
  if (!hasNumber && /\d/.test(original)) return 'Maintained quantifiable results with stronger phrasing';
  if (hasNumber) return 'Added quantifiable metrics to demonstrate impact';
  
  return 'Improved phrasing and focus on results';
}

/**
 * Get role-specific context for bullet improvements
 */
function getRoleContext(role: string): string {
  const normalized = role.toLowerCase();

  if (normalized.includes('engineer') || normalized.includes('developer')) {
    return `TECHNICAL ROLE CONTEXT:
- Emphasize technical skills, tools, and technologies
- Highlight system performance, scalability, and reliability improvements
- Mention team collaboration and code quality
- Include metrics on performance gains, reduced latency, or efficiency improvements
`;
  }

  if (normalized.includes('product') || normalized.includes('manager')) {
    return `PRODUCT/MANAGEMENT CONTEXT:
- Focus on delivery, stakeholder management, and business impact
- Mention revenue growth, user adoption, or cost savings
- Highlight cross-functional leadership
- Emphasize strategic thinking and execution
`;
  }

  if (normalized.includes('designer') || normalized.includes('design')) {
    return `DESIGN ROLE CONTEXT:
- Emphasize user research, testing, and iteration
- Mention design systems, consistency, and scalability
- Highlight collaboration with engineering and product
- Include metrics on usability improvements or user engagement
`;
  }

  if (normalized.includes('data')) {
    return `DATA ROLE CONTEXT:
- Emphasize insights, modeling, and analysis
- Mention data volume, accuracy improvements, or processing efficiency
- Highlight business decisions influenced by data
- Include technical skills and tools
`;
  }

  if (normalized.includes('marketing')) {
    return `MARKETING ROLE CONTEXT:
- Focus on campaigns, growth, and conversions
- Mention revenue impact, lead generation, or brand metrics
- Highlight channel expertise and analytics
- Include percentages on improvement
`;
  }

  return `GENERAL CONTEXT:
- Use strong action verbs
- Quantify achievements
- Focus on results and impact
- Keep concise and professional
`;
}

/**
 * Rule-based bullet improvement (fallback)
 */
function improveBulletRuleBased(bullet: string): ImprovedBullet {
  let improved = bullet;
  const changes: string[] = [];

  // Remove weak starters
  const weakStarters = ['Responsible for', 'Worked on', 'Helped with', 'Assisted in', 'Participated in'];
  for (const starter of weakStarters) {
    if (improved.startsWith(starter)) {
      improved = improved.replace(starter, '').trim();
      changes.push('Weak starter removed');
      break;
    }
  }

  // Ensure starts with action verb
  const actionVerbs = {
    'Managed': ['Managed', 'Led', 'Directed'],
    'Developed': ['Engineered', 'Built', 'Created', 'Designed'],
    'Improved': ['Optimized', 'Enhanced', 'Streamlined'],
    'Made': ['Implemented', 'Launched', 'Established'],
  };

  for (const [weak, strongOptions] of Object.entries(actionVerbs)) {
    if (improved.toLowerCase().startsWith(weak.toLowerCase())) {
      improved = improved.replace(new RegExp(`^${weak}\\s+`, 'i'), strongOptions[0] + ' ');
      changes.push('Started with strong action verb');
      break;
    }
  }

  // Add note if no quantifiable result
  if (!/\d+%|\d+\s*(?:employees|people|team|users|clients)/i.test(improved)) {
    changes.push('Consider adding quantifiable metrics');
  }

  return {
    original: bullet,
    improved,
    reasoning: changes.join(', ') || 'Rule-based improvement applied',
  };
}

function buildFallbackRoastSummary(atsScore: ATSResult, targetRole?: string): string {
  const topIssues = atsScore.issues.slice(0, 3);
  const headline =
    atsScore.overallScore >= 80
      ? 'Solid CV, but it still leaves points on the table.'
      : atsScore.overallScore >= 60
        ? 'This CV has promise, but it is making ATS work too hard.'
        : 'This CV is getting filtered out before it gets a fair shot.';

  const summary = `Your current ATS score is ${atsScore.overallScore}/100${targetRole ? ` for ${targetRole}` : ''}. The biggest drag comes from ${topIssues.map((issue) => issue.title.toLowerCase()).join(', ')}. Tightening those areas will make the CV easier to scan, easier to match, and much stronger in recruiter review.`;

  const quickWins = topIssues
    .map((issue) => `- ${issue.suggestion}`)
    .join('\n');

  return `${headline}\n\n${summary}\n\n${quickWins}`;
}
