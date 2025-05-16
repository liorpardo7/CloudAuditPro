import { NextRequest, NextResponse } from 'next/server'
import { getJobStatus } from '../store'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('id')
  if (!jobId) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }
  const status = getJobStatus(jobId)
  if (!status) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }
  return NextResponse.json(status)
} 