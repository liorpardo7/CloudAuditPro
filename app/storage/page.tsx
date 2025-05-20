"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { 
  Database, 
  Search, 
  Download, 
  AlertTriangle,
  ArrowUpDown, 
  Filter, 
  HardDrive, 
  BarChart4,
  PieChart,
  ChevronRight,
  Clock,
  PlusCircle,
  Lock,
  FileText,
  Shield
} from "lucide-react"
import { useEffect, useState } from "react"
import { useProjectStore } from '@/lib/store'
import { RunAuditButton } from '@/components/RunAuditButton'

export default function StoragePage() {
  const { selectedProject } = useProjectStore()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentTab, setCurrentTab] = React.useState("buckets")
  const [raw, setRaw] = React.useState<string | null>(null)
  const [copyMsg, setCopyMsg] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Mock data - would come from API in a real application
  const storageResources = {
    buckets: [
      { 
        id: "bucket-prod-data-01", 
        name: "Production Data Store", 
        type: "Standard", 
        region: "us-central1", 
        status: "active", 
        size: "532GB", 
        objects: 75320,
        access: "private",
        lifecycle: true,
        versioning: true,
        createdAt: "2023-01-10", 
        lastAccessed: "2h ago",
        recommendations: ["Enable object lifecycle management"]
      },
      { 
        id: "bucket-prod-assets", 
        name: "Web Assets", 
        type: "Standard", 
        region: "us-multi-region", 
        status: "active", 
        size: "156GB", 
        objects: 42156,
        access: "public-read",
        lifecycle: true,
        versioning: false,
        createdAt: "2023-02-15", 
        lastAccessed: "15m ago",
        recommendations: ["Consider CDN for improved performance", "Review public access settings"]
      },
      { 
        id: "bucket-backups", 
        name: "System Backups", 
        type: "Nearline", 
        region: "us-central1", 
        status: "active", 
        size: "1.24TB", 
        objects: 1254,
        access: "private",
        lifecycle: true,
        versioning: true,
        createdAt: "2022-11-05", 
        lastAccessed: "7d ago",
        recommendations: []
      },
      { 
        id: "bucket-logs", 
        name: "Application Logs", 
        type: "Coldline", 
        region: "us-central1", 
        status: "active", 
        size: "758GB", 
        objects: 125478,
        access: "private",
        lifecycle: false,
        versioning: false,
        createdAt: "2022-10-01", 
        lastAccessed: "2d ago",
        recommendations: ["Enable lifecycle rules to archive older logs"]
      }
    ],
    disks: [
      {
        id: "disk-prod-api-01",
        name: "API Server Boot Disk",
        size: "100GB",
        type: "SSD",
        zone: "us-central1-a",
        status: "in-use",
        attachedTo: "vm-prod-api-01",
        encrypted: true,
        snapshot: "3 days ago"
      },
      {
        id: "disk-prod-db-01",
        name: "Database Data Disk",
        size: "500GB",
        type: "SSD",
        zone: "us-central1-a",
        status: "in-use",
        attachedTo: "vm-prod-db-01",
        encrypted: true,
        snapshot: "1 day ago"
      },
      {
        id: "disk-staging-01",
        name: "Staging Server Disk",
        size: "50GB",
        type: "Standard",
        zone: "us-central1-c",
        status: "in-use",
        attachedTo: "vm-staging-api-01",
        encrypted: true,
        snapshot: "7 days ago"
      }
    ]
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "in-use":
        return "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30";
      case "suspended":
        return "text-amber-500 bg-amber-100 dark:bg-amber-900/30";
      default:
        return "text-slate-500 bg-slate-100 dark:bg-slate-900/30";
    }
  }
  
  const getAccessColor = (access: string) => {
    switch (access) {
      case "public-read":
        return "text-amber-500";
      case "private":
        return "text-emerald-500";
      default:
        return "text-slate-500";
    }
  }

  const fetchAudit = async () => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/storage/summary?projectId=${selectedProject.id}`)
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
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Storage</h2>
          <p className="text-muted-foreground mt-1">Manage cloud storage resources and optimize usage</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="h-9 flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Link href="/audit">
            <Button className="h-9 flex items-center gap-1.5">
              <PlusCircle className="h-4 w-4" />
              <span>New Audit</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex w-full sm:w-auto space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search storage resources..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        {selectedProject && (
          <RunAuditButton category="storage" projectId={selectedProject.id} onComplete={fetchAudit} />
        )}
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!raw} className="ml-2">Copy Raw Response</Button>
        {copyMsg && <span className="ml-2 text-emerald-600 text-xs">{copyMsg}</span>}
      </div>

      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle>Storage Resources</CardTitle>
          <CardDescription>
            Manage your storage resources across all environments
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="buckets" className="px-4 sm:px-6" onValueChange={setCurrentTab}>
          <div className="overflow-x-auto">
            <TabsList className="w-full justify-start border-b pb-px mb-4">
              <TabsTrigger 
                value="buckets" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Storage Buckets
              </TabsTrigger>
              <TabsTrigger 
                value="disks" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Persistent Disks
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="buckets" className="m-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Bucket Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-2 text-left font-medium">Region</th>
                      <th className="h-10 px-2 text-left font-medium">Type</th>
                      <th className="h-10 px-2 text-left font-medium">Access</th>
                      <th className="h-10 px-2 text-right font-medium">Size</th>
                      <th className="h-10 px-2 text-right font-medium">Objects</th>
                      <th className="h-10 px-2 text-left font-medium">Recommendations</th>
                      <th className="h-10 px-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storageResources.buckets.map((bucket) => (
                      <tr key={bucket.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{bucket.name}</div>
                            <div className="text-xs text-muted-foreground">{bucket.id}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs">{bucket.region}</td>
                        <td className="px-2 py-3 text-xs">{bucket.type}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-center">
                            <div className={`rounded-full p-1 ${getAccessColor(bucket.access) === "text-emerald-500" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                              {bucket.access === "private" ? (
                                <Lock className={`h-3.5 w-3.5 ${getAccessColor(bucket.access)}`} />
                              ) : (
                                <Shield className={`h-3.5 w-3.5 ${getAccessColor(bucket.access)}`} />
                              )}
                            </div>
                            <span className={`ml-2 text-xs ${getAccessColor(bucket.access)}`}>
                              {bucket.access === "private" ? "Private" : "Public"}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right text-xs">{bucket.size}</td>
                        <td className="px-2 py-3 text-right text-xs">{bucket.objects.toLocaleString()}</td>
                        <td className="px-2 py-3">
                          {bucket.recommendations.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {bucket.recommendations.map((rec, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  <span className="text-xs">{rec}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No recommendations</span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                            Details
                            <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="disks" className="m-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Disk Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-2 text-left font-medium">Size</th>
                      <th className="h-10 px-2 text-left font-medium">Type</th>
                      <th className="h-10 px-2 text-left font-medium">Zone</th>
                      <th className="h-10 px-2 text-left font-medium">Status</th>
                      <th className="h-10 px-2 text-left font-medium">Attached To</th>
                      <th className="h-10 px-2 text-left font-medium">Last Snapshot</th>
                      <th className="h-10 px-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storageResources.disks.map((disk) => (
                      <tr key={disk.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{disk.name}</div>
                            <div className="text-xs text-muted-foreground">{disk.id}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs">{disk.size}</td>
                        <td className="px-2 py-3 text-xs">{disk.type}</td>
                        <td className="px-2 py-3 text-xs">{disk.zone}</td>
                        <td className="px-2 py-3">
                          <div className="flex items-center">
                            <div className={`rounded-full p-1 ${getStatusColor(disk.status)}`}>
                              <div className="h-1.5 w-1.5 rounded-full bg-current" />
                            </div>
                            <span className="ml-2 text-xs capitalize">
                              {disk.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs">{disk.attachedTo}</td>
                        <td className="px-2 py-3 text-xs">
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                            {disk.snapshot}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                            Details
                            <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="border-t px-6 py-4">
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-muted-foreground">
              Showing {
                currentTab === "buckets" ? storageResources.buckets.length :
                storageResources.disks.length
              } entries
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart4 className="h-5 w-5 text-primary" />
              <CardTitle>Storage Utilization</CardTitle>
            </div>
            <CardDescription>
              Storage usage and growth trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Storage</span>
                  </div>
                  <span className="text-sm font-medium">2.65TB</span>
                </div>
                <div className="grid grid-cols-6 gap-1 h-8">
                  <div className="bg-blue-500 rounded-l-md flex items-center justify-center">
                    <span className="text-xs text-white font-medium">Std</span>
                  </div>
                  <div className="bg-blue-500/80 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">Std</span>
                  </div>
                  <div className="bg-blue-400 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">Std</span>
                  </div>
                  <div className="bg-blue-300 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">NL</span>
                  </div>
                  <div className="bg-blue-200 flex items-center justify-center">
                    <span className="text-xs text-blue-800 font-medium">CL</span>
                  </div>
                  <div className="bg-muted/30 rounded-r-md"></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Used: 2.65TB</span>
                  <span>Free tier: 5GB</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Disk Distribution</span>
                  </div>
                </div>
                <div className="flex items-center justify-center py-4">
                  <div className="h-32 w-32 rounded-full border-8 border-emerald-500 relative flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-amber-400 flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-xs text-white font-medium">SSD</span>
                      </div>
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-background px-2 py-0.5 rounded text-xs">SSD</div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white dark:bg-background px-2 py-0.5 rounded text-xs">Std</div>
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-background px-2 py-0.5 rounded text-xs">NVMe</div>
                  </div>
                </div>
                <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full mr-1"></div>
                    <span>Persistent: 65%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-amber-400 rounded-full mr-1"></div>
                    <span>Local: 25%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-1"></div>
                    <span>SSD: 10%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Storage Optimization</CardTitle>
            </div>
            <CardDescription>
              Recommendations and usage metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-sm font-medium mb-1">Estimated Cost</div>
                <div className="text-2xl font-bold">$256.45</div>
                <div className="text-xs text-muted-foreground">Last 30 days</div>
                <div className="mt-2 text-xs flex items-center text-amber-500">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                  <span>15% increase from previous month</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm font-medium mb-1">Optimization Opportunities</div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2 p-2 rounded border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Web Assets bucket has public access</div>
                      <div className="text-xs">Review access permissions and consider using Cloud CDN</div>
                      <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">
                        Fix Now
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 p-2 rounded border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Logs bucket missing lifecycle rules</div>
                      <div className="text-xs">Configure lifecycle rules to automatically archive old logs and save on storage costs</div>
                      <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">
                        Configure
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 p-2 rounded border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                    <Database className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">System Backups bucket optimized</div>
                      <div className="text-xs">Current configuration is optimal for your usage patterns</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link href="/storage/persistent-disk-optimization">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Persistent Disk Type & Snapshot Cost-Effectiveness</CardTitle>
            </CardHeader>
            <CardContent>
              Analyze persistent disk types and snapshot usage for the selected project to optimize storage costs and performance.
            </CardContent>
          </Card>
        </Link>
        <Link href="/storage/filestore-optimization">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Filestore Instance Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              Analyze Filestore instance usage and configuration for the selected project to optimize storage costs and performance.
            </CardContent>
          </Card>
        </Link>
      </div>

      {raw && (
        <pre className="bg-muted/30 rounded p-4 text-xs mt-4 overflow-x-auto max-h-64">{raw}</pre>
      )}
    </div>
  )
}

export function StorageSummaryPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch("/api/storage/summary")
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading storage summary...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>
  if (!data) return <div className="p-8">No data available.</div>

  // ... render summary cards, charts, and recommendations using 'data' ...
}