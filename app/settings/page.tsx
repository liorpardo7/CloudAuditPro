import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Trash2, PlayCircle, Loader2, ChevronDown } from "lucide-react"
import { PlusCircle, Trash2 } from "lucide-react"
import { AddProjectDialog } from "./add-project-dialog"
import { useRouter } from 'next/navigation'
import { useToast, ToastProvider } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
]

export default function SettingsPage() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [isAddProjectOpen, setIsAddProjectOpen] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')
  const [isLoading, setIsLoading] = React.useState(false)
  const [progressProject, setProgressProject] = React.useState<string | null>(null)
  const [runningJob, setRunningJob] = React.useState<string | null>(null)
  const { show } = useToast()
  const [progressOpen, setProgressOpen] = React.useState(false)
  const router = useRouter()

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
        show('Audit completed successfully!', 'success')
        router.push(`/audits/${runningJob}`)
      } else if (data.status === 'error') {
        setRunningJob(null)
        setProgressProject(null)
        setIsLoading(false)
        setProgressOpen(false)
        show(data.error || 'Audit failed', 'error')
      }
    }
    interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [runningJob, router, show])

  const handleRunAudit = async (projectId: string, category: string) => {
    setIsLoading(true)
    setProgressProject(projectId)
    setProgressOpen(true)
    const res = await fetch('/api/audits/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, category })
    })
    const data = await res.json()
    if (data.jobId) {
      setRunningJob(data.jobId)
    } else {
      setIsLoading(false)
      setProgressOpen(false)
      show(data.error || 'Failed to start audit', 'error')
    }
  }

  return (
    <ToastProvider>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">Manage your application settings and connected projects</p>
          </div>
          <Button onClick={() => setIsAddProjectOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Projects</CardTitle>
              <CardDescription>
                Manage your connected Google Cloud projects
              </CardDescription>
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
            setProjects([...projects, project])
            setIsAddProjectOpen(false)
          }}
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
    </ToastProvider>
  )
} 