"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CheckCircle2, CloudCog, LayoutDashboard, FileText, Server, Database, Clock, Shield, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"

interface AuditProgress {
  status: 'running' | 'completed' | 'error';
  currentStep: string;
  progress: number;
  error?: string;
  errorType?: string;
}

// Step definitions for the audit process
const AUDIT_STEPS = [
  { key: 'Initializing', label: 'Initializing', icon: CloudCog, fun: 'Getting ready...' },
  { key: 'Compute', label: 'Scanning Compute', icon: Server, fun: 'Counting VMs...' },
  { key: 'Storage', label: 'Scanning Storage', icon: Database, fun: 'Checking buckets...' },
  { key: 'Network', label: 'Scanning Network', icon: LayoutDashboard, fun: 'Mapping your network...' },
  { key: 'Security', label: 'Scanning Security', icon: Shield, fun: 'Reviewing IAM & policies...' },
  { key: 'Cost', label: 'Scanning Cost', icon: FileText, fun: 'Crunching the numbers...' },
  { key: 'Finalizing', label: 'Finalizing', icon: CheckCircle2, fun: 'Wrapping up...' },
]

function getCurrentStepIndex(currentStep) {
  // Map backend currentStep string to step index
  const stepMap = {
    'Initializing audit...': 0,
    'Starting audit...': 0,
    'Scanning Compute': 1,
    'Scanning Storage': 2,
    'Scanning Network': 3,
    'Scanning Security': 4,
    'Scanning Cost': 5,
    'Finalizing': 6,
    'Running audit...': 0,
  }
  // Try to match by key or fallback to 0
  return stepMap[currentStep] ?? AUDIT_STEPS.findIndex(s => currentStep.includes(s.key)) ?? 0
}

function AuditPageContent() {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [selectedServices, setSelectedServices] = React.useState({
    compute: true,
    storage: true,
    network: true,
    security: true,
    cost: true
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [progressOpen, setProgressOpen] = React.useState(false)
  const [runningJob, setRunningJob] = React.useState<string | null>(null)
  const [progress, setProgress] = React.useState<AuditProgress>({
    status: 'running',
    currentStep: 'Initializing audit...',
    progress: 0
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleStartAudit = async () => {
    // Gather selected categories
    const categories = Object.entries(selectedServices)
      .filter(([_, v]) => v)
      .map(([k]) => k)
    setIsLoading(true)
    setProgressOpen(true)
    setProgress({
      status: 'running',
      currentStep: 'Starting audit...',
      progress: 0
    })

    // Always use the test project for now
    const projectId = 'dba-inventory-services-prod'
    // If all categories are selected, use 'all'
    const category = categories.length === 5 ? 'all' : categories[0] // For now, only support one or all
    
    try {
      const res = await fetch('/api/audits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, category })
      })
      
      if (!res.ok) {
        throw new Error(`Failed to start audit: ${res.statusText}`)
      }
      
      const data = await res.json()
      if (data.jobId) {
        setRunningJob(data.jobId)
      } else {
        throw new Error(data.error || 'Failed to start audit')
      }
    } catch (error) {
      setIsLoading(false)
      setProgressOpen(false)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    }
  }

  React.useEffect(() => {
    if (!runningJob) return
    
    setProgressOpen(true)
    let interval: NodeJS.Timeout
    
    const poll = async () => {
      try {
        const res = await fetch(`/api/audits/status?id=${runningJob}`)
        if (!res.ok) {
          throw new Error(`Failed to check status: ${res.statusText}`)
        }
        
        const data = await res.json()
        
        if (data.status === 'completed') {
          setRunningJob(null)
          setIsLoading(false)
          setProgressOpen(false)
          toast({
            title: "Success",
            description: "Audit completed successfully!"
          })
          router.push(`/audits/${runningJob}`)
        } else if (data.status === 'error') {
          setRunningJob(null)
          setIsLoading(false)
          setProgressOpen(false)
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error || 'Audit failed'
          })
        } else if (data.status === 'running') {
          // Update progress
          setProgress({
            status: 'running',
            currentStep: data.currentStep || 'Running audit...',
            progress: data.progress || 0
          })
        }
      } catch (error) {
        setRunningJob(null)
        setIsLoading(false)
        setProgressOpen(false)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        })
      }
    }
    
    interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [runningJob, router, toast])

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>GCP Audit</CardTitle>
          <CardDescription>
            Run a comprehensive audit of your GCP resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="compute"
                  checked={selectedServices.compute}
                  onCheckedChange={(checked) =>
                    setSelectedServices((prev) => ({
                      ...prev,
                      compute: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="compute">Compute Resources</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="storage"
                  checked={selectedServices.storage}
                  onCheckedChange={(checked) =>
                    setSelectedServices((prev) => ({
                      ...prev,
                      storage: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="storage">Storage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="network"
                  checked={selectedServices.network}
                  onCheckedChange={(checked) =>
                    setSelectedServices((prev) => ({
                      ...prev,
                      network: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="network">Networking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="security"
                  checked={selectedServices.security}
                  onCheckedChange={(checked) =>
                    setSelectedServices((prev) => ({
                      ...prev,
                      security: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="security">Security & IAM</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cost"
                  checked={selectedServices.cost}
                  onCheckedChange={(checked) =>
                    setSelectedServices((prev) => ({
                      ...prev,
                      cost: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="cost">Cost Management</Label>
              </div>
            </div>
            <Button
              onClick={handleStartAudit}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Audit...
                </>
              ) : (
                "Start Audit"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Audit Progress</DialogTitle>
            <DialogDescription>
              Running comprehensive audit on your GCP resources...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Stepper Timeline */}
            <div className="flex flex-col gap-4">
              {AUDIT_STEPS.map((step, idx) => {
                const Icon = step.icon
                const currentIdx = getCurrentStepIndex(progress.currentStep)
                const isCompleted = idx < currentIdx || progress.status === 'completed'
                const isCurrent = idx === currentIdx && progress.status === 'running'
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`rounded-full border-2 flex items-center justify-center w-9 h-9 transition-all duration-300
                      ${isCompleted ? 'bg-green-100 border-green-500 text-green-600' : isCurrent ? 'border-blue-500 bg-blue-100 animate-pulse text-blue-600' : 'border-gray-300 bg-gray-100 text-gray-400'}`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className={`font-medium ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'}`}>{step.label}</div>
                      {isCurrent && <div className="text-xs text-blue-500 animate-fade-in">{step.fun}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress.currentStep}</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} />
            </div>
            {progress.status === 'completed' && (
              <div className="flex flex-col items-center gap-2 mt-4">
                <CheckCircle2 className="w-10 h-10 text-green-500 animate-bounce" />
                <div className="text-lg font-bold text-green-700">Audit Complete!</div>
                <div className="text-sm text-muted-foreground">Your audit finished successfully. 🎉</div>
              </div>
            )}
            {progress.error && (
              <div className="text-sm text-red-500">
                <p className="font-medium">Error: {progress.error}</p>
                {progress.errorType && (
                  <p className="text-xs mt-1">Type: {progress.errorType}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AuditPageContent 