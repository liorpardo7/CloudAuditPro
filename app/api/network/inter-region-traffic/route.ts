import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for inter-region/zone traffic data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalInterRegion: '2.1 TB',
      totalInterZone: '850 GB',
      potentialSavings: '$320/mo'
    },
    flows: [
      {
        source: 'us-central1',
        destination: 'europe-west1',
        type: 'Inter-Region',
        traffic: '1.2 TB',
        cost: '$180/mo',
        status: 'High',
        id: 'flow1'
      },
      {
        source: 'us-central1-a',
        destination: 'us-central1-b',
        type: 'Inter-Zone',
        traffic: '400 GB',
        cost: '$60/mo',
        status: 'Medium',
        id: 'flow2'
      },
      {
        source: 'asia-east1',
        destination: 'us-central1',
        type: 'Inter-Region',
        traffic: '900 GB',
        cost: '$140/mo',
        status: 'High',
        id: 'flow3'
      },
      {
        source: 'europe-west1-b',
        destination: 'europe-west1-c',
        type: 'Inter-Zone',
        traffic: '450 GB',
        cost: '$70/mo',
        status: 'Low',
        id: 'flow4'
      }
    ],
    details: {
      flow1: {
        history: [
          { date: '2024-05-01', traffic: '40 GB' },
          { date: '2024-05-02', traffic: '42 GB' },
          { date: '2024-05-03', traffic: '39 GB' }
        ]
      },
      flow2: {
        history: [
          { date: '2024-05-01', traffic: '13 GB' },
          { date: '2024-05-02', traffic: '15 GB' },
          { date: '2024-05-03', traffic: '14 GB' }
        ]
      },
      flow3: {
        history: [
          { date: '2024-05-01', traffic: '30 GB' },
          { date: '2024-05-02', traffic: '31 GB' },
          { date: '2024-05-03', traffic: '29 GB' }
        ]
      },
      flow4: {
        history: [
          { date: '2024-05-01', traffic: '15 GB' },
          { date: '2024-05-02', traffic: '16 GB' },
          { date: '2024-05-03', traffic: '14 GB' }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 