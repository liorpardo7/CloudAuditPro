import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for NAT gateway efficiency data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalNatGateways: 3,
      idleGateways: 1,
      potentialSavings: "$45/mo"
    },
    gateways: [
      {
        name: "nat-prod-1",
        region: "us-central1",
        status: "Active",
        utilization: "80%",
        cost: "$30/mo"
      },
      {
        name: "nat-staging-1",
        region: "us-central1",
        status: "Idle",
        utilization: "2%",
        cost: "$15/mo"
      }
    ],
    details: {
      "nat-prod-1": {
        history: [
          { date: "2024-05-01", utilization: "75%" },
          { date: "2024-05-02", utilization: "80%" }
        ]
      },
      "nat-staging-1": {
        history: [
          { date: "2024-05-01", utilization: "1%" },
          { date: "2024-05-02", utilization: "2%" }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 