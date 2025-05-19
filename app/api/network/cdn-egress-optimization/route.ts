import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for CDN egress optimization data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalCdnEligible: '3.4 TB',
      potentialSavings: '$410/mo',
      cacheHitRatio: '78%'
    },
    workloads: [
      {
        name: 'static-assets-prod',
        type: 'Storage Bucket',
        traffic: '1.8 TB',
        cacheable: true,
        currentCdn: false,
        potentialSavings: '$220/mo',
        id: 'workload1'
      },
      {
        name: 'media-cdn-app',
        type: 'App Engine',
        traffic: '900 GB',
        cacheable: true,
        currentCdn: true,
        potentialSavings: '$90/mo',
        id: 'workload2'
      },
      {
        name: 'api-service',
        type: 'Cloud Run',
        traffic: '700 GB',
        cacheable: false,
        currentCdn: false,
        potentialSavings: '$0',
        id: 'workload3'
      }
    ],
    details: {
      workload1: {
        history: [
          { date: '2024-05-01', traffic: '60 GB' },
          { date: '2024-05-02', traffic: '62 GB' },
          { date: '2024-05-03', traffic: '59 GB' }
        ]
      },
      workload2: {
        history: [
          { date: '2024-05-01', traffic: '30 GB' },
          { date: '2024-05-02', traffic: '31 GB' },
          { date: '2024-05-03', traffic: '29 GB' }
        ]
      },
      workload3: {
        history: [
          { date: '2024-05-01', traffic: '23 GB' },
          { date: '2024-05-02', traffic: '25 GB' },
          { date: '2024-05-03', traffic: '24 GB' }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 