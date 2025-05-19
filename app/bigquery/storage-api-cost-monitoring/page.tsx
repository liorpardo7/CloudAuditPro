"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart4, Database, Download, ChevronRight, Info, AlertTriangle, ArrowLeft } from "lucide-react"
import { ProjectSelector } from "@/components/project-selector"
import { useProjectStore } from '@/lib/store'

export default function StorageApiCostMonitoringPage() {
  const { selectedProject } = useProjectStore()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)
  const [selectedRow, setSelectedRow] = React.useState<any>(null)

  React.useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/bigquery/storage-api-cost-monitoring?projectId=${selectedProject.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch Storage API cost data')
        return res.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedProject])

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Breadcrumbs */}
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:underline flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/bigquery" className="hover:underline">BigQuery Audit</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-primary">Storage API Cost Monitoring</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> BigQuery Storage API Cost Monitoring
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Analyze BigQuery Storage Read/Write API usage for high-cost patterns and optimization opportunities for the selected project.
          </p>
        </div>
        <ProjectSelector />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Total API Cost</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.totalApiCost}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Top Dataset/Table</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.topTable}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Potential Savings</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.potentialSavings}</CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>API Usage by Table</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[API Usage Chart]</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Cost Trend</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Cost Trend Chart]</div>}</CardContent>
        </Card>
      </div>
      {/* Usage Table */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Storage API Usage by Table</h2>
          <Button variant="outline" size="sm" disabled={loading}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
        {error && <div className="text-destructive mb-2"><AlertTriangle className="h-4 w-4 inline mr-1" /> {error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 text-left">Dataset</th>
                <th className="px-2 py-1 text-left">Table</th>
                <th className="px-2 py-1 text-left">API Calls</th>
                <th className="px-2 py-1 text-left">Bytes Read</th>
                <th className="px-2 py-1 text-left">Bytes Written</th>
                <th className="px-2 py-1 text-left">Cost</th>
                <th className="px-2 py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
              ) : data?.tables?.length ? (
                data.tables.map((row: any) => (
                  <tr key={row.dataset + row.table} className="border-b hover:bg-muted cursor-pointer" onClick={() => setSelectedRow(row)}>
                    <td className="px-2 py-1 font-mono">{row.dataset}</td>
                    <td className="px-2 py-1 font-mono">{row.table}</td>
                    <td className="px-2 py-1">{row.apiCalls}</td>
                    <td className="px-2 py-1">{row.bytesRead}</td>
                    <td className="px-2 py-1">{row.bytesWritten}</td>
                    <td className="px-2 py-1">{row.cost}</td>
                    <td className="px-2 py-1"><Button size="sm" variant="outline">View Details</Button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No tables found.</td></tr>
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
              <li>Reduce unnecessary API calls to high-cost tables.</li>
              <li>Partition or cluster large tables to minimize read costs.</li>
              <li>Monitor API usage trends and set alerts for cost spikes.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Details Drawer/Modal */}
      {selectedRow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedRow(null)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setSelectedRow(null)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">{selectedRow.dataset}.{selectedRow.table} Details</h3>
            <div className="mb-2">API Calls: {selectedRow.apiCalls}</div>
            <div className="mb-2">Bytes Read: {selectedRow.bytesRead}</div>
            <div className="mb-2">Bytes Written: {selectedRow.bytesWritten}</div>
            <div className="mb-2">Cost: {selectedRow.cost}</div>
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Usage History</h4>
              <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Usage Chart]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 