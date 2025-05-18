// MOVE FILE: This file should be moved to app/api/auth/status/route.ts for Next.js API routing to work properly.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return new NextResponse(JSON.stringify({ authenticated: false }), { status: 401 });
  }
  // Validate token with Google tokeninfo endpoint
  const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
  if (!tokenInfoRes.ok) {
    return new NextResponse(JSON.stringify({ authenticated: false }), { status: 401 });
  }
  const tokenInfo = await tokenInfoRes.json();
  // Optionally, check audience/scope here
  return new NextResponse(JSON.stringify({ authenticated: true, tokenInfo }), { status: 200 });
} 