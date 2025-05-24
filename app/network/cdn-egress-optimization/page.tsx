"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart4, Cloud, Download, ChevronRight, Info, AlertTriangle, ArrowLeft } from "lucide-react"
import { useProjectStore } from '@/lib/store'
import { useAuthCheck } from '@/lib/useAuthCheck'

export default function CdnEgressOptimizationPage() {
  useAuthCheck();
  const { selectedProject } = useProjectStore()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)
  const [selectedWorkload, setSelectedWorkload] = React.useState<any>(null)

  React.useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/network/cdn-egress-optimization?projectId=${selectedProject.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch CDN egress optimization data')
        return res.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedProject])

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-2xl font-bold">Connect your Google Project</h2>
        <p className="text-muted-foreground">To use CloudAuditPro, please connect your Google project.</p>
        <Button onClick={() => window.location.href = '/api/auth/google'}>Connect Project</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Breadcrumbs */}
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:underline flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/network" className="hover:underline">Network Audit</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-primary">Cloud CDN for Egress Optimization</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Cloud className="h-6 w-6 text-primary" /> Cloud CDN for Egress Optimization
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Identify workloads serving cacheable static content and optimize egress costs using Cloud CDN for the selected project.
          </p>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Total CDN-Eligible Traffic</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.totalCdnEligible}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Potential Egress Savings</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.potentialSavings}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Cache Hit Ratio</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.cacheHitRatio}</CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Traffic Distribution</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Traffic Chart]</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Cache Effectiveness</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Cache Chart]</div>}</CardContent>
        </Card>
      </div>
      {/* Workloads Table */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Cacheable Workloads</h2>
          <Button variant="outline" size="sm" disabled={loading}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
        {error && <div className="text-destructive mb-2"><AlertTriangle className="h-4 w-4 inline mr-1" /> {error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 text-left">Workload</th>
                <th className="px-2 py-1 text-left">Type</th>
                <th className="px-2 py-1 text-left">Traffic</th>
                <th className="px-2 py-1 text-left">Cacheable</th>
                <th className="px-2 py-1 text-left">Current CDN</th>
                <th className="px-2 py-1 text-left">Potential Savings</th>
                <th className="px-2 py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
              ) : data?.workloads?.length ? (
                data.workloads.map((workload: any) => (
                  <tr key={workload.name} className="border-b hover:bg-muted cursor-pointer" onClick={() => setSelectedWorkload(workload)}>
                    <td className="px-2 py-1 font-mono">{workload.name}</td>
                    <td className="px-2 py-1">{workload.type}</td>
                    <td className="px-2 py-1">{workload.traffic}</td>
                    <td className="px-2 py-1">{workload.cacheable ? "Yes" : "No"}</td>
                    <td className="px-2 py-1">{workload.currentCdn ? "Enabled" : "No"}</td>
                    <td className="px-2 py-1">{workload.potentialSavings}</td>
                    <td className="px-2 py-1"><Button size="sm" variant="outline">View Details</Button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No cacheable workloads found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Recommendations Panel */}
      <div className="mt-6">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><Info className="h-5 w-5 text-primary" /><CardTitle>Recommendations</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              <li>Enable Cloud CDN for workloads serving static content to reduce egress costs.</li>
              <li>Review cache-control headers and optimize for higher cache hit ratios.</li>
              <li>Monitor CDN usage and adjust cache policies as needed.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Details Drawer/Modal */}
      {selectedWorkload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedWorkload(null)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setSelectedWorkload(null)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">{selectedWorkload.name} Details</h3>
            <div className="mb-2">Type: {selectedWorkload.type}</div>
            <div className="mb-2">Traffic: {selectedWorkload.traffic}</div>
            <div className="mb-2">Cacheable: {selectedWorkload.cacheable ? "Yes" : "No"}</div>
            <div className="mb-2">Current CDN: {selectedWorkload.currentCdn ? "Enabled" : "No"}</div>
            <div className="mb-2">Potential Savings: {selectedWorkload.potentialSavings}</div>
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Traffic History</h4>
              <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Traffic History Chart]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 