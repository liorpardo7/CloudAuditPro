import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectIds } = body;

  if (!Array.isArray(projectIds)) {
    return NextResponse.json({ error: 'projectIds must be an array' }, { status: 400 });
  }

  // TODO: Save the selected projects to your database or session here

  return NextResponse.json({ success: true, selectedProjects: projectIds });
} 