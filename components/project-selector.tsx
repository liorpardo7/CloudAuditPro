"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Plus } from "lucide-react"
import { useProjectStore, type Project } from "@/lib/store"

export function ProjectSelector() {
  const { selectedProject, setSelectedProject } = useProjectStore()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Fetch user and projects from /api/auth/me
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.projects) {
          setProjects(data.user.projects)
          // If no selected project, set the first one
          if (!selectedProject && data.user.projects.length > 0) {
            setSelectedProject({
              id: data.user.projects[0].id,
              name: data.user.projects[0].name,
            })
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="px-4 py-2">Loading projects...</div>
  if (!selectedProject) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <span className="font-medium">{selectedProject.name}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px]">
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => setSelectedProject(project)}
            >
              {project.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => window.location.href = "/api/auth/google"}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
} 