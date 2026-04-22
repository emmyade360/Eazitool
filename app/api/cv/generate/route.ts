import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { headers } from 'next/headers';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Rate limiting ─────────────────────────────────────────────────────────────
// Simple in-memory store: userIP → [timestamp1, timestamp2, ...]
// Allows 1 request per 5 minutes (300,000 ms) per user
const rateLimitStore = new Map<string, number[]>();

const RATE_LIMIT_MAX = 1;        // max requests
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes in ms
const RATE_LIMIT_CLEANUP_INTERVAL = 60 * 1000; // cleanup every 60s

// Perform periodic cleanup of old entries
function cleanupOldEntries() {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW;
  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const recent = timestamps.filter(t => t > cutoff);
    if (recent.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, recent);
    }
  }
}

// Run cleanup on startup and every interval
cleanupOldEntries();
setInterval(cleanupOldEntries, RATE_LIMIT_CLEANUP_INTERVAL);

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW;

  // Get or create entry for this IP
  const timestamps = rateLimitStore.get(ip) ?? [];

  // Filter to window
  const recent = timestamps.filter(t => t > cutoff);
  const remaining = Math.max(0, RATE_LIMIT_MAX - recent.length);
  const reset = recent.length >= RATE_LIMIT_MAX ? Math.min(...recent) + RATE_LIMIT_WINDOW : 0;

  // Update store
  if (remaining > 0) {
    recent.push(now);
    rateLimitStore.set(ip, recent);
  }

  return {
    allowed: remaining > 0,
    remaining,
    reset,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Experience = { company: string; role: string; duration: string; bullets: string };
type Education  = { institution: string; degree: string; year: string };

interface CVPayload {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  sections: string[];            // ordered list of enabled section ids
  summary?: string;
  experience?: Experience[];
  education?: Education[];
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
- Formal, neutral language — no first-person pronouns
- Section headers in ALL CAPS
- Conservative tone suited to finance, law, corporate, or government roles
- Emphasise stability, tenure, and credentials`,

  impact: `
Style: Impact / Modern
- Lead every experience bullet with a strong action verb (Spearheaded, Engineered, Grew…)
- Quantify EVERY achievement with real or plausible metrics (%, $, users, time saved)
- Tight, scannable bullets — max 1.5 lines each
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

function buildPrompt(p: CVPayload): string {
  const sectionContent: Record<string, string> = {
    summary:        p.summary        ? `PROFESSIONAL SUMMARY:\n${p.summary}` : '',
    experience:     p.experience?.length
      ? `WORK EXPERIENCE:\n${p.experience.map(e => `${e.role} at ${e.company} (${e.duration})\n${e.bullets}`).join('\n\n')}`
      : '',
    education:      p.education?.length
      ? `EDUCATION:\n${p.education.map(e => `${e.degree} — ${e.institution} (${e.year})`).join('\n')}`
      : '',
    skills:         p.skills         ? `SKILLS:\n${p.skills}`              : '',
    certifications: p.certifications ? `CERTIFICATIONS:\n${p.certifications}` : '',
    projects:       p.projects       ? `PROJECTS:\n${p.projects}`           : '',
    languages:      p.languages      ? `LANGUAGES:\n${p.languages}`         : '',
    volunteer:      p.volunteer      ? `VOLUNTEER WORK:\n${p.volunteer}`    : '',
    awards:         p.awards         ? `AWARDS & ACHIEVEMENTS:\n${p.awards}`: '',
    publications:   p.publications   ? `PUBLICATIONS:\n${p.publications}`   : '',
    references:     p.references     ? `REFERENCES:\n${p.references}`       : '',
  };

  const orderedContent = p.sections
    .map(id => sectionContent[id])
    .filter(Boolean)
    .join('\n\n');

  return `You are an expert ATS-optimised resume writer. Write a single, complete, professional CV in clean Markdown.

${STYLE_INSTRUCTION[p.style]}

CRITICAL RULES:
- Output ONLY the CV content — no preamble, no "Here is your CV", no commentary
- Use ## for main section headings
- Use **bold** for job titles and company names
- Bullet points must start with strong action verbs
- No tables, columns, images, or special symbols — pure ATS-safe text
- Include ALL the sections provided below, in the order given
- Do NOT invent information not provided — expand phrasing only

---
CANDIDATE:
Name: ${p.name}
Email: ${p.email}
Phone: ${p.phone}
Location: ${p.location}
${p.linkedin ? `LinkedIn: ${p.linkedin}` : ''}
${p.website  ? `Website: ${p.website}`   : ''}

${orderedContent}
---

Write the complete CV now:`;
}

export async function POST(req: NextRequest) {
  // ─── Rate limit check ────────────────────────────────────────────────────────
  // Get client IP (respects X-Forwarded-For when behind a proxy)
  const reqHeaders = await headers();
  const forwardedFor = reqHeaders.get('x-forwarded-for');
  const ip = (forwardedFor ? forwardedFor.split(',')[0]?.trim() : null) ?? 'unknown';

  const rateInfo = checkRateLimit(ip);
  if (!rateInfo.allowed) {
    const retryAfter = Math.ceil((rateInfo.reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, retryAfter)),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateInfo.reset / 1000)),
        },
      }
    );
  }

  try {
    const payload = await req.json() as CVPayload;

    // Generate all 3 styles in parallel
    const styles: Array<'classic' | 'impact' | 'story'> = ['classic', 'impact', 'story'];

    const results = await Promise.all(
      styles.map(style =>
        groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: buildPrompt({ ...payload, style }) }],
          temperature: style === 'story' ? 0.55 : 0.25,
          max_tokens: 2500,
        }).then(r => ({
          style,
          content: r.choices[0]?.message?.content ?? '',
        }))
      )
    );

    const variants = [
      { style: 'classic', title: 'Classic',        badge: 'Traditional',    description: 'Formal, structured, and universally accepted. Ideal for corporate, legal, finance, and government roles.',    color: 'blue'   },
      { style: 'impact',  title: 'Impact',          badge: 'Data-Driven',    description: 'Metric-heavy, action-verb-led bullets. Built for ATS and designed to impress in tech, sales, and startups.', color: 'violet' },
      { style: 'story',   title: 'Story-Driven',    badge: 'Distinctive',    description: 'Narrative arc, compelling language. Perfect for leadership, creative, or senior roles where voice matters.',  color: 'emerald'},
    ].map(meta => ({
      ...meta,
      content: results.find(r => r.style === meta.style)?.content ?? '',
    }));

    return NextResponse.json({ variants });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
