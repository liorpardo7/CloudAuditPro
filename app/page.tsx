"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentAudits } from "@/components/recent-audits"
import { ResourceMetrics } from "@/components/resource-metrics"
import { SummaryStatistics } from "@/components/summary-statistics"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowUpRight, Shield, Coins, Activity, LineChart, BarChart, PlayCircle, ClipboardList } from "lucide-react"
import { useProjectStore } from '@/lib/store'
import { useRouter, useSearchParams } from 'next/navigation'

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProject } = useProjectStore();
  const [loading, setLoading] = React.useState(true);
  const [projects, setProjects] = React.useState<any[]>([]);

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

  if (loading) return <div className="p-8">Loading dashboard...</div>;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Monitor and optimize your cloud infrastructure</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/audit">
            <Button className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700">
              <PlayCircle className="h-4 w-4" />
              <span>Run New Audit</span>
            </Button>
          </Link>
          <div className="text-xs bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-full font-medium">
            Last scan: 2 hours ago
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-emerald-500 font-medium flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                20.1%
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">
                from last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-emerald-500 font-medium flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                2.5%
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">
                from last audit
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center">
              <Coins className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12.4K</div>
            <div className="flex items-center mt-1">
              <span className="text-xs text-muted-foreground">
                Potential monthly savings
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Audits</CardTitle>
            <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <div className="flex items-center mt-1">
              <Link href="/audits" className="text-xs text-primary hover:underline">
                View audit history
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
        <Card className="col-span-7 md:col-span-4 premium-card premium-gradient">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary opacity-80" />
                Cost Overview
              </CardTitle>
              <div className="flex items-center space-x-2">
                <select className="text-xs bg-background/80 rounded-md px-2 py-1 border-0 subtle-ring">
                  <option>Last 12 Months</option>
                  <option>Last 6 Months</option>
                  <option>Last 3 Months</option>
                </select>
              </div>
            </div>
            <CardDescription>
              Monthly cloud spend with trend analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>

        <Card className="col-span-7 md:col-span-3 premium-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 text-primary opacity-80" />
                Recent Audits
              </CardTitle>
              <Link href="/audits">
                <Button variant="outline" size="sm" className="text-xs px-2 py-0.5 h-auto">
                  View All
                </Button>
              </Link>
            </div>
            <CardDescription>
              Latest audit results and findings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentAudits />
          </CardContent>
        </Card>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Resource Utilization</h3>
          <button className="text-xs bg-muted/40 hover:bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-md transition-colors">
            View All Resources
          </button>
        </div>
        <ResourceMetrics />
      </div>
    </div>
  )
} 