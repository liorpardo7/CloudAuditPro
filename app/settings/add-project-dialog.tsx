import * as React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface AddProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectAdded: (project: any) => void
  initialStep?: 'start' | 'select'
}

export function AddProjectDialog({ open, onOpenChange, onProjectAdded, initialStep = 'start' }: AddProjectDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [projects, setProjects] = React.useState<any[]>([])
  const [selected, setSelected] = React.useState<string[]>([])
  const [step, setStep] = React.useState<'start' | 'select' | 'done'>(initialStep)

  React.useEffect(() => {
    if (open) {
      setStep(initialStep);
    }
  }, [open, initialStep]);

  React.useEffect(() => {
    if (open && step === 'select') {
      setIsLoading(true)
      fetch('/api/gcp/projects')
        .then(res => res.json())
        .then(data => {
          setProjects(data.projects || [])
          setIsLoading(false)
        })
        .catch(() => setIsLoading(false))
    }
  }, [open, step])

  const handleConnect = () => {
    window.location.href = '/api/auth/google'
  }

  const handleSave = async () => {
    setIsLoading(true)
    await fetch('/api/gcp/save-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectIds: selected })
    })
    setIsLoading(false)
    setStep('done')
    onProjectAdded(selected.map(id => ({ id, name: projects.find(p => p.projectId === id)?.name || id, status: 'active', lastSync: new Date().toISOString() })))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
          <DialogDescription>
            Connect a new Google Cloud project to CloudAuditPro
          </DialogDescription>
        </DialogHeader>
        {step === 'start' && (
          <div className="grid gap-4 py-4">
            <div className="text-sm text-muted-foreground">
              <p>You will be redirected to Google to authorize CloudAuditPro to access your projects.</p>
              <p className="mt-2">Required permissions:</p>
              <ul className="list-disc list-inside mt-1">
                <li>View project resources</li>
                <li>View billing information</li>
                <li>View audit logs</li>
              </ul>
            </div>
            <Button onClick={handleConnect} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Connect with Google'}
            </Button>
          </div>
        )}
        {step === 'select' && (
          <div className="grid gap-4 py-4">
            {isLoading ? (
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            ) : (
              <>
                <div className="text-sm mb-2">Select projects to add:</div>
                <div className="max-h-48 overflow-y-auto border rounded p-2">
                  {projects.map((project: any) => (
                    <label key={project.projectId} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={selected.includes(project.projectId)}
                        onChange={e => {
                          if (e.target.checked) setSelected([...selected, project.projectId])
                          else setSelected(selected.filter(id => id !== project.projectId))
                        }}
                      />
                      <span>{project.name} <span className="text-xs text-muted-foreground">({project.projectId})</span></span>
                    </label>
                  ))}
                </div>
                <Button onClick={handleSave} disabled={selected.length === 0 || isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Add Selected Projects'}
                </Button>
              </>
            )}
          </div>
        )}
        {step === 'done' && (
          <div className="py-8 text-center">
            <div className="text-lg font-medium mb-2">Projects added successfully!</div>
            <Button onClick={() => { setStep('start'); onOpenChange(false); }}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 