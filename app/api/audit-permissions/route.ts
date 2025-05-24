import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Authentication required',
        hasPermissions: false 
      }, { status: 401 })
    }

    // Verify the JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any
      
      if (!decoded || !decoded.user) {
        return NextResponse.json({ 
          error: 'Invalid authentication token',
          hasPermissions: false 
        }, { status: 401 })
      }

      // For now, if user is authenticated, they have permissions
      // In a real implementation, you might check specific Google Cloud IAM permissions
      return NextResponse.json({
        success: true,
        hasPermissions: true,
        user: decoded.user.email,
        projects: decoded.user.projects || []
      })

    } catch (jwtError) {
      return NextResponse.json({ 
        error: 'Invalid authentication token',
        hasPermissions: false 
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Audit permissions API error:', error)
    return NextResponse.json({ 
      error: 'Failed to check audit permissions',
      hasPermissions: false 
    }, { status: 500 })
  }
} 