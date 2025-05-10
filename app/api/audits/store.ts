// In-memory store for audit job status
export const jobStatus: Record<string, { 
  status: string, 
  started: number, 
  error?: string,
  currentStep?: string,
  progress?: number 
}> = {}

// Helper functions to manage job status
export const updateJobStatus = (jobId: string, data: Partial<typeof jobStatus[string]>) => {
  if (!jobStatus[jobId]) {
    jobStatus[jobId] = { status: 'running', started: Date.now() }
  }
  jobStatus[jobId] = { ...jobStatus[jobId], ...data }
}

export const getJobStatus = (jobId: string) => {
  return jobStatus[jobId]
} 