import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { verifyToken, type AuthPayload } from '@repo/auth';
import { getJwtSecret } from './env';

export function getTokenFromRequest(req: NextRequest): string | undefined {
  return req.cookies.get('token')?.value;
}

export function getTokenFromCookies(): string | undefined {
  return cookies().get('token')?.value;
}

export function getSessionUser(token?: string): AuthPayload | null {
  if (!token) return null;
  return verifyToken(token, getJwtSecret());
}

export function requireSessionUser(token?: string): AuthPayload | null {
  return getSessionUser(token);
}

export function isAdmin(user: AuthPayload | null): boolean {
  return user?.role === 'ADMIN';
}

export function isStaff(user: AuthPayload | null): boolean {
  return user?.role === 'ADMIN' || user?.role === 'STAFF';
}

export async function verifyAdminFromCookies(): Promise<AuthPayload | null> {
  const user = getSessionUser(getTokenFromCookies());
  return isAdmin(user) ? user : null;
}

export async function verifyStaffFromCookies(): Promise<AuthPayload | null> {
  const user = getSessionUser(getTokenFromCookies());
  return isStaff(user) ? user : null;
}

export function verifyAdminFromRequest(req: NextRequest): AuthPayload | null {
  const user = getSessionUser(getTokenFromRequest(req));
  return isAdmin(user) ? user : null;
}
