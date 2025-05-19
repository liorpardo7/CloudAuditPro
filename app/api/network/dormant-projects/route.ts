import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for dormant projects data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalProjects: 12,
      dormantProjects: 3,
      potentialSavings: '$1,200/mo'
    },
    projects: [
      {
        id: 'dormant-proj-1',
        name: 'Legacy Analytics',
        lastActivity: '2023-12-10',
        lastBilling: '2024-01-01',
        status: 'Dormant',
        potentialSavings: '$500/mo',
        detailsId: 'proj1'
      },
      {
        id: 'dormant-proj-2',
        name: 'Test Sandbox',
        lastActivity: '2023-11-05',
        lastBilling: '2023-12-01',
        status: 'Dormant',
        potentialSavings: '$400/mo',
        detailsId: 'proj2'
      },
      {
        id: 'dormant-proj-3',
        name: 'Old Marketing Site',
        lastActivity: '2023-10-20',
        lastBilling: '2023-11-01',
        status: 'Dormant',
        potentialSavings: '$300/mo',
        detailsId: 'proj3'
      }
    ],
    details: {
      proj1: {
        history: [
          { date: '2024-01-01', activity: 0, billing: 500 },
          { date: '2023-12-01', activity: 0, billing: 500 },
          { date: '2023-11-01', activity: 0, billing: 500 }
        ]
      },
      proj2: {
        history: [
          { date: '2023-12-01', activity: 0, billing: 400 },
          { date: '2023-11-01', activity: 0, billing: 400 },
          { date: '2023-10-01', activity: 0, billing: 400 }
        ]
      },
      proj3: {
        history: [
          { date: '2023-11-01', activity: 0, billing: 300 },
          { date: '2023-10-01', activity: 0, billing: 300 },
          { date: '2023-09-01', activity: 0, billing: 300 }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 