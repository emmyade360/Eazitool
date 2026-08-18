import { NextRequest, NextResponse } from 'next/server';
import {
  BODY_LIMITS,
  RATE_LIMITS,
  checkRateLimit,
  exceedsBodyLimit,
  payloadTooLarge,
  tooManyRequests,
} from '@/lib/rate-limit';
import { recordVisitorVisit } from '@/lib/feedback-store';
import { getVisitorIdentity, VISITOR_COOKIE_NAME, visitorCookieOptions } from '@/lib/visitor-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PATH_CHARS = 300;

function validPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const path = value.trim();
  return path.startsWith('/') && path.length <= MAX_PATH_CHARS ? path : null;
}

export async function POST(req: NextRequest) {
  if (exceedsBodyLimit(req, BODY_LIMITS.visits)) {
    return payloadTooLarge('Visit payload is too large.');
  }

  const limit = checkRateLimit(req, RATE_LIMITS.visits);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfterSec, 'Too many visit updates.');
  }

  try {
    const body = await req.json();
    const path = validPath(body.path);
    if (!path) {
      return NextResponse.json({ error: 'Invalid visit path.' }, { status: 400 });
    }

    const visitor = getVisitorIdentity(req);
    await recordVisitorVisit(visitor, path);

    const response = NextResponse.json({ ok: true });
    if (visitor.isNew) {
      response.cookies.set(VISITOR_COOKIE_NAME, visitor.id, visitorCookieOptions);
    }
    return response;
  } catch (error) {
    console.error('Visit route error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Could not record visit.' }, { status: 500 });
  }
}
