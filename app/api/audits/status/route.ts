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

export async function GET_OLD(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('id')
  
    if (!jobId) {
      return NextResponse.json({ error: 'Missing job ID' }, { status: 400 })
    }
  
    const status = getJobStatus(jobId)
    if (!status) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
  
    // If the job is still running, return the current status
    if (status.status === 'running') {
      return NextResponse.json(status)
    }
  
    // If job completed or errored, check for audit results files
    if (status.status === 'completed') {
      try {
        // Extract project ID and category from job ID
        const parts = jobId.split('_')
        const projectId = parts[1]
        const category = parts[2]
        
        // Check if it's a specific category or all
        if (category === 'all') {
          const auditSuitePath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit/audit-suite-results.json')
          if (fs.existsSync(auditSuitePath)) {
            try {
              const auditResults = JSON.parse(fs.readFileSync(auditSuitePath, 'utf8'))
              return NextResponse.json({
                ...status,
                auditResults,
                timestamp: auditResults.timestamp || new Date().toISOString(),
                projectId: projectId || auditResults.projectId,
                summary: auditResults.summary || { 
                  total: 0, 
                  passed: 0, 
                  failed: 0, 
                  notImplemented: 0, 
                  notApplicable: 0 
                }
              })
            } catch (parseErr) {
              console.error('Error parsing audit results:', parseErr)
            }
          }
        } else {
          // Check for specific category result file
          const categoryFileName = `${category.replace(/-/g, '_')}_audit_results.json`
          const specificResultPath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit', categoryFileName)
          
          if (fs.existsSync(specificResultPath)) {
            try {
              const categoryResults = JSON.parse(fs.readFileSync(specificResultPath, 'utf8'))
              return NextResponse.json({
                ...status,
                categoryResults,
                timestamp: categoryResults.timestamp || new Date().toISOString(),
                projectId: projectId || categoryResults.projectId
              })
            } catch (parseErr) {
              console.error(`Error parsing ${category} results:`, parseErr)
            }
          }
          
          // Alternative file naming pattern
          const alternativeFileName = `${category}-audit-results.json`
          const alternativePath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit', alternativeFileName)
          
          if (fs.existsSync(alternativePath)) {
            try {
              const categoryResults = JSON.parse(fs.readFileSync(alternativePath, 'utf8'))
              return NextResponse.json({
                ...status,
                categoryResults,
                timestamp: categoryResults.timestamp || new Date().toISOString(),
                projectId: projectId || categoryResults.projectId
              })
            } catch (parseErr) {
              console.error(`Error parsing ${category} results:`, parseErr)
            }
          }
        }
      } catch (err) {
        console.error('Error processing results:', err)
      }
    }
  
    // Default fallback - return just the status
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error in audit status endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 