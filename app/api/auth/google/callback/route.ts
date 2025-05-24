import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
// @ts-ignore
import { serialize } from 'cookie'
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google/callback'

const prisma = new PrismaClient();

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
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=${encodeURIComponent(error)}`
    )
  }

  if (!code || !codeVerifier) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=${encodeURIComponent('Missing required parameters')}`
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

    // Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) {
      throw new Error('Failed to fetch user profile');
    }
    const profile = await profileRes.json();

    // Upsert user in DB
    const user = await prisma.user.upsert({
      where: { googleId: profile.id },
      update: { email: profile.email, name: profile.name },
      create: {
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
      },
    });

    // Generate a secure random session ID
    const sessionId = crypto.randomBytes(32).toString('hex');
    // Store session in DB (Sessions table to be created)
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      },
    });
    // Audit log for login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        metadata: {
          ip: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
        },
      },
    });

    // --- Fetch and save GCP projects for the user ---
    try {
      const resourceManagerRes = await fetch('https://cloudresourcemanager.googleapis.com/v1/projects', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (resourceManagerRes.ok) {
        const gcpData = await resourceManagerRes.json();
        const gcpProjects = gcpData.projects || [];
        for (const gcpProject of gcpProjects) {
          // Find project by name and userId
          const existing = await prisma.project.findFirst({
            where: { name: gcpProject.name, userId: user.id },
          });
          let dbProject;
          if (existing) {
            dbProject = await prisma.project.update({
              where: { id: existing.id },
              data: {
                status: 'active',
                lastSync: new Date(),
                gcpProjectId: gcpProject.projectId,
              },
            });
          } else {
            dbProject = await prisma.project.create({
              data: {
                name: gcpProject.name,
                status: 'active',
                lastSync: new Date(),
                userId: user.id,
                gcpProjectId: gcpProject.projectId,
              },
            });
          }
          // Upsert OAuthToken for this user/project
          if (dbProject) {
            const existingToken = await prisma.oAuthToken.findFirst({ where: { projectId: dbProject.id } });
            if (existingToken) {
              await prisma.oAuthToken.update({
                where: { id: existingToken.id },
                data: {
                  accessToken: tokens.access_token,
                  refreshToken: tokens.refresh_token,
                  expiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
                  scopes: tokens.scope || '',
                },
              });
            } else {
              await prisma.oAuthToken.create({
                data: {
                  projectId: dbProject.id,
                  accessToken: tokens.access_token,
                  refreshToken: tokens.refresh_token,
                  expiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
                  scopes: tokens.scope || '',
                },
              });
            }
          }
        }
      } else {
        console.error('Failed to fetch GCP projects:', await resourceManagerRes.text());
      }
    } catch (err) {
      console.error('Error fetching/saving GCP projects:', err);
    }

    // Set tokens in HTTP-only cookies and return a 200 HTML response with JS redirect
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${process.env.NEXT_PUBLIC_APP_URL}/?success=true" /></head><body>If you are not redirected, <a href="${process.env.NEXT_PUBLIC_APP_URL}/?success=true">click here</a>.</body></html>`;
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
    response.headers.append('Set-Cookie', serialize('session_id', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    }));
    return response;
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/?error=${encodeURIComponent('Failed to complete authentication')}`
    )
  }
} 