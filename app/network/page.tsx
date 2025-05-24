"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { 
  Network, 
  Search, 
  Download, 
  AlertTriangle,
  ArrowUpDown, 
  Filter, 
  Globe,
  Shield,
  BarChart4,
  ChevronRight,
  LucideActivity,
  PlusCircle,
  Shuffle,
  Lock,
  FileText,
  Layers,
  PlayCircle
} from "lucide-react"
import { useEffect, useState } from "react"
import { useProjectStore } from '@/lib/store'
import { RunAuditButton } from '@/components/RunAuditButton'
import { useAuthCheck } from '@/lib/useAuthCheck'
import { useRouter, useSearchParams } from 'next/navigation'

export default function NetworkPage() {
  useAuthCheck();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProjectByGcpId } = useProjectStore();
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentTab, setCurrentTab] = React.useState("vpcs")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [raw, setRaw] = React.useState<string | null>(null)
  const [copyMsg, setCopyMsg] = React.useState("")
  
  const fetchAudit = async () => {
    if (!selectedProject) return
    setLoading(true)
    setError(null)
    fetch(`/api/network/summary?projectId=${selectedProject.id}`)
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
    setLoading(true)
    fetch("/api/network/summary")
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { fetchAudit() }, [selectedProject])

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

  // Mock data - would come from API in a real application
  const networkResources = {
    vpcs: [
      { 
        id: "vpc-prod-01", 
        name: "Production VPC", 
        region: "us-central1",
        cidr: "10.0.0.0/16",
        subnets: 12,
        firewallRules: 24,
        routes: 18,
        createdAt: "2023-01-10", 
        status: "active",
        peered: ["vpc-dev-01"],
        recommendations: []
      },
      { 
        id: "vpc-dev-01", 
        name: "Development VPC", 
        region: "us-central1",
        cidr: "10.1.0.0/16",
        subnets: 6,
        firewallRules: 18,
        routes: 8,
        createdAt: "2023-02-05", 
        status: "active",
        peered: ["vpc-prod-01"],
        recommendations: ["Consolidate similar firewall rules"]
      },
      { 
        id: "vpc-staging-01", 
        name: "Staging VPC", 
        region: "us-central1",
        cidr: "10.2.0.0/16",
        subnets: 4,
        firewallRules: 12,
        routes: 6,
        createdAt: "2023-02-15", 
        status: "active",
        peered: [],
        recommendations: []
      }
    ],
    firewalls: [
      {
        id: "fw-prod-allow-ssh",
        name: "Allow SSH",
        vpc: "vpc-prod-01",
        direction: "ingress",
        priority: 1000,
        sourceRanges: ["35.235.240.0/20"],
        protocol: "tcp",
        ports: ["22"],
        action: "allow",
        status: "active",
        lastUpdated: "2023-02-14"
      },
      {
        id: "fw-prod-allow-http",
        name: "Allow HTTP",
        vpc: "vpc-prod-01",
        direction: "ingress",
        priority: 1000,
        sourceRanges: ["0.0.0.0/0"],
        protocol: "tcp",
        ports: ["80", "443"],
        action: "allow",
        status: "active",
        lastUpdated: "2023-02-14"
      },
      {
        id: "fw-prod-deny-all",
        name: "Deny All Traffic",
        vpc: "vpc-prod-01",
        direction: "ingress",
        priority: 65535,
        sourceRanges: ["0.0.0.0/0"],
        protocol: "all",
        ports: [],
        action: "deny",
        status: "active",
        lastUpdated: "2023-02-14"
      },
      {
        id: "fw-dev-allow-all-internal",
        name: "Allow Internal Traffic",
        vpc: "vpc-dev-01",
        direction: "ingress",
        priority: 1000,
        sourceRanges: ["10.1.0.0/16"],
        protocol: "all",
        ports: [],
        action: "allow",
        status: "active",
        lastUpdated: "2023-02-15"
      }
    ],
    loadBalancers: [
      {
        id: "lb-prod-frontend",
        name: "Production Frontend",
        type: "global",
        scheme: "external",
        ipAddress: "34.120.45.67",
        backends: 4,
        status: "active",
        ssl: true,
        trafficLastDay: "1.24TB",
        recommendedChanges: []
      },
      {
        id: "lb-prod-api",
        name: "Production API",
        type: "regional",
        scheme: "external",
        ipAddress: "34.120.45.68",
        backends: 6,
        status: "active",
        ssl: true,
        trafficLastDay: "745GB",
        recommendedChanges: ["Enable Cloud CDN for improved performance"]
      },
      {
        id: "lb-staging-frontend",
        name: "Staging Frontend",
        type: "regional",
        scheme: "external",
        ipAddress: "34.120.45.69",
        backends: 2,
        status: "active",
        ssl: false,
        trafficLastDay: "125GB",
        recommendedChanges: ["Enable SSL for secure connections"]
      }
    ]
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30";
      case "pending":
        return "text-amber-500 bg-amber-100 dark:bg-amber-900/30";
      case "error":
        return "text-red-500 bg-red-100 dark:bg-red-900/30";
      default:
        return "text-slate-500 bg-slate-100 dark:bg-slate-900/30";
    }
  }
  
  const getActionColor = (action: string) => {
    switch (action) {
      case "allow":
        return "text-emerald-500";
      case "deny":
        return "text-red-500";
      default:
        return "text-slate-500";
    }
  }

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-2xl font-bold">Connect your Google Project</h2>
        <p className="text-muted-foreground">To use CloudAuditPro, please connect your Google project.</p>
        <Button onClick={() => window.location.href = '/api/auth/google'}>Connect Project</Button>
      </div>
    );
  }

  if (loading) return <div className="p-8">Loading network summary...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>
  if (!data) return <div className="p-8">No data available.</div>

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Network</h2>
          <p className="text-muted-foreground mt-1">Manage cloud network infrastructure and security</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="h-9 flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Link href="/admin/audit-inventory">
            <Button className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700">
              <PlayCircle className="h-4 w-4" />
              <span>Run Comprehensive Audit</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex w-full sm:w-auto space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search network resources..."
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
          <RunAuditButton category="network" gcpProjectId={selectedProject.gcpProjectId} onComplete={fetchAudit} />
        )}
        <Button variant="outline" size="sm" onClick={handleCopy} disabled={!raw} className="ml-2">Copy Raw Response</Button>
        {copyMsg && <span className="ml-2 text-emerald-600 text-xs">{copyMsg}</span>}
      </div>

      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle>Network Infrastructure</CardTitle>
          <CardDescription>
            Manage your network resources across all environments
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="vpcs" className="px-4 sm:px-6" onValueChange={setCurrentTab}>
          <div className="overflow-x-auto">
            <TabsList className="w-full justify-start border-b pb-px mb-4">
              <TabsTrigger 
                value="vpcs" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                VPC Networks
              </TabsTrigger>
              <TabsTrigger 
                value="firewalls" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Firewall Rules
              </TabsTrigger>
              <TabsTrigger 
                value="loadbalancers" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Load Balancers
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="vpcs" className="m-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>VPC Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-2 text-left font-medium">Region</th>
                      <th className="h-10 px-2 text-left font-medium">CIDR Range</th>
                      <th className="h-10 px-2 text-center font-medium">Subnets</th>
                      <th className="h-10 px-2 text-center font-medium">Firewall Rules</th>
                      <th className="h-10 px-2 text-left font-medium">Peered With</th>
                      <th className="h-10 px-2 text-left font-medium">Status</th>
                      <th className="h-10 px-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkResources.vpcs.map((vpc) => (
                      <tr key={vpc.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{vpc.name}</div>
                            <div className="text-xs text-muted-foreground">{vpc.id}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs">{vpc.region}</td>
                        <td className="px-2 py-3 text-xs">{vpc.cidr}</td>
                        <td className="px-2 py-3 text-center text-xs">{vpc.subnets}</td>
                        <td className="px-2 py-3 text-center text-xs">{vpc.firewallRules}</td>
                        <td className="px-2 py-3 text-xs">
                          {vpc.peered.length > 0 ? (
                            <div className="flex items-center space-x-1">
                              <Shuffle className="h-3 w-3 text-blue-500" />
                              <span>{vpc.peered.length} VPC(s)</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center">
                            <div className={`rounded-full p-1 ${getStatusColor(vpc.status)}`}>
                              <div className="h-1.5 w-1.5 rounded-full bg-current" />
                            </div>
                            <span className="ml-2 text-xs capitalize">
                              {vpc.status}
                            </span>
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
          
          <TabsContent value="firewalls" className="m-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Firewall Rule</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-2 text-left font-medium">VPC</th>
                      <th className="h-10 px-2 text-left font-medium">Direction</th>
                      <th className="h-10 px-2 text-left font-medium">Source Ranges</th>
                      <th className="h-10 px-2 text-left font-medium">Protocol</th>
                      <th className="h-10 px-2 text-left font-medium">Ports</th>
                      <th className="h-10 px-2 text-left font-medium">Action</th>
                      <th className="h-10 px-2 text-right font-medium">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkResources.firewalls.map((fw) => (
                      <tr key={fw.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{fw.name}</div>
                            <div className="text-xs text-muted-foreground">{fw.id}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs">{fw.vpc}</td>
                        <td className="px-2 py-3 text-xs capitalize">{fw.direction}</td>
                        <td className="px-2 py-3 text-xs">
                          {fw.sourceRanges.map((range, idx) => (
                            <div key={idx}>{range}</div>
                          ))}
                        </td>
                        <td className="px-2 py-3 text-xs">{fw.protocol}</td>
                        <td className="px-2 py-3 text-xs">
                          {fw.ports.length > 0 ? fw.ports.join(", ") : "All"}
                        </td>
                        <td className="px-2 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            getActionColor(fw.action) === "text-emerald-500" 
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {fw.action}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-right text-xs">{fw.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="loadbalancers" className="m-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Load Balancer</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-2 text-left font-medium">Type</th>
                      <th className="h-10 px-2 text-left font-medium">Scheme</th>
                      <th className="h-10 px-2 text-left font-medium">IP Address</th>
                      <th className="h-10 px-2 text-center font-medium">Backends</th>
                      <th className="h-10 px-2 text-center font-medium">SSL</th>
                      <th className="h-10 px-2 text-left font-medium">Traffic (24h)</th>
                      <th className="h-10 px-2 text-left font-medium">Recommendations</th>
                      <th className="h-10 px-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkResources.loadBalancers.map((lb) => (
                      <tr key={lb.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{lb.name}</div>
                            <div className="text-xs text-muted-foreground">{lb.id}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs capitalize">{lb.type}</td>
                        <td className="px-2 py-3 text-xs capitalize">{lb.scheme}</td>
                        <td className="px-2 py-3 text-xs">{lb.ipAddress}</td>
                        <td className="px-2 py-3 text-center text-xs">{lb.backends}</td>
                        <td className="px-2 py-3 text-center">
                          {lb.ssl ? (
                            <div className="flex items-center justify-center">
                              <Lock className="h-3.5 w-3.5 text-emerald-500" />
                            </div>
                          ) : (
                            <span className="text-xs text-amber-500">No</span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-xs">{lb.trafficLastDay}</td>
                        <td className="px-2 py-3">
                          {lb.recommendedChanges.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {lb.recommendedChanges.map((rec, idx) => (
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
        </Tabs>
        
        <CardFooter className="border-t px-6 py-4">
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-muted-foreground">
              Showing {
                currentTab === "vpcs" ? networkResources.vpcs.length :
                currentTab === "firewalls" ? networkResources.firewalls.length :
                networkResources.loadBalancers.length
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
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Network Topology</CardTitle>
            </div>
            <CardDescription>
              Current network architecture and connectivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-80 border rounded-md bg-muted/20 flex items-center justify-center">
              <div className="space-y-2 text-center">
                <Globe className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">Interactive network topology visualization</p>
                <Button variant="outline" size="sm">View Full Topology</Button>
              </div>
              
              {/* In a real application, this would be an interactive network diagram */}
              <div className="absolute bottom-4 right-4 flex space-x-3 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                  <span>VPC</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                  <span>Subnet</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-1"></div>
                  <span>Load Balancer</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Security Recommendations</CardTitle>
            </div>
            <CardDescription>
              Network security optimization suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Security Score</div>
                  <div className="text-lg font-bold">78<span className="text-xs font-normal text-muted-foreground">/100</span></div>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full">
                  <div className="h-2 bg-amber-500 rounded-full" style={{ width: "78%" }}></div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Last updated: 2 hours ago</div>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm font-medium">Critical Findings</div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2 p-2 rounded border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Overly permissive HTTP access</div>
                      <div className="text-xs">Firewall rule 'Allow HTTP' allows access from any IP (0.0.0.0/0)</div>
                      <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">
                        Review & Fix
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 p-2 rounded border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Missing SSL configuration</div>
                      <div className="text-xs">Load balancer 'Staging Frontend' has SSL disabled</div>
                      <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">
                        Add SSL Certificate
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 p-2 rounded border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Redundant firewall rules</div>
                      <div className="text-xs">Development VPC has multiple overlapping firewall rules</div>
                      <Button variant="outline" size="sm" className="mt-2 h-7 text-xs">
                        Consolidate Rules
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link href="/network/service-tier-analysis">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Network Service Tier Analysis (Egress Costs)</CardTitle>
            </CardHeader>
            <CardContent>
              Analyze network service tier usage and egress costs for the selected project to optimize network spend.
            </CardContent>
          </Card>
        </Link>
        <Link href="/network/nat-efficiency">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Cloud NAT Gateway Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              Analyze Cloud NAT gateway usage and configuration for the selected project to optimize cost and performance.
            </CardContent>
          </Card>
        </Link>
        <Link href="/network/inter-region-traffic">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Inter-Region/Zone Traffic Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              Analyze inter-region and inter-zone network traffic for the selected project to identify cost optimization opportunities.
            </CardContent>
          </Card>
        </Link>
        <Link href="/network/cdn-egress-optimization">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Cloud CDN for Egress Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              Identify workloads serving cacheable static content and optimize egress costs using Cloud CDN for the selected project.
            </CardContent>
          </Card>
        </Link>
        <Link href="/network/dormant-projects">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Dormant/Unused Projects Review</CardTitle>
            </CardHeader>
            <CardContent>
              Identify projects with no significant activity or billing changes to optimize your GCP environment.
            </CardContent>
          </Card>
        </Link>
        <Link href="/network/cud-sud-coverage">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Holistic CUD/SUD Coverage Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              Systematically check CUD/SUD eligibility for all applicable services and optimize discount coverage.
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