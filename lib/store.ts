import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Project {
  id: string
  name: string
  gcpProjectId: string
  isTest?: boolean
  isOAuth?: boolean
}

interface ProjectState {
  selectedProject: Project | null
  setSelectedProject: (project: Project) => void
  setOAuthProject: (projectId: string, projectName: string, gcpProjectId: string) => void
  setSelectedProjectByGcpId: (gcpProjectId: string) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      selectedProject: null,
      setSelectedProject: (project) => set({ selectedProject: project }),
      setOAuthProject: (projectId, projectName, gcpProjectId) => set({
        selectedProject: {
          id: projectId,
          name: projectName,
          gcpProjectId,
          isOAuth: true
        }
      }),
      setSelectedProjectByGcpId: (gcpProjectId) => {
        // Try to find the project in localStorage (persisted by zustand)
        try {
          const persisted = localStorage.getItem('project-storage');
          if (persisted) {
            const parsed = JSON.parse(persisted);
            const projects = parsed?.state?.projects || parsed?.state?.userProjects || [];
            // Try common keys
            let allProjects = projects;
            if (!Array.isArray(allProjects) || allProjects.length === 0) {
              // Try to find in selectedProject
              if (parsed?.state?.selectedProject) {
                allProjects = [parsed.state.selectedProject];
              }
            }
            const found = allProjects.find((p: any) => p.gcpProjectId === gcpProjectId);
            if (found) {
              set({ selectedProject: found });
            }
          }
        } catch (e) {
          // Ignore
        }
      }
    }),
    {
      name: 'project-storage',
    }
  )
) 