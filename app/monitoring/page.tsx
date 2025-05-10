"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Bell, AlertTriangle, Activity } from "lucide-react"

type MonitoringData = {
  alerts: {
    name: string;
    resource: string;
    condition: string;
    severity: string;
    status: string;
  }[];
  metrics: {
    name: string;
    resource: string;
    threshold: string;
    currentValue: string;
    trend: string;
  }[];
  recommendations: {
    issue: string;
    recommendation: string;
  }[];
};

const fetchMonitoringResults = async (): Promise<MonitoringData> => {
  return {
    alerts: [
      {
        name: "High CPU Usage",
        resource: "instance-1",
        condition: "CPU > 80%",
        severity: "Warning",
        status: "Active"
      },
      {
        name: "Low Disk Space",
        resource: "instance-2",
        condition: "Disk < 10%",
        severity: "Critical",
        status: "Active"
      }
    ],
    metrics: [
      {
        name: "CPU Utilization",
        resource: "instance-1",
        threshold: "80%",
        currentValue: "85%",
        trend: "Increasing"
      },
      {
        name: "Memory Usage",
        resource: "instance-2",
        threshold: "90%",
        currentValue: "75%",
        trend: "Stable"
      }
    ],
    recommendations: [
      {
        issue: "Missing alert thresholds",
        recommendation: "Configure alert thresholds for all critical metrics."
      },
      {
        issue: "Insufficient monitoring coverage",
        recommendation: "Add monitoring for additional resources."
      }
    ]
  }
}

export default function MonitoringPage() {
  const [data, setData] = React.useState<MonitoringData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState("alerts")

  React.useEffect(() => {
    fetchMonitoringResults().then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading || !data) return <div className="p-8">Loading...</div>

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4 mb-4">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monitoring & Alerts</h2>
          <p className="text-muted-foreground mt-1">Track and manage monitoring metrics and alerts</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>Total: {data.alerts.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Metrics</CardTitle>
            <CardDescription>Total: {data.metrics.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Total: {data.recommendations.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.recommendations.length}</div>
          </CardContent>
        </Card>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="alerts">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Alert Name</th>
                    <th className="h-10 px-2 text-left font-medium">Resource</th>
                    <th className="h-10 px-2 text-left font-medium">Condition</th>
                    <th className="h-10 px-2 text-left font-medium">Severity</th>
                    <th className="h-10 px-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.alerts.map((alert, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{alert.name}</td>
                      <td className="px-2 py-3">{alert.resource}</td>
                      <td className="px-2 py-3">{alert.condition}</td>
                      <td className="px-2 py-3">{alert.severity}</td>
                      <td className="px-2 py-3">{alert.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="metrics">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Metric Name</th>
                    <th className="h-10 px-2 text-left font-medium">Resource</th>
                    <th className="h-10 px-2 text-left font-medium">Threshold</th>
                    <th className="h-10 px-2 text-left font-medium">Current Value</th>
                    <th className="h-10 px-2 text-left font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {data.metrics.map((metric, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{metric.name}</td>
                      <td className="px-2 py-3">{metric.resource}</td>
                      <td className="px-2 py-3">{metric.threshold}</td>
                      <td className="px-2 py-3">{metric.currentValue}</td>
                      <td className="px-2 py-3">{metric.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2">
                {data.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-1" />
                    <span>{rec.issue} — {rec.recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 