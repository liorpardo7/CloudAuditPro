// @ts-ignore: No type definitions for 'cookie'
import { serialize } from 'cookie';
import { NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { verifyCsrf } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function POST(request: Request) {
  const rateLimitError = rateLimit(request, { limit: 5, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;
  // Refresh the access token using the refresh token from the cookie
  const cookieStore = nextCookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  if (!refreshToken) {
    return new NextResponse(JSON.stringify({ error: 'No refresh token found' }), { status: 401 });
  }
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh access token');
    }
    const tokens = await tokenResponse.json();
    // Set new access token in HTTP-only, Secure, SameSite=Strict cookie
    const response = new NextResponse(JSON.stringify({ access_token: tokens.access_token }), { status: 200 });
    response.headers.append('Set-Cookie', serialize('access_token', tokens.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: tokens.expires_in || 3600
    }));
    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to refresh token' }), { status: 500 });
  }
} 