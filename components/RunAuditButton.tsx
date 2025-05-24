import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, Shield, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState, useEffect } from "react";

interface RunAuditButtonProps {
  category?: string;
  gcpProjectId?: string;
  onComplete?: () => void;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function RunAuditButton({ category, gcpProjectId, onComplete, className, size }: RunAuditButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string>('');

  // Check audit permissions on component mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const response = await fetch('/api/audit-permissions', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setHasPermissions(data.hasPermissions);
          setPermissionMessage(data.message);
          
          if (!data.hasPermissions) {
            console.warn('[PERMISSIONS] Insufficient audit permissions:', data);
          }
        }
      } catch (error) {
        console.error('[PERMISSIONS] Error checking audit permissions:', error);
      }
    };

    checkPermissions();
  }, []);

  const handleRunAudit = async () => {
    console.log('[RUN_AUDIT] ===== Starting audit =====')
    console.log('[RUN_AUDIT] Category:', category)
    console.log('[RUN_AUDIT] GCP Project ID:', gcpProjectId)
    
    if (!gcpProjectId) {
      console.error('[RUN_AUDIT] No GCP Project ID provided')
      toast({
        title: "Error",
        description: "No project selected or project is missing a GCP Project ID.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // First, check if we're authenticated
      console.log('[RUN_AUDIT] Checking authentication status...')
      const authRes = await fetch('/api/auth/status', { credentials: 'include' });
      const authData = await authRes.json();
      console.log('[RUN_AUDIT] Auth status:', authData)
      
      // If not authenticated, try to authenticate using stored OAuth tokens
      if (!authData.authenticated) {
        console.log('[RUN_AUDIT] Not authenticated, attempting automatic login...')
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include'
        });
        
        if (loginRes.status === 401) {
          console.log('[RUN_AUDIT] No OAuth tokens available, showing auth modal')
          setShowAuthModal(true);
          return;
        }
        
        if (!loginRes.ok) {
          const loginError = await loginRes.json();
          console.error('[RUN_AUDIT] Auto-login failed:', loginError)
          throw new Error(loginError.error || "Authentication failed");
        }
        
        console.log('[RUN_AUDIT] Auto-login successful')
      }

      // Fetch CSRF token
      console.log('[RUN_AUDIT] Fetching CSRF token...')
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      console.log('[RUN_AUDIT] CSRF response status:', csrfRes.status)
      console.log('[RUN_AUDIT] CSRF response headers:', Object.fromEntries(csrfRes.headers.entries()))
      
      const csrfData = await csrfRes.json();
      console.log('[RUN_AUDIT] CSRF token response:', csrfData)
      const csrfToken = csrfData.csrfToken;
      console.log('[RUN_AUDIT] Using CSRF token:', csrfToken)

      // Prepare request payload
      const requestPayload = { projectId: gcpProjectId, category };
      console.log('[RUN_AUDIT] Request payload:', requestPayload)
      
      const headers = {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken
      };
      console.log('[RUN_AUDIT] Request headers:', headers)

      // Trigger audit with CSRF token in header
      console.log('[RUN_AUDIT] Making audit request to /api/audits/run...')
      const res = await fetch("/api/audits/run", {
        method: "POST",
        headers,
        body: JSON.stringify(requestPayload),
        credentials: "include"
      });
      
      console.log('[RUN_AUDIT] Audit response status:', res.status)
      console.log('[RUN_AUDIT] Audit response headers:', Object.fromEntries(res.headers.entries()))
      
      if (res.status === 401) {
        const data = await res.json();
        console.log('[RUN_AUDIT] 401 response data:', data)
        console.log('[RUN_AUDIT] Still getting 401 after auth attempt, showing auth modal')
        setShowAuthModal(true);
        return;
      }
      
      if (res.status === 403) {
        const data = await res.json();
        console.error('[RUN_AUDIT] 403 Forbidden error:', data)
        throw new Error(data.error || "Forbidden - CSRF token issue");
      }
      
      const data = await res.json();
      console.log('[RUN_AUDIT] Audit response data:', data)
      
      // Check if we got immediate results (new direct response format)
      if (data.success && data.results) {
        console.log('[RUN_AUDIT] Got immediate audit results:', data.results)
        
        // Enhanced success message with option to view details
        const findingsCount = data.results.summary?.total_checks || data.results.findings?.length || 0;
        const potentialSavings = data.results.summary?.potential_savings || 'N/A';
        
        let description = `${data.results.category} audit completed with ${findingsCount} checks!`;
        if (potentialSavings !== 'N/A' && potentialSavings !== '$0/month') {
          description += ` 💰 Potential savings: ${potentialSavings}`;
        }
        if (data.jobId) {
          description += ` 📊 View detailed results at /audits/${data.jobId}`;
        }
        
        toast({ 
          title: "Audit Complete ✅", 
          description: description,
          variant: "default",
          duration: 8000  // Longer duration for more content
        });
        onComplete && onComplete();
        return;
      }
      
      // Legacy job-based workflow (fallback)
      if (!data.jobId) {
        console.error('[RUN_AUDIT] No job ID or immediate results returned:', data)
        throw new Error(data.error || "Failed to start audit");
      }
      
      console.log('[RUN_AUDIT] Audit started successfully with job ID:', data.jobId)

      // Poll for status
      let status = "running";
      let pollCount = 0;
      while (status === "running") {
        console.log('[RUN_AUDIT] Polling status, attempt:', ++pollCount)
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(`/api/audits/status?id=${data.jobId}`, { credentials: "include" });
        console.log('[RUN_AUDIT] Poll response status:', poll.status)
        const pollData = await poll.json();
        console.log('[RUN_AUDIT] Poll data:', pollData)
        status = pollData.status;
        if (status === "completed") {
          console.log('[RUN_AUDIT] Audit completed successfully!')
          toast({ title: "Audit Complete", description: "Audit finished successfully!", variant: "default" });
          onComplete && onComplete();
        }
        if (status === "error") {
          console.error('[RUN_AUDIT] Audit failed:', pollData.error)
          throw new Error(pollData.error || "Audit failed");
        }
      }
    } catch (e: any) {
      console.error('[RUN_AUDIT] Error during audit:', e)
      console.error('[RUN_AUDIT] Error stack:', e.stack)
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
      console.log('[RUN_AUDIT] ===== Audit process finished =====')
    }
  };

  if (isLoading) {
    return (
      <Button disabled size={size} className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Running Audit...
      </Button>
    );
  }

  // Show permission warning if needed
  if (hasPermissions === false) {
    return (
      <div className="space-y-2">
        <Button 
          size={size} 
          className={`${className} bg-orange-600 hover:bg-orange-700`}
          onClick={() => {
            toast({
              title: "🔐 Audit Permissions Required",
              description: "Your Google account needs additional permissions to run cloud audits. Please re-authenticate with expanded scopes.",
              variant: "destructive"
            });
          }}
        >
          <Shield className="mr-2 h-4 w-4" />
          Grant Audit Permissions
        </Button>
        <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border">
          <p className="font-medium">🔒 Missing GCP audit permissions</p>
          <p className="text-xs mt-1">Required scopes: Cloud Platform, Compute, BigQuery, Monitoring</p>
          <p className="text-xs mt-1">💡 Contact your admin or re-authenticate your Google account</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button 
        onClick={handleRunAudit} 
        disabled={loading || hasPermissions === false}
        className={className}
        size={size}
        data-audit-category={category}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {category ? `Running ${category} audit...` : "Running audit..."}
          </>
        ) : hasPermissions === false ? (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Insufficient Permissions
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            {category ? `Run ${category.charAt(0).toUpperCase() + category.slice(1)} Audit` : "Run Audit"}
          </>
        )}
      </Button>
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Google Account</DialogTitle>
          </DialogHeader>
          <div className="py-2">You need to connect your Google account to run this audit for the selected project.</div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowAuthModal(false);
                window.location.href = "/api/auth/google";
              }}
            >
              Connect Google Account
            </Button>
            <Button variant="outline" onClick={() => setShowAuthModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 