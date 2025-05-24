// MOVE FILE: This file should be moved to app/api/auth/status/route.ts for Next.js API routing to work properly.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  console.log('[AUTH] Frontend auth status check called')
  
  try {
    // Proxy the auth status check to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:7778'
    const response = await fetch(`${backendUrl}/auth/status`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      },
      credentials: 'include'
    })

    const data = await response.json()
    console.log('[AUTH] Backend auth status:', data)
    
    // Forward the response from backend
    const nextResponse = NextResponse.json(data, { status: response.status })
    
    // Forward any cookies set by the backend
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader)
    }
    
    return nextResponse
  } catch (error) {
    console.error('[AUTH] Error checking auth status:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Failed to check auth status' },
      { status: 500 }
    )
  }
} 