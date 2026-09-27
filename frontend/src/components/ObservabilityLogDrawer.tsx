import React, { useState } from 'react';
import { AgentActionLog } from '../types/index.js';
import {
  Terminal,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Code2
} from 'lucide-react';

interface ObservabilityLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  actions: AgentActionLog[];
}

export const ObservabilityLogDrawer: React.FC<ObservabilityLogDrawerProps> = ({
  isOpen,
  onClose,
  actions
}) => {
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedActionId(expandedActionId === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Agent Execution & Audit Trail</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                  {actions.length} Tool Actions
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Deterministic trace of all agent tools, inputs, outputs, and latencies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 font-mono text-xs">
          {actions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <p className="text-xs">No actions logged yet. Start a purchasing session to view execution trace.</p>
            </div>
          ) : (
            actions.map((act) => {
              const isExpanded = expandedActionId === act.id;
              const isSuccess = act.status === 'SUCCESS';

              return (
                <div
                  key={act.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden transition-all shadow-sm"
                >
                  {/* Action Summary Bar */}
                  <div
                    onClick={() => toggleExpand(act.id)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <button className="text-slate-400 hover:text-slate-700">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-slate-400 font-bold">#{act.stepNumber}</span>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                        {act.toolName}()
                      </span>
                      {isSuccess ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SUCCESS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>FAILED</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-slate-500 text-[11px] font-semibold">
                      <div className="flex items-center space-x-1 text-cyan-700">
                        <Clock className="w-3 h-3" />
                        <span>{act.executionTimeMs}ms</span>
                      </div>
                      <span className="text-slate-400">
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Explanation text */}
                  <div className="px-3.5 pb-2.5 text-[11px] text-slate-700 font-sans leading-relaxed">
                    {act.explanation}
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5 text-[11px]">
                      <div>
                        <div className="flex items-center space-x-1 text-slate-400 mb-1">
                          <Code2 className="w-3 h-3 text-cyan-400" />
                          <span className="font-bold uppercase text-[10px]">Tool Input:</span>
                        </div>
                        <pre className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto font-mono text-[11px]">
                          {JSON.stringify(act.input, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <div className="flex items-center space-x-1 text-slate-400 mb-1">
                          <Code2 className="w-3 h-3 text-emerald-400" />
                          <span className="font-bold uppercase text-[10px]">Tool Output:</span>
                        </div>
                        <pre className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 overflow-x-auto font-mono text-[11px]">
                          {JSON.stringify(act.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
