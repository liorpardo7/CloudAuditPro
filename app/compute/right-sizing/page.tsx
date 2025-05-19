"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { 
  BarChart4, 
  Cpu, 
  Gauge, 
  Download, 
  ChevronRight, 
  Info, 
  AlertTriangle, 
  ArrowLeft 
} from "lucide-react"
// Import project selector and chart components as used in other compute pages
import { ProjectSelector } from "@/components/project-selector"
import { useProjectStore } from '@/lib/store'

export default function RightSizingPage() {
  const { selectedProject } = useProjectStore()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)
  const [selectedVM, setSelectedVM] = React.useState<any>(null)

  React.useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/compute/right-sizing?projectId=${selectedProject.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch right-sizing data')
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
        <span className="font-medium text-primary">Right-Sizing</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" /> Granular VM Right-Sizing & Customization
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Analyze historical VM utilization and get precise right-sizing and custom machine type recommendations for the selected project.
          </p>
        </div>
        <ProjectSelector />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Total VMs</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.totalVMs}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Overprovisioned</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.overprovisioned}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Est. Savings</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.estimatedSavings}</CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Utilization Distribution</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Utilization Chart]</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Savings Potential</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Savings Chart]</div>}</CardContent>
        </Card>
      </div>
      {/* Recommendations Table */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Right-Sizing Recommendations</h2>
          <Button variant="outline" size="sm" disabled={loading}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
        {error && <div className="text-destructive mb-2"><AlertTriangle className="h-4 w-4 inline mr-1" /> {error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 text-left">VM Name</th>
                <th className="px-2 py-1 text-left">Current Type</th>
                <th className="px-2 py-1 text-left">Recommended Type</th>
                <th className="px-2 py-1 text-left">CPU Utilization</th>
                <th className="px-2 py-1 text-left">Memory Utilization</th>
                <th className="px-2 py-1 text-left">Savings</th>
                <th className="px-2 py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
              ) : data?.recommendations?.length ? (
                data.recommendations.map((rec: any) => (
                  <tr key={rec.name} className="border-b hover:bg-muted cursor-pointer" onClick={() => setSelectedVM(rec)}>
                    <td className="px-2 py-1 font-mono">{rec.name}</td>
                    <td className="px-2 py-1">{rec.currentType}</td>
                    <td className="px-2 py-1">{rec.recommendedType}</td>
                    <td className="px-2 py-1">{rec.cpuUtil}</td>
                    <td className="px-2 py-1">{rec.memUtil}</td>
                    <td className="px-2 py-1">{rec.savings}</td>
                    <td className="px-2 py-1"><Button size="sm" variant="outline">View Details</Button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="text-center py-4 text-muted-foreground">No recommendations found.</td></tr>
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
              <li>Review and apply right-sizing recommendations to optimize costs and performance.</li>
              <li>Consider custom machine types for workloads with unique requirements.</li>
              <li>Monitor utilization trends regularly to maintain optimal sizing.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Details Drawer/Modal */}
      {selectedVM && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedVM(null)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setSelectedVM(null)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">{selectedVM.name} Details</h3>
            <div className="mb-2">Current: <span className="font-mono">{selectedVM.currentType}</span></div>
            <div className="mb-2">Recommended: <span className="font-mono">{selectedVM.recommendedType}</span></div>
            <div className="mb-2">CPU Utilization: {selectedVM.cpuUtil}</div>
            <div className="mb-2">Memory Utilization: {selectedVM.memUtil}</div>
            <div className="mb-2">Estimated Savings: {selectedVM.savings}</div>
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Historical Utilization</h4>
              <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Historical Utilization Chart]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 