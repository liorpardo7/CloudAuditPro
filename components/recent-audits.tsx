"use client"

import * as React from "react"
import { Check, Clock, AlertTriangle, Server, Shield } from "lucide-react"

const getIconForAudit = (name: string) => {
  if (name.includes("VPC") || name.includes("Network")) return Shield
  if (name.includes("Storage") || name.includes("Bucket")) return Server
  return Check
}

const recentAudits = [
  {
    id: "1",
    name: "Production VPC",
    status: "Completed",
    findings: "12 issues found",
    severity: "medium",
    date: "2024-02-20",
  },
  {
    id: "2",
    name: "Storage Buckets",
    status: "In Progress",
    findings: "Scanning...",
    severity: "pending",
    date: "2024-02-20",
  },
  {
    id: "3",
    name: "IAM Policies",
    status: "Completed",
    findings: "3 critical issues",
    severity: "high",
    date: "2024-02-19",
  },
  {
    id: "4",
    name: "Compute Resources",
    status: "Completed",
    findings: "8 recommendations",
    severity: "low",
    date: "2024-02-19",
  },
  {
    id: "5",
    name: "Network Security",
    status: "Completed",
    findings: "All clear",
    severity: "none",
    date: "2024-02-18",
  },
]

export function RecentAudits() {
  return (
    <div className="space-y-4">
      {recentAudits.map((audit) => {
        const IconComponent = getIconForAudit(audit.name)
        
        return (
          <div 
            key={audit.id} 
            className="flex items-center p-2 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                audit.severity === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                audit.severity === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                audit.severity === "low" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                audit.severity === "none" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
              }`}>
                {audit.severity === "high" ? <AlertTriangle className="h-4 w-4" /> : 
                 audit.status === "In Progress" ? <Clock className="h-4 w-4" /> : 
                 <IconComponent className="h-4 w-4" />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{audit.name}</p>
                <div className="flex items-center">
                  <p className="text-xs text-muted-foreground">{audit.findings}</p>
                  <span className="text-xs text-muted-foreground/60 mx-1.5">•</span>
                  <p className="text-xs text-muted-foreground/60">{audit.date}</p>
                </div>
              </div>
            </div>
            <div className="ml-auto font-medium">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  audit.status === "Completed"
                    ? "bg-primary/10 text-primary"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                }`}
              >
                {audit.status}
              </span>
            </div>
          </div>
        )
      })}
      <div className="pt-1">
        <button className="w-full text-xs font-medium text-primary hover:underline flex items-center justify-center py-1">
          View all audits
        </button>
      </div>
    </div>
  )
} 