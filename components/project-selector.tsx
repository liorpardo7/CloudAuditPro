"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProject } = useProjectStore();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.projects) {
          setProjects(data.user.projects);
          // On mount, sync with URL param if present
          const urlProjectId = searchParams.get('project');
          let projectToSelect = null;
          if (urlProjectId) {
            projectToSelect = data.user.projects.find((p: Project) => p.gcpProjectId === urlProjectId);
          }
          if (!projectToSelect && data.user.projects.length > 0) {
            projectToSelect = data.user.projects[0];
          }
          if (projectToSelect && (!selectedProject || selectedProject.gcpProjectId !== projectToSelect.gcpProjectId)) {
            setSelectedProject({
              id: projectToSelect.id,
              name: projectToSelect.name,
              gcpProjectId: projectToSelect.gcpProjectId,
            });
            // Update URL if needed
            if (!urlProjectId || urlProjectId !== projectToSelect.gcpProjectId) {
              const params = new URLSearchParams(searchParams.toString());
              params.set('project', projectToSelect.gcpProjectId);
              router.replace(`?${params.toString()}`);
            }
          }
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  const handleSelect = (project: Project) => {
    setSelectedProject(project);
    const params = new URLSearchParams(searchParams.toString());
    params.set('project', project.gcpProjectId);
    router.replace(`?${params.toString()}`);
  };

  if (loading) return <div className="px-4 py-2">Loading projects...</div>;
  if (!selectedProject) return null;

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
              onClick={() => handleSelect(project)}
            >
              <div>
                <div className="font-medium">{project.name}</div>
                <div className="text-xs text-muted-foreground">{project.gcpProjectId}</div>
              </div>
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
  );
} 