import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for GKE workload right-sizing data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalWorkloads: 12,
      overProvisioned: 4,
      underProvisioned: 2
    },
    workloads: [
      {
        name: "nginx-deployment",
        namespace: "default",
        cpuRequest: "500m",
        cpuUsage: "120m",
        memRequest: "512Mi",
        memUsage: "200Mi",
        status: "Over-Provisioned"
      },
      {
        name: "api-server",
        namespace: "prod",
        cpuRequest: "1000m",
        cpuUsage: "950m",
        memRequest: "2Gi",
        memUsage: "2.1Gi",
        status: "Under-Provisioned"
      }
    ],
    details: {
      "nginx-deployment": {
        history: [
          { date: "2024-05-01", cpu: "100m", mem: "180Mi" },
          { date: "2024-05-02", cpu: "120m", mem: "200Mi" }
        ]
      },
      "api-server": {
        history: [
          { date: "2024-05-01", cpu: "900m", mem: "2Gi" },
          { date: "2024-05-02", cpu: "950m", mem: "2.1Gi" }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 