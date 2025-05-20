import { NextResponse } from 'next/server';

export async function GET() {
  // Mock cost summary data
  const data = {
    summary: {
      totalSpend: "$12,340/mo",
      forecast: "$13,200/mo",
      budget: "$15,000/mo",
      savingsOpportunities: "$1,200/mo",
      lastUpdated: new Date().toISOString(),
    },
    topProjects: [
      { name: "Project Alpha", spend: "$4,200/mo" },
      { name: "Project Beta", spend: "$3,100/mo" },
      { name: "Project Gamma", spend: "$2,800/mo" },
    ],
    topServices: [
      { name: "Compute Engine", spend: "$5,000/mo" },
      { name: "BigQuery", spend: "$2,200/mo" },
      { name: "Cloud Storage", spend: "$1,800/mo" },
    ],
    recommendations: [
      "Review idle resources in Project Beta.",
      "Enable committed use discounts for BigQuery.",
      "Optimize persistent disk usage in Cloud Storage."
    ]
  };
  return NextResponse.json(data);
} 