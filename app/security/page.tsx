"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SummaryStatistics } from "@/components/summary-statistics"
import { Shield, Lock, AlertTriangle, CheckCircle, FileCheck } from "lucide-react"

export default function SecurityPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security</h2>
          <p className="text-muted-foreground mt-1">Comprehensive security analysis and recommendations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="text-xs bg-primary/10 hover:bg-primary/15 transition-colors text-primary px-3 py-1.5 rounded-md font-medium">
            Run Security Scan
          </button>
        </div>
      </div>

      <div className="premium-card premium-gradient p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Security Health Overview</h3>
              <p className="text-sm text-muted-foreground">Last updated: Today at 9:45 AM</p>
            </div>
          </div>
          <div className="text-sm font-medium bg-muted/30 px-3 py-1 rounded-full">
            <span className="text-emerald-500 font-semibold">89% </span>
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
              <CardTitle>IAM Security</CardTitle>
            </div>
            <CardDescription>Access control audit results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">Root access secured</span>
                </div>
                <span className="text-xs text-muted-foreground">✓ Compliant</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Service accounts with high privileges</span>
                </div>
                <span className="text-xs text-muted-foreground">3 findings</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">IAM password policy</span>
                </div>
                <span className="text-xs text-muted-foreground">✓ Compliant</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">MFA enforcement</span>
                </div>
                <span className="text-xs text-muted-foreground">✓ Compliant</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <button className="w-full text-xs font-medium text-primary hover:underline flex items-center justify-center">
                View All IAM Findings
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <FileCheck className="h-5 w-5 text-primary opacity-80" />
              <CardTitle>Compliance Status</CardTitle>
            </div>
            <CardDescription>Regulatory compliance findings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">SOC 2</div>
                <div className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Compliant
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">HIPAA</div>
                <div className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Partially Compliant
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">PCI DSS</div>
                <div className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Compliant
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">ISO 27001</div>
                <div className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Compliant
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <button className="w-full text-xs font-medium text-primary hover:underline flex items-center justify-center">
                View Compliance Reports
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="premium-card col-span-1 md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-primary opacity-80" />
              <CardTitle>Security Alerts</CardTitle>
            </div>
            <CardDescription>Recent security notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div className="text-sm font-medium">Suspicious Login Attempts</div>
                </div>
                <p className="text-xs text-muted-foreground">Multiple failed login attempts from unusual location. IP: 203.45.xx.xx</p>
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-muted-foreground">2 hours ago</span>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-md p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div className="text-sm font-medium">Critical Vulnerability</div>
                </div>
                <p className="text-xs text-muted-foreground">Server VM-DB-01 has unpatched critical vulnerability (CVE-2023-1234)</p>
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