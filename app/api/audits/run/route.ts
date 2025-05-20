import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import { verifyCsrf } from '@/lib/csrf'
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
  const rateLimitError = rateLimit(request, { limit: 5, windowMs: 60_000 })
  if (rateLimitError) return rateLimitError
  const csrfError = verifyCsrf(request)
  if (csrfError) return csrfError
  try {
    const { projectId, category } = await request.json()
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }

    // --- Extract userId from session cookie ---
    const cookieStore = cookies()
    const sessionId = cookieStore.get('session_id')?.value
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    })
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
    const userId = session.user.id

    // --- LOGGING ---
    console.log(`[AUDIT] /api/audits/run: userId=${userId}, projectId=${projectId}`)

    // Look up tokens for this user/project
    const tokenRecord = await prisma.oAuthToken.findFirst({
      where: { projectId, project: { userId } },
      orderBy: { createdAt: 'desc' },
    })
    if (!tokenRecord) {
      console.warn(`[AUDIT] No OAuth tokens found for userId=${userId}, projectId=${projectId}`)
      return NextResponse.json(
        { error: 'You are authenticated, but have not connected this project. Please connect your Google account for this project.' },
        { status: 401 }
      )
    }
    // Prepare tokens object for audit script
    const tokens = {
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
      scope: tokenRecord.scopes,
      expiry_date: tokenRecord.expiry.getTime(),
      token_type: 'Bearer',
    }
    const cat = category || 'all'
    const script = CATEGORY_TO_SCRIPT[cat]
    if (!script) {
      return NextResponse.json(
        { error: `Invalid category: ${category}. Must be one of: ${Object.keys(CATEGORY_TO_SCRIPT).join(', ')}` },
        { status: 400 }
      )
    }
    // Create AuditJob in DB
    const job = await prisma.auditJob.create({
      data: {
        projectId,
        userId,
        category: cat,
        status: 'running',
      },
    })
    const jobId = job.id
    try {
      // Dynamically require and run the audit script
      const scriptPath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit', script)
      const auditModule = require(scriptPath)
      if (typeof auditModule.run !== 'function') {
        throw new Error(`Audit script ${script} does not export a run(projectId, tokens) function`)
      }
      const result = await auditModule.run(projectId, tokens)
      await prisma.auditJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          completed: new Date(),
          result: JSON.stringify(result),
        },
      })
      return NextResponse.json({ jobId, result })
    } catch (err) {
      await prisma.auditJob.update({
        where: { id: jobId },
        data: {
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        },
      })
      return NextResponse.json({ jobId, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
    }
  } catch (error) {
    console.error('Error running audit:', error)
    return NextResponse.json({ error: `Failed to run audit: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
  }
} 