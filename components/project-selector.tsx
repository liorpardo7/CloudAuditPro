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
  const isDevelopment = process.env.NODE_ENV === 'development'
  const { selectedProject, setSelectedProject } = useProjectStore()
  
  const testProject = { id: "test", name: "Test Service Account", isTest: true }
  const regularProjects = [
    { id: "1", name: "Project Alpha" },
    { id: "2", name: "Project Beta" },
  ]
  
  const [projects, setProjects] = React.useState<Project[]>([
    ...regularProjects,
    ...(isDevelopment ? [testProject] : []),
  ])

  // Initialize selected project if not set
  React.useEffect(() => {
    if (!selectedProject) {
      setSelectedProject(isDevelopment ? testProject : regularProjects[0])
    }
  }, [selectedProject, setSelectedProject, isDevelopment])

  const handleAddProject = async () => {
    // TODO: Implement OAuth flow for adding new projects
    window.location.href = "/api/auth/google" // This will be your OAuth endpoint
  }

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
          {projects.filter(p => !p.isTest).map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => setSelectedProject(project)}
            >
              {project.name}
            </DropdownMenuItem>
          ))}
          {isDevelopment && (
            <>
              <DropdownMenuSeparator />
              {projects.filter(p => p.isTest).map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="text-muted-foreground"
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleAddProject}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
} 