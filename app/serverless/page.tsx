"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Zap } from "lucide-react"

export default function ServerlessAuditLandingPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:underline flex items-center gap-1"><Zap className="h-4 w-4" /> Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-primary">Serverless Audit</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Zap className="h-6 w-6 text-primary" /> Serverless Audit
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/serverless/cloud-functions-optimization">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle>Cloud Functions Resource & Concurrency Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              Analyze memory/CPU allocation and concurrency settings for Cloud Functions in the selected project to optimize cost and performance.
            </CardContent>
          </Card>
        </Link>
        {/* Future serverless audit sub-pages can be added here */}
      </div>
    </div>
  )
} 