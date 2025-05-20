"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MoreHorizontal, 
  Search, 
  PlusCircle, 
  ArrowUpDown, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  X, 
  PlayCircle,
  FileText,
  Filter
} from "lucide-react"
import { useEffect, useState } from "react"

interface Audit {
  id: string
  name: string
  status: "running" | "completed" | "error" | "cancelled" | "scheduled"
  date: string
  resources: number 
  findings: number
  environment: string
  tags: string[]
}

export default function AuditsPage() {
  // Sample data - would come from API in a real application
  const audits: Audit[] = [
    {
      id: "aud-123456",
      name: "Weekly Production Audit",
      status: "running",
      date: "2023-02-20 09:23:11",
      resources: 423,
      findings: 0,
      environment: "Production",
      tags: ["automated", "weekly"]
    },
    {
      id: "aud-123455",
      name: "Storage Security Scan",
      status: "completed",
      date: "2023-02-19 15:45:22",
      resources: 87,
      findings: 12,
      environment: "Production",
      tags: ["security"]
    },
    {
      id: "aud-123454",
      name: "Cost Optimization Audit",
      status: "completed",
      date: "2023-02-17 11:12:45",
      resources: 356,
      findings: 24,
      environment: "Production",
      tags: ["cost", "optimization"]
    },
    {
      id: "aud-123453",
      name: "Development Environment Scan",
      status: "error",
      date: "2023-02-15 08:30:00",
      resources: 125,
      findings: 3,
      environment: "Development",
      tags: ["scheduled"]
    },
    {
      id: "aud-123452",
      name: "Compliance Validation",
      status: "completed",
      date: "2023-02-14 14:20:33",
      resources: 201,
      findings: 0,
      environment: "Production",
      tags: ["compliance"]
    },
    {
      id: "aud-123451",
      name: "Full Infrastructure Scan",
      status: "cancelled",
      date: "2023-02-12 10:15:00",
      resources: 0,
      findings: 0,
      environment: "Staging",
      tags: ["full"]
    },
    {
      id: "aud-123450",
      name: "Scheduled Monthly Audit",
      status: "scheduled",
      date: "2023-02-28 00:00:00",
      resources: 0,
      findings: 0,
      environment: "Production",
      tags: ["automated", "monthly"]
    }
  ]
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState<string | null>(null)
  const [filteredAudits, setFilteredAudits] = React.useState<Audit[]>(audits)

  const statusConfig = {
    running: { 
      icon: Clock, 
      color: "text-blue-500", 
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      label: "Running"
    },
    completed: { 
      icon: CheckCircle, 
      color: "text-emerald-500", 
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      label: "Completed" 
    },
    error: { 
      icon: AlertCircle, 
      color: "text-red-500", 
      bgColor: "bg-red-100 dark:bg-red-900/30",
      label: "Error" 
    },
    cancelled: { 
      icon: X, 
      color: "text-slate-500", 
      bgColor: "bg-slate-100 dark:bg-slate-800", 
      label: "Cancelled"
    },
    scheduled: { 
      icon: PlayCircle, 
      color: "text-purple-500", 
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      label: "Scheduled" 
    }
  }

  React.useEffect(() => {
    let results = audits
    
    if (searchQuery) {
      results = results.filter(audit => 
        audit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.environment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    if (filterStatus) {
      results = results.filter(audit => audit.status === filterStatus)
    }
    
    setFilteredAudits(results)
  }, [searchQuery, filterStatus])

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audits</h2>
          <p className="text-muted-foreground mt-1">View and manage cloud infrastructure audits</p>
        </div>
        <Link href="/audit">
          <Button className="flex items-center space-x-2">
            <PlusCircle className="h-4 w-4" />
            <span>New Audit</span>
          </Button>
        </Link>
      </div>

      <Card className="premium-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Audit History</CardTitle>
            
            <div className="flex w-full sm:w-auto space-x-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search audits..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Filter className="h-4 w-4" />
                </Button>
                
                {/* In a real app, this would be a dropdown menu */}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <Tabs defaultValue="all" className="px-4 sm:px-6">
          <div className="overflow-x-auto">
            <TabsList className="w-full justify-start border-b pb-px mb-4">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                onClick={() => setFilterStatus(null)}
              >
                All Audits
              </TabsTrigger>
              <TabsTrigger 
                value="running" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                onClick={() => setFilterStatus("running")}
              >
                Running
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                onClick={() => setFilterStatus("completed")}
              >
                Completed
              </TabsTrigger>
              <TabsTrigger 
                value="scheduled" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                onClick={() => setFilterStatus("scheduled")}
              >
                Scheduled
              </TabsTrigger>
              <TabsTrigger 
                value="error" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                onClick={() => setFilterStatus("error")}
              >
                Failed
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="m-0">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">
                        <div className="flex items-center space-x-1">
                          <span>Audit Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="h-10 px-2 text-left font-medium">Status</th>
                      <th className="h-10 px-2 text-left font-medium">Environment</th>
                      <th className="h-10 px-2 text-right font-medium">Date</th>
                      <th className="h-10 px-2 text-right font-medium">Resources</th>
                      <th className="h-10 px-2 text-right font-medium">Findings</th>
                      <th className="h-10 px-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="h-24 text-center text-muted-foreground">
                          No audits found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      filteredAudits.map((audit) => {
                        const StatusIcon = statusConfig[audit.status].icon
                        
                        return (
                          <tr key={audit.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium">{audit.name}</div>
                                <div className="text-xs text-muted-foreground">{audit.id}</div>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center">
                                <div className={`rounded-full p-1 ${statusConfig[audit.status].bgColor}`}>
                                  <StatusIcon className={`h-3.5 w-3.5 ${statusConfig[audit.status].color}`} />
                                </div>
                                <span className="ml-2 text-xs">
                                  {statusConfig[audit.status].label}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-xs">
                              {audit.environment}
                            </td>
                            <td className="px-2 py-3 text-xs text-right">
                              {new Date(audit.date).toLocaleString(undefined, {
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric'
                              })}
                            </td>
                            <td className="px-2 py-3 text-right text-xs">
                              {audit.resources > 0 ? audit.resources : '-'}
                            </td>
                            <td className={`px-2 py-3 text-right text-xs ${
                              audit.findings > 0 ? 'text-amber-500 font-medium' : ''
                            }`}>
                              {audit.findings > 0 ? audit.findings : '-'}
                            </td>
                            <td className="px-2 py-3 text-right">
                              <div className="flex justify-end space-x-1">
                                {audit.status === "completed" && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-4">
              <div className="text-xs text-muted-foreground">
                Showing <strong>{filteredAudits.length}</strong> of <strong>{audits.length}</strong> audits
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
          </TabsContent>
          
          {/* The other tab contents would be identical to "all" since we're using filtering */}
          <TabsContent value="running" className="m-0">
            {/* Same content as "all" tab */}
          </TabsContent>
          <TabsContent value="completed" className="m-0">
            {/* Same content as "all" tab */}
          </TabsContent>
          <TabsContent value="scheduled" className="m-0">
            {/* Same content as "all" tab */}
          </TabsContent>
          <TabsContent value="error" className="m-0">
            {/* Same content as "all" tab */}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

export function AuditsSummaryPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch("/api/audits/summary")
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading audits summary...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>
  if (!data) return <div className="p-8">No data available.</div>

  // ... render summary cards, charts, and recommendations using 'data' ...
} 