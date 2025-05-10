import { NextResponse } from 'next/server'
import { getJobStatus } from '../store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('id')

  if (!jobId) {
    return NextResponse.json({ error: 'Missing job ID' }, { status: 400 })
  }

  const status = getJobStatus(jobId)
  if (!status) {
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

  return NextResponse.json(status)
} 