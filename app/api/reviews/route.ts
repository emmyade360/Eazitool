import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Review service not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { document_type, rating, comment, user_email } = body;

    if (!document_type || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.from('reviews').insert([
      {
        document_type,
        rating,
        comment: comment?.trim() || null,
        user_email: user_email || null,
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
