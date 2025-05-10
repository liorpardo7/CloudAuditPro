"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SummaryStatistics } from "@/components/summary-statistics"
import { ResourceMetrics } from "@/components/resource-metrics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  ArrowLeft,
  BarChart,
  Server,
  Database,
  Network,
  Shield,
  Coins,
  Info,
  HelpCircle,
  ChevronRight,
  CircleAlert,
  Settings,
  LucideIcon
} from "lucide-react"

interface Finding {
  id: string
  service: string
  resourceId: string
  severity: "critical" | "high" | "medium" | "low" | "info"
  title: string
  description: string
  recommendation: string
  category: string
}

interface AuditDetailsData {
  id: string
  name: string
  status: "running" | "completed" | "error" | "cancelled" | "scheduled"
  startedAt: string
  completedAt: string
  resourcesScanned: number
  findingsCount: {
    total: number
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  services: {
    name: string
    resourcesScanned: number
    findings: number
    status: string
    icon: LucideIcon
  }[]
  findings: Finding[]
}

export default function AuditDetailsPage() {
  const params = useParams()
  const auditId = params.id as string
  
  // Mock data - in a real app this would be fetched from an API
  const auditData: AuditDetailsData = {
    id: auditId,
    name: "Weekly Production Infrastructure Audit",
    status: "completed",
    startedAt: "2023-02-20 09:23:11",
    completedAt: "2023-02-20 09:35:43",
    resourcesScanned: 523,
    findingsCount: {
      total: 12,
      critical: 1,
      high: 3,
      medium: 5,
      low: 2,
      info: 1
    },
    services: [
      {
        name: "Compute",
        resourcesScanned: 154,
        findings: 4,
        status: "Complete",
        icon: Server
      },
      {
        name: "Storage",
        resourcesScanned: 87,
        findings: 5,
        status: "Complete",
        icon: Database
      },
      {
        name: "Network",
        resourcesScanned: 42,
        findings: 1,
        status: "Complete",
        icon: Network
      },
      {
        name: "Security",
        resourcesScanned: 156,
        findings: 2,
        status: "Complete",
        icon: Shield
      },
      {
        name: "Cost",
        resourcesScanned: 84,
        findings: 0,
        status: "Complete",
        icon: Coins
      }
    ],
    findings: [
      {
        id: "F-1",
        service: "Storage",
        resourceId: "bucket-prod-data-01",
        severity: "critical",
        title: "Public access enabled on sensitive data bucket",
        description: "Storage bucket containing sensitive data has public access enabled which violates security policy.",
        recommendation: "Disable public access on the bucket and implement appropriate access controls.",
        category: "Security"
      },
      {
        id: "F-2",
        service: "Compute",
        resourceId: "vm-api-prod-01",
        severity: "high",
        title: "Unpatched critical vulnerability",
        description: "VM instance is running an operating system version with known critical vulnerabilities.",
        recommendation: "Apply the latest security patches and update the OS to the latest version.",
        category: "Security"
      },
      {
        id: "F-3",
        service: "Compute",
        resourceId: "vm-batch-01",
        severity: "medium",
        title: "VM instance over-provisioned",
        description: "VM instance has been allocated excessive resources compared to actual usage patterns.",
        recommendation: "Downsize the VM to an appropriate instance type based on actual resource utilization.",
        category: "Cost"
      },
      {
        id: "F-4",
        service: "Network",
        resourceId: "fw-prod-01",
        severity: "high",
        title: "Overly permissive inbound firewall rule",
        description: "Firewall rule allows unrestricted access on port 22 from any source IP address.",
        recommendation: "Restrict SSH access to specific trusted IP ranges only.",
        category: "Security"
      },
      {
        id: "F-5",
        service: "Storage",
        resourceId: "bucket-logs-01",
        severity: "medium",
        title: "Logging bucket without lifecycle policy",
        description: "Log storage bucket does not have a lifecycle policy to manage older logs.",
        recommendation: "Implement a lifecycle policy to archive logs older than 30 days and delete logs older than 1 year.",
        category: "Cost"
      }
    ]
  }
  
  const severityConfig = {
    critical: { 
      icon: AlertCircle, 
      color: "text-red-500", 
      bgColor: "bg-red-100 dark:bg-red-900/30",
      label: "Critical" 
    },
    high: { 
      icon: CircleAlert, 
      color: "text-amber-500", 
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      label: "High" 
    },
    medium: { 
      icon: Info, 
      color: "text-yellow-500", 
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      label: "Medium" 
    },
    low: { 
      icon: Info, 
      color: "text-blue-500", 
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      label: "Low" 
    },
    info: { 
      icon: HelpCircle, 
      color: "text-slate-500", 
      bgColor: "bg-slate-100 dark:bg-slate-800",
      label: "Info" 
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/audits" className="text-muted-foreground hover:text-foreground transition-colors">
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Audits
              </Button>
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">Audit Details</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mt-2">{auditData.name}</h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground">ID: {auditData.id}</p>
            <div className="flex items-center">
              <div className="rounded-full p-1 bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <span className="ml-1.5 text-sm">Completed</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button className="flex items-center space-x-2" variant="outline">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 premium-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary opacity-80" />
              Audit Summary
            </CardTitle>
            <CardDescription>
              Overview of audit results and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Started</div>
                <div className="font-medium">
                  {new Date(auditData.startedAt).toLocaleString(undefined, {
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Completed</div>
                <div className="font-medium">
                  {new Date(auditData.completedAt).toLocaleString(undefined, {
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Resources Scanned</div>
                <div className="font-medium">{auditData.resourcesScanned}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total Findings</div>
                <div className="font-medium">{auditData.findingsCount.total}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium">Findings by Severity</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs">Critical</span>
                  </div>
                  <span className="text-xs font-medium">{auditData.findingsCount.critical}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-xs">High</span>
                  </div>
                  <span className="text-xs font-medium">{auditData.findingsCount.high}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs">Medium</span>
                  </div>
                  <span className="text-xs font-medium">{auditData.findingsCount.medium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs">Low</span>
                  </div>
                  <span className="text-xs font-medium">{auditData.findingsCount.low}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                    <span className="text-xs">Info</span>
                  </div>
                  <span className="text-xs font-medium">{auditData.findingsCount.info}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="text-xs font-medium mb-2">Services Audited</div>
              <div className="space-y-3">
                {auditData.services.map((service) => {
                  const ServiceIcon = service.icon
                  return (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">
                          <ServiceIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs font-medium">{service.name}</div>
                          <div className="text-xs text-muted-foreground">{service.resourcesScanned} resources</div>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-xs ${
                        service.findings > 0 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {service.findings > 0 ? `${service.findings} findings` : 'All clear'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2 premium-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-primary opacity-80" />
                Findings
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="h-8">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  Filters
                </Button>
              </div>
            </div>
            <CardDescription>
              Detailed list of all issues discovered during the audit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditData.findings.length > 0 ? (
                auditData.findings.map((finding) => {
                  const SeverityIcon = severityConfig[finding.severity].icon
                  
                  return (
                    <div key={finding.id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between bg-muted/30 px-4 py-2 border-b">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-full p-1 ${severityConfig[finding.severity].bgColor}`}>
                            <SeverityIcon className={`h-3.5 w-3.5 ${severityConfig[finding.severity].color}`} />
                          </div>
                          <span className="font-medium text-sm">{finding.title}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full">
                            {finding.id}
                          </span>
                          <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full">
                            {finding.category}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Resource</div>
                          <div className="text-sm font-medium">{finding.resourceId}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Description</div>
                          <div className="text-sm">{finding.description}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Recommendation</div>
                          <div className="text-sm">{finding.recommendation}</div>
                        </div>
                      </div>
                      <div className="bg-muted/20 px-4 py-2 border-t flex justify-end">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          View Details
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No findings were discovered in this audit.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 