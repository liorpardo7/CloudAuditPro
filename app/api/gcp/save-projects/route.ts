import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf-server';
import { rateLimit } from '@/lib/rate-limit';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

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

  // Get user session and access token
  const cookieStore = cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  const userId = session.user.id;
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return NextResponse.json({ error: 'No access token found' }, { status: 401 });
  }

  // Fetch all GCP projects for this user
  const gcpRes = await fetch('https://cloudresourcemanager.googleapis.com/v1/projects', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!gcpRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch GCP projects' }, { status: 500 });
  }
  const { projects } = await gcpRes.json();

  const savedProjects = [];
  for (const id of projectIds) {
    const gcpProject = projects.find((p: any) => p.projectId === id);
    if (!gcpProject) continue;
    const upserted = await prisma.project.upsert({
      where: { gcpProjectId_userId: { gcpProjectId: id, userId } },
      update: { status: 'active', lastSync: new Date(), name: gcpProject.name },
      create: {
        name: gcpProject.name,
        gcpProjectId: gcpProject.projectId,
        status: 'active',
        lastSync: new Date(),
        userId,
      },
    });
    savedProjects.push(upserted);
  }

  return NextResponse.json({ success: true, selectedProjects: savedProjects });
} 