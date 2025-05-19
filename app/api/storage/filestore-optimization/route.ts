import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for Filestore optimization data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalInstances: 4,
      underutilized: 1,
      potentialSavings: "$60/mo"
    },
    instances: [
      {
        name: "filestore-prod-1",
        zone: "us-central1-a",
        tier: "STANDARD",
        capacity: "10TB",
        used: "2TB",
        utilization: "20%",
        status: "Underutilized"
      },
      {
        name: "filestore-analytics-2",
        zone: "us-central1-b",
        tier: "PREMIUM",
        capacity: "5TB",
        used: "4.5TB",
        utilization: "90%",
        status: "Optimal"
      }
    ],
    details: {
      "filestore-prod-1": {
        history: [
          { date: "2024-05-01", utilization: "18%" },
          { date: "2024-05-02", utilization: "20%" }
        ]
      },
      "filestore-analytics-2": {
        history: [
          { date: "2024-05-01", utilization: "88%" },
          { date: "2024-05-02", utilization: "90%" }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 