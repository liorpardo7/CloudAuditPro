"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SummaryStatistics } from "@/components/summary-statistics"
import { Shield, Lock, AlertTriangle, CheckCircle, FileCheck, Database } from "lucide-react"
import { useRouter, useSearchParams } from 'next/navigation'
import { useProjectStore } from '@/lib/store'

export default function DataProtectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProjectByGcpId } = useProjectStore();
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

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Protection</h2>
          <p className="text-muted-foreground mt-1">Comprehensive data protection and privacy analysis</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-xs bg-primary/10 hover:bg-primary/15 transition-colors text-primary px-3 py-1.5 rounded-md font-medium">
            Run Data Protection Scan
          </button>
        </div>
      </div>

      <div className="premium-card premium-gradient p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Data Protection Overview</h3>
              <p className="text-sm text-muted-foreground">Last updated: Today at 9:45 AM</p>
            </div>
          </div>
          <div className="text-sm font-medium bg-muted/30 px-3 py-1 rounded-full">
            <span className="text-emerald-500 font-semibold">92% </span>
            <span className="text-muted-foreground">compliance</span>
          </div>
        </div>
        
        <SummaryStatistics />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="premium-card col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-primary opacity-80" />
              <CardTitle>Data Classification</CardTitle>
            </div>
            <CardDescription>Data sensitivity analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">PII Data Protection</span>
                </div>
                <span className="text-xs text-muted-foreground">✓ Compliant</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Sensitive Data Discovery</span>
                </div>
                <span className="text-xs text-muted-foreground">2 findings</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">Data Retention Policies</span>
                </div>
                <span className="text-xs text-muted-foreground">✓ Compliant</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <button className="w-full text-xs font-medium text-primary hover:underline flex items-center justify-center">
                View All Classification Findings
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary opacity-80" />
              <CardTitle>Privacy Controls</CardTitle>
            </div>
            <CardDescription>Data privacy compliance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">GDPR Compliance</div>
                <div className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Compliant
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">CCPA Compliance</div>
                <div className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Compliant
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Data Encryption</div>
                <div className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Partially Compliant
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <button className="w-full text-xs font-medium text-primary hover:underline flex items-center justify-center">
                View Privacy Reports
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-primary opacity-80" />
              <CardTitle>Data Protection Alerts</CardTitle>
            </div>
            <CardDescription>Recent data protection issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div className="text-sm font-medium">Unencrypted Data</div>
                </div>
                <p className="text-xs text-muted-foreground">Sensitive data found in unencrypted storage bucket</p>
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div className="text-sm font-medium">Data Retention Violation</div>
                </div>
                <p className="text-xs text-muted-foreground">Customer data retained beyond required period</p>
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-muted-foreground">Yesterday</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <button className="w-full text-xs font-medium text-primary hover:underline flex items-center justify-center">
                View All Alerts
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 