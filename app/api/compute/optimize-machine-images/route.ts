import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for machine image storage data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalImages: 18,
      unusedImages: 6,
      estimatedSavings: "$320/mo"
    },
    images: [
      {
        name: "custom-image-2023-01-01",
        type: "Custom",
        size: "20GB",
        created: "2023-01-01",
        lastUsed: "2023-05-10",
        status: "Unused",
        savings: "$40/mo"
      },
      {
        name: "public-ubuntu-2204-lts",
        type: "Public",
        size: "10GB",
        created: "2022-12-15",
        lastUsed: "2024-05-01",
        status: "Active",
        savings: "$0/mo"
      }
    ],
    usage: {},
    cost: {},
    details: {
      "custom-image-2023-01-01": {
        history: [
          { date: "2023-01-01", used: false },
          { date: "2023-05-10", used: true }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 