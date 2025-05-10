import { NextResponse } from 'next/server'
import { jobStatus } from '../run/route'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('id')
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }

  // Use shared jobStatus for real tracking
  const statusObj = jobStatus[jobId]
  if (!statusObj) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({ status: statusObj.status, error: statusObj.error })
} 