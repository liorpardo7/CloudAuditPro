// @ts-ignore: No type definitions for 'cookie'
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  // Generate a secure random CSRF token
  const csrfToken = crypto.randomBytes(32).toString('hex');
  // Set as HTTP-only cookie
  const cookie = serialize('csrf_token', csrfToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 // 1 hour
  });
  const response = NextResponse.json({ csrfToken });
  response.headers.append('Set-Cookie', cookie);
  return response;
} 