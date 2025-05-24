import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface RunAuditButtonProps {
  category: string;
  gcpProjectId: string;
  onComplete?: () => void;
  className?: string;
}

export function RunAuditButton({ category, gcpProjectId, onComplete, className }: RunAuditButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

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
      
      if (!data.jobId) {
        console.error('[RUN_AUDIT] No job ID returned:', data)
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

  return (
    <>
      <Button onClick={handleRunAudit} disabled={loading || !gcpProjectId} className={className}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
        {loading ? "Running..." : "Run Audit"}
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