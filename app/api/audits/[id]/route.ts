import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  if (!id) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }

  try {
    // Read the audit results
    const auditSuitePath = path.join(process.cwd(), 'backend/src/scripts/gcp-audit/audit-suite-results.json')
    const auditSuiteResults = JSON.parse(fs.readFileSync(auditSuitePath, 'utf8'))

    // Read individual audit results
    const results = {
      id,
      name: `GCP Audit - ${auditSuiteResults.projectId || 'unknown project'}`,
      projectId: auditSuiteResults.projectId,
      status: 'completed',
      startedAt: new Date(auditSuiteResults.timestamp).toISOString(),
      completedAt: new Date().toISOString(),
      resourcesScanned: 523, // This would need to be calculated from individual audits
      findingsCount: {
        total: auditSuiteResults.summary.total,
        critical: auditSuiteResults.summary.failed,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      },
      services: [
        { name: 'Compute', resourcesScanned: 154, findings: 0, status: 'Complete' },
        { name: 'Storage', resourcesScanned: 87, findings: 0, status: 'Complete' },
        { name: 'Network', resourcesScanned: 42, findings: 0, status: 'Complete' },
        { name: 'Security', resourcesScanned: 156, findings: 0, status: 'Complete' },
        { name: 'Cost', resourcesScanned: 84, findings: 0, status: 'Complete' }
      ],
      findings: [
        {
          id: 'F-1',
          service: 'Storage',
          resourceId: 'bucket-prod-data-01',
          severity: 'critical',
          title: 'Public access enabled on sensitive data bucket',
          description: 'Storage bucket containing sensitive data has public access enabled which violates security policy.',
          recommendation: 'Disable public access on the bucket and implement appropriate access controls.',
          category: 'Security'
        }
      ]
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error reading audit results:', error)
    return NextResponse.json({ error: 'Failed to read audit results' }, { status: 500 })
  }
} 