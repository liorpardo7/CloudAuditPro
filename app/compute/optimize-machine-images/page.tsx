"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useProjectStore } from '@/lib/store'
import React from 'react'
import { useAuthCheck } from '@/lib/auth'

export default function OptimizeMachineImagesPage() {
  useAuthCheck();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProjectByGcpId } = useProjectStore();
  React.useEffect(() => {
    // On mount, sync ?project= param to store
    const urlProject = searchParams.get('project');
    if (urlProject && (!selectedProject || selectedProject.gcpProjectId !== urlProject)) {
      setSelectedProjectByGcpId(urlProject);
    }
  }, []);
  React.useEffect(() => {
    // When project changes, update URL param
    if (selectedProject && searchParams.get('project') !== selectedProject.gcpProjectId) {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set('project', selectedProject.gcpProjectId);
      router.replace(`?${params.toString()}`);
    }
  }, [selectedProject]);
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Optimize Machine Images</h1>
      <p className="text-muted-foreground mt-1 max-w-2xl">Review and optimize your GCP machine images for cost and efficiency.</p>
      {/* Content goes here */}
    </div>
  )
} 