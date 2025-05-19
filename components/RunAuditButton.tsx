import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface RunAuditButtonProps {
  category: string;
  projectId: string;
  onComplete?: () => void;
  className?: string;
}

export function RunAuditButton({ category, projectId, onComplete, className }: RunAuditButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

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
    <Button onClick={handleRunAudit} disabled={loading} className={className}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
      {loading ? "Running..." : "Run Audit"}
    </Button>
  );
} 