"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { 
  Server, 
  Search, 
  Download, 
  BarChart4, 
  Clock, 
  AlertTriangle,
  ArrowUpDown, 
  Filter, 
  Cpu, 
  CircuitBoard, 
  HardDrive, 
  Gauge, 
  ChevronRight, 
  PlusCircle
} from "lucide-react"

export default function ComputePage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentTab, setCurrentTab] = React.useState("instances")
  
  // Mock data - would come from API in a real application
  const computeResources = {
    instances: [
      { 
        id: "vm-prod-api-01", 
        name: "Production API Server", 
        type: "n2-standard-4", 
        zone: "us-central1-a", 
        status: "running", 
        cpu: 4, 
        memory: "16GB", 
        disk: "100GB", 
        createdAt: "2023-01-10", 
        cpuUsage: 65, 
        memoryUsage: 72,
        recommendations: ["Right-size to n2-standard-2", "Create instance group for HA"]
      },
      { 
        id: "vm-prod-db-01", 
        name: "Database Primary", 
        type: "n2-highmem-8", 
        zone: "us-central1-a", 
        status: "running", 
        cpu: 8, 
        memory: "64GB", 
        disk: "500GB", 
        createdAt: "2023-01-05", 
        cpuUsage: 42, 
        memoryUsage: 85,
        recommendations: []
      },
      { 
        id: "vm-prod-batch-01", 
        name: "Batch Processing Server", 
        type: "n2-highcpu-16", 
        zone: "us-central1-b", 
        status: "running", 
        cpu: 16, 
        memory: "32GB", 
        disk: "200GB", 
        createdAt: "2023-02-15", 
        cpuUsage: 12, 
        memoryUsage: 24,
        recommendations: ["Schedule downtime during off-hours", "Right-size to n2-highcpu-8"]
      },
      { 
        id: "vm-staging-api-01", 
        name: "Staging API Server", 
        type: "n2-standard-2", 
        zone: "us-central1-c", 
        status: "stopped", 
        cpu: 2, 
        memory: "8GB", 
        disk: "50GB", 
        createdAt: "2023-03-01", 
        cpuUsage: 0, 
        memoryUsage: 0,
        recommendations: []
      }
    ],
    functions: [
      {
        id: "func-data-processor",
        name: "Data Processor",
        runtime: "Node.js 16",
        region: "us-central1",
        memory: "256MB",
        timeout: "60s",
        invocations: 12500,
        avgExecutionTime: "1.2s",
        errors: 25,
        lastInvoked: "2 hours ago"
      },
      {
        id: "func-image-resizer",
        name: "Image Resizer",
        runtime: "Python 3.9",
        region: "us-central1",
        memory: "512MB",
        timeout: "120s",
        invocations: 8750,
        avgExecutionTime: "3.1s",
        errors: 12,
        lastInvoked: "45 minutes ago"
      },
      {
        id: "func-auth-validator",
        name: "Auth Validator",
        runtime: "Node.js 14",
        region: "us-east1",
        memory: "128MB",
        timeout: "30s",
        invocations: 56800,
        avgExecutionTime: "0.4s",
        errors: 120,
        lastInvoked: "5 minutes ago"
      }
    ],
    containers: [
      {
        id: "gke-prod-cluster-default",
        name: "Production Cluster",
        version: "1.25.8-gke.500",
        nodes: 5,
        pods: 42,
        location: "us-central1",
        status: "running",
        cpuUsage: 78,
        memoryUsage: 65
      },
      {
        id: "gke-staging-cluster-default",
        name: "Staging Cluster",
        version: "1.25.8-gke.500",
        nodes: 3,
        pods: 21,
        location: "us-central1",
        status: "running",
        cpuUsage: 45,
        memoryUsage: 38
      }
    ]
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30";
      case "stopped":
        return "text-slate-500 bg-slate-100 dark:bg-slate-900/30";
      default:
        return "text-slate-500 bg-slate-100 dark:bg-slate-900/30";
    }
  }
  
  const getUsageColor = (usage: number) => {
    if (usage >= 90) return "text-red-500";
    if (usage >= 75) return "text-amber-500";
    if (usage >= 50) return "text-yellow-500";
    return "text-emerald-500";
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Compute Resources</h2>
          <p className="text-muted-foreground mt-1">Manage and monitor all your compute resources</p>
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
              placeholder="Search resources..."
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

      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle>Resource Management</CardTitle>
          <CardDescription>
            Monitor and manage your compute resources across all environments
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="instances" className="px-4 sm:px-6" onValueChange={setCurrentTab}>
          <div className="overflow-x-auto">
            <TabsList className="w-full justify-start border-b pb-px mb-4">
              <TabsTrigger 
                value="instances" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                VM Instances
              </TabsTrigger>
              <TabsTrigger 
                value="functions" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Cloud Functions
              </TabsTrigger>
              <TabsTrigger 
                value="containers" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Container Services
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="instances" className="m-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Instance Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-2 text-left font-medium">Status</th>
                      <th className="h-10 px-2 text-left font-medium">Type</th>
                      <th className="h-10 px-2 text-left font-medium">Zone</th>
                      <th className="h-10 px-2 text-center font-medium">CPU Usage</th>
                      <th className="h-10 px-2 text-center font-medium">Memory Usage</th>
                      <th className="h-10 px-2 text-left font-medium">Recommendations</th>
                      <th className="h-10 px-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computeResources.instances.map((instance) => (
                      <tr key={instance.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{instance.name}</div>
                            <div className="text-xs text-muted-foreground">{instance.id}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center">
                            <div className={`rounded-full p-1 ${getStatusColor(instance.status)}`}>
                              <div className="h-1.5 w-1.5 rounded-full bg-current" />
                            </div>
                            <span className="ml-2 text-xs capitalize">
                              {instance.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs">{instance.type}</td>
                        <td className="px-2 py-3 text-xs">{instance.zone}</td>
                        <td className="px-2 py-3 text-center">
                          {instance.status === "running" ? (
                            <div className="flex flex-col items-center">
                              <div className="w-full bg-muted/50 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${getUsageColor(instance.cpuUsage)}`} 
                                  style={{ width: `${instance.cpuUsage}%` }}
                                ></div>
                              </div>
                              <span className={`text-xs mt-1 ${getUsageColor(instance.cpuUsage)}`}>
                                {instance.cpuUsage}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          {instance.status === "running" ? (
                            <div className="flex flex-col items-center">
                              <div className="w-full bg-muted/50 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${getUsageColor(instance.memoryUsage)}`} 
                                  style={{ width: `${instance.memoryUsage}%` }}
                                ></div>
                              </div>
                              <span className={`text-xs mt-1 ${getUsageColor(instance.memoryUsage)}`}>
                                {instance.memoryUsage}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          {instance.recommendations.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {instance.recommendations.map((rec, idx) => (
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
          
          <TabsContent value="functions" className="m-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Function Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-2 text-left font-medium">Runtime</th>
                      <th className="h-10 px-2 text-left font-medium">Region</th>
                      <th className="h-10 px-2 text-center font-medium">Invocations</th>
                      <th className="h-10 px-2 text-center font-medium">Avg. Execution</th>
                      <th className="h-10 px-2 text-center font-medium">Errors</th>
                      <th className="h-10 px-2 text-right font-medium">Last Invoked</th>
                      <th className="h-10 px-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computeResources.functions.map((func) => (
                      <tr key={func.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{func.name}</div>
                            <div className="text-xs text-muted-foreground">{func.id}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs">{func.runtime}</td>
                        <td className="px-2 py-3 text-xs">{func.region}</td>
                        <td className="px-2 py-3 text-center text-xs">
                          {func.invocations.toLocaleString()}
                        </td>
                        <td className="px-2 py-3 text-center text-xs">
                          {func.avgExecutionTime}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className={`text-xs ${func.errors > 100 ? 'text-red-500' : func.errors > 50 ? 'text-amber-500' : 'text-slate-500'}`}>
                            {func.errors}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-right text-xs">
                          {func.lastInvoked}
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
          
          <TabsContent value="containers" className="m-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Cluster Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-2 text-left font-medium">Version</th>
                      <th className="h-10 px-2 text-left font-medium">Location</th>
                      <th className="h-10 px-2 text-center font-medium">Nodes</th>
                      <th className="h-10 px-2 text-center font-medium">Pods</th>
                      <th className="h-10 px-2 text-center font-medium">CPU Usage</th>
                      <th className="h-10 px-2 text-center font-medium">Memory Usage</th>
                      <th className="h-10 px-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computeResources.containers.map((container) => (
                      <tr key={container.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{container.name}</div>
                            <div className="text-xs text-muted-foreground">{container.id}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs">{container.version}</td>
                        <td className="px-2 py-3 text-xs">{container.location}</td>
                        <td className="px-2 py-3 text-center text-xs">
                          {container.nodes}
                        </td>
                        <td className="px-2 py-3 text-center text-xs">
                          {container.pods}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-full bg-muted/50 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${getUsageColor(container.cpuUsage)}`} 
                                style={{ width: `${container.cpuUsage}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs mt-1 ${getUsageColor(container.cpuUsage)}`}>
                              {container.cpuUsage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-full bg-muted/50 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${getUsageColor(container.memoryUsage)}`} 
                                style={{ width: `${container.memoryUsage}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs mt-1 ${getUsageColor(container.memoryUsage)}`}>
                              {container.memoryUsage}%
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
        </Tabs>
        
        <CardFooter className="border-t px-6 py-4">
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-muted-foreground">
              Showing {
                currentTab === "instances" ? computeResources.instances.length :
                currentTab === "functions" ? computeResources.functions.length :
                computeResources.containers.length
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
              <CardTitle>Resource Utilization</CardTitle>
            </div>
            <CardDescription>
              Current utilization across compute resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">CPU Utilization</span>
                  </div>
                  <span className="text-sm font-medium">68%</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-amber-500 rounded-full" style={{ width: "68%" }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>120 vCPUs total</span>
                  <span>82 vCPUs used</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CircuitBoard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory Utilization</span>
                  </div>
                  <span className="text-sm font-medium">72%</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-amber-500 rounded-full" style={{ width: "72%" }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>512GB total</span>
                  <span>368GB used</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Disk Utilization</span>
                  </div>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-emerald-500 rounded-full" style={{ width: "45%" }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2TB total</span>
                  <span>900GB used</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Gauge className="h-5 w-5 text-primary" />
              <CardTitle>Performance Metrics</CardTitle>
            </div>
            <CardDescription>
              Recent performance metrics and SLA tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Average CPU Load</div>
                  <div className="text-2xl font-bold">3.2</div>
                  <div className="text-xs text-muted-foreground mt-1">Last 24 hours</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Response Time</div>
                  <div className="text-2xl font-bold">124ms</div>
                  <div className="text-xs text-muted-foreground mt-1">Avg. API response</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Function Errors</div>
                  <div className="text-2xl font-bold text-amber-500">156</div>
                  <div className="text-xs text-muted-foreground mt-1">Last 24 hours</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Uptime</div>
                  <div className="text-2xl font-bold text-emerald-500">99.98%</div>
                  <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="text-sm font-medium mb-3">Recent Incidents</div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-sm">High CPU utilization on Production API Server</div>
                      <div className="text-xs text-muted-foreground">2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <div className="text-sm">Auth Validator function experiencing elevated error rate</div>
                      <div className="text-xs text-muted-foreground">5 hours ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 