import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

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
  try {
    const { projectId, category, userId = 'demo-user' } = await request.json()
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
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
    // Always use the test service account key
    const credentialPath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit/dba-inventory-services-prod-8a97ca8265b5.json')
    if (!fs.existsSync(credentialPath)) {
      await prisma.auditJob.update({ where: { id: jobId }, data: { status: 'error', error: 'Test service account key not found at backend/src/scripts/gcp-audit/dba-inventory-services-prod-8a97ca8265b5.json' } })
      return NextResponse.json({ jobId, error: 'Test service account key not found' }, { status: 400 })
    }
    const scriptDir = path.join(process.cwd(), 'backend/src/scripts/gcp-audit');
    const scriptEnv: NodeJS.ProcessEnv = {
      ...process.env,
      GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      GCP_PROJECT_ID: projectId,
      NODE_ENV: 'production',
    }
    console.log(`Running audit: ${script} for project ${projectId} with credentials ${credentialPath}`)
    const proc = spawn('node', [script], {
      cwd: scriptDir,
      env: scriptEnv,
      stdio: 'pipe',
      detached: true,
    })
    let stdoutData = ''
    let stderrData = ''
    proc.stdout?.on('data', (data: Buffer) => {
      const dataStr = data.toString()
      stdoutData += dataStr
    })
    proc.stderr?.on('data', (data: Buffer) => {
      const dataStr = data.toString()
      stderrData += dataStr
      console.error(`Audit stderr: ${dataStr}`)
    })
    proc.on('exit', async (code: number | null) => {
      console.log(`Audit completed with code ${code}`)
      if (code === 0) {
        // Try to read results file if it exists
        let resultJson: string | null = null
        const resultsFile = path.join(scriptDir, `${cat.replace(/_/g, '-')}-results.json`)
        if (fs.existsSync(resultsFile)) {
          try {
            resultJson = fs.readFileSync(resultsFile, 'utf-8')
          } catch (e) {
            resultJson = null
          }
        }
        await prisma.auditJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            completed: new Date(),
            result: resultJson,
          },
        })
      } else {
        await prisma.auditJob.update({
          where: { id: jobId },
          data: {
            status: 'error',
            error: `Script exited with code ${code}: ${stderrData}`,
          },
        })
      }
    })
    proc.unref()
    return NextResponse.json({ jobId })
  } catch (error) {
    console.error('Error running audit:', error)
    return NextResponse.json({ error: `Failed to run audit: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 })
  }
} 