import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { updateJobStatus } from '../store'

// In-memory job status for demo
const jobStatus: Record<string, { status: string, started: number, error?: string }> = {}

const CATEGORY_TO_SCRIPT: Record<string, string> = {
  compute: 'compute-audit.js',
  storage: 'storage-audit.js',
  network: 'networking-audit.js',
  security: 'security-audit.js',
  cost: 'cost-audit.js',
  'data-protection': 'data-protection-audit.js',
  all: 'run-all-audits.js',
}

export async function POST(request: Request) {
  const { projectId, category } = await request.json()
  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }
  const cat = category || 'all'
  const script = CATEGORY_TO_SCRIPT[cat] || CATEGORY_TO_SCRIPT['all']
  const jobId = `job_${projectId}_${cat}_${Date.now()}`

  // Initialize job status
  updateJobStatus(jobId, { 
    status: 'running', 
    started: Date.now(),
    currentStep: 'Starting audit...',
    progress: 0
  })

  // Spawn the audit script (simulate for now)
  // In production, use the correct working directory and env
  const proc = spawn('node', [script], {
    cwd: process.cwd() + '/backend/src/scripts/gcp-audit',
    stdio: 'ignore',
    detached: true
  })

  proc.on('exit', (code) => {
    updateJobStatus(jobId, {
      status: code === 0 ? 'completed' : 'error',
      error: code !== 0 ? `Script exited with code ${code}` : undefined
    })
  })

  proc.unref()

  return NextResponse.json({ jobId })
} 