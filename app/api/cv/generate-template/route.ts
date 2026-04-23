import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { headers } from 'next/headers';
import { sanitizeHtml } from '@/lib/sanitize';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;

function cleanupOldEntries() {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW;

  for (const [ip, timestamps] of rateLimitStore.entries()) {
    const recent = timestamps.filter((timestamp) => timestamp > cutoff);
    if (recent.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, recent);
    }
  }
}

cleanupOldEntries();
setInterval(cleanupOldEntries, 60 * 1000);

function checkRateLimit(ip: string) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW;
  const timestamps = rateLimitStore.get(ip) ?? [];
  const recent = timestamps.filter((timestamp) => timestamp > cutoff);
  const remaining = Math.max(0, RATE_LIMIT_MAX - recent.length);
  const reset = recent.length >= RATE_LIMIT_MAX ? Math.min(...recent) + RATE_LIMIT_WINDOW : 0;

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

export type ProfessionalTemplateId =
  | 'harvard'
  | 'stanford'
  | 'mckinsey'
  | 'google'
  | 'mit'
  | 'forbes';

export async function POST(req: NextRequest) {
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
    const payload = (await req.json()) as {
      content: string;
      templateId: ProfessionalTemplateId;
    };

    if (!payload.content || !payload.templateId) {
      return NextResponse.json(
        { error: 'Missing content or templateId.' },
        { status: 400 }
      );
    }

    const { buildTemplatePrompt } = await import('@/lib/cv-templates');
    const prompt = buildTemplatePrompt(payload.templateId, payload.content);

    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
    });

    let htmlTemplate = result.choices[0]?.message?.content ?? '';

    // Extract HTML if Groq wraps it in markdown code blocks
    const htmlMatch = htmlTemplate.match(/```(?:html)?\s*([\s\S]*?)```/);
    if (htmlMatch) {
      htmlTemplate = htmlMatch[1];
    }

    // Sanitize the HTML for security
    htmlTemplate = sanitizeHtml(htmlTemplate);

    // Ensure it has proper HTML structure
    if (!htmlTemplate.includes('<html') && !htmlTemplate.includes('<!DOCTYPE')) {
      htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV - ${payload.templateId}</title>
</head>
<body>
${htmlTemplate}
</body>
</html>`;
    }

    return NextResponse.json({ htmlTemplate });
  } catch (error) {
    console.error('Template generation error:', error);
    const message = error instanceof Error ? error.message : 'Template generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
