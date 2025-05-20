import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface RunAuditButtonProps {
  category: string;
  projectId: string;
  onComplete?: () => void;
  className?: string;
}

export function RunAuditButton({ category, projectId, onComplete, className }: RunAuditButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      // Fetch CSRF token
      const csrfRes = await fetch('/api/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      // Trigger audit with CSRF token in header
      const res = await fetch("/api/audits/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken
        },
        body: JSON.stringify({ projectId, category }),
        credentials: "include"
      });
      if (res.status === 401) {
        const data = await res.json();
        if (data.error && data.error.includes("No OAuth tokens found")) {
          setShowAuthModal(true);
          return;
        } else {
          throw new Error(data.error || "Unauthorized");
        }
      }
      const data = await res.json();
      if (!data.jobId) throw new Error(data.error || "Failed to start audit");

      // Poll for status
      let status = "running";
      while (status === "running") {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(`/api/audits/status?id=${data.jobId}`, { credentials: "include" });
        const pollData = await poll.json();
        status = pollData.status;
        if (status === "completed") {
          toast({ title: "Audit Complete", description: "Audit finished successfully!", variant: "default" });
          onComplete && onComplete();
        }
        if (status === "error") {
          throw new Error(pollData.error || "Audit failed");
        }
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleRunAudit} disabled={loading} className={className}>
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