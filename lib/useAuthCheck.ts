"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthCheck() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) router.replace("/login");
        } else {
          const data = await res.json();
          if (!data.user) {
            if (!cancelled) router.replace("/login");
          }
        }
      } catch {
        if (!cancelled) router.replace("/login");
      }
    }
    checkAuth();
    return () => { cancelled = true; };
  }, [router]);
} 