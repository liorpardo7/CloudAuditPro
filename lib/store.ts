import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Project {
  id: string
  name: string
  isTest?: boolean
  isOAuth?: boolean
}

interface ProjectState {
  selectedProject: Project | null
  setSelectedProject: (project: Project) => void
  setOAuthProject: (projectId: string, projectName: string) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      selectedProject: null,
      setSelectedProject: (project) => set({ selectedProject: project }),
      setOAuthProject: (projectId, projectName) => set({
        selectedProject: {
          id: projectId,
          name: projectName,
          isOAuth: true
        }
      })
    }),
    {
      name: 'project-storage',
    }
  )
) 