import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, AlertCircle, CheckCircle2, Loader2, BarChart3 } from "lucide-react";

const CompliancePage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Compliance
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Review your cloud environment's compliance with major regulatory standards. Run compliance scans, view audit logs, and get actionable recommendations to maintain and improve your compliance posture.
          </p>
        </div>
        <Button className="flex items-center gap-2" variant="outline">
          <BarChart3 className="h-5 w-5" />
          Run Compliance Scan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" /> GDPR
            </CardTitle>
            <CardDescription>General Data Protection Regulation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Compliant</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" /> HIPAA
            </CardTitle>
            <CardDescription>Health Insurance Portability and Accountability Act</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Compliant</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-yellow-500" /> PCI DSS
            </CardTitle>
            <CardDescription>Payment Card Industry Data Security Standard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium">Partial</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-pink-500" /> SOC 2
            </CardTitle>
            <CardDescription>Service Organization Control 2</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Compliant</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Audit Log Status</CardTitle>
            <CardDescription>Ensure all required audit logs are enabled and retained.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Admin Activity Logs</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Data Access Logs</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span>System Event Logs (Partial)</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              <span>Log Export in Progress</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Improve your compliance posture with these actions:</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Enable full Data Access Logging for all resources.</li>
              <li>Review and update your data retention policies.</li>
              <li>Address partial PCI DSS compliance by remediating flagged controls.</li>
              <li>Export and archive audit logs regularly.</li>
              <li>Schedule periodic compliance scans.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Findings</CardTitle>
          <CardDescription>Latest issues and alerts from your compliance scans.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-muted">
            <li className="py-3 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="font-medium">PCI DSS:</span>
              <span className="text-muted-foreground">Unencrypted cardholder data found in storage bucket <span className="font-mono">prod-payments</span>.</span>
            </li>
            <li className="py-3 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium">System Event Logs:</span>
              <span className="text-muted-foreground">Retention policy not configured for <span className="font-mono">system-logs</span>.</span>
            </li>
            <li className="py-3 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">GDPR:</span>
              <span className="text-muted-foreground">All data subject requests processed within SLA.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompliancePage; 