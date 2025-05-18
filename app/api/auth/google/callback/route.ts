import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
// @ts-ignore
import { serialize } from 'cookie'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google/callback'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  // Validate state for CSRF protection
  const cookieStore = cookies()
  const storedState = cookieStore.get('oauth_state')?.value
  const codeVerifier = cookieStore.get('code_verifier')?.value
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${encodeURIComponent('Invalid state parameter')}`
    )
  }

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${encodeURIComponent(error)}`
    )
  }

  if (!code || !codeVerifier) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${encodeURIComponent('Missing required parameters')}`
    )
  }

  try {
    // Exchange code for tokens with PKCE code_verifier
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    const tokens = await tokenResponse.json()

    // Set tokens in HTTP-only cookies and return a 200 HTML response with JS redirect
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true" /></head><body>If you are not redirected, <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true">click here</a>.</body></html>`;
    const response = new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
    response.headers.append('Set-Cookie', serialize('access_token', tokens.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: tokens.expires_in || 3600
    }));
    if (tokens.refresh_token) {
      response.headers.append('Set-Cookie', serialize('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      }));
    }
    response.headers.append('Set-Cookie', serialize('oauth_state', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    }));
    response.headers.append('Set-Cookie', serialize('code_verifier', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    }));
    return response;
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${encodeURIComponent('Failed to complete authentication')}`
    )
  }
} 