"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { BarChart3, AlertTriangle, Server, Database, Cloud } from "lucide-react"
import { useEffect, useState } from "react"
import { useProjectStore } from '@/lib/store'
import { RunAuditButton } from '@/components/RunAuditButton'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'

// Placeholder for fetching audit results
const fetchResourceUtilizationResults = async () => {
  // TODO: Replace with real API call
  return {
    computeEngine: {
      vms: [
        { name: "vm-1", zone: "us-central1-a", cpuUtilization: 0.23, memoryUtilization: 0.45, diskIO: 12345, machineType: "n1-standard-1", status: "RUNNING" },
        { name: "vm-2", zone: "us-central1-b", cpuUtilization: 0.12, memoryUtilization: 0.33, diskIO: 5432, machineType: "n1-standard-2", status: "TERMINATED" },
      ],
      persistentDisks: [
        { name: "disk-1", zone: "us-central1-a", size: 100, diskIO: 2345, status: "READY" },
      ],
      loadBalancers: [
        { name: "lb-1", region: "us-central1", traffic: 123456, status: "ACTIVE" },
      ],
      unusedIPs: [
        { name: "ip-1", region: "us-central1", address: "34.123.45.67" },
      ],
    },
    cloudSQL: {
      instances: [
        { name: "sql-1", region: "us-central1", cpuUtilization: 0.31, memoryUtilization: 0.55, diskUtilization: 0.22, state: "RUNNABLE" },
      ],
    },
    gke: {
      clusters: [
        { name: "gke-cluster-1", location: "us-central1", nodes: [{ name: "node-1", cpuUtilization: 0.21, memoryUtilization: 0.41, nodeCount: 3, status: "READY" }], status: "RUNNING" },
      ],
    },
    recommendations: [
      { category: "Compute", issue: "Underutilized VM", recommendation: "Consider resizing or shutting down VM-2." },
      { category: "Storage", issue: "Unused IP", recommendation: "Release unused IP ip-1 to save costs." },
    ],
  }
}

// Add a type for vm
interface VM {
  status: string;
  // add other properties as needed
}

export default function ResourceUtilizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProject } = useProjectStore();
  const [loading, setLoading] = React.useState(true);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [data, setData] = React.useState<any>(null)
  const [tab, setTab] = React.useState("vms")
  const [raw, setRaw] = React.useState<string | null>(null)
  const [copyMsg, setCopyMsg] = React.useState("")
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.projects) {
          setProjects(data.user.projects);
          const urlProjectId = searchParams.get('project');
          let projectToSelect = null;
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
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  const fetchAudit = async () => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/resource-utilization/summary?projectId=${selectedProject.gcpProjectId}`)
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

  React.useEffect(() => { fetchAudit() }, [selectedProject])

  if (loading) return <div className="p-8">Loading resource utilization...</div>;
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
      <div className="flex items-center gap-4 mb-4">
        {selectedProject && (
          <RunAuditButton category="resource-utilization" gcpProjectId={selectedProject.gcpProjectId} onComplete={fetchAudit} />
        )}
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!raw} className="ml-2">Copy Raw Response</Button>
        {copyMsg && <span className="ml-2 text-emerald-600 text-xs">{copyMsg}</span>}
      </div>
      <div className="flex items-center gap-4 mb-4">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Resource Utilization</h2>
          <p className="text-muted-foreground mt-1">Analyze usage and efficiency of your cloud resources</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>VMs</CardTitle>
            <CardDescription>Total: {data.computeEngine.vms.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.computeEngine.vms.filter((vm: VM) => vm.status === "RUNNING").length} Running</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Persistent Disks</CardTitle>
            <CardDescription>Total: {data.computeEngine.persistentDisks.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.computeEngine.persistentDisks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cloud SQL Instances</CardTitle>
            <CardDescription>Total: {data.cloudSQL.instances.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.cloudSQL.instances.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for resource types */}
      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="vms">VMs</TabsTrigger>
          <TabsTrigger value="disks">Disks</TabsTrigger>
          <TabsTrigger value="sql">Cloud SQL</TabsTrigger>
          <TabsTrigger value="gke">GKE</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="vms">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Name</th>
                    <th className="h-10 px-2 text-left font-medium">Zone</th>
                    <th className="h-10 px-2 text-left font-medium">CPU Utilization</th>
                    <th className="h-10 px-2 text-left font-medium">Memory Utilization</th>
                    <th className="h-10 px-2 text-left font-medium">Disk I/O</th>
                    <th className="h-10 px-2 text-left font-medium">Type</th>
                    <th className="h-10 px-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.computeEngine.vms.map((vm: any) => (
                    <tr key={vm.name} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{vm.name}</td>
                      <td className="px-2 py-3">{vm.zone}</td>
                      <td className="px-2 py-3">{(vm.cpuUtilization * 100).toFixed(1)}%</td>
                      <td className="px-2 py-3">{(vm.memoryUtilization * 100).toFixed(1)}%</td>
                      <td className="px-2 py-3">{vm.diskIO}</td>
                      <td className="px-2 py-3">{vm.machineType}</td>
                      <td className="px-2 py-3">{vm.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="disks">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Name</th>
                    <th className="h-10 px-2 text-left font-medium">Zone</th>
                    <th className="h-10 px-2 text-left font-medium">Size (GB)</th>
                    <th className="h-10 px-2 text-left font-medium">Disk I/O</th>
                    <th className="h-10 px-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.computeEngine.persistentDisks.map((disk: any) => (
                    <tr key={disk.name} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{disk.name}</td>
                      <td className="px-2 py-3">{disk.zone}</td>
                      <td className="px-2 py-3">{disk.size}</td>
                      <td className="px-2 py-3">{disk.diskIO}</td>
                      <td className="px-2 py-3">{disk.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sql">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Name</th>
                    <th className="h-10 px-2 text-left font-medium">Region</th>
                    <th className="h-10 px-2 text-left font-medium">CPU Utilization</th>
                    <th className="h-10 px-2 text-left font-medium">Memory Utilization</th>
                    <th className="h-10 px-2 text-left font-medium">Disk Utilization</th>
                    <th className="h-10 px-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cloudSQL.instances.map((sql: any) => (
                    <tr key={sql.name} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{sql.name}</td>
                      <td className="px-2 py-3">{sql.region}</td>
                      <td className="px-2 py-3">{(sql.cpuUtilization * 100).toFixed(1)}%</td>
                      <td className="px-2 py-3">{(sql.memoryUtilization * 100).toFixed(1)}%</td>
                      <td className="px-2 py-3">{(sql.diskUtilization * 100).toFixed(1)}%</td>
                      <td className="px-2 py-3">{sql.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gke">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Name</th>
                    <th className="h-10 px-2 text-left font-medium">Location</th>
                    <th className="h-10 px-2 text-left font-medium">Node Count</th>
                    <th className="h-10 px-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gke.clusters.map((cluster: any) => (
                    <tr key={cluster.name} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">{cluster.name}</td>
                      <td className="px-2 py-3">{cluster.location}</td>
                      <td className="px-2 py-3">{cluster.nodes.length}</td>
                      <td className="px-2 py-3">{cluster.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2">
                {data.recommendations.map((rec: any, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-1" />
                    <span>
                      <strong>{rec.category}:</strong> {rec.issue} — {rec.recommendation}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {raw && (
        <pre className="bg-muted/30 rounded p-4 text-xs mt-4 overflow-x-auto max-h-64">{raw}</pre>
      )}
    </div>
  )
} 