import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: { include: { projects: true } } },
  });
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  const { user } = session;
  return NextResponse.json({
    user: {
      id: user.id,
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      projects: user.projects,
    },
  });
} 