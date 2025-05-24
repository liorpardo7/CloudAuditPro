"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShieldCheck, Server, Database, FileText, BarChart3, ClipboardList, 
  ChevronDown, ChevronUp, Terminal, RefreshCw, Clipboard, CheckCircle2,
  AlertTriangle, Eye, Play, Square, Monitor, Cloud, 
  DollarSign, Lock, Network, Cpu, HardDrive, GitBranch,
  Calendar, Settings, Users, Activity, Bug, Code, Download,
  CheckCircle, XCircle, Clock, Zap, Filter, Search,
  ArrowRight, Loader2, PauseCircle, Timer, ChevronRight,
  MessageSquare, Plus, Edit, Trash2, Save, X, Archive
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from 'next/navigation'
import { useProjectStore } from '@/lib/store'
import { makeAuthenticatedRequest } from '@/lib/csrf';

// TODO: Replace with real auth check
const ADMIN_EMAIL = "admin@cloudauditpro.com";
const currentUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;

const statusColors = {
  "completed": "bg-green-100 text-green-800",
  "running": "bg-blue-100 text-blue-800",
  "failed": "bg-red-100 text-red-800",
  "pending": "bg-yellow-100 text-yellow-800",
  "idle": "bg-gray-100 text-gray-800"
} as const;

const priorityColors = {
  "low": "bg-blue-100 text-blue-800",
  "medium": "bg-yellow-100 text-yellow-800", 
  "high": "bg-orange-100 text-orange-800",
  "critical": "bg-red-100 text-red-800"
} as const;

const commentStatusColors = {
  "open": "bg-red-100 text-red-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  "resolved": "bg-green-100 text-green-800"
} as const;

// Icon mapping for categories
const iconMapping = {
  "compute": Cpu,
  "storage": HardDrive,
  "bigquery": Database,
  "network": Network,
  "security": Lock,
  "cost": DollarSign,
  "gke": Monitor,
  "serverless": Zap,
  "devops": GitBranch,
  "monitoring": Activity,
  "compliance": CheckCircle,
  "data-protection": ShieldCheck
};

type AuditStatus = "idle" | "pending" | "running" | "completed" | "failed";

type AdminComment = {
  id: string;
  comment: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved";
  tags: string[];
  adminEmail?: string;
  createdAt: string;
  updatedAt: string;
};

type AuditCategory = {
  id: string;
  name: string;
  path: string;
  icon: any;
  description: string;
  subcategories: string[];
  status: AuditStatus;
  lastRun?: Date;
  duration?: number;
  progress?: number;
  results?: any;
  logs?: string[];
  rawData?: any;
  error?: string;
  comments?: AdminComment[];
  updatedAt?: string;
};

type DebugLog = {
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  category: string;
  message: string;
  data?: any;
};

export default function AdminAuditInventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProjectByGcpId } = useProjectStore();

  // State management
  const [categories, setCategories] = useState<AuditCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<AuditStatus | "all">("all");
  const [showRawData, setShowRawData] = useState<Record<string, boolean>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Comment management
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<Record<string, {
    comment: string;
    priority: string;
    tags: string;
  }>>({});

  // Project sync
  React.useEffect(() => {
    const urlProject = searchParams.get('project');
    if (urlProject && (!selectedProject || selectedProject.gcpProjectId !== urlProject)) {
      setSelectedProjectByGcpId(urlProject);
    }
  }, []);

  React.useEffect(() => {
    if (selectedProject && searchParams.get('project') !== selectedProject.gcpProjectId) {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set('project', selectedProject.gcpProjectId);
      router.replace(`?${params.toString()}`);
    }
  }, [selectedProject]);

  // Auth check
  if (currentUserEmail && currentUserEmail !== ADMIN_EMAIL) {
    return <div className="p-8 text-center text-lg text-red-600">Access denied. Admins only.</div>;
  }

  // Load categories from database
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/api/admin/audit-inventory');
      if (response.ok) {
      const data = await response.json();
        const categoriesWithIcons = data.categories.map((cat: any) => ({
          ...cat,
          icon: iconMapping[cat.id as keyof typeof iconMapping] || Database,
          lastRun: cat.lastRun ? new Date(cat.lastRun) : undefined
        }));
        setCategories(categoriesWithIcons);
        addDebugLog("info", "system", `Loaded ${categoriesWithIcons.length} categories from database`);
      } else {
        throw new Error('Failed to load categories');
      }
    } catch (error: any) {
      addDebugLog("error", "system", `Failed to load categories: ${error.message}`);
      toast.error("Failed to load audit categories");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debug logging function
  const addDebugLog = useCallback((level: "info" | "warn" | "error" | "debug", category: string, message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };
    setDebugLogs(prev => [log, ...prev].slice(0, 1000)); // Keep last 1000 logs
  }, []);

  // Update category status in database
  const updateCategoryInDB = useCallback(async (categoryId: string, updates: Partial<AuditCategory>) => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/audit-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          categoryId,
          ...updates
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update category in database');
      }

      addDebugLog("info", categoryId, "Category updated in database", updates);
    } catch (error: any) {
      addDebugLog("error", categoryId, `Failed to update category: ${error.message}`);
    }
  }, [addDebugLog]);

  // Update category status locally and in database
  const updateCategoryStatus = useCallback((categoryId: string, updates: Partial<AuditCategory>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));
    
    // Update in database
    updateCategoryInDB(categoryId, updates);
  }, [updateCategoryInDB]);

  // Add comment to category
  const addComment = async (categoryId: string, comment: string, priority: string, tags: string[]) => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/audit-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addComment',
          categoryId,
          comment,
          priority,
          tags,
          adminEmail: currentUserEmail
        })
      });

      if (response.ok) {
        await loadCategories(); // Reload to get updated comments
        setNewComment(prev => ({ ...prev, [categoryId]: { comment: '', priority: 'medium', tags: '' } }));
        toast.success("Comment added successfully");
        addDebugLog("info", categoryId, "Comment added", { comment, priority, tags });
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error: any) {
      toast.error("Failed to add comment");
      addDebugLog("error", categoryId, `Failed to add comment: ${error.message}`);
    }
  };

  // Update comment status
  const updateCommentStatus = async (commentId: string, status: string) => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/audit-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateComment',
          commentId,
          status
        })
      });

      if (response.ok) {
        await loadCategories();
        toast.success("Comment updated");
      } else {
        throw new Error('Failed to update comment');
      }
    } catch (error: any) {
      toast.error("Failed to update comment");
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string) => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/audit-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteComment',
          commentId
        })
      });

      if (response.ok) {
        await loadCategories();
        toast.success("Comment deleted");
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error: any) {
      toast.error("Failed to delete comment");
    }
  };

  // Create manual backup
  const createBackup = async (categoryId: string) => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/audit-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createBackup',
          categoryId,
          description: `Manual backup by ${currentUserEmail}`
        })
      });

      if (response.ok) {
        toast.success("Backup created successfully");
        addDebugLog("info", categoryId, "Manual backup created");
      } else {
        throw new Error('Failed to create backup');
      }
    } catch (error: any) {
      toast.error("Failed to create backup");
      addDebugLog("error", categoryId, `Failed to create backup: ${error.message}`);
    }
  };

  // Run individual audit
  const runAudit = async (categoryId: string) => {
    if (!selectedProject) {
      toast.error('Please select a project first');
      return;
    }

    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    addDebugLog("info", categoryId, `Starting audit for ${category.name}`);
    updateCategoryStatus(categoryId, { 
      status: "running", 
      progress: 0, 
      error: undefined,
      lastRun: new Date()
    });

    try {
      const startTime = Date.now();
      
      const response = await makeAuthenticatedRequest('/api/audits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.gcpProjectId,
          category: categoryId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Audit failed');
      }
      
      const data = await response.json();
      addDebugLog("info", categoryId, `Audit request sent, job ID: ${data.jobId}`, data);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await makeAuthenticatedRequest(`/api/audits/status?id=${data.jobId}`);
          const statusData = await statusResponse.json();
          
          addDebugLog("debug", categoryId, `Polling status: ${statusData.status}`, statusData);
          
          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            const duration = Date.now() - startTime;
            
            updateCategoryStatus(categoryId, {
              status: "completed",
              duration,
              progress: 100,
              results: statusData.result ? JSON.parse(statusData.result) : null,
              rawData: statusData.rawData
            });

            addDebugLog("info", categoryId, `Audit completed in ${duration}ms`, statusData);
            toast.success(`${category.name} audit completed!`);

          } else if (statusData.status === 'error') {
            clearInterval(pollInterval);
            const duration = Date.now() - startTime;
            
            updateCategoryStatus(categoryId, {
              status: "failed",
              duration,
              error: statusData.error
            });

            addDebugLog("error", categoryId, `Audit failed: ${statusData.error}`, statusData);
            toast.error(`${category.name} audit failed: ${statusData.error}`);
          }
        } catch (pollError) {
          addDebugLog("error", categoryId, `Error polling status: ${pollError}`, pollError);
        }
      }, 2000);

      // Timeout after 5 minutes
        setTimeout(() => {
        clearInterval(pollInterval);
        updateCategoryStatus(categoryId, {
          status: "failed",
          error: "Audit timed out"
        });
        addDebugLog("error", categoryId, "Audit timed out after 5 minutes");
      }, 300000);

    } catch (error: any) {
      updateCategoryStatus(categoryId, {
        status: "failed", 
        error: error.message
      });
      addDebugLog("error", categoryId, `Audit failed: ${error.message}`, error);
      toast.error(`${category.name} audit failed: ${error.message}`);
    }
  };

  // Run all selected audits
  const runSelectedAudits = async () => {
    if (selectedCategories.size === 0) {
      toast.error('Please select at least one audit category');
      return;
    }

    setIsRunningAll(true);
    setCurrentOperation("Running selected audits...");
    addDebugLog("info", "system", `Starting batch audit for ${selectedCategories.size} categories`);

    for (const categoryId of Array.from(selectedCategories)) {
      await runAudit(categoryId);
      // Small delay between audits to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunningAll(false);
    setCurrentOperation(null);
    addDebugLog("info", "system", "Batch audit completed");
  };

  // Run all audits
  const runAllAudits = async () => {
    setSelectedCategories(new Set(categories.map(c => c.id)));
    await runSelectedAudits();
  };

  // Stop all running audits
  const stopAllAudits = () => {
    categories.forEach(cat => {
      if (cat.status === "running") {
        updateCategoryStatus(cat.id, { status: "idle", progress: 0 });
        addDebugLog("warn", cat.id, "Audit stopped by user");
      }
    });
    setIsRunningAll(false);
    setCurrentOperation(null);
    toast.info("All running audits have been stopped");
  };

  // Toggle category selection
  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Select all categories
  const selectAllCategories = () => {
    setSelectedCategories(new Set(filteredCategories.map(c => c.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedCategories(new Set());
  };

  // Filter categories
  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         cat.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === "all" || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Refresh running audits
      const runningAudits = categories.filter(cat => cat.status === "running");
      if (runningAudits.length > 0) {
        addDebugLog("debug", "system", `Auto-refresh check for ${runningAudits.length} running audits`);
        // Only reload if there are running audits
        loadCategories();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, categories, addDebugLog, loadCategories]);

  const getStatusIcon = (status: AuditStatus) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "running": return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <PauseCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeColor = (status: AuditStatus) => {
    return statusColors[status] || statusColors.idle;
  };

  if (loading) {
  return (
      <div className="flex justify-center items-center h-screen">
          <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Audit Control Center</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor all audit processes across your GCP environment
          </p>
          </div>
          <div className="flex items-center gap-2">
                        <Button
            variant="outline"
                          size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
                        >
            {autoRefresh ? <PauseCircle className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Auto Refresh
                        </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
                              </Button>
          {selectedProject && (
            <Badge variant="outline" className="text-xs">
              Project: {selectedProject.gcpProjectId}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="logs">Debug Logs</TabsTrigger>
          <TabsTrigger value="raw-data">Raw Data</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Control Panel */}
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Audit Control Panel
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={runAllAudits}
                    disabled={isRunningAll || !selectedProject}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isRunningAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                    Run All Audits
                  </Button>
                  <Button 
                    onClick={runSelectedAudits}
                    disabled={selectedCategories.size === 0 || isRunningAll || !selectedProject}
                    variant="outline"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Selected ({selectedCategories.size})
                  </Button>
                  <Button 
                    onClick={stopAllAudits}
                    disabled={!categories.some(c => c.status === "running")}
                    variant="destructive"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop All
                  </Button>
                                        </div>
                
                <div className="flex gap-2">
                  <Button onClick={selectAllCategories} variant="outline" size="sm">
                    Select All
                  </Button>
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    Clear
                  </Button>
                </div>
              </div>

              {currentOperation && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {currentOperation}
                  </div>
                </div>
              )}
                                      </CardContent>
                                    </Card>

          {/* Filters */}
                                    <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search audit categories..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as AuditStatus | "all")}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="idle">Idle</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategories.has(category.id);
              const isRunning = category.status === "running";

              return (
                <Card 
                  key={category.id} 
                  className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  } ${isRunning ? 'animate-pulse' : ''}`}
                  onClick={() => toggleCategorySelection(category.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-200' : 'bg-gray-100'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Badge className={`text-xs ${getStatusBadgeColor(category.status)}`}>
                            {getStatusIcon(category.status)}
                            <span className="ml-1">{category.status}</span>
                          </Badge>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                      />
                    </div>
                                      </CardHeader>
                                      <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {category.description}
                    </p>
                    
                    {/* Progress bar for running audits */}
                    {isRunning && category.progress !== undefined && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{category.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${category.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Comments indicator */}
                    {category.comments && category.comments.length > 0 && (
                      <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-center gap-2 text-xs">
                          <MessageSquare className="h-3 w-3 text-yellow-600" />
                          <span className="text-yellow-700">
                            {category.comments.length} admin comment{category.comments.length !== 1 ? 's' : ''}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowComments(prev => ({ ...prev, [category.id]: !prev[category.id] }));
                            }}
                          >
                            {showComments[category.id] ? 'Hide' : 'Show'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Comments section */}
                    {showComments[category.id] && (
                      <div className="mb-4 space-y-2 border-t pt-3">
                        {category.comments?.map((comment) => (
                          <div key={comment.id} className="p-2 bg-gray-50 rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${priorityColors[comment.priority as keyof typeof priorityColors]}`}>
                                  {comment.priority}
                                </Badge>
                                <Badge className={`text-xs ${commentStatusColors[comment.status as keyof typeof commentStatusColors]}`}>
                                  {comment.status}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCommentStatus(comment.id, comment.status === 'resolved' ? 'open' : 'resolved');
                                  }}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteComment(comment.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-1">{comment.comment}</p>
                            <div className="text-gray-500 text-xs">
                              {comment.adminEmail} • {new Date(comment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                        
                        {/* Add new comment */}
                        <div className="p-2 bg-blue-50 rounded space-y-2">
                          <textarea
                            placeholder="Add admin comment..."
                            value={newComment[category.id]?.comment || ''}
                            onChange={(e) => setNewComment(prev => ({
                              ...prev,
                              [category.id]: { ...prev[category.id], comment: e.target.value }
                            }))}
                            className="w-full text-xs min-h-[60px] p-2 border rounded"
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={newComment[category.id]?.priority || 'medium'}
                              onChange={(e) => setNewComment(prev => ({
                                ...prev,
                                [category.id]: { ...prev[category.id], priority: e.target.value }
                              }))}
                              className="text-xs px-2 py-1 border rounded"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                            <Input
                              placeholder="Tags (comma separated)"
                              value={newComment[category.id]?.tags || ''}
                              onChange={(e) => setNewComment(prev => ({
                                ...prev,
                                [category.id]: { ...prev[category.id], tags: e.target.value }
                              }))}
                              className="text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                const commentData = newComment[category.id];
                                if (commentData?.comment.trim()) {
                                  const tags = commentData.tags.split(',').map(t => t.trim()).filter(Boolean);
                                  addComment(category.id, commentData.comment, commentData.priority || 'medium', tags);
                                }
                              }}
                              disabled={!newComment[category.id]?.comment?.trim()}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          runAudit(category.id);
                        }}
                        disabled={isRunning || !selectedProject}
                        className="flex-1"
                      >
                        {isRunning ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(category.path);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowComments(prev => ({ ...prev, [category.id]: !prev[category.id] }));
                        }}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          createBackup(category.id);
                        }}
                      >
                        <Archive className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Last run info */}
                    {category.lastRun && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        Last run: {category.lastRun.toLocaleString()}
                        {category.duration && (
                          <span className="ml-2">({(category.duration / 1000).toFixed(1)}s)</span>
                        )}
                      </div>
                    )}

                    {/* Error display */}
                    {category.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        {category.error}
                      </div>
                    )}
                                      </CardContent>
                                    </Card>
              );
            })}
                                  </div>
        </TabsContent>

        {/* Debug Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
                                    <Card>
                                      <CardHeader>
              <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Debug Logs ({debugLogs.length})
                                        </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDebugLogs([])}
                  >
                    Clear Logs
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const logData = JSON.stringify(debugLogs, null, 2);
                      const blob = new Blob([logData], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `audit-logs-${new Date().toISOString()}.json`;
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
                                      </CardHeader>
                                      <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2 font-mono text-sm">
                {debugLogs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No debug logs yet. Run an audit to see logs here.
                  </div>
                ) : (
                  debugLogs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`p-2 rounded border-l-4 ${
                        log.level === 'error' ? 'border-red-500 bg-red-50' :
                        log.level === 'warn' ? 'border-yellow-500 bg-yellow-50' :
                        log.level === 'info' ? 'border-blue-500 bg-blue-50' :
                        'border-gray-500 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span>{log.timestamp.toLocaleTimeString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.level}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.category}
                        </Badge>
                      </div>
                      <div className="text-sm">{log.message}</div>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="text-xs cursor-pointer text-muted-foreground">
                            View data
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-white rounded border overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
                                      </CardContent>
                                    </Card>
        </TabsContent>

        {/* Raw Data Tab */}
        <TabsContent value="raw-data" className="space-y-6">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Raw GCP Data & Calculations
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
              <div className="space-y-4">
                {categories.filter(cat => cat.results || cat.rawData).map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          {category.name}
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowRawData(prev => ({
                            ...prev,
                            [category.id]: !prev[category.id]
                          }))}
                        >
                          {showRawData[category.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {showRawData[category.id] ? 'Hide' : 'Show'} Data
                                          </Button>
                                          </div>
                                            </CardHeader>
                    {showRawData[category.id] && (
                                            <CardContent>
                        <Tabs defaultValue="results">
                          <TabsList>
                            <TabsTrigger value="results">Processed Results</TabsTrigger>
                            <TabsTrigger value="raw">Raw GCP Data</TabsTrigger>
                          </TabsList>
                          <TabsContent value="results" className="mt-4">
                            <pre className="text-xs p-4 bg-gray-50 rounded border overflow-x-auto max-h-96">
                              {JSON.stringify(category.results, null, 2) || 'No results available'}
                                              </pre>
                          </TabsContent>
                          <TabsContent value="raw" className="mt-4">
                            <pre className="text-xs p-4 bg-gray-50 rounded border overflow-x-auto max-h-96">
                              {JSON.stringify(category.rawData, null, 2) || 'No raw data available'}
                            </pre>
                          </TabsContent>
                        </Tabs>
                                            </CardContent>
                    )}
                                          </Card>
                ))}
                
                {categories.filter(cat => cat.results || cat.rawData).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No audit data available. Run some audits to see results here.
                  </div>
                )}
              </div>
                                      </CardContent>
                                    </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
                                    <Card>
                                      <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin Settings
              </CardTitle>
                                      </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto Refresh</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically refresh audit status every 10 seconds
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  {autoRefresh ? 'Disable' : 'Enable'}
                </Button>
                                  </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Database Connection</h4>
                  <p className="text-sm text-muted-foreground">
                    Status: Connected to PostgreSQL • {categories.length} categories loaded
                  </p>
                </div>
          <Button 
                  variant="outline"
                  onClick={loadCategories}
                >
                  Refresh Data
          </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Backup System</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatic backups enabled • Local files stored in /backups/admin-audit/
                  </p>
                </div>
          <Button 
            variant="outline" 
                  onClick={() => {
                    categories.forEach(cat => createBackup(cat.id));
                    toast.success("Creating backups for all categories...");
                  }}
                >
                  Backup All
          </Button>
        </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Log Level</h4>
                  <p className="text-sm text-muted-foreground">
                    Set minimum log level for debug output
                  </p>
      </div>
                <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Max Concurrent Audits</h4>
                  <p className="text-sm text-muted-foreground">
                    Maximum number of audits to run simultaneously
                  </p>
                </div>
        <Input
                  type="number"
                  min="1"
                  max="10"
                  defaultValue="3"
                  className="w-20"
        />
      </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 