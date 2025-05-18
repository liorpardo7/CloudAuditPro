import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

// Helper to get the Resource Manager client
const getResourceManager = async (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.cloudresourcemanager({ version: 'v1', auth: oauth2Client });
};

export async function GET(req: NextRequest) {
  // Read access_token from HTTP-only cookie
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  if (!accessToken) {
    return NextResponse.json({ error: 'Missing or invalid access token cookie' }, { status: 401 });
  }

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