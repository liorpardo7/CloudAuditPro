import React from 'react';
import Link from 'next/link';

export default function Sidebar() {
  return (
    <nav className="grid items-start gap-2">
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/">
        Dashboard
      </a>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/audits">
        Audits
      </a>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/audit">
        New Audit
      </a>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/security">
        Security
      </a>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/compute">
        Compute
      </a>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/storage">
        Storage
      </a>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/network">
        Network
      </a>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/cost">
        Cost
      </a>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/settings">
        Settings
      </a>
      {/* --- BigQuery Section --- */}
      <div className="pl-4 text-xs font-semibold text-gray-500">BigQuery</div>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/bigquery">
        Overview
      </a>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/bigquery/stale-partitioning">
        Stale Partitioning
      </a>
      <a className="flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground opacity-80" href="/bigquery/deprecated-udfs">
        Deprecated SQL UDFs
      </a>
    </nav>
  );
} 