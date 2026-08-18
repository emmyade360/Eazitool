import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  getAdminSessionToken,
  isAdminPassword,
} from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const configuredToken = getAdminSessionToken();
  if (!configuredToken) {
    return NextResponse.json({ error: 'Admin access is not configured.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const password = typeof body.password === 'string' ? body.password : '';
    if (!isAdminPassword(password)) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, configuredToken, adminSessionCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid sign-in request.' }, { status: 400 });
  }
}

export function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { ...adminSessionCookieOptions, maxAge: 0 });
  return response;
}
