import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export function verifyCsrf(request: Request): Response | null {
  const cookieStore = cookies();
  const csrfCookie = cookieStore.get('csrf_token')?.value;
  const csrfHeader = request.headers.get('x-csrf-token');
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return new NextResponse(JSON.stringify({ error: 'Invalid or missing CSRF token' }), { status: 403 });
  }
  return null;
} 