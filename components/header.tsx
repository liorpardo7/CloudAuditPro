"use client"

import * as React from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { Bell, Search } from "lucide-react"
import { ProjectSelector } from "@/components/project-selector"

export function Header() {
  return (
    <div className="border-b shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="ml-auto flex items-center gap-4">
          <ProjectSelector />
          <div className="flex items-center justify-center rounded-full bg-muted/30 w-8 h-8">
            <Search className="h-4 w-4 text-foreground/60" />
          </div>
          <div className="flex items-center justify-center rounded-full bg-muted/30 w-8 h-8">
            <Bell className="h-4 w-4 text-foreground/60" />
          </div>
          <div className="h-6 w-px bg-border mx-1"></div>
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  )
} 