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

const MAX_COMMENT_CHARS = 1000;
const MAX_EMAIL_CHARS = 254;

export async function POST(req: NextRequest) {
  if (exceedsBodyLimit(req, BODY_LIMITS.reviews)) {
    return payloadTooLarge('Review payload is too large.');
  }

  const limit = checkRateLimit(req, RATE_LIMITS.reviews);
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfterSec, 'Too many reviews submitted. Try again later.');
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Review service not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { document_type, rating, comment, user_email } = body;

    if (
      typeof document_type !== 'string' ||
      document_type.length === 0 ||
      document_type.length > 100 ||
      typeof rating !== 'number' ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }

    if (
      (comment !== undefined && comment !== null && typeof comment !== 'string') ||
      (user_email !== undefined && user_email !== null && typeof user_email !== 'string')
    ) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.from('reviews').insert([
      {
        document_type,
        rating,
        comment: comment?.trim().slice(0, MAX_COMMENT_CHARS) || null,
        user_email: user_email?.trim().slice(0, MAX_EMAIL_CHARS) || null,
      },
    ]);

    if (error) {
      console.error('Review insert error:', error.message);
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Review route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
