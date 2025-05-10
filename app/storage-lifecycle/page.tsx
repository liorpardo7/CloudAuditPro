"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Database, AlertTriangle, Clock } from "lucide-react"

type StorageLifecycleData = {
  buckets: {
    name: string;
    location: string;
    lifecycleRules: string[];
    lastModified: string;
    size: string;
  }[];
  coldStorage: {
    bucket: string;
    objectCount: number;
    totalSize: string;
    lastAccessed: string;
  }[];
  recommendations: {
    issue: string;
    recommendation: string;
  }[];
};

const fetchStorageLifecycleResults = async (): Promise<StorageLifecycleData> => {
  return {
    buckets: [
      {
        name: "bucket-1",
        location: "us-central1",
        lifecycleRules: ["Delete after 30 days", "Move to Cold Storage after 90 days"],
        lastModified: "2024-03-15",
        size: "1.2 TB"
      },
      {
        name: "bucket-2",
        location: "europe-west1",
        lifecycleRules: ["Delete after 60 days"],
        lastModified: "2024-03-10",
        size: "500 GB"
      }
    ],
    coldStorage: [
      {
        bucket: "bucket-1",
        objectCount: 1500,
        totalSize: "800 GB",
        lastAccessed: "2024-02-01"
      },
      {
        bucket: "bucket-2",
        objectCount: 800,
        totalSize: "300 GB",
        lastAccessed: "2024-02-15"
      }
    ],
    recommendations: [
      {
        issue: "Missing lifecycle rules",
        recommendation: "Implement lifecycle rules for bucket-2 to optimize storage costs."
      },
      {
        issue: "Cold storage optimization",
        recommendation: "Consider moving more objects to cold storage in bucket-1."
      }
    ]
  }
}

export default function StorageLifecyclePage() {
  const [data, setData] = React.useState<StorageLifecycleData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState("buckets")

  React.useEffect(() => {
    fetchStorageLifecycleResults().then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [])

  if (loading || !data) return <div className="p-8">Loading...</div>

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4 mb-4">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Storage Lifecycle Policies</h2>
          <p className="text-muted-foreground mt-1">Manage and optimize storage lifecycle rules</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Buckets</CardTitle>
            <CardDescription>Total: {data.buckets.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.buckets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cold Storage</CardTitle>
            <CardDescription>Total: {data.coldStorage.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.coldStorage.length}</div>
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
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
          <TabsTrigger value="cold">Cold Storage</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="buckets">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Bucket Name</th>
                    <th className="h-10 px-2 text-left font-medium">Location</th>
                    <th className="h-10 px-2 text-left font-medium">Lifecycle Rules</th>
                    <th className="h-10 px-2 text-left font-medium">Last Modified</th>
                    <th className="h-10 px-2 text-left font-medium">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {data.buckets.map((bucket, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{bucket.name}</td>
                      <td className="px-2 py-3">{bucket.location}</td>
                      <td className="px-2 py-3">{bucket.lifecycleRules.join(", ") || "None"}</td>
                      <td className="px-2 py-3">{bucket.lastModified}</td>
                      <td className="px-2 py-3">{bucket.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="cold">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Bucket</th>
                    <th className="h-10 px-2 text-left font-medium">Object Count</th>
                    <th className="h-10 px-2 text-left font-medium">Total Size</th>
                    <th className="h-10 px-2 text-left font-medium">Last Accessed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coldStorage.map((storage, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{storage.bucket}</td>
                      <td className="px-2 py-3">{storage.objectCount}</td>
                      <td className="px-2 py-3">{storage.totalSize}</td>
                      <td className="px-2 py-3">{storage.lastAccessed}</td>
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