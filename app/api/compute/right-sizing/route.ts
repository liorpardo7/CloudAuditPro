import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for VM right-sizing data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalVMs: 24,
      overprovisioned: 7,
      estimatedSavings: "$1,250/mo"
    },
    recommendations: [
      {
        name: "vm-prod-01",
        currentType: "n2-standard-8",
        recommendedType: "n2-standard-4",
        cpuUtil: "18%",
        memUtil: "22%",
        savings: "$120/mo"
      },
      {
        name: "vm-analytics-02",
        currentType: "e2-highmem-16",
        recommendedType: "e2-highmem-8",
        cpuUtil: "25%",
        memUtil: "30%",
        savings: "$210/mo"
      }
    ],
    utilization: {},
    savings: {},
    details: {
      "vm-prod-01": {
        history: [
          { date: "2024-05-01", cpu: 15, mem: 20 },
          { date: "2024-05-02", cpu: 18, mem: 22 }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 