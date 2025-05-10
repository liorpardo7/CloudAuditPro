"use client"

import * as React from "react"

const recentAudits = [
  {
    id: "1",
    name: "Production VPC",
    status: "Completed",
    findings: "12 issues found",
    date: "2024-02-20",
  },
  {
    id: "2",
    name: "Storage Buckets",
    status: "In Progress",
    findings: "Scanning...",
    date: "2024-02-20",
  },
  {
    id: "3",
    name: "IAM Policies",
    status: "Completed",
    findings: "3 critical issues",
    date: "2024-02-19",
  },
  {
    id: "4",
    name: "Compute Resources",
    status: "Completed",
    findings: "8 recommendations",
    date: "2024-02-19",
  },
  {
    id: "5",
    name: "Network Security",
    status: "Completed",
    findings: "All clear",
    date: "2024-02-18",
  },
]

export function RecentAudits() {
  return (
    <div className="space-y-8">
      {recentAudits.map((audit) => (
        <div key={audit.id} className="flex items-center">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{audit.name}</p>
            <p className="text-sm text-muted-foreground">{audit.findings}</p>
          </div>
          <div className="ml-auto font-medium">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                audit.status === "Completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              }`}
            >
              {audit.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
} 