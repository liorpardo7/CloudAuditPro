"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href: string
  active?: boolean
}

export function Breadcrumb() {
  const pathname = usePathname()
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([])
  
  React.useEffect(() => {
    const generateBreadcrumbs = () => {
      // Home page
      if (pathname === "/") {
        return [{ label: "Dashboard", href: "/", active: true }]
      }
      
      // Split the path and create breadcrumb items
      const paths = pathname.split("/").filter(Boolean)
      
      const items: BreadcrumbItem[] = [
        { label: "Dashboard", href: "/" }
      ]
      
      let currentPath = ""
      paths.forEach((path, i) => {
        currentPath += `/${path}`
        // Format the label - capitalize and replace dashes with spaces
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ")
        
        items.push({
          label,
          href: currentPath,
          active: i === paths.length - 1
        })
      })
      
      return items
    }
    
    setBreadcrumbs(generateBreadcrumbs())
  }, [pathname])
  
  if (breadcrumbs.length <= 1) {
    return null
  }
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Link href="/" className="flex items-center hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Home</span>
      </Link>
      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      
      {breadcrumbs.slice(1).map((breadcrumb, i) => (
        <React.Fragment key={breadcrumb.href}>
          <Link 
            href={breadcrumb.href}
            className={`hover:text-foreground ${breadcrumb.active ? "text-foreground font-medium" : ""}`}
            aria-current={breadcrumb.active ? "page" : undefined}
          >
            {breadcrumb.label}
          </Link>
          
          {i < breadcrumbs.length - 2 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          )}
        </React.Fragment>
      ))}
    </nav>
  )
} 