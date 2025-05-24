import { NextResponse } from 'next/server'
// @ts-ignore
import { serialize } from 'cookie'
import crypto from 'crypto'
import { GCP_AUDIT_SCOPES_STRING } from '@/lib/oauth-scopes'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google/callback'

function base64URLEncode(str: Buffer) {
  return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function sha256(buffer: string) {
  return crypto.createHash('sha256').update(buffer).digest()
}

export async function GET(request: Request) {
  // Generate PKCE code_verifier and code_challenge
  const code_verifier = base64URLEncode(crypto.randomBytes(32))
  const code_challenge = base64URLEncode(sha256(code_verifier))
  // Generate random state
  const state = base64URLEncode(crypto.randomBytes(16))

  console.log('[OAUTH] Requesting OAuth with comprehensive scopes for CloudAuditPro auditing')
  console.log('[OAUTH] Scopes requested:', GCP_AUDIT_SCOPES_STRING.split(' ').length, 'total scopes')

  // Set code_verifier and state in secure, HTTP-only cookies
  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(GCP_AUDIT_SCOPES_STRING)}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&code_challenge=${code_challenge}` +
    `&code_challenge_method=S256` +
    `&state=${state}`
  )
  response.headers.append('Set-Cookie', serialize('code_verifier', code_verifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 300 // 5 minutes
  }))
  response.headers.append('Set-Cookie', serialize('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 300 // 5 minutes
  }))
  return response
} 