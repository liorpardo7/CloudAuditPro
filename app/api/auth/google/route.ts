import { NextResponse } from 'next/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google/callback'

export async function GET(request: Request) {
  // No project_id required for OAuth flow
  return NextResponse.redirect(
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
    `&prompt=consent`
  )
} 