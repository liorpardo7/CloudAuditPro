"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart4, Zap, Download, ChevronRight, Info, AlertTriangle, ArrowLeft } from "lucide-react"
import { useProjectStore } from '@/lib/store'
import { useAuthCheck } from '@/lib/useAuthCheck'

export default function CloudRunOptimizationPage() {
  useAuthCheck();
  const { selectedProject } = useProjectStore()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)
  const [selectedService, setSelectedService] = React.useState<any>(null)

  React.useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/serverless/cloud-run-optimization?projectId=${selectedProject.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch Cloud Run optimization data')
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
        <Link href="/serverless" className="hover:underline">Serverless Audit</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-primary">Cloud Run Resource & Concurrency Optimization</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> Cloud Run Resource & Concurrency Optimization
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Analyze memory/CPU allocation and concurrency settings for Cloud Run services in the selected project to optimize cost and performance.
          </p>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Total Services</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary?.totalServices}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Over-Provisioned</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary?.overProvisioned}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Concurrency Issues</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary?.concurrencyIssues}</CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Memory Allocation</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Memory Chart]</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Concurrency Settings</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Concurrency Chart]</div>}</CardContent>
        </Card>
      </div>
      {/* Services Table */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Cloud Run Services</h2>
          <Button variant="outline" size="sm" disabled={loading}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
        {error && <div className="text-destructive mb-2"><AlertTriangle className="h-4 w-4 inline mr-1" /> {error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 text-left">Service</th>
                <th className="px-2 py-1 text-left">Region</th>
                <th className="px-2 py-1 text-left">Memory</th>
                <th className="px-2 py-1 text-left">CPU</th>
                <th className="px-2 py-1 text-left">Concurrency</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
              ) : data?.services?.length ? (
                data.services.map((svc: any) => (
                  <tr key={svc.name + svc.region} className="border-b hover:bg-muted cursor-pointer" onClick={() => setSelectedService(svc)}>
                    <td className="px-2 py-1 font-mono">{svc.name}</td>
                    <td className="px-2 py-1">{svc.region}</td>
                    <td className="px-2 py-1">{svc.memory}</td>
                    <td className="px-2 py-1">{svc.cpu}</td>
                    <td className="px-2 py-1">{svc.concurrency}</td>
                    <td className="px-2 py-1">{svc.status}</td>
                    <td className="px-2 py-1"><Button size="sm" variant="outline">View Details</Button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No services found.</td></tr>
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
              <li>Adjust memory and CPU allocation to match actual usage for cost savings.</li>
              <li>Review concurrency settings for optimal performance and cost.</li>
              <li>Monitor service execution trends to optimize resources.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Details Drawer/Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedService(null)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setSelectedService(null)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">{selectedService.name} Details</h3>
            <div className="mb-2">Region: {selectedService.region}</div>
            <div className="mb-2">Memory: {selectedService.memory}</div>
            <div className="mb-2">CPU: {selectedService.cpu}</div>
            <div className="mb-2">Concurrency: {selectedService.concurrency}</div>
            <div className="mb-2">Status: {selectedService.status}</div>
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Execution History</h4>
              <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Execution History Chart]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 