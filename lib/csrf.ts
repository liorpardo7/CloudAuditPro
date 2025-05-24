// Client-side CSRF token utilities (safe for client components)
export async function getCsrfToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null; // Server-side, can't fetch
  }
  
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      return data.csrfToken;
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
  return null;
}

export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  let csrfToken: string | null = null;
  
  // Try to get CSRF token from cookie first (faster)
  if (typeof document !== 'undefined') {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1];
    
    if (cookieValue) {
      csrfToken = cookieValue;
    }
  }
  
  // If no token in cookie, fetch from API
  if (!csrfToken) {
    csrfToken = await getCsrfToken();
  }
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
    headers.set('x-csrf-token', csrfToken); // Try both formats
  }
  
  console.log('[CLIENT-CSRF] Making request with token:', csrfToken ? 'present' : 'missing');
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
} 