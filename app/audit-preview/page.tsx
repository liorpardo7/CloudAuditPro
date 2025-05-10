"use client"

import React, { useState } from "react"
import { Loader2, CheckCircle2, AlertCircle, Clock, BarChart2, FileText, Server, Database, LayoutDashboard, Shield, BadgeCheck, ArrowUpRight, ArrowDownRight } from "lucide-react"

const categories = [
  { key: 'compute', label: 'Compute Resources', icon: Server },
  { key: 'storage', label: 'Storage', icon: Database },
  { key: 'network', label: 'Network', icon: LayoutDashboard },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'cost', label: 'Cost', icon: FileText },
  { key: 'compliance', label: 'Compliance', icon: BadgeCheck },
]

const sectionOrder = ['compute', 'storage', 'network', 'security', 'cost', 'compliance']

const statusIcons = {
  empty: <Clock className="w-5 h-5 text-slate-400" />, // Not started
  loading: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />, // Running
  result: <CheckCircle2 className="w-5 h-5 text-green-600" />, // Completed
  error: <AlertCircle className="w-5 h-5 text-red-500" />, // Error
}

const statusLabels = {
  empty: 'Not started',
  loading: 'Running…',
  result: 'Completed',
  error: 'Error',
}

const demoFindings = {
  compute: { critical: 2, total: 5, utilization: 72 },
  storage: { critical: 0, total: 2, utilization: 65 },
  network: { critical: 1, total: 3, utilization: 58 },
  security: { critical: 3, total: 6, utilization: 80 },
  cost: { critical: 0, total: 1, utilization: 54 },
  compliance: { critical: 0, total: 0, utilization: 89 },
}

function MiniBar({ value }: { value: number }) {
  // Simple bar for utilization
  return (
    <div className="w-full h-2 bg-slate-100 rounded">
      <div className="h-2 rounded bg-blue-500 transition-all" style={{ width: `${value}%` }} />
    </div>
  )
}

function CategoryCard({ label, icon: Icon, state, findings, onViewDetails }: any) {
  return (
    <div className={`relative bg-white rounded-xl border transition-all duration-200 shadow-sm flex flex-col px-6 py-6 min-h-[210px]
      ${state === 'loading' ? 'border-blue-500' : ''}
      ${state === 'result' ? 'border-green-500' : ''}
      ${state === 'error' ? 'border-red-500' : ''}
      ${state === 'empty' ? 'border-slate-200 opacity-60 grayscale pointer-events-none' : ''}
      hover:shadow-md`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="bg-slate-50 rounded-full p-2 flex items-center justify-center">{<Icon className="w-6 h-6" />}</span>
        <span className="font-semibold text-lg">{label}</span>
        <span className="ml-auto flex items-center gap-1">{statusIcons[state]}<span className="text-xs font-medium">{statusLabels[state]}</span></span>
      </div>
      <div className="flex items-center gap-4 mb-2">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Critical Findings</span>
          <span className={`font-bold text-base ${findings.critical > 0 ? 'text-red-600' : 'text-green-700'}`}>{findings.critical}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">Total Findings</span>
          <span className="font-bold text-base text-slate-700">{findings.total}</span>
        </div>
        <div className="flex-1 flex flex-col">
          <span className="text-xs text-slate-500">Utilization</span>
          <MiniBar value={findings.utilization} />
        </div>
      </div>
      <button
        className="mt-auto ml-auto px-3 py-1 rounded bg-primary text-white text-xs font-semibold disabled:opacity-60"
        onClick={onViewDetails}
        disabled={state === 'empty'}
      >
        View Details
      </button>
      {state === 'loading' && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}
    </div>
  )
}

function SummarySection() {
  return (
    <div className="bg-white rounded-xl border p-6 mb-8 shadow-sm flex flex-col md:flex-row md:items-center md:gap-8 gap-4">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold">89%</span>
          <span className="text-xs bg-green-100 text-green-700 rounded px-2 py-0.5 font-semibold">Compliant</span>
          <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-2 py-0.5 font-semibold">Risk: Medium</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4 text-yellow-500" />4 Critical Findings</span>
          <span className="flex items-center gap-1"><ArrowUpRight className="w-4 h-4 text-green-500" />+2.5% since last audit</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 rounded px-2 py-0.5 font-semibold">SOC 2</span>
          <span className="text-xs bg-slate-100 text-slate-700 rounded px-2 py-0.5 font-semibold">ISO 27001</span>
          <span className="text-xs bg-slate-100 text-slate-700 rounded px-2 py-0.5 font-semibold">PCI DSS</span>
        </div>
        <button className="mt-2 px-4 py-1 rounded bg-primary text-white text-xs font-semibold w-max">Download Executive Summary</button>
      </div>
    </div>
  )
}

function HeaderSection() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
      <div>
        <h1 className="text-3xl font-bold mb-1">GCP Audit Report</h1>
        <div className="text-sm text-slate-500 flex gap-4">
          <span>Date: 2024-06-01</span>
          <span>Project: XYZ</span>
          <span>Environment: Production</span>
          <span>Status: <span className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs font-semibold">In Progress</span></span>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded border text-slate-700 bg-white font-semibold text-xs">Export</button>
        <button className="px-3 py-1 rounded border text-slate-700 bg-white font-semibold text-xs">Share</button>
        <button className="px-3 py-1 rounded border text-slate-700 bg-white font-semibold text-xs">Print</button>
      </div>
    </div>
  )
}

function DrillDownModal({ open, onClose, category }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl relative">
        <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-700" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold mb-4">{category} Details</h2>
        <div className="text-slate-500">(Placeholder for full table of findings, recommendations, resource-level details, filters, export/print options...)</div>
      </div>
    </div>
  )
}

export default function AuditPreviewPage() {
  // State: 'empty' | 'loading' | 'result' | 'error' for each section
  const [sectionStates, setSectionStates] = useState<Record<string, 'empty' | 'loading' | 'result' | 'error'>>({
    compute: 'empty',
    storage: 'empty',
    network: 'empty',
    security: 'empty',
    cost: 'empty',
    compliance: 'empty',
  })
  const [running, setRunning] = useState(false)
  const [modal, setModal] = useState<string | null>(null)

  // Simulate audit running and updating each section in sequence
  const runAudit = async () => {
    setRunning(true)
    let newStates = { ...sectionStates }
    for (const key of sectionOrder) {
      newStates[key] = 'loading'
      setSectionStates({ ...newStates })
      await new Promise(res => setTimeout(res, 1000))
      newStates[key] = 'result'
      setSectionStates({ ...newStates })
    }
    setRunning(false)
  }

  return (
    <div className="container mx-auto py-8">
      <HeaderSection />
      <SummarySection />
      <button
        className="mb-8 px-6 py-2 rounded bg-primary text-white font-semibold disabled:opacity-60"
        onClick={runAudit}
        disabled={running}
      >
        {running ? 'Running Audit...' : 'Run Full Audit'}
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map(cat => (
          <CategoryCard
            key={cat.key}
            label={cat.label}
            icon={cat.icon}
            state={sectionStates[cat.key]}
            findings={demoFindings[cat.key]}
            onViewDetails={() => setModal(cat.label)}
          />
        ))}
      </div>
      <DrillDownModal open={!!modal} onClose={() => setModal(null)} category={modal} />
    </div>
  )
} 