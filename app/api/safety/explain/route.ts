import { NextRequest, NextResponse } from 'next/server';
import { containsHighConfidencePii } from '@/lib/privacy/redact';
import { explainScamMessage } from '@/lib/safety/explain';
import type { RiskLevel } from '@/lib/safety/types';
import {
  BODY_LIMITS,
  RATE_LIMITS,
  checkRateLimit,
  exceedsBodyLimit,
  payloadTooLarge,
  tooManyRequests,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEXT_CHARS = 4000;
const VALID_LEVELS = new Set<RiskLevel>(['safe', 'caution', 'high-risk', 'almost-certainly-a-scam']);

export async function POST(req: NextRequest) {
  if (exceedsBodyLimit(req, BODY_LIMITS.safety)) {
    return payloadTooLarge('Message is too long.');
  }

  const limit = checkRateLimit(req, RATE_LIMITS.safety);
  if (!limit.ok) {
    return tooManyRequests(
      limit.retryAfterSec,
      'Too many checks — your offline result is still shown below.',
    );
  }

  try {
    const body = await req.json();
    const redactedText = typeof body.redactedText === 'string' ? body.redactedText : '';
    const level = body.level as RiskLevel;
    const signalIds = Array.isArray(body.signalIds)
      ? body.signalIds.filter((id: unknown): id is string => typeof id === 'string').slice(0, 30)
      : [];

    if (!redactedText || redactedText.length > MAX_TEXT_CHARS || !VALID_LEVELS.has(level)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    // Belt and braces: the client redacts before sending, but a client bug
    // must not leak raw PII to a third-party AI provider.
    if (containsHighConfidencePii(redactedText)) {
      return NextResponse.json(
        { error: 'Text still contains personal information. Redact it before requesting an explanation.' },
        { status: 400 },
      );
    }

    const started = Date.now();
    const result = await explainScamMessage({ redactedText, level, signalIds });

    // Never log the body — only shape and timing.
    console.info('safety/explain', {
      level,
      signalCount: signalIds.length,
      durationMs: Date.now() - started,
      source: result.source,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('safety/explain error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Explanation unavailable.' }, { status: 500 });
  }
}
