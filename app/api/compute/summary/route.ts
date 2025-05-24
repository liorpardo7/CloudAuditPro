import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('[API] /api/compute/summary called')
  
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  
  console.log('[API] Compute summary requested for project:', projectId)
  
  // Mock data for now - would integrate with actual GCP APIs
  const mockData = {
    summary: {
      totalInstances: 4,
      runningInstances: 3,
      stoppedInstances: 1,
      totalCpu: 120,
      totalMemory: '512GB',
      totalStorage: '2TB'
    },
    instances: [
      {
        name: 'vm-prod-api-01',
        type: 'n2-standard-4',
        zone: 'us-central1-a',
        status: 'RUNNING',
        cpu: 4,
        memory: '16GB'
      },
      {
        name: 'vm-prod-db-01', 
        type: 'n2-highmem-8',
        zone: 'us-central1-a',
        status: 'RUNNING',
        cpu: 8,
        memory: '64GB'
      }
    ],
    recommendations: [
      {
        type: 'RIGHT_SIZING',
        resource: 'vm-prod-batch-01',
        description: 'Instance is underutilized, consider downsizing',
        potentialSavings: '$45/month'
      }
    ]
  }
  
  console.log('[API] Returning compute summary:', mockData)
  
  return NextResponse.json(mockData)
} 