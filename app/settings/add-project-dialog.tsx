import * as React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useSearchParams } from 'next/navigation'

interface AddProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectAdded: (project: { id: string; name: string; status: 'active' | 'inactive'; lastSync: string }) => void
}

export function AddProjectDialog({ open, onOpenChange, onProjectAdded }: AddProjectDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [projectId, setProjectId] = React.useState('')
  const searchParams = useSearchParams()

  React.useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const projectId = searchParams.get('project_id')

    if (success && projectId) {
      onProjectAdded({
        id: projectId,
        name: `Project ${projectId}`,
        status: 'active',
        lastSync: new Date().toISOString()
      })
      onOpenChange(false)
    } else if (error) {
      console.error('OAuth error:', error)
      // TODO: Show error toast
    }
  }, [searchParams, onProjectAdded, onOpenChange])

  const handleAddProject = async () => {
    setIsLoading(true)
    try {
      // Redirect to Google OAuth
      window.location.href = `/api/auth/google?project_id=${encodeURIComponent(projectId)}`
    } catch (error) {
      console.error('Failed to initiate OAuth:', error)
      setIsLoading(false)
    }
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
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-id">Project ID</Label>
            <Input
              id="project-id"
              placeholder="Enter your Google Cloud project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>You will be redirected to Google to authorize CloudAuditPro to access your project.</p>
            <p className="mt-2">Required permissions:</p>
            <ul className="list-disc list-inside mt-1">
              <li>View project resources</li>
              <li>View billing information</li>
              <li>View audit logs</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddProject}
            disabled={!projectId || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Project'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 