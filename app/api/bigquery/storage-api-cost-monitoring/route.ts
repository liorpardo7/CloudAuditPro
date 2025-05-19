import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for Storage API cost data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalApiCost: '$1,850/mo',
      topTable: 'analytics.events_2024',
      potentialSavings: '$420/mo'
    },
    tables: [
      {
        dataset: 'analytics',
        table: 'events_2024',
        apiCalls: 12000,
        bytesRead: '2.1 TB',
        bytesWritten: '150 GB',
        cost: '$600/mo',
        id: 'tbl1'
      },
      {
        dataset: 'logs',
        table: 'access_logs',
        apiCalls: 8500,
        bytesRead: '1.2 TB',
        bytesWritten: '80 GB',
        cost: '$400/mo',
        id: 'tbl2'
      },
      {
        dataset: 'sales',
        table: 'transactions',
        apiCalls: 5000,
        bytesRead: '900 GB',
        bytesWritten: '60 GB',
        cost: '$250/mo',
        id: 'tbl3'
      }
    ],
    details: {
      tbl1: {
        history: [
          { date: '2024-05-01', apiCalls: 12000, bytesRead: 2.1, bytesWritten: 0.15, cost: 600 },
          { date: '2024-04-01', apiCalls: 11000, bytesRead: 1.9, bytesWritten: 0.13, cost: 570 },
          { date: '2024-03-01', apiCalls: 10500, bytesRead: 1.8, bytesWritten: 0.12, cost: 550 }
        ]
      },
      tbl2: {
        history: [
          { date: '2024-05-01', apiCalls: 8500, bytesRead: 1.2, bytesWritten: 0.08, cost: 400 },
          { date: '2024-04-01', apiCalls: 8000, bytesRead: 1.1, bytesWritten: 0.07, cost: 380 },
          { date: '2024-03-01', apiCalls: 7800, bytesRead: 1.0, bytesWritten: 0.07, cost: 370 }
        ]
      },
      tbl3: {
        history: [
          { date: '2024-05-01', apiCalls: 5000, bytesRead: 0.9, bytesWritten: 0.06, cost: 250 },
          { date: '2024-04-01', apiCalls: 4800, bytesRead: 0.85, bytesWritten: 0.05, cost: 240 },
          { date: '2024-03-01', apiCalls: 4700, bytesRead: 0.8, bytesWritten: 0.05, cost: 230 }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 