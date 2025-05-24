import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import { verifyCsrf } from '@/lib/csrf-server'
import { rateLimit } from '@/lib/rate-limit'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

// Map of categories to their script files
const CATEGORY_TO_SCRIPT: Record<string, string> = {
  compute: 'compute-audit.js',
  storage: 'storage-audit.js',
  network: 'networking-audit.js',
  security: 'security-audit.js',
  cost: 'cost-audit.js',
  'data-protection': 'data-protection-audit.js',
  'storage-lifecycle': 'storage-lifecycle-audit.js',
  monitoring: 'monitoring-audit.js',
  'resource-utilization': 'resource-utilization-audit.js',
  'cost-allocation': 'cost-allocation-audit.js',
  billing: 'billing-audit.js',
  'billing-advanced': 'billing-advanced-audit.js',
  discount: 'discount-audit.js',
  budget: 'budget-audit.js',
  bigquery: 'bigquery-audit.js',
  compliance: 'compliance-audit.js',
  devops: 'devops-audit.js',
  all: 'run-all-audits.js',
  'permissions-audit': 'permissions-audit.js',
  'api-audit': 'api-audit.js',
}

export async function POST(request: Request) {
  // Proxy the request to the backend server
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:7778/api/audits/run';
  const body = await request.text();
  const headers = new Headers(request.headers);
  
  // Forward cookies for authentication
  const cookie = headers.get('cookie');
  
  // Get CSRF token from various possible header formats
  const csrfToken = headers.get('x-csrf-token') || 
                   headers.get('X-CSRF-Token') || 
                   headers.get('csrf-token') ||
                   '';
  
  console.log('Proxying /api/audits/run with headers:', {
    cookie: cookie ? 'present' : 'missing',
    csrfToken: csrfToken ? 'present' : 'missing',
    csrfTokenValue: csrfToken,
    allHeaders: Object.fromEntries(headers.entries()),
  });

  const proxyHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (cookie) {
    proxyHeaders.cookie = cookie;
  }

  if (csrfToken) {
    // Use the exact header name the backend expects
    proxyHeaders['x-csrf-token'] = csrfToken;
  }

  try {
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: proxyHeaders,
      body,
    });

    let data;
    const contentType = res.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error('Non-JSON response from backend:', text.substring(0, 500));
      
      // If it's a CSRF error, try to provide a more helpful response
      if (text.includes('invalid csrf token')) {
        data = { 
          error: 'CSRF token validation failed. Please refresh the page and try again.',
          details: 'Authentication token expired or invalid'
        };
      } else {
        data = { error: 'Internal server error. Non-JSON response from backend.' };
      }
    }
    
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend server' }, 
      { status: 500 }
    );
  }
} 