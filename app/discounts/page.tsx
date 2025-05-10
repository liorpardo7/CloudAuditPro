"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Percent, AlertTriangle, DollarSign } from "lucide-react"

type DiscountData = {
  committedUseDiscounts: {
    project: string;
    resourceType: string;
    commitment: string;
    savings: string;
    status: string;
  }[];
  sustainedUseDiscounts: {
    project: string;
    resourceType: string;
    usage: string;
    savings: string;
  }[];
  recommendations: {
    issue: string;
    recommendation: string;
  }[];
};

const fetchDiscountResults = async (): Promise<DiscountData> => {
  return {
    committedUseDiscounts: [
      {
        project: "project-1",
        resourceType: "Compute Engine",
        commitment: "1 year",
        savings: "$1,200",
        status: "Active"
      },
      {
        project: "project-2",
        resourceType: "Cloud SQL",
        commitment: "3 years",
        savings: "$3,600",
        status: "Active"
      }
    ],
    sustainedUseDiscounts: [
      {
        project: "project-1",
        resourceType: "Compute Engine",
        usage: "85%",
        savings: "$800"
      },
      {
        project: "project-2",
        resourceType: "Cloud Storage",
        usage: "92%",
        savings: "$1,200"
      }
    ],
    recommendations: [
      {
        issue: "Underutilized commitments",
        recommendation: "Consider adjusting commitment terms for better cost optimization."
      },
      {
        issue: "Missing sustained use discounts",
        recommendation: "Enable sustained use discounts for eligible resources."
      }
    ]
  }
}

export default function DiscountsPage() {
  const [data, setData] = React.useState<DiscountData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState("committed")

  React.useEffect(() => {
    fetchDiscountResults().then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading || !data) return <div className="p-8">Loading...</div>

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4 mb-4">
        <Percent className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Discount Program Evaluation</h2>
          <p className="text-muted-foreground mt-1">Analyze and optimize discount programs</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Committed Use</CardTitle>
            <CardDescription>Total: {data.committedUseDiscounts.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.committedUseDiscounts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sustained Use</CardTitle>
            <CardDescription>Total: {data.sustainedUseDiscounts.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sustainedUseDiscounts.length}</div>
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
          <TabsTrigger value="committed">Committed Use</TabsTrigger>
          <TabsTrigger value="sustained">Sustained Use</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="committed">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Project</th>
                    <th className="h-10 px-2 text-left font-medium">Resource Type</th>
                    <th className="h-10 px-2 text-left font-medium">Commitment</th>
                    <th className="h-10 px-2 text-left font-medium">Savings</th>
                    <th className="h-10 px-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.committedUseDiscounts.map((discount, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{discount.project}</td>
                      <td className="px-2 py-3">{discount.resourceType}</td>
                      <td className="px-2 py-3">{discount.commitment}</td>
                      <td className="px-2 py-3">{discount.savings}</td>
                      <td className="px-2 py-3">{discount.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="sustained">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Project</th>
                    <th className="h-10 px-2 text-left font-medium">Resource Type</th>
                    <th className="h-10 px-2 text-left font-medium">Usage</th>
                    <th className="h-10 px-2 text-left font-medium">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sustainedUseDiscounts.map((discount, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{discount.project}</td>
                      <td className="px-2 py-3">{discount.resourceType}</td>
                      <td className="px-2 py-3">{discount.usage}</td>
                      <td className="px-2 py-3">{discount.savings}</td>
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