"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart4, Network, Download, ChevronRight, Info, AlertTriangle, ArrowLeft } from "lucide-react"
import { ProjectSelector } from "@/components/project-selector"
import { useProjectStore } from '@/lib/store'

export default function NetworkServiceTierAnalysisPage() {
  const { selectedProject } = useProjectStore()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<any>(null)
  const [selectedTier, setSelectedTier] = React.useState<any>(null)

  React.useEffect(() => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/network/service-tier-analysis?projectId=${selectedProject.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch network service tier data')
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
        <span className="font-medium text-primary">Service Tier Analysis (Egress Costs)</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" /> Network Service Tier Analysis (Egress Costs)
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Analyze network service tier usage and egress costs for the selected project to optimize network spend.
          </p>
        </div>
        <ProjectSelector />
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Total Egress</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.totalEgress}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Premium Tier Usage</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.premiumTierUsage}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Potential Savings</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? "-" : data?.summary.potentialSavings}</CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Service Tier Distribution</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Tier Chart]</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2"><BarChart4 className="h-5 w-5 text-primary" /><CardTitle>Egress Cost</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-32 bg-muted rounded" /> : <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Egress Chart]</div>}</CardContent>
        </Card>
      </div>
      {/* Service Tier Table */}
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Service Tiers</h2>
          <Button variant="outline" size="sm" disabled={loading}><Download className="h-4 w-4 mr-1" /> Export</Button>
        </div>
        {error && <div className="text-destructive mb-2"><AlertTriangle className="h-4 w-4 inline mr-1" /> {error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 text-left">Resource</th>
                <th className="px-2 py-1 text-left">Tier</th>
                <th className="px-2 py-1 text-left">Egress</th>
                <th className="px-2 py-1 text-left">Cost</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
              ) : data?.tiers?.length ? (
                data.tiers.map((tier: any) => (
                  <tr key={tier.resource + tier.tier} className="border-b hover:bg-muted cursor-pointer" onClick={() => setSelectedTier(tier)}>
                    <td className="px-2 py-1 font-mono">{tier.resource}</td>
                    <td className="px-2 py-1">{tier.tier}</td>
                    <td className="px-2 py-1">{tier.egress}</td>
                    <td className="px-2 py-1">{tier.cost}</td>
                    <td className="px-2 py-1">{tier.status}</td>
                    <td className="px-2 py-1"><Button size="sm" variant="outline">View Details</Button></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No service tiers found.</td></tr>
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
              <li>Review use of Premium Tier for cost-sensitive workloads.</li>
              <li>Consider Standard Tier for non-critical egress to save costs.</li>
              <li>Monitor egress trends and optimize tier selection regularly.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Details Drawer/Modal */}
      {selectedTier && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setSelectedTier(null)}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-muted-foreground" onClick={() => setSelectedTier(null)}>&times;</button>
            <h3 className="text-xl font-bold mb-2">{selectedTier.resource} Details</h3>
            <div className="mb-2">Tier: {selectedTier.tier}</div>
            <div className="mb-2">Egress: {selectedTier.egress}</div>
            <div className="mb-2">Cost: {selectedTier.cost}</div>
            <div className="mb-2">Status: {selectedTier.status}</div>
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Egress History</h4>
              <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">[Egress History Chart]</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 