"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

export function UserNav() {
  return (
    <Button
      variant="ghost"
      className="relative h-8 w-8 rounded-full"
    >
      <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
        <span className="flex h-full w-full items-center justify-center rounded-full bg-muted">
          LP
        </span>
      </span>
    </Button>
  )
} 