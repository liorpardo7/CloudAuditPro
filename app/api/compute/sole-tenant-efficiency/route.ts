import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for sole-tenant node efficiency data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalNodes: 5,
      underutilized: 2,
      estimatedSavings: "$800/mo"
    },
    nodes: [
      {
        name: "sole-tenant-node-01",
        utilization: "22%",
        recommendedAction: "Consolidate VMs",
        vmsHosted: 3,
        savings: "$300/mo"
      },
      {
        name: "sole-tenant-node-02",
        utilization: "18%",
        recommendedAction: "Decommission",
        vmsHosted: 1,
        savings: "$500/mo"
      }
    ],
    utilization: {},
    details: {
      "sole-tenant-node-01": {
        history: [
          { date: "2024-05-01", utilization: 20 },
          { date: "2024-05-02", utilization: 22 }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 