"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useProjectStore } from '@/lib/store'
import React from 'react'

export default function OperationsSummaryPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">Operations Overview</h1>
      <p className="text-muted-foreground mt-1 max-w-2xl">Summary of DevOps, CI/CD, and operational health across your GCP environment.</p>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"></div>
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"></div>
      {/* Top Recommendations */}
      <div className="bg-card rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">Top Recommendations</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Monitor CI/CD pipeline health and deployment frequency.</li>
          <li>Review operational alerts and incident response times.</li>
          <li>Automate routine operational tasks for efficiency.</li>
        </ul>
      </div>
    </div>
  )
} 