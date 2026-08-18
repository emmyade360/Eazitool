import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GROQ_MODEL } from '@/lib/groq-model';
import {
  BODY_LIMITS,
  RATE_LIMITS,
  checkRateLimit,
  exceedsBodyLimit,
  payloadTooLarge,
  tooManyRequests,
} from '@/lib/rate-limit';

let groqClient: Groq | null = null;
function getGroq(): Groq {
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
}

interface CVPayload {
  name: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  website?: string;
  sections: string[];
  summary?: string;
  experience?: Array<{ company: string; role: string; duration: string; bullets: string }>;
  education?: Array<{ institution: string; degree: string; year: string }>;
  skills?: string;
  certifications?: string;
  projects?: string;
  languages?: string;
  volunteer?: string;
  awards?: string;
  publications?: string;
  references?: string;
  style: 'classic' | 'impact' | 'story';
}

const STYLE_INSTRUCTION: Record<string, string> = {
  classic: `
Style: Classic / Traditional
- Strict chronological order, clean hierarchy
- Formal, neutral language - no first-person pronouns
- Section headers in ALL CAPS
- Conservative tone suited to finance, law, corporate, or government roles
- Emphasise stability, tenure, and credentials`,

  impact: `
Style: Impact / Modern
- Lead every experience bullet with a strong action verb (Spearheaded, Engineered, Grew)
- Quantify every real achievement only when the user provided enough information to support it
- Tight, scannable bullets - max 1.5 lines each
- Designed to pass ATS and impress tech, SaaS, or startup hiring teams
- Section headers in Title Case`,

  story: `
Style: Story-Driven / Distinctive
- Open with a compelling narrative summary that reads like an executive bio
- Weave a coherent career arc through the experience section
- Use power language that's professional yet memorably human
- Ideal for leadership, creative, marketing, or senior roles where personality matters
- Section headers in Title Case`,
};

function buildPrompt(payload: CVPayload): string {
  const candidateLines = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    payload.phone?.trim() ? `Phone: ${payload.phone.trim()}` : '',
    payload.location?.trim() ? `Address / Location: ${payload.location.trim()}` : '',
    payload.linkedin?.trim() ? `LinkedIn: ${payload.linkedin.trim()}` : '',
    payload.website?.trim() ? `Website: ${payload.website.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const sectionContent: Record<string, string> = {
    summary: payload.summary?.trim() ? `PROFESSIONAL SUMMARY:\n${payload.summary.trim()}` : '',
    experience: payload.experience?.length
      ? `WORK EXPERIENCE:\n${payload.experience
          .filter((e) => e.company.trim() || e.role.trim() || e.duration.trim() || e.bullets.trim())
          .map((e) => `${e.role} at ${e.company} (${e.duration})\n${e.bullets}`)
          .join('\n\n')}`
      : '',
    education: payload.education?.length
      ? `EDUCATION:\n${payload.education
          .filter((e) => e.institution.trim() || e.degree.trim() || e.year.trim())
          .map((e) => `${e.degree} - ${e.institution} (${e.year})`)
          .join('\n')}`
      : '',
    skills: payload.skills?.trim() ? `SKILLS:\n${payload.skills.trim()}` : '',
    certifications: payload.certifications?.trim() ? `CERTIFICATIONS:\n${payload.certifications.trim()}` : '',
    projects: payload.projects?.trim() ? `PROJECTS:\n${payload.projects.trim()}` : '',
    languages: payload.languages?.trim() ? `LANGUAGES:\n${payload.languages.trim()}` : '',
    volunteer: payload.volunteer?.trim() ? `VOLUNTEER WORK:\n${payload.volunteer.trim()}` : '',
    awards: payload.awards?.trim() ? `AWARDS & ACHIEVEMENTS:\n${payload.awards.trim()}` : '',
    publications: payload.publications?.trim() ? `PUBLICATIONS:\n${payload.publications.trim()}` : '',
    references: payload.references?.trim() ? `REFERENCES:\n${payload.references.trim()}` : '',
  };

  const orderedContent = payload.sections
    .map((id) => sectionContent[id])
    .filter(Boolean)
    .join('\n\n');

  return `You are an expert ATS-optimised resume writer. Write a single, complete, professional CV in clean Markdown.

${STYLE_INSTRUCTION[payload.style]}

CRITICAL RULES:
- Output only the CV content. No preamble, no commentary.
- Start with the candidate's name on a plain first line, then their contact details on separate plain lines. Do not make the name a Markdown heading.
- Use ## for main section headings.
- Use **bold** for job titles and company names.
- Bullet points must start with strong action verbs.
- No tables, columns, images, or special symbols - pure ATS-safe text.
- Include only the sections provided below, in the order given.
- Do not invent information that was not provided.
- If a field or section is blank, omit it completely.
- Never guess or fabricate an address, location, phone number, website, LinkedIn URL, dates, institutions, employers, or metrics.
- Do not add placeholders such as "N/A", "Available on request", or guessed city/country values.
- Never include a template, design, product, or style name in the CV content.

---
CANDIDATE:
${candidateLines}

${orderedContent}
---

Write the complete CV now:`;
}

export async function POST(req: NextRequest) {

  if (exceedsBodyLimit(req, BODY_LIMITS.cv)) {
    return payloadTooLarge('Upload is too large.');
  }

  const rateLimit = checkRateLimit(req, RATE_LIMITS.cv);
  if (!rateLimit.ok) {
    return tooManyRequests(rateLimit.retryAfterSec, 'Too many requests. Try again in a few minutes.');
  }
  try {
    const payload = (await req.json()) as CVPayload;
    // The builder now has one template-controlled output path. Generating three
    // alternative drafts here added large, unused Groq requests and delayed the
    // template library from opening.
    const result = await getGroq().chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: buildPrompt({ ...payload, style: 'classic' }) }],
      temperature: 0.25,
      max_tokens: 2500,
    });

    const variants = [{
      style: 'classic',
      title: 'CV Draft',
      badge: 'Template-ready',
      description: 'One ATS-safe CV draft formatted by the template you select.',
      color: 'blue',
      content: result.choices[0]?.message?.content ?? '',
    }];

    return NextResponse.json({ variants });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
