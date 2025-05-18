import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rateLimitError = rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const { projectIds } = body;

  if (!Array.isArray(projectIds)) {
    return NextResponse.json({ error: 'projectIds must be an array' }, { status: 400 });
  }

  // TODO: Save the selected projects to your database or session here

  return NextResponse.json({ success: true, selectedProjects: projectIds });
} 