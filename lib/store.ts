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
      })
    }),
    {
      name: 'project-storage',
    }
  )
) 