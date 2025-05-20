"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart4, HardDrive, Download, ChevronRight, Info, AlertTriangle, ArrowLeft } from "lucide-react"
import { useProjectStore } from '@/lib/store'

export default function PersistentDiskOptimizationPage() {
  const { selectedProject } = useProjectStore()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)
  const [selectedDisk, setSelectedDisk] = React.useState<any>(null)

  React.useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/storage/persistent-disk-optimization?projectId=${selectedProject.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch persistent disk optimization data')
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
        <Link href="/storage" className="hover:underline">Storage Audit</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-primary">Persistent Disk Type & Snapshot Cost-Effectiveness</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-primary" /> Persistent Disk Type & Snapshot Cost-Effectiveness
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Analyze persistent disk types and snapshot usage for the selected project to optimize storage costs and performance.
          </p>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Total Disks</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.totalDisks}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Non-Optimal Type</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.nonOptimalType}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Snapshot Waste</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.snapshotWaste}</CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Disk Type Distribution</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Type Chart]</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Snapshot Cost</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Snapshot Chart]</div>}</CardContent>
        </Card>
      </div>
      {/* Disks Table */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Persistent Disks</h2>
          <Button variant="outline" size="sm" disabled={loading}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
        {error && <div className="text-destructive mb-2"><AlertTriangle className="h-4 w-4 inline mr-1" /> {error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 text-left">Disk</th>
                <th className="px-2 py-1 text-left">Zone</th>
                <th className="px-2 py-1 text-left">Type</th>
                <th className="px-2 py-1 text-left">Size</th>
                <th className="px-2 py-1 text-left">Snapshots</th>
                <th className="px-2 py-1 text-left">Waste</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
              ) : data?.disks?.length ? (
                data.disks.map((disk: any) => (
                  <tr key={disk.name + disk.zone} className="border-b hover:bg-muted cursor-pointer" onClick={() => setSelectedDisk(disk)}>
                    <td className="px-2 py-1 font-mono">{disk.name}</td>
                    <td className="px-2 py-1">{disk.zone}</td>
                    <td className="px-2 py-1">{disk.type}</td>
                    <td className="px-2 py-1">{disk.size}</td>
                    <td className="px-2 py-1">{disk.snapshots}</td>
                    <td className="px-2 py-1">{disk.waste}</td>
                    <td className="px-2 py-1">{disk.status}</td>
                    <td className="px-2 py-1"><Button size="sm" variant="outline">View Details</Button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="text-center py-4 text-muted-foreground">No disks found.</td></tr>
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
              <li>Switch to optimal disk types for cost and performance.</li>
              <li>Delete unused or excessive snapshots to reduce waste.</li>
              <li>Monitor disk and snapshot usage trends regularly.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Details Drawer/Modal */}
      {selectedDisk && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedDisk(null)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setSelectedDisk(null)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">{selectedDisk.name} Details</h3>
            <div className="mb-2">Zone: {selectedDisk.zone}</div>
            <div className="mb-2">Type: {selectedDisk.type}</div>
            <div className="mb-2">Size: {selectedDisk.size}</div>
            <div className="mb-2">Snapshots: {selectedDisk.snapshots}</div>
            <div className="mb-2">Waste: {selectedDisk.waste}</div>
            <div className="mb-2">Status: {selectedDisk.status}</div>
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Snapshot History</h4>
              <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Snapshot History Chart]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 