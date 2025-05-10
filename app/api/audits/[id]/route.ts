import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  if (!id) {
    return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })
  }

  // TODO: In production, fetch real results from DB or file
  // For now, return mock results
  const mockResults = {
    id,
    name: 'GCP Test Audit',
    status: 'completed',
    startedAt: new Date(Date.now() - 120000).toISOString(),
    completedAt: new Date().toISOString(),
    resourcesScanned: 523,
    findingsCount: {
      total: 12,
      critical: 1,
      high: 3,
      medium: 5,
      low: 2,
      info: 1
    },
    services: [
      { name: 'Compute', resourcesScanned: 154, findings: 4, status: 'Complete' },
      { name: 'Storage', resourcesScanned: 87, findings: 5, status: 'Complete' },
      { name: 'Network', resourcesScanned: 42, findings: 1, status: 'Complete' },
      { name: 'Security', resourcesScanned: 156, findings: 2, status: 'Complete' },
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
      },
      {
        id: 'F-2',
        service: 'Compute',
        resourceId: 'vm-api-prod-01',
        severity: 'high',
        title: 'Unpatched critical vulnerability',
        description: 'VM instance is running an operating system version with known critical vulnerabilities.',
        recommendation: 'Apply the latest security patches and update the OS to the latest version.',
        category: 'Security'
      }
      // ... more findings ...
    ]
  }

  return NextResponse.json(mockResults)
} 