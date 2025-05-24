"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Zap } from "lucide-react"
import * as React from "react"
import { useEffect, useState } from "react"
import { useProjectStore } from '@/lib/store'
import { RunAuditButton } from '@/components/RunAuditButton'
import { Button } from '@/components/ui/button'
import { useAuthCheck } from '@/lib/useAuthCheck'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ServerlessAuditLandingPage() {
  useAuthCheck();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProjectByGcpId } = useProjectStore()
  const [raw, setRaw] = React.useState<string | null>(null)
  const [copyMsg, setCopyMsg] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchAudit = async () => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/serverless/summary?projectId=${selectedProject.id}`)
      .then(res => res.json())
      .then(json => setRaw(JSON.stringify(json, null, 2)))
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

  React.useEffect(() => {
    // On mount, sync ?project= param to store
    const urlProject = searchParams.get('project');
    if (urlProject && (!selectedProject || selectedProject.gcpProjectId !== urlProject)) {
      setSelectedProjectByGcpId(urlProject);
    }
  }, []);

  React.useEffect(() => {
    // When project changes, update URL param
    if (selectedProject && searchParams.get('project') !== selectedProject.gcpProjectId) {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set('project', selectedProject.gcpProjectId);
      router.replace(`?${params.toString()}`);
    }
  }, [selectedProject]);

  React.useEffect(() => { fetchAudit() }, [selectedProject])

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
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:underline flex items-center gap-1"><Zap className="h-4 w-4" /> Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-primary">Serverless Audit</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" /> Serverless Audit
      </h1>
      <div className="flex items-center gap-4 mb-4">
        {selectedProject && (
          <RunAuditButton category="serverless" gcpProjectId={selectedProject.gcpProjectId} onComplete={fetchAudit} />
        )}
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!raw} className="ml-2">Copy Raw Response</Button>
        {copyMsg && <span className="ml-2 text-emerald-600 text-xs">{copyMsg}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/serverless/cloud-functions-optimization">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Cloud Functions Resource & Concurrency Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              Analyze memory/CPU allocation and concurrency settings for Cloud Functions in the selected project to optimize cost and performance.
            </CardContent>
          </Card>
        </Link>
        {/* Future serverless audit sub-pages can be added here */}
      </div>
      {raw && (
        <pre className="bg-muted/30 rounded p-4 text-xs mt-4 overflow-x-auto max-h-64">{raw}</pre>
      )}
    </div>
  )
} 