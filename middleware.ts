import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/',
  '/settings',
  '/compute',
  '/storage', 
  '/bigquery',
  '/cost',
  '/serverless',
  '/network',
  '/resource-utilization',
  '/gke',
  '/discounts'
]

// Define public routes that don't require authentication  
const publicRoutes = [
  '/login',
  '/api/auth/google',
  '/api/auth/google/callback'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow API routes and static files to pass through
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )
  
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  // For protected routes, check authentication
  if (isProtectedRoute) {
    const sessionId = request.cookies.get('session_id')?.value
    const jwtToken = request.cookies.get('token')?.value
    
    // If no authentication cookies, redirect to login
    if (!sessionId && !jwtToken) {
      console.log('[MIDDLEWARE] No auth cookies found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If user is authenticated and tries to access login, redirect to home
  if (pathname === '/login') {
    const sessionId = request.cookies.get('session_id')?.value
    const jwtToken = request.cookies.get('token')?.value
    
    if (sessionId || jwtToken) {
      console.log('[MIDDLEWARE] User already authenticated, redirecting to home')
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 