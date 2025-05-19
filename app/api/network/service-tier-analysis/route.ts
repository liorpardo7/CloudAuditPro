import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  // TODO: Integrate with real backend/service for network service tier analysis data
  // For now, return a realistic mock response
  const data = {
    summary: {
      totalEgress: "2.1TB/mo",
      premiumTierUsage: "1.7TB/mo",
      potentialSavings: "$120/mo"
    },
    tiers: [
      {
        resource: "vm-prod-api-01",
        tier: "Premium",
        egress: "1.2TB/mo",
        cost: "$80/mo",
        status: "Premium Tier"
      },
      {
        resource: "vm-staging-01",
        tier: "Standard",
        egress: "0.4TB/mo",
        cost: "$20/mo",
        status: "Standard Tier"
      }
    ],
    details: {
      "vm-prod-api-01": {
        history: [
          { date: "2024-05-01", egress: "1.1TB" },
          { date: "2024-05-02", egress: "1.2TB" }
        ]
      },
      "vm-staging-01": {
        history: [
          { date: "2024-05-01", egress: "0.3TB" },
          { date: "2024-05-02", egress: "0.4TB" }
        ]
      }
    }
  }

  return NextResponse.json(data)
} 