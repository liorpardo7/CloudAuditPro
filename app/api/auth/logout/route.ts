import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
// @ts-ignore
import { serialize } from 'cookie';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  console.log('[AUTH] Frontend logout API called')
  
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    let userId: string | undefined;
    
    // Get user info before cleanup
    if (sessionId) {
      const session = await prisma.session.findUnique({ 
        where: { id: sessionId }, 
        include: { user: true } 
      });
      userId = session?.user?.id;
      
      // Delete session from database
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }
    
    // Also try to call backend logout to clear any JWT tokens
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:7778';
      await fetch(`${backendUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Cookie': req.headers.get('cookie') || ''
        },
        credentials: 'include'
      });
      console.log('[AUTH] Backend logout called successfully')
    } catch (error) {
      console.log('[AUTH] Backend logout failed (this is okay):', error)
    }
    
    // Audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'LOGOUT',
          metadata: {
            ip: req.headers.get('x-forwarded-for') || req.ip || null,
            userAgent: req.headers.get('user-agent') || null,
          },
        },
      });
    }
    
    // Clear ALL authentication-related cookies
    const response = NextResponse.json({ success: true });
    
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 0,
    };
    
    // Clear session-based cookies
    response.headers.append('Set-Cookie', serialize('session_id', '', cookieOptions));
    response.headers.append('Set-Cookie', serialize('access_token', '', cookieOptions));
    response.headers.append('Set-Cookie', serialize('refresh_token', '', cookieOptions));
    
    // Clear JWT-based cookies
    response.headers.append('Set-Cookie', serialize('token', '', cookieOptions));
    
    // Clear OAuth-related cookies
    response.headers.append('Set-Cookie', serialize('code_verifier', '', cookieOptions));
    response.headers.append('Set-Cookie', serialize('oauth_state', '', cookieOptions));
    
    // Clear CSRF token
    response.headers.append('Set-Cookie', serialize('csrf_token', '', cookieOptions));
    
    console.log('[AUTH] All cookies cleared successfully')
    
    return response;
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}