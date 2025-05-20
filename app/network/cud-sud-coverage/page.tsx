"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart4, Percent, Download, ChevronRight, Info, AlertTriangle, ArrowLeft } from "lucide-react"
import { useProjectStore } from '@/lib/store'

export default function CudSudCoveragePage() {
  const { selectedProject } = useProjectStore()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)
  const [selectedService, setSelectedService] = React.useState<any>(null)

  React.useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/network/cud-sud-coverage?projectId=${selectedProject.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch CUD/SUD coverage data')
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
        <Link href="/network" className="hover:underline">Network Audit</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-primary">Holistic CUD/SUD Coverage Analysis</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Percent className="h-6 w-6 text-primary" /> Holistic CUD/SUD Coverage Analysis
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Systematically check CUD/SUD eligibility for all applicable services and optimize discount coverage for the selected project.
          </p>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>CUD Coverage</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.cudCoverage}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>SUD Coverage</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.sudCoverage}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Potential Additional Savings</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.potentialSavings}</CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Coverage by Service</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Coverage Chart]</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Discount Utilization</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Utilization Chart]</div>}</CardContent>
        </Card>
      </div>
      {/* Coverage Table */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">CUD/SUD Coverage by Service</h2>
          <Button variant="outline" size="sm" disabled={loading}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
        {error && <div className="text-destructive mb-2"><AlertTriangle className="h-4 w-4 inline mr-1" /> {error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 text-left">Service</th>
                <th className="px-2 py-1 text-left">CUD Coverage</th>
                <th className="px-2 py-1 text-left">SUD Coverage</th>
                <th className="px-2 py-1 text-left">Current Discount</th>
                <th className="px-2 py-1 text-left">Potential Additional Savings</th>
                <th className="px-2 py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
              ) : data?.services?.length ? (
                data.services.map((service: any) => (
                  <tr key={service.name} className="border-b hover:bg-muted cursor-pointer" onClick={() => setSelectedService(service)}>
                    <td className="px-2 py-1 font-mono">{service.name}</td>
                    <td className="px-2 py-1">{service.cudCoverage}</td>
                    <td className="px-2 py-1">{service.sudCoverage}</td>
                    <td className="px-2 py-1">{service.currentDiscount}</td>
                    <td className="px-2 py-1">{service.potentialSavings}</td>
                    <td className="px-2 py-1"><Button size="sm" variant="outline">View Details</Button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No services found.</td></tr>
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
              <li>Increase CUD/SUD coverage for services with low or no discount utilization.</li>
              <li>Review usage patterns to optimize discount allocation.</li>
              <li>Monitor discount utilization and adjust commitments as needed.</li>
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
            <div className="mb-2">CUD Coverage: {selectedService.cudCoverage}</div>
            <div className="mb-2">SUD Coverage: {selectedService.sudCoverage}</div>
            <div className="mb-2">Current Discount: {selectedService.currentDiscount}</div>
            <div className="mb-2">Potential Additional Savings: {selectedService.potentialSavings}</div>
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Discount Utilization History</h4>
              <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Discount Utilization Chart]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 