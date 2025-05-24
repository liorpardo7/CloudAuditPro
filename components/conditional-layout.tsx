"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

// Routes that should show clean layout without sidebar/header
const publicRoutes = [
  '/login',
  '/signup', 
  '/forgot-password',
  '/auth/callback',
  '/auth/error'
];

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if current route is a public route (like login)
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/');
  
  // For public routes, show clean layout without sidebar/header
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  // For protected routes, show full layout with sidebar/header
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 