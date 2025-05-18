import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get the Resource Manager client
const getResourceManager = async (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.cloudresourcemanager({ version: 'v1', auth: oauth2Client });
};

export async function GET(req: NextRequest) {
  // Read session_id from HTTP-only cookie
  const cookieStore = cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: { include: { projects: { include: { tokens: true } } } } },
  });
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  // Use the first project's access token for demonstration (can be improved)
  const userProjects = session.user.projects;
  if (!userProjects.length || !userProjects[0].tokens.length) {
    return NextResponse.json({ error: 'No projects or tokens found for user' }, { status: 404 });
  }
  const accessToken = userProjects[0].tokens[0].accessToken;

  try {
    const resourceManager = await getResourceManager(accessToken);
    const result = await resourceManager.projects.list({ pageSize: 1000 });
    const projects = result.data.projects || [];
    return NextResponse.json({ projects });
  } catch (err: any) {
    console.error('Error fetching projects:', err);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
} 