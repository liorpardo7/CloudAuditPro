"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { useProjectStore } from '@/lib/store'
import { RunAuditButton } from '@/components/RunAuditButton'
import { Button } from '@/components/ui/button'

export default function ComplianceSummaryPage() {
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
    fetch(`/api/compliance/summary?projectId=${selectedProject.id}`)
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

  if (loading) return <div className="p-8">Loading compliance summary...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>
  if (!data) return <div className="p-8">No data available.</div>

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4 mb-4">
        {selectedProject && (
          <RunAuditButton category="compliance" gcpProjectId={selectedProject.gcpProjectId} onComplete={fetchAudit} />
        )}
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!raw} className="ml-2">Copy Raw Response</Button>
        {copyMsg && <span className="ml-2 text-emerald-600 text-xs">{copyMsg}</span>}
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Compliance Overview</h1>
      <p className="text-muted-foreground mt-1 max-w-2xl">Summary of GDPR, HIPAA, PCI, SOC2, audit logs, privacy, consent, and data access compliance across your GCP environment.</p>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">{/* Add summary cards here */}</div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">{/* Add charts here */}</div>
      {/* Top Recommendations */}
      <div className="bg-card rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Top Recommendations</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Review compliance status for all major frameworks (GDPR, HIPAA, PCI, SOC2).</li>
          <li>Monitor audit logs and data access for anomalies.</li>
          <li>Ensure privacy and consent management is up to date.</li>
        </ul>
      </div>
      {raw && (
        <pre className="bg-muted/30 rounded p-4 text-xs mt-4 overflow-x-auto max-h-64">{raw}</pre>
      )}
    </div>
  )
} 