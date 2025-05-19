import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for CUD/SUD coverage data
  // For now, return a realistic mock response
  const data = {
    summary: {
      cudCoverage: '62%',
      sudCoverage: '48%',
      potentialSavings: '$2,100/mo'
    },
    services: [
      {
        name: 'Compute Engine',
        cudCoverage: '70%',
        sudCoverage: '55%',
        currentDiscount: '$1,200/mo',
        potentialSavings: '$400/mo',
        id: 'svc1'
      },
      {
        name: 'Cloud SQL',
        cudCoverage: '50%',
        sudCoverage: '30%',
        currentDiscount: '$600/mo',
        potentialSavings: '$300/mo',
        id: 'svc2'
      },
      {
        name: 'GKE',
        cudCoverage: '40%',
        sudCoverage: '60%',
        currentDiscount: '$300/mo',
        potentialSavings: '$200/mo',
        id: 'svc3'
      }
    ],
    details: {
      svc1: {
        history: [
          { date: '2024-05-01', cud: 70, sud: 55, discount: 1200 },
          { date: '2024-04-01', cud: 68, sud: 54, discount: 1150 },
          { date: '2024-03-01', cud: 65, sud: 52, discount: 1100 }
        ]
      },
      svc2: {
        history: [
          { date: '2024-05-01', cud: 50, sud: 30, discount: 600 },
          { date: '2024-04-01', cud: 48, sud: 28, discount: 580 },
          { date: '2024-03-01', cud: 45, sud: 25, discount: 550 }
        ]
      },
      svc3: {
        history: [
          { date: '2024-05-01', cud: 40, sud: 60, discount: 300 },
          { date: '2024-04-01', cud: 38, sud: 58, discount: 280 },
          { date: '2024-03-01', cud: 35, sud: 55, discount: 250 }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 