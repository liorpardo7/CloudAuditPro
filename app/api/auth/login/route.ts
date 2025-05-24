import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  console.log('[AUTH] Frontend login API called')
  
  try {
    // Get the Google access token from cookies (set by OAuth callback)
    const cookieStore = cookies()
    const accessToken = cookieStore.get('access_token')?.value
    
    if (!accessToken) {
      console.error('[AUTH] No access token found in cookies')
      return NextResponse.json(
        { error: 'No access token found. Please complete OAuth flow first.' },
        { status: 401 }
      )
    }
    
    console.log('[AUTH] Found access token, calling backend login...')
    
    // Call the backend login endpoint with the Google access token
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:7778'
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ googleAccessToken: accessToken }),
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('[AUTH] Backend login failed:', response.status, errorData)
      return NextResponse.json(
        { error: 'Backend authentication failed' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('[AUTH] Backend login successful')
    
    // Forward the JWT token cookie from backend to frontend
    const nextResponse = NextResponse.json(data)
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader)
    }
    
    return nextResponse
  } catch (error) {
    console.error('[AUTH] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 