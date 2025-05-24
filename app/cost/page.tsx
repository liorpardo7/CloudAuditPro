"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { 
  DollarSign, 
  Search, 
  Download, 
  AlertTriangle,
  ArrowUpDown, 
  Filter, 
  BarChart4,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  LineChart,
  Clock,
  Calendar,
  Server,
  Database,
  Network,
  Layers,
  Wallet,
  Coins
} from "lucide-react"
import { useEffect, useState } from "react"
import { useProjectStore } from '@/lib/store'
import { RunAuditButton } from '@/components/RunAuditButton'
import { useAuthCheck } from '@/lib/useAuthCheck'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CostSummaryPage() {
  useAuthCheck();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProject } = useProjectStore();
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [raw, setRaw] = useState<string>("")
  const [copyMsg, setCopyMsg] = useState("")
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.projects) {
          setProjects(data.user.projects);
          const urlProjectId = searchParams.get('project');
          let projectToSelect: any = null;
          if (urlProjectId) {
            projectToSelect = data.user.projects.find((p: any) => p.gcpProjectId === urlProjectId);
          }
          if (!projectToSelect && data.user.projects.length > 0) {
            projectToSelect = data.user.projects[0];
          }
          if (projectToSelect && (!selectedProject || selectedProject.gcpProjectId !== projectToSelect.gcpProjectId)) {
            setSelectedProject({
              id: projectToSelect.id,
              name: projectToSelect.name,
              gcpProjectId: projectToSelect.gcpProjectId,
            });
            // Update URL if needed
            if (!urlProjectId || urlProjectId !== projectToSelect.gcpProjectId) {
              const params = new URLSearchParams(searchParams.toString());
              params.set('project', projectToSelect.gcpProjectId);
              router.replace(`?${params.toString()}`);
            }
          }
        }
      });
    // eslint-disable-next-line
  }, []);

  const fetchAudit = async () => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/cost/summary?projectId=${selectedProject.gcpProjectId}`)
      .then(res => res.json())
      .then(json => { setData(json); setRaw(JSON.stringify(json, null, 2)) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleCopy = () => {
    if (raw) {
      navigator.clipboard.writeText(raw)
      setCopyMsg("Copied!")
      setTimeout(() => setCopyMsg(""), 1200)
    }
  }

  useEffect(() => { fetchAudit() }, [selectedProject])

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-2xl font-bold">Connect your Google Project</h2>
        <p className="text-muted-foreground">To use CloudAuditPro, please connect your Google project.</p>
        <Button onClick={() => window.location.href = '/api/auth/google'}>Connect Project</Button>
      </div>
    );
  }

  if (loading) return <div className="p-8">Loading cost summary...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>
  if (!data) return <div className="p-8">No data available.</div>

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4 mb-4">
        {selectedProject && (
          <RunAuditButton category="cost" gcpProjectId={selectedProject.gcpProjectId} onComplete={fetchAudit} />
        )}
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!raw} className="ml-2">Copy Raw Response</Button>
        {copyMsg && <span className="ml-2 text-emerald-600 text-xs">{copyMsg}</span>}
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Cost Overview</h1>
      <p className="text-muted-foreground mt-1 max-w-2xl">Summary of cost allocation, budgeting, discounts, anomaly detection, and optimization across your GCP environment.</p>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">{/* Add summary cards here */}</div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">{/* Add charts here */}</div>
      {/* Top Recommendations */}
      <div className="bg-card rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Top Recommendations</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Review cost allocation and tagging for all resources.</li>
          <li>Monitor budget alerts and optimize discount utilization.</li>
          <li>Investigate cost anomalies and take corrective actions.</li>
        </ul>
      </div>
      {raw && (
        <pre className="bg-muted/30 rounded p-4 text-xs mt-4 overflow-x-auto max-h-64">{raw}</pre>
      )}
    </div>
  )
} 