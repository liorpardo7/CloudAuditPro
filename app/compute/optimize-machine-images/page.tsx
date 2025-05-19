"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart4, HardDrive, Download, ChevronRight, Info, AlertTriangle, ArrowLeft } from "lucide-react"
import { ProjectSelector } from "@/components/project-selector"
import { useProjectStore } from '@/lib/store'

export default function OptimizeMachineImagesPage() {
  const { selectedProject } = useProjectStore()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)
  const [selectedImage, setSelectedImage] = React.useState<any>(null)

  React.useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/compute/optimize-machine-images?projectId=${selectedProject.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch machine image data')
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
        <Link href="/compute" className="hover:underline">Compute Audit</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-primary">Optimize Machine Images</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-primary" /> Optimize Machine Image Storage Costs
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Identify old, unused, or redundant custom images and evaluate public image use for the selected project.
          </p>
        </div>
        <ProjectSelector />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Total Images</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.totalImages}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Unused Images</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.unusedImages}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Est. Savings</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.estimatedSavings}</CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Image Usage</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Usage Chart]</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Storage Cost</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Cost Chart]</div>}</CardContent>
        </Card>
      </div>
      {/* Machine Images Table */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Machine Images</h2>
          <Button variant="outline" size="sm" disabled={loading}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
        {error && <div className="text-destructive mb-2"><AlertTriangle className="h-4 w-4 inline mr-1" /> {error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 text-left">Image Name</th>
                <th className="px-2 py-1 text-left">Type</th>
                <th className="px-2 py-1 text-left">Size</th>
                <th className="px-2 py-1 text-left">Created</th>
                <th className="px-2 py-1 text-left">Last Used</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Savings</th>
                <th className="px-2 py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
              ) : data?.images?.length ? (
                data.images.map((img: any) => (
                  <tr key={img.name} className="border-b hover:bg-muted cursor-pointer" onClick={() => setSelectedImage(img)}>
                    <td className="px-2 py-1 font-mono">{img.name}</td>
                    <td className="px-2 py-1">{img.type}</td>
                    <td className="px-2 py-1">{img.size}</td>
                    <td className="px-2 py-1">{img.created}</td>
                    <td className="px-2 py-1">{img.lastUsed}</td>
                    <td className="px-2 py-1">{img.status}</td>
                    <td className="px-2 py-1">{img.savings}</td>
                    <td className="px-2 py-1"><Button size="sm" variant="outline">View Details</Button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="text-center py-4 text-muted-foreground">No images found.</td></tr>
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
              <li>Delete unused or old custom images to reduce storage costs.</li>
              <li>Review public image usage for compliance and security.</li>
              <li>Monitor image usage trends to optimize storage.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Details Drawer/Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedImage(null)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setSelectedImage(null)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">{selectedImage.name} Details</h3>
            <div className="mb-2">Type: {selectedImage.type}</div>
            <div className="mb-2">Size: {selectedImage.size}</div>
            <div className="mb-2">Created: {selectedImage.created}</div>
            <div className="mb-2">Last Used: {selectedImage.lastUsed}</div>
            <div className="mb-2">Status: {selectedImage.status}</div>
            <div className="mb-2">Estimated Savings: {selectedImage.savings}</div>
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Usage History</h4>
              <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Usage History Chart]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 