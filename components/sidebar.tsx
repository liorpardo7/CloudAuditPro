"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Shield, 
  Server, 
  Database,
  Network,
  Settings,
  BarChart
} from "lucide-react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Security",
    icon: Shield,
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
    icon: BarChart,
    href: "/cost",
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
    <div className="flex h-full w-[200px] flex-col bg-sidebar-background">
      <div className="flex h-14 items-center border-b px-3 py-4">
        <Link href="/" className="flex items-center">
          <span className="text-lg font-bold">CloudAuditPro</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 gap-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                pathname === route.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
} 