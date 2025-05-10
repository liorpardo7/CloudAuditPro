"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Percent,
  TrendingUp
} from "lucide-react"

interface SummaryStatProps {
  title: string
  value: string | number
  change?: number
  info?: string
  status?: "warning" | "success" | "info" | "neutral"
  progressValue?: number
  progressColor?: string
}

function SummaryStat({
  title,
  value,
  change,
  info,
  status = "neutral",
  progressValue,
  progressColor
}: SummaryStatProps) {
  const statusIcon = {
    warning: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
    success: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
    info: <HelpCircle className="h-3.5 w-3.5 text-blue-500" />,
    neutral: null
  }

  const changeColor = change && change > 0 
    ? "text-emerald-500" 
    : change && change < 0 
      ? "text-rose-500" 
      : "text-muted-foreground"

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            {status !== "neutral" && statusIcon[status]}
          </div>
          {change && (
            <div className={`text-xs font-medium flex items-center ${changeColor}`}>
              {change > 0 ? "+" : ""}{change}%
              <TrendingUp className={`h-3 w-3 ml-0.5 ${change > 0 ? "" : "transform rotate-180"}`} />
            </div>
          )}
        </div>
        
        <div className="text-2xl font-bold mb-1">{value}</div>
        
        {info && (
          <div className="text-xs text-muted-foreground mb-2">{info}</div>
        )}
        
        {typeof progressValue === "number" && (
          <div className="space-y-1">
            <Progress 
              value={progressValue} 
              className="h-1.5" 
              indicatorColor={progressColor}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressValue}%</span>
              <div className="flex items-center gap-0.5">
                <Percent className="h-3 w-3" />
                <span>of target</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SummaryStatistics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryStat
        title="Compliance Score"
        value="89%"
        change={2.5}
        status="success"
        info="Meets enterprise standards"
        progressValue={89}
        progressColor="bg-emerald-500"
      />
      <SummaryStat
        title="Security Findings"
        value="4"
        change={-15}
        status="warning"
        info="Critical issues need attention"
        progressValue={65}
        progressColor="bg-amber-500"
      />
      <SummaryStat
        title="Optimization Rate"
        value="78%"
        change={5.2}
        status="info"
        info="Resource efficiency improving"
        progressValue={78}
        progressColor="bg-blue-500"
      />
      <SummaryStat
        title="Total Spend YTD"
        value="$428.5K"
        change={-3.8}
        info="9% under budget"
        progressValue={91}
        progressColor="bg-violet-500"
      />
    </div>
  )
} 