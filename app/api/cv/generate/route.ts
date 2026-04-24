import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
- Use ## for main section headings.
- Use **bold** for job titles and company names.
- Bullet points must start with strong action verbs.
- No tables, columns, images, or special symbols - pure ATS-safe text.
- Include only the sections provided below, in the order given.
- Do not invent information that was not provided.
- If a field or section is blank, omit it completely.
- Never guess or fabricate an address, location, phone number, website, LinkedIn URL, dates, institutions, employers, or metrics.
- Do not add placeholders such as "N/A", "Available on request", or guessed city/country values.

---
CANDIDATE:
${candidateLines}

${orderedContent}
---

Write the complete CV now:`;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CVPayload;
    const styles: Array<'classic' | 'impact' | 'story'> = ['classic', 'impact', 'story'];

    const results = await Promise.all(
      styles.map((style) =>
        groq.chat.completions
          .create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: buildPrompt({ ...payload, style }) }],
            temperature: style === 'story' ? 0.55 : 0.25,
            max_tokens: 2500,
          })
          .then((result) => ({
            style,
            content: result.choices[0]?.message?.content ?? '',
          }))
      )
    );

    const variants = [
      {
        style: 'classic',
        title: 'Classic',
        badge: 'Traditional',
        description: 'Formal, structured, and universally accepted. Ideal for corporate, legal, finance, and government roles.',
        color: 'blue',
      },
      {
        style: 'impact',
        title: 'Impact',
        badge: 'Data-Driven',
        description: 'Metric-heavy, action-verb-led bullets. Built for ATS and designed to impress in tech, sales, and startups.',
        color: 'violet',
      },
      {
        style: 'story',
        title: 'Story-Driven',
        badge: 'Distinctive',
        description: 'Narrative arc, compelling language. Perfect for leadership, creative, or senior roles where voice matters.',
        color: 'emerald',
      },
    ].map((meta) => ({
      ...meta,
      content: results.find((r) => r.style === meta.style)?.content ?? '',
    }));

    return NextResponse.json({ variants });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
