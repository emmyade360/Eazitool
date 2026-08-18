import 'server-only';

import { createHmac, randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { clientKey } from '@/lib/rate-limit';

export const VISITOR_COOKIE_NAME = 'eazitool_visitor_id';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type VisitorIdentity = {
  id: string;
  isNew: boolean;
  ipHash: string;
  userAgent: string | null;
};

export function getVisitorIdentity(req: NextRequest): VisitorIdentity {
  const cookieValue = req.cookies.get(VISITOR_COOKIE_NAME)?.value;
  const isNew = !cookieValue || !UUID_PATTERN.test(cookieValue);
  const id = isNew ? randomUUID() : cookieValue;
  const ip = clientKey(req);
  const secret = process.env.VISITOR_IP_HASH_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!secret) {
    throw new Error('Visitor tracking is not configured.');
  }

  return {
    id,
    isNew,
    ipHash: createHmac('sha256', secret).update(ip).digest('hex'),
    userAgent: req.headers.get('user-agent')?.slice(0, 500) || null,
  };
}

export const visitorCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
};
