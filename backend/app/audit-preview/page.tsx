import { CircleIcon, Loader2Icon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { ReactElement } from 'react';
import React from 'react';

// Add type definitions
type StatusType = 'empty' | 'loading' | 'result' | 'error';

const statusIcons: Record<StatusType, ReactElement> = {
  empty: <CircleIcon className="h-4 w-4" />,
  loading: <Loader2Icon className="h-4 w-4 animate-spin" />,
  result: <CheckCircleIcon className="h-4 w-4" />,
  error: <XCircleIcon className="h-4 w-4" />
};

const statusLabels: Record<StatusType, string> = {
  empty: 'No Data',
  loading: 'Loading...',
  result: 'Complete',
  error: 'Error'
};

// Add type for state
type StateType = StatusType;

// Add type for demoFindings
interface FindingStats {
  critical: number;
  total: number;
  utilization: number;
}

interface DemoFindings {
  compute: FindingStats;
  storage: FindingStats;
  network: FindingStats;
  security: FindingStats;
  cost: FindingStats;
  compliance: FindingStats;
}

const demoFindings: DemoFindings = {
  compute: { critical: 2, total: 10, utilization: 0.8 },
  storage: { critical: 1, total: 8, utilization: 0.6 },
  network: { critical: 0, total: 5, utilization: 0.4 },
  security: { critical: 3, total: 12, utilization: 0.9 },
  cost: { critical: 1, total: 6, utilization: 0.5 },
  compliance: { critical: 2, total: 9, utilization: 0.7 }
};

export default function AuditPreview() {
  const [state, setState] = React.useState<StateType>('empty');

  return (
    <div>
      <span className="ml-auto flex items-center gap-1">
        {statusIcons[state]}
        <span className="text-xs font-medium">{statusLabels[state]}</span>
      </span>
      {Object.entries(demoFindings).map(([key, value]) => (
        <div key={key}>
          <span>Findings: {value.total}</span>
        </div>
      ))}
    </div>
  );
} 