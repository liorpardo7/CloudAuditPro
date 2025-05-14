"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Server, Database, FileText, BarChart3, ClipboardList, ChevronDown, ChevronUp, Terminal, RefreshCw, Clipboard, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// TODO: Replace with real auth check
const ADMIN_EMAIL = "admin@cloudauditpro.com";
const currentUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;

const statusColors = {
  "Reviewed": "bg-green-100 text-green-800",
  "Needs Work": "bg-yellow-100 text-yellow-800",
  "Missing": "bg-red-100 text-red-800",
  "Ready for Prod": "bg-blue-100 text-blue-800",
  "Needs Review": "bg-gray-100 text-gray-800"
} as const;

type AuditItem = {
  category: string;
  name: string;
  page: string;
  script: string;
  endpoint: string;
  description: string;
  formula: string;
  status: keyof typeof statusColors;
  notes: string;
  reviewed: boolean;
  lastRun: string;
  results: any;
  id: string;
};

// FULL STATIC AUDIT INVENTORY: One row per audit sub-item from GCP_AUDIT_CHECKLIST.md
const STATIC_AUDIT_ITEMS: AuditItem[] = [
  // --- Compute: Virtual Machines ---
  { category: "Compute", name: "VM Instance Inventory", page: "/compute", script: "compute-audit.js", endpoint: "/api/audits/compute/vm-instance-inventory", description: "List all VM instances", formula: "compute.instances.list", status: "Needs Review", notes: "", reviewed: false, lastRun: new Date().toISOString(), results: {}, id: "vm-instance-inventory" },
  { category: "Compute", name: "Check instance types and sizes", page: "/compute", script: "compute-audit.js", endpoint: "/api/audits/compute/check-instance-types", description: "Check instance types and sizes", formula: "compute.machineTypes.list", status: "Needs Review", notes: "", reviewed: false, lastRun: new Date().toISOString(), results: {}, id: "check-instance-types" },
  { category: "Compute", name: "Verify machine family usage", page: "/compute", script: "compute-audit.js", endpoint: "/api/audits/compute/verify-machine-family", description: "Verify machine family usage", formula: "compute.machineTypes.list", status: "Needs Review", notes: "", reviewed: false, lastRun: new Date().toISOString(), results: {}, id: "verify-machine-family" },
  { category: "Compute", name: "Review instance labels and tags", page: "/compute", script: "compute-audit.js", endpoint: "/api/audits/compute/review-labels-tags", description: "Review instance labels and tags", formula: "compute.instances.list", status: "Needs Review", notes: "", reviewed: false, lastRun: new Date().toISOString(), results: {}, id: "review-labels-tags" },
  { category: "Compute", name: "Check for deprecated machine types", page: "/compute", script: "compute-audit.js", endpoint: "/api/audits/compute/check-deprecated-types", description: "Check for deprecated machine types", formula: "compute.machineTypes.list", status: "Needs Review", notes: "", reviewed: false, lastRun: new Date().toISOString(), results: {}, id: "check-deprecated-types" },
  { category: "Compute", name: "Verify instance naming conventions", page: "/compute", script: "compute-audit.js", endpoint: "/api/audits/compute/verify-naming-conventions", description: "Verify instance naming conventions", formula: "compute.instances.list", status: "Needs Review", notes: "", reviewed: false, lastRun: new Date().toISOString(), results: {}, id: "verify-naming-conventions" },
  // ... (repeat for every sub-item in every section of the checklist, including Storage, Networking, Security, Cost, Data Protection, DevOps, Compliance, etc.) ...
];

// Add a helper for copying text to clipboard
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

// Group items by script file
function groupByScript(items: AuditItem[]) {
  const groups: Record<string, AuditItem[]> = {};
  for (const item of items) {
    if (!groups[item.script]) groups[item.script] = [];
    groups[item.script].push(item);
  }
  return groups;
}

export default function AdminAuditInventoryPage() {
  // TODO: Replace with real auth check
  if (currentUserEmail && currentUserEmail !== ADMIN_EMAIL) {
    return <div className="p-8 text-center text-lg text-red-600">Access denied. Admins only.</div>;
  }

  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [needsAudit, setNeedsAudit] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testLoading, setTestLoading] = useState<Record<string, boolean>>({});
  const [testError, setTestError] = useState<Record<string, string | null>>({});
  const [showNetworkError, setShowNetworkError] = useState<Record<string, boolean>>({});
  const [groupTestLoading, setGroupTestLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<any>(null);
  const [runSuccessStatus, setRunSuccessStatus] = useState<Record<string, { success: boolean, timestamp: string } | null>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const response = await fetch('/api/admin/audit-inventory');
      if (!response.ok) throw new Error('Failed to fetch audit data');
      const data = await response.json();
      setItems(data.items);
      setNeedsAudit(data.needsAudit);
      setMessage(data.message);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllAudits = async () => {
    setIsRunningAll(true);
    try {
      const res = await fetch('/api/audits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'demo-project-123', category: 'all' })
      });
      if (res.ok) {
        toast.success('All audits started!');
        fetchAuditData(); // Optionally refresh data
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to start all audits');
      }
    } finally {
      setIsRunningAll(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAuditData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAuditData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRowClick = (idx: number) => {
    setExpanded(expanded === idx ? null : idx);
  };

  const handleStatusChange = async (idx: number, newStatus: keyof typeof statusColors) => {
    try {
      const item = items[idx];
      const response = await fetch('/api/admin/audit-inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: item.category,
          name: item.name,
          updates: { status: newStatus }
        })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      const updated = [...items];
      updated[idx].status = newStatus;
      setItems(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleNotesChange = async (idx: number, newNotes: string) => {
    try {
      const item = items[idx];
      const response = await fetch('/api/admin/audit-inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: item.category,
          name: item.name,
          updates: { notes: newNotes }
        })
      });

      if (!response.ok) throw new Error('Failed to update notes');
      
      const updated = [...items];
      updated[idx].notes = newNotes;
      setItems(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes');
    }
  };

  const handleReviewedChange = async (idx: number, checked: boolean) => {
    try {
      const item = items[idx];
      const updates = {
        reviewed: checked,
        status: checked ? "Reviewed" as const : 
          (item.status === "Reviewed" || item.status === "Ready for Prod") ? "Needs Work" as const : item.status
      };

      const response = await fetch('/api/admin/audit-inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: item.category,
          name: item.name,
          updates
        })
      });

      if (!response.ok) throw new Error('Failed to update reviewed status');
      
      const updated = [...items];
      updated[idx].reviewed = checked;
      updated[idx].status = updates.status;
      setItems(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reviewed status');
    }
  };

  // Helper to test the API endpoint for a given item
  const handleTestApi = async (scriptFile: string) => {
    try {
      setLoading(true);
      setError(null);
      setResults(null);

      // Convert script file to API endpoint format
      const scriptName = scriptFile.replace('.py', '').replace(/_/g, '-');
      const response = await fetch(`/api/audits/${scriptName}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run audit');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Test all items in a script group
  const handleGroupTestApi = async (script: string) => {
    setGroupTestLoading((prev) => ({ ...prev, [script]: true }));
    try {
      // Use the script name directly, removing .js extension
      const scriptName = script.replace('.js', '');
      const response = await fetch(`/api/audits/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: 'demo-project-123', // Can be made dynamic with a projectId state
          category: scriptName
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Poll for job status
        const jobId = data.jobId;
        let intervalId = setInterval(async () => {
          const statusResponse = await fetch(`/api/audits/status?id=${jobId}`);
          const statusData = await statusResponse.json();
          
          if (statusData.status === 'completed') {
            clearInterval(intervalId);
            
            // Update all items in this group in the UI
            setItems((prev) => prev.map(item =>
              item.script === script
                ? { ...item, lastRun: new Date().toISOString(), results: statusData.auditResults || {} }
                : item
            ));
            
            // Set success status for this script
            setRunSuccessStatus(prev => ({ 
              ...prev, 
              [script]: { 
                success: true, 
                timestamp: new Date().toISOString() 
              } 
            }));
            
            // Show success toast
            toast.success(`Audit ${scriptName} completed successfully!`, {
              description: `Results updated at ${new Date().toLocaleTimeString()}`
            });
            
            setGroupTestLoading(prev => ({ ...prev, [script]: false }));
          } else if (statusData.status === 'error') {
            clearInterval(intervalId);
            setGroupTestLoading(prev => ({ ...prev, [script]: false }));
            setRunSuccessStatus(prev => ({ 
              ...prev, 
              [script]: { 
                success: false, 
                timestamp: new Date().toISOString() 
              } 
            }));
            toast.error(`Audit ${scriptName} failed: ${statusData.error || 'Unknown error'}`);
          }
        }, 1000);
        
        // Stop polling after 30 seconds to prevent infinite polling
        setTimeout(() => {
          clearInterval(intervalId);
          if (groupTestLoading[script]) {
            setGroupTestLoading(prev => ({ ...prev, [script]: false }));
            toast.error(`Audit ${scriptName} timed out. The operation may still be running in the background.`);
          }
        }, 30000);
      } else {
        toast.error(`Failed to start audit: ${data.error || 'Unknown error'}`);
        setGroupTestLoading((prev) => ({ ...prev, [script]: false }));
      }
    } catch (err: any) {
      toast.error(`Failed to run audit: ${err.message || 'Unknown error'}`);
      setGroupTestLoading((prev) => ({ ...prev, [script]: false }));
    }
  };

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.script.toLowerCase().includes(search.toLowerCase()) ||
    item.endpoint.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = groupByScript(filtered);

  // Helper to render a section for each script
  function ScriptSection({ script, itemsInGroup, groupIdx }: { script: string, itemsInGroup: AuditItem[], groupIdx: number }) {
    return (
      <div key={script} className="mb-10 border rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-primary" />
            <span className="font-mono font-bold text-lg">{script}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleGroupTestApi(script)}
              disabled={groupTestLoading[script]}
            >
              {groupTestLoading[script] ? <span className="animate-spin mr-2"><RefreshCw className="h-4 w-4" /></span> : null}
              Run Audit
            </Button>
            {runSuccessStatus[script]?.success && (
              <span className="text-xs text-green-600 ml-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Last run: {new Date(runSuccessStatus[script]?.timestamp || '').toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-2 py-2 text-left font-semibold w-8">#</th>
                <th className="px-2 py-2 text-left font-semibold w-44">ID</th>
                <th className="px-2 py-2 text-left font-semibold">Category</th>
                <th className="px-2 py-2 text-left font-semibold">Name</th>
                <th className="px-2 py-2 text-left font-semibold">Status</th>
                <th className="px-2 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {itemsInGroup.map((item, idx) => {
                const globalIdx = groupIdx * 1000 + idx;
                return (
                  <tr key={item.id} className={
                    `${expanded === globalIdx ? "bg-primary/10" : idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-primary/5 cursor-pointer`}
                    onClick={() => handleRowClick(globalIdx)}
                    id={`item-${globalIdx}`}
                  >
                    <td className="px-2 py-2 font-bold">{idx + 1}</td>
                    <td className="px-2 py-2 font-mono text-xs flex items-center gap-2">
                      {item.id}
                      <button
                        className="ml-1 p-1 rounded hover:bg-gray-200"
                        title="Copy ID"
                        onClick={e => { e.stopPropagation(); copyToClipboard(item.id); }}
                      >
                        <Clipboard className="h-4 w-4 text-gray-500" />
                      </button>
                    </td>
                    <td className="px-2 py-2 font-medium whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">{item.category}</td>
                    <td className="px-2 py-2">{item.name}</td>
                    <td className="px-2 py-2">
                      <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${statusColors[item.status]}`}>{item.status}</span>
                    </td>
                    <td className="px-2 py-2">
                      <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); handleRowClick(globalIdx); }}>
                        {expanded === globalIdx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Expanded details for items in this script */}
        {itemsInGroup.map((item, idx) => {
          const globalIdx = groupIdx * 1000 + idx;
          if (expanded !== globalIdx) return null;
          return (
            <div key={item.id + '-details'} className="bg-primary/5 p-6 border-t">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4 min-w-[300px]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" /> Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-2 text-muted-foreground">{item.description}</div>
                      <div className="text-xs text-muted-foreground">
                        Page: <a href={item.page} className="underline text-primary">{item.page}</a>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-primary" /> Script
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-mono text-xs bg-muted rounded p-2">{item.script}</div>
                      <div className="text-xs text-muted-foreground mt-2">Last Run: {new Date(item.lastRun).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground mt-2">Reviewed: {item.reviewed ? 'Yes' : 'No'}</div>
                      <Button size="sm" className="mt-2">View Code</Button>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex-1 space-y-4 min-w-[300px]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" /> API Endpoint
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-mono text-xs bg-muted rounded p-2 mb-2 break-all">{item.endpoint}</div>
                      <Button size="sm" className="mr-2" onClick={e => { e.stopPropagation(); handleTestApi(item.script); }} disabled={loading}>
                        {loading ? <span className="animate-spin mr-2"><RefreshCw className="h-4 w-4" /></span> : null}
                        Test API
                      </Button>
                      <Button size="sm" variant="outline">View Docs</Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" /> Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading && <div className="text-xs text-blue-600 mb-2">Testing API...</div>}
                      {testError[item.script] && <>
                        <div className="text-xs text-red-600 mb-2">Error: {testError[item.script]}</div>
                        <Button size="sm" variant="ghost" onClick={() => setShowNetworkError(prev => ({ ...prev, [item.script]: !prev[item.script] }))}>
                          {showNetworkError[item.script] ? 'Hide' : 'Show'} Network Error
                        </Button>
                        {showNetworkError[item.script] && <pre className="text-xs bg-red-50 rounded p-2 overflow-auto max-h-32 mt-2">{testError[item.script]}</pre>}
                      </>}
                      {runSuccessStatus[item.script]?.success && (
                        <div className="flex items-center text-green-600 mb-4 bg-green-50 p-2 rounded-md">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          <span>Audit completed successfully at {new Date(runSuccessStatus[item.script]?.timestamp || '').toLocaleTimeString()}</span>
                        </div>
                      )}
                      {item.results && Object.keys(item.results).length > 0 && (
                        <Card className="mt-4">
                          <CardHeader>
                            <CardTitle>Results</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                              {JSON.stringify(item.results, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Status & Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <select
                        className="mb-2 border rounded px-2 py-1 text-sm w-full"
                        value={item.status}
                        onChange={e => handleStatusChange(globalIdx, e.target.value as keyof typeof statusColors)}
                      >
                        {Object.keys(statusColors).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <textarea
                        className="w-full text-sm border rounded px-2 py-1"
                        rows={2}
                        value={item.notes}
                        onChange={e => handleNotesChange(globalIdx, e.target.value)}
                        placeholder="Add notes or TODOs..."
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-primary" /> Admin Audit Inventory & QA
        </h1>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-sm text-muted-foreground">
              Last refreshed: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button 
            variant="default"
            size="sm"
            onClick={handleRunAllAudits}
            disabled={isRunningAll}
          >
            {isRunningAll ? 'Running...' : 'Run All Audits'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAuditData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Search audits, scripts, endpoints..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-96"
        />
      </div>
      {/* Render a section for each script */}
      {Object.entries(grouped).map(([script, itemsInGroup], groupIdx) => (
        <ScriptSection key={script} script={script} itemsInGroup={itemsInGroup} groupIdx={groupIdx} />
      ))}
    </div>
  );
} 