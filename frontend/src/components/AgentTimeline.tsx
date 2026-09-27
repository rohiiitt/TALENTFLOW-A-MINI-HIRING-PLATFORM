import React from 'react';
import { AgentStatus } from '../types/index.js';
import {
  FileText,
  Search,
  CheckCircle2,
  GitCompare,
  Sparkles,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface TimelineStep {
  key: AgentStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: TimelineStep[] = [
  {
    key: 'REQUIREMENTS_EXTRACTED',
    label: 'Requirement Extraction',
    description: 'Parsing buyer criteria & hard constraints',
    icon: FileText
  },
  {
    key: 'RESEARCHING',
    label: 'Catalog Investigation',
    description: 'Scanning live inventory & specifications',
    icon: Search
  },
  {
    key: 'OPTIONS_COMPARED',
    label: 'Multi-Criteria Scoring',
    description: 'Hard filtering & weighted MCDA evaluation',
    icon: GitCompare
  },
  {
    key: 'WAITING_APPROVAL',
    label: 'Decision & Approval',
    description: 'Autonomous selection & buyer sign-off',
    icon: Sparkles
  },
  {
    key: 'PURCHASE_COMPLETED',
    label: 'Order Placement',
    description: 'Atomic order mutation & stock decrement',
    icon: CreditCard
  },
  {
    key: 'VALIDATED',
    label: 'Independent Validation',
    description: 'Post-purchase verification checklist',
    icon: ShieldCheck
  }
];

interface AgentTimelineProps {
  currentStatus: AgentStatus;
  isFailed?: boolean;
}

const STATUS_ORDER: AgentStatus[] = [
  'REQUEST_RECEIVED',
  'REQUIREMENTS_EXTRACTED',
  'RESEARCHING',
  'OPTIONS_FOUND',
  'OPTIONS_COMPARED',
  'DECISION_MADE',
  'WAITING_APPROVAL',
  'PURCHASE_INITIATED',
  'PURCHASE_COMPLETED',
  'VALIDATING',
  'VALIDATED'
];

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ currentStatus, isFailed }) => {
  const getStepIndex = (status: AgentStatus) => STATUS_ORDER.indexOf(status);
  const currentIndex = getStepIndex(currentStatus);

  const getStepStatus = (stepKey: AgentStatus) => {
    const stepIdx = getStepIndex(stepKey);
    if (isFailed && currentIndex <= stepIdx) return 'failed';
    if (currentIndex > stepIdx) return 'completed';
    if (currentIndex === stepIdx || (stepKey === 'OPTIONS_COMPARED' && currentStatus === 'OPTIONS_FOUND')) return 'active';
    return 'pending';
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 mb-6 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <span>Agent Lifecycle Flow</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
          </h2>
          <p className="text-xs text-slate-500">
            Real-time autonomous purchasing execution pipeline
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-mono font-medium">Current State:</span>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {currentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STEPS.map((step, idx) => {
          const status = getStepStatus(step.key);
          const Icon = step.icon;

          let cardStyle = 'bg-slate-50 border-slate-200 text-slate-600';
          let iconStyle = 'bg-slate-200 text-slate-600';

          if (status === 'completed') {
            cardStyle = 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-sm';
            iconStyle = 'bg-emerald-100 text-emerald-700 border border-emerald-300';
          } else if (status === 'active') {
            cardStyle = 'bg-cyan-50 border-cyan-300 text-cyan-950 ring-2 ring-cyan-400/30 shadow-sm';
            iconStyle = 'bg-cyan-100 text-cyan-700 border border-cyan-300 animate-pulse';
          } else if (status === 'failed') {
            cardStyle = 'bg-rose-50 border-rose-200 text-rose-950';
            iconStyle = 'bg-rose-100 text-rose-700 border border-rose-300';
          }

          return (
            <div
              key={step.key}
              className={`flex flex-col p-3.5 rounded-2xl border transition-all relative overflow-hidden ${cardStyle}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-xl ${iconStyle}`}>
                  {status === 'active' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-700" />
                  ) : status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : status === 'failed' ? (
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  Step {idx + 1}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 mb-0.5">
                {step.label}
              </h3>
              <p className="text-[11px] text-slate-500 leading-tight">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
