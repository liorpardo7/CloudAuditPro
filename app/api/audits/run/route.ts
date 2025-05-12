import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { updateJobStatus } from '../store'
import fs from 'fs'
import path from 'path'

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
}

export async function POST(request: Request) {
  try {
    const { projectId, category } = await request.json()
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
    }
    
    // Validate category
    const cat = category || 'all'
    const script = CATEGORY_TO_SCRIPT[cat]
    if (!script) {
      return NextResponse.json(
        { error: `Invalid category: ${category}. Must be one of: ${Object.keys(CATEGORY_TO_SCRIPT).join(', ')}` }, 
        { status: 400 }
      )
    }
    
    const jobId = `job_${projectId}_${cat}_${Date.now()}`

    // Initialize job status
    updateJobStatus(jobId, { 
      status: 'running', 
      started: Date.now(),
      currentStep: 'Starting audit...',
      progress: 0,
      projectId
    })

    // Check for GCP credentials
    const scriptDir = path.join(process.cwd(), 'backend/src/scripts/gcp-audit')
    const credentialFiles = fs.readdirSync(scriptDir).filter(file => 
      file.endsWith('.json') && !file.endsWith('-results.json') && !file.includes('audit-')
    )
    
    if (credentialFiles.length === 0) {
      updateJobStatus(jobId, {
        status: 'error',
        error: 'No GCP credential files found. Please add a service account key file to the backend/src/scripts/gcp-audit directory.'
      })
      return NextResponse.json({ 
        jobId,
        error: 'No GCP credential files found'
      }, { status: 400 })
    }

    // Set the credential file as an environment variable
    const credentialFile = credentialFiles[0]
    const credentialPath = path.join(scriptDir, credentialFile)
    
    // Create a properly typed environment object
    const scriptEnv: NodeJS.ProcessEnv = {
      ...process.env,
      GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      GCP_PROJECT_ID: projectId,
      NODE_ENV: 'production'
    }

    console.log(`Running audit: ${script} for project ${projectId} with credentials ${credentialFile}`)

    // Spawn the audit script with proper TypeScript types
    const proc = spawn('node', [script], {
      cwd: scriptDir,
      env: scriptEnv,
      stdio: 'pipe',
      detached: true
    })

    // Capture output for debugging
    let stdoutData = ''
    let stderrData = ''

    proc.stdout?.on('data', (data: Buffer) => {
      const dataStr = data.toString()
      stdoutData += dataStr
      
      // Try to parse progress data if available
      try {
        const progressMatch = dataStr.match(/Progress: (\d+)%\s+(.+)/)
        if (progressMatch) {
          const progress = parseInt(progressMatch[1], 10)
          const currentStep = progressMatch[2]
          updateJobStatus(jobId, { progress, currentStep })
        }
      } catch (e) {
        // Ignore parse errors
      }
    })

    proc.stderr?.on('data', (data: Buffer) => {
      const dataStr = data.toString()
      stderrData += dataStr
      console.error(`Audit stderr: ${dataStr}`)
    })

    proc.on('exit', (code: number | null) => {
      console.log(`Audit completed with code ${code}`)
      if (code === 0) {
        updateJobStatus(jobId, {
          status: 'completed',
          progress: 100,
          currentStep: 'Audit completed successfully',
          stdout: stdoutData,
          completed: Date.now()
        })
      } else {
        updateJobStatus(jobId, {
          status: 'error',
          error: `Script exited with code ${code}: ${stderrData}`,
          stdout: stdoutData,
          stderr: stderrData
        })
      }
    })

    proc.unref()

    return NextResponse.json({ jobId })
  } catch (error) {
    console.error('Error running audit:', error)
    return NextResponse.json({ 
      error: `Failed to run audit: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 })
  }
} 