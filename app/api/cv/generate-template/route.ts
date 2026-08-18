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

const TEMPLATE_META: Record<string, { label: string }> = {
  harvard: { label: 'Harvard Classic' },
  stanford: { label: 'Stanford Modern' },
  mckinsey: { label: 'McKinsey Executive' },
  google: { label: 'Google Minimal' },
  mit: { label: 'MIT Technical' },
  forbes: { label: 'Forbes Bold' },
};

function buildPrompt(templateId: string, content: string): string {
  const meta = TEMPLATE_META[templateId];
  return `You are an expert HTML/CSS developer specializing in ATS-friendly CV templates.

Generate a complete, professional CV in HTML with embedded CSS that matches the ${meta?.label || templateId} style.

CRITICAL REQUIREMENTS:
- Output ONLY valid HTML with embedded CSS in <style> tags
- ATS-friendly: no tables for layout, no images, standard HTML structure
- Use semantic HTML: <header>, <section>, <article>, <h1>-<h6>, <ul>, <li>
- CSS must be embedded in <style> tags (no external files)
- Use standard fonts: Arial, Helvetica, Times New Roman, or Georgia
- Print-friendly: use @media print styles
- Page size: A4 (210mm x 297mm) or standard US Letter
- Font sizes: 10-12pt for body, 14-18pt for headings
- Line height: 1.3-1.6 for readability

TEMPLATE-SPECIFIC STYLING:
- harvard: Classic serif font (Times New Roman, Georgia), traditional black and white, clear section headings in ALL CAPS, underlined section headers, left-aligned, single-column layout, generous margins (1 inch / 2.54cm), conservative spacing, bold company/job titles
- stanford: Modern sans-serif (Arial, Helvetica), two-column layout: narrow left sidebar for contact/skills, teal or blue accent (#0D9488 or #2563EB), rounded corners on sections, clean, airy spacing, subtle shadows or borders, modern gradient header (optional)
- mckinsey: Executive serif font (Georgia, Times), dark navy accent (#1E3A8A) with gold highlights (#F59E0B), strong horizontal rules between sections, right-aligned dates, bold metrics and numbers, ample white space, sophisticated, premium feel
- google: Clean sans-serif (Arial, Roboto), Material Design inspired: cards with subtle shadows, blue accent (#4285F4), border-radius on containers (8px), minimalist, lots of white space, simple, clear hierarchy
- mit: Technical monospace/sans-serif mix (Consolas, Arial), structured grid layout, dark gray (#374151) with bright accent (#10B981), code-like formatting for technical skills, clear section numbering (1. 2. 3.), precise, engineering-focused design
- forbes: Bold sans-serif (Arial Black, Impact for headers), strong contrast: black text on white, red accents (#DC2626), large, bold name header, horizontal accent bars, executive summary box with colored background, professional yet distinctive

CONTENT TO RENDER:
---
${content}
---

Output the complete HTML document with embedded CSS now:`;
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
    const { content, templateId } = await req.json();

    if (!content || !templateId) {
      return NextResponse.json({ error: 'Missing content or templateId.' }, { status: 400 });
    }
    if (typeof templateId !== 'string' || !TEMPLATE_META[templateId]) {
      return NextResponse.json({ error: 'Unknown professional template.' }, { status: 400 });
    }

    const result = await getGroq().chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: buildPrompt(templateId, content) }],
      temperature: 0.3,
      // One template is generated on demand; this cap keeps the request well
      // below Groq burst limits while leaving room for a complete print layout.
      max_tokens: 2400,
    });

    let htmlTemplate = result.choices[0]?.message?.content ?? '';

    const htmlMatch = htmlTemplate.match(/```(?:html)?\s*([\s\S]*?)```/);
    if (htmlMatch) htmlTemplate = htmlMatch[1];

    htmlTemplate = htmlTemplate.replace(/<script[\s\S]*?<\/script>/gi, '');

    if (!htmlTemplate.includes('<html') && !htmlTemplate.includes('<!DOCTYPE')) {
      htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV - ${templateId}</title>
</head>
<body>
${htmlTemplate}
</body>
</html>`;
    }

    return NextResponse.json({ htmlTemplate });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Template generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
