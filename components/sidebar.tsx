"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "../lib/utils"
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Server, 
  Database,
  Network,
  BarChart3,
  Settings,
  PlayCircle,
  ClipboardList
} from "lucide-react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Audits",
    icon: ClipboardList,
    href: "/audits",
  },
  {
    label: "New Audit",
    icon: PlayCircle,
    href: "/audit",
  },
  {
    label: "Security",
    icon: ShieldCheck,
    href: "/security",
  },
  {
    label: "Compute",
    icon: Server,
    href: "/compute",
  },
  {
    label: "Storage",
    icon: Database,
    href: "/storage",
  },
  {
    label: "Network",
    icon: Network,
    href: "/network",
  },
  {
    label: "Cost",
    icon: BarChart3,
    href: "/cost",
  },
  {
    label: "Big Query",
    icon: Database,
    href: "/bigquery",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-[240px] flex-col bg-sidebar-background border-r shadow-sm">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold tracking-tight">CloudAuditPro</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-6 px-4">
        <nav className="grid items-start gap-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === route.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground opacity-80"
              )}
            >
              <route.icon className="h-5 w-5" />
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <div className="rounded-md bg-sidebar-accent/20 p-3">
          <p className="text-xs font-medium">CloudAuditPro Enterprise</p>
          <p className="text-xs text-sidebar-foreground opacity-70 mt-1">Version 1.2.4</p>
        </div>
      </div>
    </div>
  )
} 