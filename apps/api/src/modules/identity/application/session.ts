import { createHash, createHmac, timingSafeEqual } from 'crypto';

const SESSION_MS = 12 * 60 * 60 * 1000;

export function issueSession(username: string, secret: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ u: username.trim(), exp: now + SESSION_MS })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function sessionUsername(token: string): string | null {
  const payload = payloadOf(token);
  if (!payload) {
    return null;
  }
  try {
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { u?: unknown };
    return typeof body.u === 'string' && body.u.trim() ? body.u : null;
  } catch {
    return null;
  }
}

export function sessionIsValid(token: string, username: string, secret: string, now = Date.now()): boolean {
  const payload = payloadOf(token);
  if (!payload || !username.trim() || !secret) {
    return false;
  }
  const signature = token.slice(payload.length + 1);
  if (!sameSecret(signature, sign(payload, secret))) {
    return false;
  }
  try {
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { u?: unknown; exp?: unknown };
    return body.u === username.trim() && typeof body.exp === 'number' && body.exp > now;
  } catch {
    return false;
  }
}

function payloadOf(token: string): string | null {
  const separator = token.indexOf('.');
  if (separator <= 0 || separator !== token.lastIndexOf('.')) {
    return null;
  }
  return token.slice(0, separator);
}

function sign(payload: string, secret: string): string {
  const key = createHash('sha256').update(`aniclare-admin-session\0${secret}`).digest();
  return createHmac('sha256', key).update(payload).digest('base64url');
}

function sameSecret(left: string, right: string): boolean {
  const actual = createHash('sha256').update(left).digest();
  const stored = createHash('sha256').update(right).digest();
  return timingSafeEqual(actual, stored);
}
