"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SummaryStatistics } from "@/components/summary-statistics"
import { Shield, Lock, AlertTriangle, CheckCircle, FileCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { useProjectStore } from '@/lib/store'
import { RunAuditButton } from '@/components/RunAuditButton'
import { Button } from "@/components/ui/button"

export default function SecuritySummaryPage() {
  const { selectedProject } = useProjectStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [raw, setRaw] = useState(null)
  const [copyMsg, setCopyMsg] = useState("")

  const fetchAudit = async () => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/security/summary?projectId=${selectedProject.id}`)
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

  if (loading) return <div className="p-8">Loading security summary...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>
  if (!data) return <div className="p-8">No data available.</div>

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4 mb-4">
        {selectedProject && (
          <RunAuditButton category="security" gcpProjectId={selectedProject.gcpProjectId} onComplete={fetchAudit} />
        )}
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!raw} className="ml-2">Copy Raw Response</Button>
        {copyMsg && <span className="ml-2 text-emerald-600 text-xs">{copyMsg}</span>}
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Security Overview</h1>
      <p className="text-muted-foreground mt-1 max-w-2xl">Summary of IAM, service account, org policy, vulnerability, and threat detection findings across your GCP environment.</p>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="premium-card col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary opacity-80" />
              <CardTitle>Security Health Overview</CardTitle>
            </div>
            <CardDescription>Comprehensive security analysis and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Last updated</div>
                <div className="text-sm font-medium">Today at 9:45 AM</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Compliance</div>
                <div className="text-sm font-medium text-emerald-500 font-semibold">89%</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <button className="w-full text-xs font-medium text-primary hover:underline flex items-center justify-center">
                View Details
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Add charts here */}
      </div>
      {/* Top Recommendations */}
      <div className="bg-card rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Top Recommendations</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Enforce least privilege on all IAM roles and service accounts.</li>
          <li>Remediate critical vulnerabilities and review threat findings.</li>
          <li>Regularly audit org policies and security recommendations.</li>
        </ul>
      </div>
      {raw && (
        <pre className="bg-muted/30 rounded p-4 text-xs mt-4 overflow-x-auto max-h-64">{raw}</pre>
      )}
    </div>
  )
} 