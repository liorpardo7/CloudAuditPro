import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
// @ts-ignore
import { serialize } from 'cookie';
import { verifyCsrf } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();

// If you see model accessor errors, ensure you have run `npx prisma generate` and are using the correct schema.

export async function POST(req: NextRequest) {
  const rateLimitError = rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (rateLimitError) return rateLimitError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  const cookieStore = cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  let userId: string | undefined;
  if (sessionId) {
    // Get user before deleting session
    const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } });
    userId = session?.user?.id;
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }
  // Audit log
  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        metadata: {
          ip: req.headers.get('x-forwarded-for') || req.ip || null,
          userAgent: req.headers.get('user-agent') || null,
        },
      },
    });
  }
  // Clear the session_id cookie
  const response = NextResponse.json({ success: true });
  response.headers.append('Set-Cookie', serialize('session_id', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  }));
  return response;
} 