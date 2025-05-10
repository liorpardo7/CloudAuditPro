"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, AlertCircle, Info } from "lucide-react"

interface ResourceMetricProps {
  title: string
  used: number
  total: number
  unit: string
  status?: "ok" | "warning" | "critical" | "info"
}

export function ResourceMetric({ 
  title, 
  used, 
  total, 
  unit, 
  status = "ok" 
}: ResourceMetricProps) {
  const percentage = Math.round((used / total) * 100)
  
  const statusConfig = {
    ok: { color: "bg-green-500", icon: Check, text: "text-green-500" },
    warning: { color: "bg-amber-500", icon: Info, text: "text-amber-500" },
    critical: { color: "bg-red-500", icon: AlertCircle, text: "text-red-500" },
    info: { color: "bg-blue-500", icon: Info, text: "text-blue-500" }
  }
  
  const { color, icon: Icon, text } = statusConfig[status]
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-7 w-7 rounded-full ${color}/20 flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${text}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-2xl font-bold">
            {used} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
          </div>
          
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
            <div 
              className={`h-full ${color}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentage}% used</span>
            <span>{total} {unit} total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ResourceMetrics() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      <ResourceMetric 
        title="CPU Usage"
        used={32}
        total={64}
        unit="vCPUs"
        status="ok"
      />
      <ResourceMetric 
        title="Memory Usage"
        used={124}
        total={256}
        unit="GB"
        status="warning"
      />
      <ResourceMetric 
        title="Storage"
        used={1.8}
        total={2}
        unit="TB"
        status="critical"
      />
      <ResourceMetric 
        title="Network Bandwidth"
        used={3.2}
        total={10}
        unit="Gbps"
        status="info"
      />
    </div>
  )
} 