"use client"

import React, { useEffect, useState } from "react"
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
  Code2
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card"

export default function BigQueryPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [currentTab, setCurrentTab] = React.useState("datasets")
  const [stalePartitioning, setStalePartitioning] = useState<any[]>([]);
  const [deprecatedUDFs, setDeprecatedUDFs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data - would come from API in a real application
  const bigqueryData = {
    datasets: [
      { 
        id: "analytics-prod", 
        name: "Production Analytics", 
        location: "us-central1",
        tables: 24,
        size: "1.8TB", 
        lastModified: "2 hours ago",
        defaultExpiration: "Never",
        labels: ["production", "analytics"],
        access: ["All authenticated users"]
      },
      { 
        id: "marketing-data", 
        name: "Marketing Data", 
        location: "us-central1",
        tables: 8,
        size: "560GB", 
        lastModified: "1 day ago",
        defaultExpiration: "Never",
        labels: ["marketing"],
        access: ["marketing@company.com"]
      },
      { 
        id: "events-archive", 
        name: "Events Archive", 
        location: "us-central1",
        tables: 36,
        size: "4.2TB", 
        lastModified: "3 days ago",
        defaultExpiration: "90 days",
        labels: ["archive", "events"],
        access: ["All authenticated users"]
      },
      { 
        id: "ml-training", 
        name: "ML Training Data", 
        location: "us-west1",
        tables: 12,
        size: "875GB", 
        lastModified: "5 hours ago",
        defaultExpiration: "Never",
        labels: ["machine-learning", "training"],
        access: ["ml-team@company.com"]
      }
    ],
    tables: [
      {
        id: "events_daily",
        name: "events_daily",
        dataset: "analytics-prod",
        type: "TABLE",
        rows: "547.2M",
        size: "420GB",
        lastModified: "1 hour ago",
        schema: "15 fields",
        expiration: "Never",
        partitioned: true,
        clustered: true
      },
      {
        id: "user_sessions",
        name: "user_sessions",
        dataset: "analytics-prod",
        type: "TABLE",
        rows: "128.4M",
        size: "210GB",
        lastModified: "2 hours ago",
        schema: "24 fields",
        expiration: "Never",
        partitioned: true,
        clustered: true
      },
      {
        id: "conversion_events",
        name: "conversion_events",
        dataset: "marketing-data",
        type: "TABLE",
        rows: "42.6M",
        size: "78GB",
        lastModified: "3 hours ago",
        schema: "18 fields",
        expiration: "Never",
        partitioned: true,
        clustered: false
      },
      {
        id: "daily_aggregates",
        name: "daily_aggregates",
        dataset: "analytics-prod",
        type: "VIEW",
        rows: "-",
        size: "-",
        lastModified: "5 days ago",
        schema: "8 fields",
        expiration: "Never",
        partitioned: false,
        clustered: false
      }
    ],
    recentQueries: [
      {
        id: "query-123456",
        query: "SELECT event_date, COUNT(*) as event_count FROM `analytics-prod.events_daily` WHERE event_type = 'purchase' GROUP BY event_date ORDER BY event_date DESC LIMIT 100",
        user: "analyst@company.com",
        processed: "2.3TB",
        duration: "45 seconds",
        timestamp: "1 hour ago",
        status: "completed",
        location: "us-central1"
      },
      {
        id: "query-123455",
        query: "SELECT user_id, session_duration, device_type FROM `analytics-prod.user_sessions` WHERE session_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) LIMIT 1000",
        user: "john.smith@company.com",
        processed: "156GB",
        duration: "12 seconds",
        timestamp: "3 hours ago",
        status: "completed",
        location: "us-central1"
      },
      {
        id: "query-123454",
        query: "SELECT campaign_id, COUNT(DISTINCT user_id) as unique_users, SUM(revenue) as total_revenue FROM `marketing-data.conversion_events` GROUP BY campaign_id ORDER BY total_revenue DESC",
        user: "marketing@company.com",
        processed: "78GB",
        duration: "28 seconds",
        timestamp: "5 hours ago",
        status: "completed",
        location: "us-central1"
      }
    ],
    recommendations: [
      {
        id: "rec-001",
        title: "Optimize query with excessive data scan",
        description: "Query 'query-123456' scans 2.3TB but only uses a small fraction of columns",
        impact: "high",
        estimatedSavings: "$45.20/month",
        type: "query-optimization"
      },
      {
        id: "rec-002",
        title: "Add clustering to user_sessions table",
        description: "Table is frequently filtered by user_id but not clustered",
        impact: "medium",
        estimatedSavings: "$23.80/month",
        type: "table-configuration"
      },
      {
        id: "rec-003",
        title: "Set expiration for infrequently accessed tables",
        description: "Several tables in events-archive dataset haven't been queried in 60+ days",
        impact: "medium",
        estimatedSavings: "$67.50/month",
        type: "lifecycle-management"
      }
    ]
  }
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-500 bg-red-100 dark:bg-red-900/30";
      case "medium":
        return "text-amber-500 bg-amber-100 dark:bg-amber-900/30";
      case "low":
        return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
      default:
        return "text-slate-500 bg-slate-100 dark:bg-slate-900/30";
    }
  }

  useEffect(() => {
    let jobId = typeof window !== 'undefined' ? localStorage.getItem('lastAuditJobId') : null;
    if (!jobId) {
      jobId = 'test'; // fallback to a default value to always fetch results
    }
    fetch(`/api/audits/status?id=${jobId}`)
      .then(res => res.json())
      .then(res => {
        setStalePartitioning(res.bigqueryResults?.bigquery?.stalePartitioning || []);
        setDeprecatedUDFs(res.bigqueryResults?.bigquery?.deprecatedUDFs || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch audit results.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 error">{error}</div>;

  return (
    <main className="p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">BigQuery Audit</h1>
      <div className="grid gap-8 md:grid-cols-2">
        {/* Stale Partitioning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" />
              Stale Partitioning
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stalePartitioning.length === 0 ? (
              <div className="text-muted-foreground">No stale partitioning issues found.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left font-semibold">Table</th>
                    <th className="text-left font-semibold">Partition</th>
                    <th className="text-left font-semibold">Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {stalePartitioning.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-1">{item.table}</td>
                      <td className="py-1">{item.partition}</td>
                      <td className="py-1">{item.lastModified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Deprecated UDFs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="text-blue-500" />
              Deprecated SQL UDFs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deprecatedUDFs.length === 0 ? (
              <div className="text-muted-foreground">No deprecated UDFs found.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left font-semibold">Dataset</th>
                    <th className="text-left font-semibold">Table</th>
                  </tr>
                </thead>
                <tbody>
                  {deprecatedUDFs.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-1">{item.dataset}</td>
                      <td className="py-1">{item.table}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
} 