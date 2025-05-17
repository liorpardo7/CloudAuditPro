import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Helper to get the Resource Manager client
const getResourceManager = async (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.cloudresourcemanager({ version: 'v1', auth: oauth2Client });
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }
  const accessToken = authHeader.replace('Bearer ', '');

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