import { NextResponse } from 'next/server'
import { getJobStatus } from '../store'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('id')

  if (!jobId) {
    return NextResponse.json({ error: 'Missing job ID' }, { status: 400 })
  }

  const status = getJobStatus(jobId)
  if (!status) {
    // Try to return results if the results file exists
    try {
      const auditSuitePath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit/audit-suite-results.json')
      if (fs.existsSync(auditSuitePath)) {
        const auditResults = JSON.parse(fs.readFileSync(auditSuitePath, 'utf8'))
        return NextResponse.json({
          status: 'completed',
          auditResults,
          timestamp: auditResults.timestamp,
          projectId: auditResults.projectId,
          summary: auditResults.summary
        })
      }
    } catch (err) {
      console.error('Error reading audit results:', err)
    }
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Simulate progress updates for demo
  if (status.status === 'running') {
    const steps = [
      'Initializing audit...',
      'Scanning Compute',
      'Scanning Storage',
      'Scanning Network',
      'Scanning Security',
      'Scanning Cost',
      'Scanning BigQuery',
      'Finalizing'
    ]
    const elapsed = Date.now() - status.started
    const stepIndex = Math.min(Math.floor(elapsed / 2000), steps.length - 1)
    const progress = Math.min(Math.floor((elapsed / (steps.length * 2000)) * 100), 99)

    return NextResponse.json({
      ...status,
      currentStep: steps[stepIndex],
      progress
    })
  }

  // When job is complete, include audit results
  try {
    const auditSuitePath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit/audit-suite-results.json')
    if (fs.existsSync(auditSuitePath)) {
      const auditResults = JSON.parse(fs.readFileSync(auditSuitePath, 'utf8'))
      return NextResponse.json({
        ...status,
        auditResults,
        timestamp: auditResults.timestamp,
        projectId: auditResults.projectId,
        summary: auditResults.summary
      })
    }
  } catch (err) {
    console.error('Error reading audit results:', err)
  }

  return NextResponse.json(status)
} 