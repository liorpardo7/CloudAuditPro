"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart4, Server, Download, ChevronRight, Info, AlertTriangle, ArrowLeft } from "lucide-react"
import { useProjectStore } from '@/lib/store'
import { useAuthCheck } from '@/lib/useAuthCheck'

export default function GKEIdleNodePoolsPage() {
  useAuthCheck();
  const { selectedProject } = useProjectStore()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)
  const [selectedNodePool, setSelectedNodePool] = React.useState<any>(null)

  React.useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/gke/idle-node-pools?projectId=${selectedProject.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch GKE node pool data')
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
        <Link href="/gke" className="hover:underline">GKE Audit</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-primary">Idle/Underutilized Node Pools</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Server className="h-6 w-6 text-primary" /> GKE Idle/Underutilized Node Pool Detection
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Identify node pools with low or no workload utilization for the selected project to optimize costs and resources.
          </p>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Total Node Pools</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.totalNodePools}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Idle Node Pools</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.idleNodePools}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Potential Savings</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.potentialSavings}</CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Node Pool Utilization</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Utilization Chart]</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Cost Impact</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Cost Chart]</div>}</CardContent>
        </Card>
      </div>
      {/* Node Pools Table */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Node Pools</h2>
          <Button variant="outline" size="sm" disabled={loading}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
        {error && <div className="text-destructive mb-2"><AlertTriangle className="h-4 w-4 inline mr-1" /> {error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 text-left">Node Pool</th>
                <th className="px-2 py-1 text-left">Cluster</th>
                <th className="px-2 py-1 text-left">Nodes</th>
                <th className="px-2 py-1 text-left">CPU</th>
                <th className="px-2 py-1 text-left">Memory</th>
                <th className="px-2 py-1 text-left">Utilization</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
              ) : data?.nodePools?.length ? (
                data.nodePools.map((np: any) => (
                  <tr key={np.name + np.cluster} className="border-b hover:bg-muted cursor-pointer" onClick={() => setSelectedNodePool(np)}>
                    <td className="px-2 py-1 font-mono">{np.name}</td>
                    <td className="px-2 py-1">{np.cluster}</td>
                    <td className="px-2 py-1">{np.nodes}</td>
                    <td className="px-2 py-1">{np.cpu}</td>
                    <td className="px-2 py-1">{np.memory}</td>
                    <td className="px-2 py-1">{np.utilization}</td>
                    <td className="px-2 py-1">{np.status}</td>
                    <td className="px-2 py-1"><Button size="sm" variant="outline">View Details</Button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="text-center py-4 text-muted-foreground">No node pools found.</td></tr>
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
              <li>Delete or scale down idle node pools to reduce costs.</li>
              <li>Consolidate underutilized node pools for efficiency.</li>
              <li>Monitor node pool utilization trends regularly.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Details Drawer/Modal */}
      {selectedNodePool && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedNodePool(null)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setSelectedNodePool(null)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">{selectedNodePool.name} Details</h3>
            <div className="mb-2">Cluster: {selectedNodePool.cluster}</div>
            <div className="mb-2">Nodes: {selectedNodePool.nodes}</div>
            <div className="mb-2">CPU: {selectedNodePool.cpu}</div>
            <div className="mb-2">Memory: {selectedNodePool.memory}</div>
            <div className="mb-2">Utilization: {selectedNodePool.utilization}</div>
            <div className="mb-2">Status: {selectedNodePool.status}</div>
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Utilization History</h4>
              <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Utilization History Chart]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 