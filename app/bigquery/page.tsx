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
  BarChart4,
  ChevronRight,
  Clock,
  PlusCircle,
  FileText,
  Table,
  Layers,
  Code,
  ExternalLink,
  Play,
  HardDrive,
  Timer,
  Code2,
  Loader2
} from "lucide-react"
import { RunAuditButton } from "@/components/RunAuditButton"
import { useProjectStore } from '@/lib/store'
import { useEffect, useState } from "react"
import { useAuthCheck } from '@/lib/useAuthCheck'
import { useRouter, useSearchParams } from 'next/navigation'

export default function BigQueryPage() {
  useAuthCheck();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProjectByGcpId } = useProjectStore();
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentTab, setCurrentTab] = React.useState("datasets")
  
  // State for real data
  const [auditResults, setAuditResults] = React.useState<any>(null)
  const [auditLoading, setAuditLoading] = React.useState(false)
  const [auditError, setAuditError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [realData, setRealData] = React.useState<any>(null)
  const [hasRealData, setHasRealData] = React.useState(false)

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

  // Load real audit data from database
  const loadRealAuditData = React.useCallback(async () => {
    if (!selectedProject) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/bigquery/audit-results?projectId=${selectedProject.gcpProjectId}`)
      const data = await response.json()
      
      if (data.hasData) {
        setRealData(data)
        setHasRealData(true)
        console.log('[BIGQUERY] Loaded real audit data:', data)
      } else {
        setHasRealData(false)
        console.log('[BIGQUERY] No real audit data found:', data.message)
      }
    } catch (error) {
      console.error('[BIGQUERY] Failed to load real audit data:', error)
      setHasRealData(false)
    } finally {
      setLoading(false)
    }
  }, [selectedProject])

  // Handle audit results from RunAuditButton
  const handleAuditComplete = React.useCallback((results: any) => {
    console.log('[BIGQUERY] Received audit results:', results)
    setAuditResults(results)
    setAuditLoading(false)
    setAuditError(null)
    // Reload real data after audit completes
    loadRealAuditData()
  }, [loadRealAuditData])

  // Try to load any existing audit results on mount
  React.useEffect(() => {
    loadRealAuditData()
  }, [loadRealAuditData])

  // Use real data if available, otherwise fall back to mock data
  const bigqueryData = hasRealData ? {
    datasets: realData.datasets || [],
    tables: realData.tables || [],
    recentQueries: realData.recentQueries || [],
    recommendations: realData.recommendations || []
  } : {
    datasets: [
      { id: "analytics-prod", name: "Production Analytics", location: "us-central1", tables: 24, size: "1.8TB", lastModified: "2 hours ago", defaultExpiration: "Never", labels: ["production", "analytics"], access: ["All authenticated users"] },
      { id: "marketing-data", name: "Marketing Data", location: "us-central1", tables: 8, size: "560GB", lastModified: "1 day ago", defaultExpiration: "Never", labels: ["marketing"], access: ["marketing@company.com"] },
      { id: "events-archive", name: "Events Archive", location: "us-central1", tables: 36, size: "4.2TB", lastModified: "3 days ago", defaultExpiration: "90 days", labels: ["archive", "events"], access: ["All authenticated users"] },
      { id: "ml-training", name: "ML Training Data", location: "us-west1", tables: 12, size: "875GB", lastModified: "5 hours ago", defaultExpiration: "Never", labels: ["machine-learning", "training"], access: ["ml-team@company.com"] }
    ],
    tables: [
      { id: "events_daily", name: "events_daily", dataset: "analytics-prod", type: "TABLE", rows: "547.2M", size: "420GB", lastModified: "1 hour ago", schema: "15 fields", expiration: "Never", partitioned: true, clustered: true },
      { id: "user_sessions", name: "user_sessions", dataset: "analytics-prod", type: "TABLE", rows: "128.4M", size: "210GB", lastModified: "2 hours ago", schema: "24 fields", expiration: "Never", partitioned: true, clustered: true },
      { id: "conversion_events", name: "conversion_events", dataset: "marketing-data", type: "TABLE", rows: "42.6M", size: "78GB", lastModified: "3 hours ago", schema: "18 fields", expiration: "Never", partitioned: true, clustered: false },
      { id: "daily_aggregates", name: "daily_aggregates", dataset: "analytics-prod", type: "VIEW", rows: "-", size: "-", lastModified: "5 days ago", schema: "8 fields", expiration: "Never", partitioned: false, clustered: false }
    ],
    recentQueries: [
      { id: "query-123456", query: "SELECT event_date, COUNT(*) as event_count FROM `analytics-prod.events_daily` WHERE event_type = 'purchase' GROUP BY event_date ORDER BY event_date DESC LIMIT 100", user: "analyst@company.com", processed: "2.3TB", duration: "45 seconds", timestamp: "1 hour ago", status: "completed", location: "us-central1" },
      { id: "query-123455", query: "SELECT user_id, session_duration, device_type FROM `analytics-prod.user_sessions` WHERE session_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) LIMIT 1000", user: "john.smith@company.com", processed: "156GB", duration: "12 seconds", timestamp: "3 hours ago", status: "completed", location: "us-central1" },
      { id: "query-123454", query: "SELECT campaign_id, COUNT(DISTINCT user_id) as unique_users, SUM(revenue) as total_revenue FROM `marketing-data.conversion_events` GROUP BY campaign_id ORDER BY total_revenue DESC", user: "marketing@company.com", processed: "78GB", duration: "28 seconds", timestamp: "5 hours ago", status: "completed", location: "us-central1" }
    ],
    recommendations: [
      { id: "rec-001", title: "Optimize query with excessive data scan", description: "Query 'query-123456' scans 2.3TB but only uses a small fraction of columns", impact: "high", estimatedSavings: "$45.20/month", type: "query-optimization" },
      { id: "rec-002", title: "Add clustering to user_sessions table", description: "Table is frequently filtered by user_id but not clustered", impact: "medium", estimatedSavings: "$23.80/month", type: "table-configuration" },
      { id: "rec-003", title: "Set expiration for infrequently accessed tables", description: "Several tables in events-archive dataset haven't been queried in 60+ days", impact: "medium", estimatedSavings: "$67.50/month", type: "lifecycle-management" }
    ]
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-500 bg-red-100 dark:bg-red-900/30"
      case "medium":
        return "text-amber-500 bg-amber-100 dark:bg-amber-900/30"
      case "low":
        return "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
      default:
        return "text-slate-500 bg-slate-100 dark:bg-slate-900/30"
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

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">BigQuery</h2>
          <p className="text-muted-foreground mt-1">Manage datasets, tables, and queries</p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedProject && (
            <RunAuditButton
              category="bigquery"
              gcpProjectId={selectedProject.gcpProjectId}
              onComplete={handleAuditComplete}
            />
          )}
          <Button variant="outline" className="h-9 flex items-center gap-1.5">
            <Code className="h-4 w-4" />
            <span>SQL Editor</span>
          </Button>
          <Button className="h-9 flex items-center gap-1.5">
            <PlusCircle className="h-4 w-4" />
            <span>New Query</span>
          </Button>
        </div>
      </div>

      {/* Data Source Indicator */}
      {!loading && (
        <div className={`p-3 rounded-lg border ${
          hasRealData 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {hasRealData ? (
              <>
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Showing real audit data from {new Date(realData.lastUpdated).toLocaleString()}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={loadRealAuditData}
                  className="ml-auto h-6 px-2 text-xs"
                >
                  Refresh
                </Button>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Showing demo data - Run a BigQuery audit to see your real data
                </span>
                {selectedProject && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      // Auto-click the audit button to run an audit
                      const auditButton = document.querySelector('[data-audit-category="bigquery"]') as HTMLButtonElement;
                      if (auditButton) auditButton.click();
                    }}
                    className="ml-auto h-6 px-2 text-xs"
                  >
                    Run Audit Now
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading latest audit results...</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex w-full sm:w-auto space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search datasets and tables..."
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
      )}

      <Card className="premium-card">
        <CardHeader className="pb-3">
          <CardTitle>BigQuery Resources</CardTitle>
          <CardDescription>
            Manage your datasets, tables, and queries
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="datasets" className="px-4 sm:px-6" onValueChange={setCurrentTab}>
          <div className="overflow-x-auto">
            <TabsList className="w-full justify-start border-b pb-px mb-4">
              <TabsTrigger 
                value="datasets" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Datasets
              </TabsTrigger>
              <TabsTrigger 
                value="tables" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Tables
              </TabsTrigger>
              <TabsTrigger 
                value="queries" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Recent Queries
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="datasets" className="m-0">
            {bigqueryData.datasets.length === 0 ? (
              <div className="text-center py-12">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Datasets Found</h3>
                <p className="text-muted-foreground mb-4">
                  {hasRealData 
                    ? "No BigQuery datasets were found in your project."
                    : "This is demo data. Run an audit to see your actual BigQuery datasets."
                  }
                </p>
                {!hasRealData && selectedProject && (
                  <Button 
                    onClick={() => {
                      const auditButton = document.querySelector('[data-audit-category="bigquery"]') as HTMLButtonElement;
                      if (auditButton) auditButton.click();
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run BigQuery Audit
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-10 px-4 text-left font-medium">
                          <div className="flex items-center space-x-1">
                            <span>Dataset Name</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="h-10 px-2 text-left font-medium">Location</th>
                        <th className="h-10 px-2 text-center font-medium">Tables</th>
                        <th className="h-10 px-2 text-right font-medium">Size</th>
                        <th className="h-10 px-2 text-left font-medium">Last Modified</th>
                        <th className="h-10 px-2 text-left font-medium">Default Expiration</th>
                        <th className="h-10 px-2 text-left font-medium">Labels</th>
                        <th className="h-10 px-2 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bigqueryData.datasets.map((dataset: any) => (
                        <tr key={dataset.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{dataset.name}</div>
                              <div className="text-xs text-muted-foreground">{dataset.id}</div>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-xs">{dataset.location}</td>
                          <td className="px-2 py-3 text-center text-xs">{dataset.tables}</td>
                          <td className="px-2 py-3 text-right text-xs">{dataset.size}</td>
                          <td className="px-2 py-3 text-xs">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{dataset.lastModified}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-xs">{dataset.defaultExpiration}</td>
                          <td className="px-2 py-3">
                            <div className="flex flex-wrap gap-1">
                              {dataset.labels.map((label: string) => (
                                <span 
                                  key={label} 
                                  className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-2 py-3 text-right">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                              View
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="tables" className="m-0">
            {bigqueryData.tables.length === 0 ? (
              <div className="text-center py-12">
                <Table className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Tables Found</h3>
                <p className="text-muted-foreground mb-4">
                  {hasRealData 
                    ? "No BigQuery tables were found in your project."
                    : "This is demo data. Run an audit to see your actual BigQuery tables."
                  }
                </p>
                {!hasRealData && selectedProject && (
                  <Button 
                    onClick={() => {
                      const auditButton = document.querySelector('[data-audit-category="bigquery"]') as HTMLButtonElement;
                      if (auditButton) auditButton.click();
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run BigQuery Audit
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-10 px-4 text-left font-medium">
                          <div className="flex items-center space-x-1">
                            <span>Table Name</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="h-10 px-2 text-left font-medium">Dataset</th>
                        <th className="h-10 px-2 text-left font-medium">Type</th>
                        <th className="h-10 px-2 text-right font-medium">Rows</th>
                        <th className="h-10 px-2 text-right font-medium">Size</th>
                        <th className="h-10 px-2 text-left font-medium">Schema</th>
                        <th className="h-10 px-2 text-center font-medium">Partitioned</th>
                        <th className="h-10 px-2 text-center font-medium">Clustered</th>
                        <th className="h-10 px-2 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bigqueryData.tables.map((table: any) => (
                        <tr key={table.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium">{table.name}</div>
                              <div className="text-xs text-muted-foreground">
                                <Clock className="inline h-3 w-3 mr-0.5 text-muted-foreground" />
                                {table.lastModified}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-xs">{table.dataset}</td>
                          <td className="px-2 py-3 text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              table.type === 'VIEW' 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {table.type}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-right text-xs">{table.rows}</td>
                          <td className="px-2 py-3 text-right text-xs">{table.size}</td>
                          <td className="px-2 py-3 text-xs">{table.schema}</td>
                          <td className="px-2 py-3 text-center">
                            {table.partitioned ? (
                              <div className="flex items-center justify-center">
                                <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <div className="h-2 w-2 bg-slate-300 dark:bg-slate-700 rounded-full" />
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 text-center">
                            {table.clustered ? (
                              <div className="flex items-center justify-center">
                                <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <div className="h-2 w-2 bg-slate-300 dark:bg-slate-700 rounded-full" />
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-3 text-right">
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Table className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="queries" className="m-0">
            {bigqueryData.recentQueries.length === 0 ? (
              <div className="text-center py-12">
                <Code2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Recent Queries</h3>
                <p className="text-muted-foreground mb-4">
                  {hasRealData 
                    ? "No recent BigQuery queries were found."
                    : "This is demo data. Run an audit to see your actual query history."
                  }
                </p>
                {!hasRealData && selectedProject && (
                  <Button 
                    onClick={() => {
                      const auditButton = document.querySelector('[data-audit-category="bigquery"]') as HTMLButtonElement;
                      if (auditButton) auditButton.click();
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run BigQuery Audit
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {bigqueryData.recentQueries.map((query: any) => (
                  <Card key={query.id} className="border shadow-none overflow-hidden">
                    <CardHeader className="p-4 pb-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Play className="h-4 w-4 text-blue-500" />
                          <div className="text-sm font-medium">Query {query.id}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {query.timestamp} by {query.user}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                      <div className="bg-muted/30 rounded-md p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                        {query.query}
                      </div>
                      <div className="flex flex-wrap justify-between mt-4 text-xs text-muted-foreground gap-y-2">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <HardDrive className="h-3.5 w-3.5" />
                            <span>Processed: {query.processed}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Timer className="h-3.5 w-3.5" />
                            <span>Duration: {query.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Database className="h-3.5 w-3.5" />
                            <span>Location: {query.location}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Results
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Open in SQL Editor
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <CardFooter className="border-t px-6 py-4">
          <div className="flex justify-between items-center w-full">
            <div className="text-xs text-muted-foreground">
              Showing {
                currentTab === "datasets" ? bigqueryData.datasets.length :
                currentTab === "tables" ? bigqueryData.tables.length :
                bigqueryData.recentQueries.length
              } items
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="premium-card md:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart4 className="h-5 w-5 text-primary" />
              <CardTitle>Usage Statistics</CardTitle>
            </div>
            <CardDescription>
              Query and storage metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-80 border rounded-md bg-muted/20 flex items-center justify-center">
              <div className="space-y-2 text-center">
                <BarChart4 className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">Query usage visualization by day</p>
                <Button variant="outline" size="sm">View Detailed Reports</Button>
              </div>
              
              {/* In a real application, this would be an interactive chart */}
              <div className="absolute bottom-4 right-4 flex space-x-3 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                  <span>Storage</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                  <span>Queries</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                  <span>Streaming</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="premium-card">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <CardTitle>Recommendations</CardTitle>
            </div>
            <CardDescription>
              Optimization suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bigqueryData.recommendations.map((rec: any) => (
                <div key={rec.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">{rec.title}</h4>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(rec.impact)}`}>
                      {rec.impact}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-medium text-green-600">
                      Save {rec.estimatedSavings}
                    </span>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 