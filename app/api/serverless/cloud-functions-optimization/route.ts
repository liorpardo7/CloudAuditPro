import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for Cloud Functions optimization data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalFunctions: 8,
      overProvisioned: 3,
      concurrencyIssues: 2
    },
    functions: [
      {
        name: "processImage",
        region: "us-central1",
        memory: "2Gi",
        cpu: "1 vCPU",
        concurrency: 1,
        status: "Over-Provisioned"
      },
      {
        name: "webhookHandler",
        region: "europe-west1",
        memory: "256Mi",
        cpu: "0.25 vCPU",
        concurrency: 80,
        status: "Concurrency Issue"
      }
    ],
    details: {
      "processImage": {
        history: [
          { date: "2024-05-01", memory: "1.5Gi", cpu: "0.8 vCPU" },
          { date: "2024-05-02", memory: "1.6Gi", cpu: "0.9 vCPU" }
        ]
      },
      "webhookHandler": {
        history: [
          { date: "2024-05-01", concurrency: 100 },
          { date: "2024-05-02", concurrency: 80 }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 