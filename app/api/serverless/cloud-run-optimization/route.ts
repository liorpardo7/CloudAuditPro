import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for Cloud Run optimization data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalServices: 5,
      overProvisioned: 2,
      concurrencyIssues: 1
    },
    services: [
      {
        name: "api-service",
        region: "us-central1",
        memory: "2Gi",
        cpu: "1 vCPU",
        concurrency: 1,
        status: "Over-Provisioned"
      },
      {
        name: "worker-service",
        region: "europe-west1",
        memory: "512Mi",
        cpu: "0.5 vCPU",
        concurrency: 100,
        status: "Concurrency Issue"
      }
    ],
    details: {
      "api-service": {
        history: [
          { date: "2024-05-01", memory: "1.5Gi", cpu: "0.8 vCPU" },
          { date: "2024-05-02", memory: "1.6Gi", cpu: "0.9 vCPU" }
        ]
      },
      "worker-service": {
        history: [
          { date: "2024-05-01", concurrency: 120 },
          { date: "2024-05-02", concurrency: 100 }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 