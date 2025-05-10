"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CheckCircle2, CloudCog, LayoutDashboard, FileText, Server, Database, Clock, Shield, Loader2 } from "lucide-react"
import { useToast, ToastProvider } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

export default function AuditPage() {
  return (
    <ToastProvider>
      <AuditPageContent />
    </ToastProvider>
  )
}

function AuditPageContent() {
  const [currentStep, setCurrentStep] = React.useState(1)
  const [auditName, setAuditName] = React.useState("")
  const [selectedServices, setSelectedServices] = React.useState({
    compute: true,
    storage: true,
    network: true,
    security: true,
    cost: true
  })
  const [progressOpen, setProgressOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [runningJob, setRunningJob] = React.useState<string | null>(null)
  const { show } = useToast()
  const router = useRouter()

  const totalSteps = 3

  const auditServices = [
    {
      id: "compute",
      name: "Compute Resources",
      icon: Server,
      description: "Audit VM instances, functions, container services.",
      items: "213 resources"
    },
    {
      id: "storage",
      name: "Storage Resources",
      icon: Database,
      description: "Audit storage buckets, disks, backup and snapshots.",
      items: "87 resources"
    },
    {
      id: "network",
      name: "Network Resources",
      icon: CloudCog,
      description: "Audit VPC networks, load balancers, DNS settings.",
      items: "42 resources"
    },
    {
      id: "security",
      name: "Security Configuration",
      icon: Shield,
      description: "Audit IAM roles, firewall rules, security policies.",
      items: "156 resources"
    },
    {
      id: "cost",
      name: "Cost Optimization",
      icon: FileText,
      description: "Audit resource utilization and cost efficiency.",
      items: "All resources"
    }
  ]

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices({
      ...selectedServices,
      [serviceId]: !selectedServices[serviceId as keyof typeof selectedServices]
    })
  }

  const handleStartAudit = async () => {
    // Gather selected categories
    const categories = Object.entries(selectedServices)
      .filter(([_, v]) => v)
      .map(([k]) => k)
    setIsLoading(true)
    setProgressOpen(true)
    // Always use the test project for now
    const projectId = 'dba-inventory-services-prod'
    // If all categories are selected, use 'all'
    const category = categories.length === 5 ? 'all' : categories[0] // For now, only support one or all
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

  React.useEffect(() => {
    if (!runningJob) return
    setProgressOpen(true)
    let interval: NodeJS.Timeout
    const poll = async () => {
      const res = await fetch(`/api/audits/status?id=${runningJob}`)
      const data = await res.json()
      if (data.status === 'completed') {
        setRunningJob(null)
        setIsLoading(false)
        setProgressOpen(false)
        show('Audit completed successfully!', 'success')
        router.push(`/audits/${runningJob}`)
      } else if (data.status === 'error') {
        setRunningJob(null)
        setIsLoading(false)
        setProgressOpen(false)
        show(data.error || 'Audit failed', 'error')
      }
    }
    interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [runningJob, router, show])

  return (
    <div className="flex-1 space-y-6 p-8 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Audit</h2>
          <p className="text-muted-foreground mt-1">Create and configure a new cloud infrastructure audit</p>
        </div>
      </div>

      <Card className="premium-card overflow-hidden">
        <CardHeader className="bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle>Audit Configuration</CardTitle>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          <CardDescription>
            Configure your audit settings and select which services to include
          </CardDescription>
        </CardHeader>
        <div className="relative h-2 bg-muted/30">
          <div 
            className="absolute h-full bg-primary transition-all duration-300" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="audit-name">Audit Name</Label>
                    <Input 
                      id="audit-name" 
                      placeholder="e.g., Monthly Infrastructure Audit" 
                      value={auditName}
                      onChange={(e) => setAuditName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="audit-description">Description (Optional)</Label>
                    <Input 
                      id="audit-description" 
                      placeholder="Brief description of this audit's purpose" 
                      className="mt-1.5"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <div className="w-1/2">
                      <Label htmlFor="environment">Environment</Label>
                      <select 
                        id="environment" 
                        className="w-full rounded-md p-2 mt-1.5 bg-background border border-input"
                      >
                        <option>Production</option>
                        <option>Staging</option>
                        <option>Development</option>
                        <option>Testing</option>
                      </select>
                    </div>
                    <div className="w-1/2">
                      <Label htmlFor="priority">Priority</Label>
                      <select 
                        id="priority" 
                        className="w-full rounded-md p-2 mt-1.5 bg-background border border-input"
                      >
                        <option>High</option>
                        <option selected>Normal</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Schedule</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox id="schedule-now" defaultChecked />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor="schedule-now">Run immediately</Label>
                    <span className="text-xs text-muted-foreground">The audit will start right after creation</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="save-template" />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor="save-template">Save as template</Label>
                    <span className="text-xs text-muted-foreground">Save these settings for future audits</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Select Services to Audit</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which cloud services and resources to include in this audit
                </p>
                <div className="grid gap-4 pt-2">
                  {auditServices.map((service) => {
                    const Icon = service.icon
                    const isSelected = selectedServices[service.id as keyof typeof selectedServices]
                    return (
                      <div 
                        key={service.id}
                        className={`flex items-start space-x-4 rounded-lg border p-4 transition-colors cursor-pointer ${
                          isSelected ? 'bg-primary/5 border-primary/20' : 'bg-card hover:bg-muted/30'
                        }`}
                        onClick={() => toggleService(service.id)}
                      >
                        <div className={`rounded-full p-2 ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">{service.name}</h4>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleService(service.id)}
                              className="h-4 w-4"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
                          <div className="text-xs font-medium mt-2 flex items-center">
                            <span className={isSelected ? 'text-primary' : 'text-muted-foreground'}>
                              {service.items}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="flex flex-col items-center justify-center py-6 space-y-6">
              <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-medium">Audit Ready to Start</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Your audit "{auditName || 'Cloud Infrastructure Audit'}" has been configured and is ready to run.
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 w-full max-w-md">
                <h4 className="text-sm font-medium mb-3">Audit Summary</h4>
                <ul className="space-y-2">
                  <li className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Services:</span>
                    <span>{Object.values(selectedServices).filter(Boolean).length} selected</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Resources:</span>
                    <span>~500 resources</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated time:</span>
                    <span>5-10 minutes</span>
                  </li>
                </ul>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Results will be available in your dashboard</span>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-4">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <div className="flex space-x-2">
            {currentStep < totalSteps && (
              <Button onClick={handleNextStep}>
                Continue
              </Button>
            )}
            {currentStep === totalSteps && (
              <Button onClick={handleStartAudit} className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Start Audit
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
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