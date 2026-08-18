import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  BODY_LIMITS,
  RATE_LIMITS,
  checkRateLimit,
  exceedsBodyLimit,
  payloadTooLarge,
  tooManyRequests,
} from '@/lib/rate-limit';
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

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Visitor tracking is not configured.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const path = validPath(body.path);
    if (!path) {
      return NextResponse.json({ error: 'Invalid visit path.' }, { status: 400 });
    }

    const visitor = getVisitorIdentity(req);
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { error } = await supabase.rpc('record_visitor_visit', {
      p_visitor_id: visitor.id,
      p_ip_hash: visitor.ipHash,
      p_path: path,
      p_user_agent: visitor.userAgent,
    });

    if (error) {
      console.error('Visit insert error:', error.message);
      return NextResponse.json({ error: 'Could not record visit.' }, { status: 500 });
    }

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
