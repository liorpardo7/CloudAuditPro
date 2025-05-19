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
  ClipboardList,
  FileText
} from "lucide-react"
import { useState } from "react"

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
    label: "Compliance",
    icon: ShieldCheck,
    children: [
      {
        label: "Data Protection",
        icon: ShieldCheck,
        href: "/data-protection",
      },
      {
        label: "Audit Logs",
        icon: FileText,
        href: "/compliance/audit-logs",
      },
      {
        label: "Compliance Dashboard",
        icon: ShieldCheck,
        href: "/compliance",
      },
    ],
    href: "/compliance",
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
    label: "GKE Audit",
    icon: Server,
    href: "/gke",
  },
  {
    label: "Serverless Audit",
    icon: require('lucide-react').Zap,
    href: "/serverless",
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
    label: "Cost",
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
    href: "/cost",
  },
  {
    label: "Big Query",
    icon: Database,
    children: [
      {
        label: "Overview",
        icon: Database,
        href: "/bigquery",
      },
      {
        label: "Stale Partitioning",
        icon: Database,
        href: "/bigquery/stale-partitioning",
      },
      {
        label: "Deprecated SQL UDFs",
        icon: Database,
        href: "/bigquery/deprecated-udfs",
      },
      {
        label: "Storage API Cost Monitoring",
        icon: Database,
        href: "/bigquery/storage-api-cost-monitoring",
      },
    ],
    href: "/bigquery",
  },
  {
    label: "Operations",
    icon: Server,
    children: [
      {
        label: "DevOps",
        icon: Server,
        href: "/devops",
      },
    ],
    href: "/operations",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [openParent, setOpenParent] = useState<string | null>(null)

  const handleToggle = (label: string) => {
    setOpenParent((prev) => (prev === label ? null : label))
  }

  return (
    <div className="flex h-full w-[240px] flex-col bg-sidebar-background border-r shadow-sm relative">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold tracking-tight">CloudAuditPro</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-6 px-4">
        <nav className="grid items-start gap-2 relative">
          {routes.map((route) => {
            if (!route.children) {
              const isSelected = pathname === route.href
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isSelected
                      ? "bg-primary/10 border-l-4 border-primary text-primary font-bold shadow-sm"
                      : "text-sidebar-foreground opacity-80"
                  )}
                  style={isSelected ? { boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' } : {}}
                >
                  <route.icon className={cn("h-5 w-5", isSelected ? "text-primary" : "")}/>
                  {route.label}
                </Link>
              )
            }
            const isOpen = openParent === route.label
            const isParentActive =
              (route.children && route.children.some((child) => child.href === pathname)) || pathname === route.href
            return (
              <div key={route.label} className="relative">
                <button
                  type="button"
                  onClick={() => handleToggle(route.label)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none relative",
                    isOpen || isParentActive
                      ? "bg-primary/10 border-l-4 border-primary text-primary font-bold shadow-sm"
                      : "text-sidebar-foreground opacity-80"
                  )}
                  aria-expanded={isOpen}
                  aria-controls={`submenu-${route.label}`}
                  style={isOpen || isParentActive ? { boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' } : {}}
                >
                  <route.icon className={cn("h-5 w-5 z-10", isOpen || isParentActive ? "text-primary" : "")}/>
                  {route.label}
                  <span className="ml-auto z-10">
                    <svg className={`h-5 w-5 font-bold transition-transform duration-200 ${isOpen ? 'rotate-90 text-primary' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                  </span>
                </button>
                {isOpen && (
                  <div id={`submenu-${route.label}`} className="ml-6 mt-1 space-y-1 border-l border-muted pl-3 bg-primary/5 rounded-md py-2">
                    {route.children.map((child) => {
                      const isSubSelected = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isSubSelected
                              ? "bg-primary/20 border-l-4 border-primary text-primary font-bold shadow-sm"
                              : "text-sidebar-foreground opacity-80"
                          )}
                          style={isSubSelected ? { boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' } : {}}
                        >
                          <child.icon className={cn("h-4 w-4", isSubSelected ? "text-primary" : "")}/>
                          {child.label}
                        </Link>
                      )
                    })}
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

// Add animation for drawer
// In your global CSS (e.g., globals.css), add:
// .animate-slide-in-right { animation: slideInRight 0.25s cubic-bezier(0.4,0,0.2,1) both; }
// @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } 