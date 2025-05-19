import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for persistent disk optimization data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalDisks: 14,
      nonOptimalType: 3,
      snapshotWaste: "$90/mo"
    },
    disks: [
      {
        name: "pd-standard-1",
        zone: "us-central1-a",
        type: "pd-standard",
        size: "500GB",
        snapshots: 4,
        waste: "$20/mo",
        status: "Non-Optimal Type"
      },
      {
        name: "pd-ssd-2",
        zone: "us-central1-b",
        type: "pd-ssd",
        size: "1TB",
        snapshots: 7,
        waste: "$40/mo",
        status: "Snapshot Waste"
      }
    ],
    details: {
      "pd-standard-1": {
        history: [
          { date: "2024-05-01", waste: "$18/mo" },
          { date: "2024-05-02", waste: "$20/mo" }
        ]
      },
      "pd-ssd-2": {
        history: [
          { date: "2024-05-01", waste: "$35/mo" },
          { date: "2024-05-02", waste: "$40/mo" }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 