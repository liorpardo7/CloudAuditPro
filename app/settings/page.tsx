"use client";

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, PlayCircle, Loader2, ChevronDown } from "lucide-react"
import { AddProjectDialog } from "./add-project-dialog"
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from 'react'

interface Project {
  id: string
  name: string
  status: 'active' | 'inactive'
  lastSync: string
}

const AUDIT_CATEGORIES = [
  { key: 'all', label: 'Full Audit' },
  { key: 'compute', label: 'Compute' },
  { key: 'storage', label: 'Storage' },
  { key: 'network', label: 'Network' },
  { key: 'security', label: 'Security' },
  { key: 'cost', label: 'Cost' },
  { key: 'data-protection', label: 'Data Protection' },
  { key: 'permissions-audit', label: 'Permissions Audit' },
]

export default function SettingsPage() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [isAddProjectOpen, setIsAddProjectOpen] = React.useState(false)
  const [addProjectInitialStep, setAddProjectInitialStep] = React.useState<'start' | 'select'>('start')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')
  const [isLoading, setIsLoading] = React.useState(false)
  const [progressProject, setProgressProject] = React.useState<string | null>(null)
  const [runningJob, setRunningJob] = React.useState<string | null>(null)
  const { toast } = useToast()
  const [progressOpen, setProgressOpen] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  React.useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setAddProjectInitialStep('select');
      setIsAddProjectOpen(true);
    }
  }, [searchParams]);

  // Poll for audit status
  React.useEffect(() => {
    if (!runningJob) return
    setProgressOpen(true)
    let interval: NodeJS.Timeout
    const poll = async () => {
      const res = await fetch(`/api/audits/status?id=${runningJob}`)
      const data = await res.json()
      if (data.status === 'completed') {
        setRunningJob(null)
        setProgressProject(null)
        setIsLoading(false)
        setProgressOpen(false)
        toast({
          title: 'Success',
          description: 'Audit completed successfully!',
          variant: 'default'
        })
        router.push(`/audits/${runningJob}`)
      } else if (data.status === 'error') {
        setRunningJob(null)
        setProgressProject(null)
        setIsLoading(false)
        setProgressOpen(false)
        toast({
          title: 'Error',
          description: data.error || 'Audit failed',
          variant: 'destructive'
        })
      }
    }
    interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [runningJob, router, toast])

  useEffect(() => {
    // On mount, check if user is authenticated
    fetch('/api/auth/status', { credentials: 'include' })
      .then(res => {
        if (res.ok) setIsAuthenticated(true);
        else setIsAuthenticated(false);
      });
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const accessToken = url.searchParams.get('access_token');
    if (accessToken) {
      // Exchange Google access token for session cookie
      fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleAccessToken: accessToken }),
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            localStorage.removeItem('google_access_token');
            url.searchParams.delete('access_token');
            window.history.replaceState({}, document.title, url.pathname + url.search);
            setAddProjectInitialStep('select');
            setIsAddProjectOpen(true);
          } else {
            window.location.href = '/api/auth/google';
          }
        });
    }
  }, []);

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/api/auth/google';
  };

  const handleRunAudit = async (projectId: string, category: string) => {
    setIsLoading(true)
    setProgressProject(projectId)
    setProgressOpen(true)
    const res = await fetch('/api/audits/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, category }),
      credentials: 'include',
    })
    const data = await res.json()
    if (data.jobId) {
      setRunningJob(data.jobId)
    } else {
      setIsLoading(false)
      setProgressOpen(false)
      toast({
        title: 'Error',
        description: data.error || 'Failed to start audit',
        variant: 'destructive'
      })
    }
  }

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center h-full">Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-2xl font-bold">Connect your Google Account</h2>
        <p className="text-muted-foreground">To use CloudAuditPro, please connect your Google account.</p>
        <Button onClick={() => window.location.href = '/api/auth/google'}>Connect Account</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your application settings and connected projects</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddProjectOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Project
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Connected Projects</CardTitle>
            <CardDescription>
              Manage your connected Google Cloud projects
            </CardDescription>
            {projects.length > 0 && (
              <div className="mb-4">
                <Button
                  variant="default"
                  onClick={() => handleRunAudit(projects[0].id, 'all')}
                  disabled={isLoading && progressProject === projects[0].id}
                >
                  Run All Audits
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No projects connected yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsAddProjectOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Connect Your First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last synced: {project.lastSync}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.status === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.status}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading && progressProject === project.id}
                            className="flex items-center gap-1"
                          >
                            {isLoading && progressProject === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <PlayCircle className="h-4 w-4 mr-1" />
                            )}
                            Run Audit
                            <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {AUDIT_CATEGORIES.map((cat) => (
                            <DropdownMenuItem
                              key={cat.key}
                              onClick={() => handleRunAudit(project.id, cat.key)}
                            >
                              {cat.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddProjectDialog
        open={isAddProjectOpen}
        onOpenChange={setIsAddProjectOpen}
        onProjectAdded={(project) => {
          setProjects([...projects, ...project])
          setIsAddProjectOpen(false)
        }}
        initialStep={addProjectInitialStep}
      />
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Running Audit</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="text-lg font-medium">Your audit is in progress...</div>
            <div className="text-muted-foreground text-sm">This may take a few minutes depending on the size of your project and selected category.</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 