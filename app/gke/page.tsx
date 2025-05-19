"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Server } from "lucide-react"

export default function GKEAuditLandingPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:underline flex items-center gap-1"><Server className="h-4 w-4" /> Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-primary">GKE Audit</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Server className="h-6 w-6 text-primary" /> GKE Audit
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/gke/workload-right-sizing">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Workload (Pod) Right-Sizing</CardTitle>
            </CardHeader>
            <CardContent>
              Analyze pod resource requests/limits and actual usage to identify over/under-provisioned workloads.
            </CardContent>
          </Card>
        </Link>
        <Link href="/gke/idle-node-pools">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Idle/Underutilized Node Pool Detection</CardTitle>
            </CardHeader>
            <CardContent>
              Identify node pools with low or no workload utilization for the selected project to optimize costs and resources.
            </CardContent>
          </Card>
        </Link>
        {/* Future GKE audit sub-pages can be added here */}
      </div>
    </div>
  )
} 