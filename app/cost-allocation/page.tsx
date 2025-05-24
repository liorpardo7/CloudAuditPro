"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { BarChart3, AlertTriangle, Tag } from "lucide-react"
import { useRouter, useSearchParams } from 'next/navigation'
import { useProjectStore } from '@/lib/store'

type CostAllocationData = {
  taggingCoverage: { total: number; tagged: number; percentage: number };
  missingLabels: string[];
  inconsistentTags: { key: string; value: string; expectedValue: string }[];
  resources: { name: string; type: string; project: string; labels?: Record<string, string> }[];
  recommendations: { issue: string; recommendation: string }[];
};

const fetchCostAllocationResults = async (): Promise<CostAllocationData> => {
  return {
    taggingCoverage: { total: 100, tagged: 85, percentage: 85 },
    missingLabels: ["cost_center", "owner"],
    inconsistentTags: [
      { key: "environment", value: "prod", expectedValue: "production" },
    ],
    resources: [
      { name: "vm-1", type: "VM", project: "project-1", labels: { cost_center: "123", environment: "prod" } },
      { name: "bucket-1", type: "Bucket", project: "project-2", labels: { environment: "production" } },
    ],
    recommendations: [
      { issue: "Missing required labels", recommendation: "Add cost_center and owner labels to all resources." },
      { issue: "Inconsistent environment tag", recommendation: "Standardize environment tag values across projects." },
    ],
  }
}

export default function CostAllocationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProjectByGcpId } = useProjectStore();
  const [data, setData] = React.useState<CostAllocationData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState("resources")

  React.useEffect(() => {
    // On mount, sync ?project= param to store
    const urlProject = searchParams.get('project');
    if (urlProject && (!selectedProject || selectedProject.gcpProjectId !== urlProject)) {
      setSelectedProjectByGcpId(urlProject);
    }
  }, []);

  React.useEffect(() => {
    // When project changes, update URL param
    if (selectedProject && searchParams.get('project') !== selectedProject.gcpProjectId) {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set('project', selectedProject.gcpProjectId);
      router.replace(`?${params.toString()}`);
    }
  }, [selectedProject]);

  React.useEffect(() => {
    fetchCostAllocationResults().then((res) => {
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
          <h2 className="text-2xl font-bold tracking-tight">Cost Allocation & Tagging</h2>
          <p className="text-muted-foreground mt-1">Analyze resource tagging and cost allocation coverage</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tagging Coverage</CardTitle>
            <CardDescription>Total: {data.taggingCoverage.total}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.taggingCoverage.percentage}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Missing Labels</CardTitle>
            <CardDescription>&nbsp;</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.missingLabels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inconsistent Tags</CardTitle>
            <CardDescription>&nbsp;</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.inconsistentTags.length}</div>
          </CardContent>
        </Card>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="coverage">Tagging Coverage</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="resources">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Name</th>
                    <th className="h-10 px-2 text-left font-medium">Type</th>
                    <th className="h-10 px-2 text-left font-medium">Project</th>
                    <th className="h-10 px-2 text-left font-medium">Labels</th>
                  </tr>
                </thead>
                <tbody>
                  {data.resources.map((res) => (
                    <tr key={res.name} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{res.name}</td>
                      <td className="px-2 py-3">{res.type}</td>
                      <td className="px-2 py-3">{res.project}</td>
                      <td className="px-2 py-3">
                        {Object.entries(res.labels ?? {}).map(([k, v]) => (
                          <span key={k} className="inline-block bg-muted px-2 py-0.5 rounded-full text-xs mr-1 mb-1">{k}: {v}</span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="coverage">
          <Card>
            <CardHeader>
              <CardTitle>Tagging Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg">{data.taggingCoverage.tagged} of {data.taggingCoverage.total} resources tagged ({data.taggingCoverage.percentage}%)</div>
              <div className="mt-4">
                <strong>Missing Labels:</strong> {data.missingLabels.join(", ") || "None"}
              </div>
              <div className="mt-2">
                <strong>Inconsistent Tags:</strong> {data.inconsistentTags.length === 0 ? "None" : (
                  <span>
                    {data.inconsistentTags.map((tag, idx) => (
                      <span key={idx} className="inline-block bg-muted px-2 py-0.5 rounded-full text-xs mr-1 mb-1">{tag.key}: {tag.value} (expected: {tag.expectedValue})</span>
                    ))}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
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