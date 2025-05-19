import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for GKE idle node pool data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalNodePools: 7,
      idleNodePools: 2,
      potentialSavings: "$180/mo"
    },
    nodePools: [
      {
        name: "np-default-1",
        cluster: "gke-prod-1",
        nodes: 3,
        cpu: "6 vCPU",
        memory: "24Gi",
        utilization: "5%",
        status: "Idle"
      },
      {
        name: "np-analytics-2",
        cluster: "gke-analytics",
        nodes: 2,
        cpu: "4 vCPU",
        memory: "16Gi",
        utilization: "12%",
        status: "Underutilized"
      }
    ],
    details: {
      "np-default-1": {
        history: [
          { date: "2024-05-01", utilization: "4%" },
          { date: "2024-05-02", utilization: "5%" }
        ]
      },
      "np-analytics-2": {
        history: [
          { date: "2024-05-01", utilization: "10%" },
          { date: "2024-05-02", utilization: "12%" }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 