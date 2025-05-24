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
import { useRouter, useSearchParams } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { useProjectStore } from "@/stores/project"

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
  { key: 'BigQueryStale', label: 'Scanning BigQuery Stale Partitioning', icon: Clock, fun: 'Checking partition freshness...' },
  { key: 'BigQueryUDF', label: 'Scanning Deprecated SQL UDFs', icon: FileText, fun: 'Looking for deprecated UDFs...' },
  { key: 'Finalizing', label: 'Finalizing', icon: CheckCircle2, fun: 'Wrapping up...' },
]

function getCurrentStepIndex(currentStep: string) {
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
  return stepMap[currentStep as keyof typeof stepMap] ?? AUDIT_STEPS.findIndex(s => currentStep.includes(s.key)) ?? 0
}

function AuditPageContent() {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [selectedServices, setSelectedServices] = React.useState({
    compute: true,
    storage: true,
    network: true,
    security: true,
    cost: true,
    bigqueryStale: true,
    bigqueryUdf: true,
    dataProtection: true,
    devops: true,
    compliance: true
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
  const searchParams = useSearchParams()
  const { selectedProject, setSelectedProjectByGcpId } = useProjectStore()
  const { toast } = useToast()

  const handleStartAudit = async () => {
    console.log('[AUDIT] ===== Starting audit process =====')
    
    // Gather selected categories
    const categories = Object.entries(selectedServices)
      .filter(([_, v]) => v)
      .map(([k]) => k)
    
    console.log('[AUDIT] Selected categories:', categories)
    console.log('[AUDIT] Selected project from store:', selectedProject)
    
    setIsLoading(true)
    setProgressOpen(true)
    setProgress({
      status: 'running',
      currentStep: 'Starting audit...',
      progress: 0
    })

    // Always use the selected project from store if available
    const projectId = selectedProject?.gcpProjectId || 'dba-inventory-services-prod'
    console.log('[AUDIT] Using project ID:', projectId)
    
    if (!projectId) {
      console.error('[AUDIT] No project ID available!')
      toast({
        variant: "destructive",
        title: "Error",
        description: "No project selected. Please select a project first."
      })
      setIsLoading(false)
      setProgressOpen(false)
      return
    }
    
    // If all categories are selected, use 'all'
    const category = categories.length === 5 ? 'all' : categories[0] // For now, only support one or all
    console.log('[AUDIT] Using audit category:', category)
    
    const requestPayload = { projectId, category }
    console.log('[AUDIT] Request payload:', requestPayload)
    
    try {
      console.log('[AUDIT] Making API request to /api/audits/run...')
      
      const res = await fetch('/api/audits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      })
      
      console.log('[AUDIT] API response status:', res.status)
      console.log('[AUDIT] API response headers:', Object.fromEntries(res.headers.entries()))
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('[AUDIT] API request failed:', {
          status: res.status,
          statusText: res.statusText,
          responseText: errorText
        })
        throw new Error(`Failed to start audit: ${res.statusText}`)
      }
      
      const data = await res.json()
      console.log('[AUDIT] API response data:', data)
      
      if (data.jobId) {
        console.log('[AUDIT] Audit job started successfully with ID:', data.jobId)
        setRunningJob(data.jobId)
      } else {
        console.error('[AUDIT] No job ID returned:', data)
        throw new Error(data.error || 'Failed to start audit')
      }
    } catch (error: any) {
      console.error('[AUDIT] Error during audit start:', error)
      console.error('[AUDIT] Error stack:', error.stack)
      
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
    
    console.log('[AUDIT] Starting status polling for job:', runningJob)
    setProgressOpen(true)
    let interval: NodeJS.Timeout
    
    const poll = async () => {
      try {
        console.log('[AUDIT] Polling job status for:', runningJob)
        
        const res = await fetch(`/api/audits/status?id=${runningJob}`)
        console.log('[AUDIT] Status poll response status:', res.status)
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error('[AUDIT] Status poll failed:', {
            status: res.status,
            statusText: res.statusText,
            responseText: errorText
          })
          throw new Error(`Failed to check status: ${res.statusText}`)
        }
        
        const data = await res.json()
        console.log('[AUDIT] Status poll data:', data)
        
        if (data.status === 'completed') {
          console.log('[AUDIT] Audit completed successfully!')
          setRunningJob(null)
          setIsLoading(false)
          setProgressOpen(false)
          toast({
            title: "Success",
            description: "Audit completed successfully!"
          })
          router.push(`/audits/${runningJob}`)
        } else if (data.status === 'error') {
          console.error('[AUDIT] Audit failed with error:', data.error)
          setRunningJob(null)
          setIsLoading(false)
          setProgressOpen(false)
          toast({
            variant: "destructive",
            title: "Error",
            description: data.error || 'Audit failed'
          })
        } else if (data.status === 'running') {
          console.log('[AUDIT] Audit still running:', {
            currentStep: data.currentStep,
            progress: data.progress
          })
          // Update progress
          setProgress({
            status: 'running',
            currentStep: data.currentStep || 'Running audit...',
            progress: data.progress || 0
          })
        }
      } catch (error: any) {
        console.error('[AUDIT] Error during status polling:', error)
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

  React.useEffect(() => {
    // On mount, sync ?project= param to store
    const urlProject = searchParams.get('project');
    console.log('[AUDIT] URL project parameter:', urlProject)
    console.log('[AUDIT] Current selected project:', selectedProject)
    
    if (urlProject && (!selectedProject || selectedProject.gcpProjectId !== urlProject)) {
      console.log('[AUDIT] Setting project from URL parameter:', urlProject)
      setSelectedProjectByGcpId(urlProject);
    }
  }, []);

  React.useEffect(() => {
    // When project changes, update URL param
    if (selectedProject && searchParams.get('project') !== selectedProject.gcpProjectId) {
      console.log('[AUDIT] Updating URL parameter for project:', selectedProject.gcpProjectId)
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set('project', selectedProject.gcpProjectId);
      router.replace(`?${params.toString()}`);
    }
  }, [selectedProject]);

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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bigqueryStale"
                  checked={selectedServices.bigqueryStale}
                  onCheckedChange={(checked) =>
                    setSelectedServices((prev) => ({
                      ...prev,
                      bigqueryStale: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="bigqueryStale">BigQuery: Stale Partitioning</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bigqueryUdf"
                  checked={selectedServices.bigqueryUdf}
                  onCheckedChange={(checked) =>
                    setSelectedServices((prev) => ({
                      ...prev,
                      bigqueryUdf: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="bigqueryUdf">BigQuery: Deprecated SQL UDFs</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dataProtection"
                  checked={selectedServices.dataProtection}
                  onCheckedChange={(checked) =>
                    setSelectedServices((prev) => ({
                      ...prev,
                      dataProtection: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="dataProtection">Data Protection</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="devops"
                  checked={selectedServices.devops}
                  onCheckedChange={(checked) =>
                    setSelectedServices((prev) => ({
                      ...prev,
                      devops: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="devops">DevOps</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="compliance"
                  checked={selectedServices.compliance}
                  onCheckedChange={(checked) =>
                    setSelectedServices((prev) => ({
                      ...prev,
                      compliance: checked as boolean
                    }))
                  }
                />
                <Label htmlFor="compliance">Compliance</Label>
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