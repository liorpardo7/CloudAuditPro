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

// New nested routes structure
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
    children: [
      {
        label: "Resource Utilization",
        icon: BarChart3,
        href: "/resource-utilization",
      },
    ],
    href: "/compute",
  },
  {
    label: "Storage",
    icon: Database,
    children: [
      {
        label: "Storage Lifecycle Policies",
        icon: Database,
        href: "/storage-lifecycle",
      },
    ],
    href: "/storage",
  },
  {
    label: "Network",
    icon: Network,
    href: "/network",
  },
  {
    label: "Cost Management",
    icon: BarChart3,
    children: [
      {
        label: "Cost Allocation & Tagging",
        icon: BarChart3,
        href: "/cost-allocation",
      },
      {
        label: "Budgeting & Forecasting",
        icon: BarChart3,
        href: "/budgeting",
      },
      {
        label: "Discount Program Evaluation",
        icon: BarChart3,
        href: "/discounts",
      },
      {
        label: "Monitoring & Alerts",
        icon: ShieldCheck,
        href: "/monitoring",
      },
      {
        label: "Cost",
        icon: BarChart3,
        href: "/cost",
      },
    ],
    href: "/cost-management",
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
  // Only one parent can be open at a time, and it's the one whose child is active or was last clicked
  const [openParent, setOpenParent] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Expand parent if a child is active
    for (const route of routes) {
      if (route.children && route.children.some((child) => child.href === pathname)) {
        setOpenParent(route.label)
        return
      }
    }
    // If on a parent route, open it
    for (const route of routes) {
      if (route.href === pathname && route.children) {
        setOpenParent(route.label)
        return
      }
    }
  }, [pathname])

  const handleToggle = (label: string) => {
    setOpenParent((prev) => (prev === label ? null : label))
  }

  return (
    <div className="flex h-full w-[240px] flex-col bg-sidebar-background border-r shadow-sm">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold tracking-tight">CloudAuditPro</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-6 px-4">
        <nav className="grid items-start gap-2">
          {routes.map((route) => {
            if (!route.children) {
              return (
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
              )
            }
            // Parent with children (hybrid: only one open at a time)
            const isOpen = openParent === route.label
            // Parent is active if any child is active or parent route is active
            const isParentActive =
              (route.children && route.children.some((child) => child.href === pathname)) || pathname === route.href
            return (
              <div key={route.label}>
                <button
                  type="button"
                  onClick={() => handleToggle(route.label)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none",
                    isParentActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground opacity-80"
                  )}
                  aria-expanded={isOpen}
                  aria-controls={`submenu-${route.label}`}
                >
                  <route.icon className="h-5 w-5" />
                  {route.label}
                </button>
                {isOpen && (
                  <div id={`submenu-${route.label}`} className="ml-7 mt-1 space-y-1">
                    {route.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          pathname === child.href
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                            : "text-sidebar-foreground opacity-80"
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
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