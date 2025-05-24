import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('[CSRF] Frontend requesting CSRF token from backend...')
  
  try {
    // Proxy the CSRF token request to the backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:7778';
    const response = await fetch(`${backendUrl}/api/csrf-token`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      },
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('[CSRF] Backend CSRF request failed:', response.status)
      throw new Error('Failed to get CSRF token from backend');
    }

    const data = await response.json();
    console.log('[CSRF] Got CSRF token from backend:', data.csrfToken)
    
    // Forward any cookies set by the backend
    const nextResponse = NextResponse.json(data);
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader);
    }
    
    return nextResponse;
  } catch (error) {
    console.error('[CSRF] Error getting CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to get CSRF token' }, 
      { status: 500 }
    );
  }
} 