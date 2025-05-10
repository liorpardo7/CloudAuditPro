import { NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  // Store project ID in session/cookie for the callback
  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(
      'https://www.googleapis.com/auth/cloud-platform.read-only ' +
      'https://www.googleapis.com/auth/cloud-billing.readonly ' +
      'https://www.googleapis.com/auth/logging.read'
    )}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${encodeURIComponent(projectId)}`
  )

  // Store project ID in a cookie for the callback
  response.cookies.set('oauth_project_id', projectId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  })

  return response
} 