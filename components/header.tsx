"use client"

import * as React from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"

export function Header() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  )
} 