import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export interface User {
  id: string
  email: string
  name?: string
  projects?: Project[]
}

export interface Project {
  id: string
  name: string
  gcpProjectId: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })
  const router = useRouter()

  useEffect(() => {
    console.log('[AUTH] useAuth hook initializing...')
    
    const checkAuth = async () => {
      try {
        console.log('[AUTH] Checking authentication status...')
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        
        console.log('[AUTH] Auth check response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[AUTH] Authentication successful:', {
            email: data.user?.email,
            projectCount: data.user?.projects?.length || 0
          })
          
          setAuthState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true
          })
        } else {
          console.log('[AUTH] Authentication failed, response:', response.status)
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false
          })
        }
      } catch (error) {
        console.error('[AUTH] Authentication check error:', error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    }

    checkAuth()
  }, [])

  return authState
}

// Alias for backward compatibility
export const useAuthCheck = useAuth

export function requireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('[AUTH] requireAuth check:', { isAuthenticated, isLoading })
    
    if (!isLoading && !isAuthenticated) {
      console.log('[AUTH] User not authenticated, redirecting to Google OAuth...')
      window.location.href = '/api/auth/google'
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading }
}

export async function logout() {
  console.log('[AUTH] Logging out user...')
  
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    
    if (response.ok) {
      console.log('[AUTH] Logout successful, redirecting to login')
      // Force a full page reload to ensure all state is cleared
      window.location.href = '/login'
    } else {
      console.error('[AUTH] Logout failed:', response.status)
      // Even if logout fails, redirect to login to clear client state
      window.location.href = '/login'
    }
  } catch (error) {
    console.error('[AUTH] Logout error:', error)
    // Even if logout fails, redirect to login to clear client state
    window.location.href = '/login'
  }
} 