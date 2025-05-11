import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Project {
  id: string
  name: string
  isTest?: boolean
}

interface ProjectState {
  selectedProject: Project | null
  setSelectedProject: (project: Project) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      selectedProject: null,
      setSelectedProject: (project) => set({ selectedProject: project }),
    }),
    {
      name: 'project-storage',
    }
  )
) 