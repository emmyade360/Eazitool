import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'eazitool_admin_session';

function getPassword() {
  return process.env.ADMIN_DASHBOARD_PASSWORD?.trim() || '';
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function sessionToken(password: string) {
  return createHmac('sha256', password).update('eazitool:admin-feedback:v1').digest('base64url');
}

export function isAdminPassword(password: string) {
  const configured = getPassword();
  return Boolean(configured) && safeEqual(password, configured);
}

export function hasAdminSession(token: string | undefined) {
  const configured = getPassword();
  if (!configured || !token) return false;
  return safeEqual(token, sessionToken(configured));
}

export function getAdminSessionToken() {
  const configured = getPassword();
  return configured ? sessionToken(configured) : null;
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/admin',
  maxAge: 60 * 60 * 24 * 7,
};
