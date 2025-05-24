"use client";

import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.user && !cancelled) {
            router.replace("/");
          }
        }
      } catch {}
    }
    checkAuth();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="bg-card rounded-lg shadow-lg p-8 flex flex-col items-center">
        <Zap className="h-10 w-10 text-primary mb-4" />
        <h1 className="text-3xl font-bold mb-2">Sign in to CloudAuditPro</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-xs">
          Securely connect your Google account to audit and optimize your GCP environment.
        </p>
        <Button
          size="lg"
          className="w-full"
          onClick={() => (window.location.href = "/api/auth/google")}
        >
          Connect with Google
        </Button>
      </div>
    </div>
  );
} 