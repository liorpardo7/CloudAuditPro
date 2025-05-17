import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import path from 'path';

// Helper to get the Resource Manager client
const getResourceManager = async (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.cloudresourcemanager({ version: 'v1', auth: oauth2Client });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the OAuth token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const accessToken = authHeader.replace('Bearer ', '');

  try {
    const resourceManager = await getResourceManager(accessToken);
    const result = await resourceManager.projects.list({ pageSize: 1000 });
    const projects = result.data.projects || [];
    res.status(200).json({ projects });
  } catch (err: any) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
} 