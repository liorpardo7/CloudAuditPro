"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { BarChart3, AlertTriangle, Calendar } from "lucide-react"

type BudgetingData = {
  budgets: { project: string; name: string; amount: string; thresholdRules: string[]; notifications: string[]; forecastSettings: { enabled: boolean } }[];
  forecasts: { project: string; trend: string; forecastedAmount: string }[];
  recommendations: { issue: string; recommendation: string }[];
};

const fetchBudgetingResults = async (): Promise<BudgetingData> => {
  return {
    budgets: [
      { project: "project-1", name: "Main Budget", amount: "$10,000", thresholdRules: ["80%", "100%"], notifications: ["Email"], forecastSettings: { enabled: true } },
      { project: "project-2", name: "Dev Budget", amount: "$2,000", thresholdRules: [], notifications: [], forecastSettings: { enabled: false } },
    ],
    forecasts: [
      { project: "project-1", trend: "increasing", forecastedAmount: "$12,000" },
      { project: "project-2", trend: "stable", forecastedAmount: "$2,000" },
    ],
    recommendations: [
      { issue: "No threshold rules", recommendation: "Add threshold rules to all budgets." },
      { issue: "Forecasting not enabled", recommendation: "Enable forecasting for all budgets." },
    ],
  }
}

export default function BudgetingPage() {
  const [data, setData] = React.useState<BudgetingData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState("budgets")

  React.useEffect(() => {
    fetchBudgetingResults().then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading || !data) return <div className="p-8">Loading...</div>

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4 mb-4">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Budgeting & Forecasting</h2>
          <p className="text-muted-foreground mt-1">Monitor budgets, forecasts, and cost trends</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Total: {data.budgets.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.budgets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Forecasts</CardTitle>
            <CardDescription>&nbsp;</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.forecasts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>&nbsp;</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.recommendations.length}</div>
          </CardContent>
        </Card>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="budgets">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Project</th>
                    <th className="h-10 px-2 text-left font-medium">Budget Name</th>
                    <th className="h-10 px-2 text-left font-medium">Amount</th>
                    <th className="h-10 px-2 text-left font-medium">Threshold Rules</th>
                    <th className="h-10 px-2 text-left font-medium">Notifications</th>
                    <th className="h-10 px-2 text-left font-medium">Forecasting</th>
                  </tr>
                </thead>
                <tbody>
                  {data.budgets.map((budget, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{budget.project}</td>
                      <td className="px-2 py-3">{budget.name}</td>
                      <td className="px-2 py-3">{budget.amount}</td>
                      <td className="px-2 py-3">{budget.thresholdRules.join(", ") || "None"}</td>
                      <td className="px-2 py-3">{budget.notifications.join(", ") || "None"}</td>
                      <td className="px-2 py-3">{budget.forecastSettings.enabled ? "Enabled" : "Disabled"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="forecasts">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Project</th>
                    <th className="h-10 px-2 text-left font-medium">Trend</th>
                    <th className="h-10 px-2 text-left font-medium">Forecasted Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forecasts.map((forecast, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{forecast.project}</td>
                      <td className="px-2 py-3">{forecast.trend}</td>
                      <td className="px-2 py-3">{forecast.forecastedAmount}</td>
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