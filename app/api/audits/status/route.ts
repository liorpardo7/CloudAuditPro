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
    let auditResults = null
    let bigqueryResults = null
    try {
      const auditPath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit/audit-suite-results.json')
      const bigqueryPath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit/bigquery-audit-results.json')
      if (fs.existsSync(auditPath)) {
        auditResults = JSON.parse(fs.readFileSync(auditPath, 'utf8'))
      }
      if (fs.existsSync(bigqueryPath)) {
        bigqueryResults = JSON.parse(fs.readFileSync(bigqueryPath, 'utf8'))
      }
    } catch (err) {
      console.error('Error reading audit results:', err)
    }
    if (auditResults || bigqueryResults) {
      return NextResponse.json({
        status: 'completed',
        auditResults,
        bigqueryResults
      })
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
  let auditResults = null
  let bigqueryResults = null
  try {
    const auditPath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit/audit-suite-results.json')
    const bigqueryPath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit/bigquery-audit-results.json')
    if (fs.existsSync(auditPath)) {
      auditResults = JSON.parse(fs.readFileSync(auditPath, 'utf8'))
    }
    if (fs.existsSync(bigqueryPath)) {
      bigqueryResults = JSON.parse(fs.readFileSync(bigqueryPath, 'utf8'))
    }
  } catch (err) {
    // Log and ignore errors for now
    console.error('Error reading audit results:', err)
  }

  return NextResponse.json({
    ...status,
    auditResults,
    bigqueryResults
  })
} 