import React from 'react';
import { ExtractedRequirements } from '../types/index.js';
import { Check, ShieldAlert, Cpu, HardDrive, DollarSign, Package, Clock, Tag } from 'lucide-react';

interface RequirementsPanelProps {
  requirements: ExtractedRequirements | null;
}

export const RequirementsPanel: React.FC<RequirementsPanelProps> = ({ requirements }) => {
  if (!requirements) return null;

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 mb-6 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200/80 pb-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Structured Requirements Extracted</h2>
            <p className="text-xs text-slate-500">Parsed buyer criteria & constraints</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          NLP Parser: 100% Extracted
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Budget Max</span>
          </div>
          <p className="text-sm font-bold text-slate-900 font-mono">
            {requirements.budgetMax ? `₹${requirements.budgetMax.toLocaleString('en-IN')}` : 'Unlimited'}
          </p>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-600" />
            <span>Min RAM</span>
          </div>
          <p className="text-sm font-bold text-slate-900 font-mono">
            {requirements.ramMinGb ? `${requirements.ramMinGb} GB` : 'Any'}
          </p>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
            <span>Min Storage</span>
          </div>
          <p className="text-sm font-bold text-slate-900 font-mono">
            {requirements.storageMinGb ? (requirements.storageMinGb >= 1024 ? `${requirements.storageMinGb / 1024} TB` : `${requirements.storageMinGb} GB`) : 'Any'}
          </p>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <Package className="w-3.5 h-3.5 text-amber-600" />
            <span>Quantity</span>
          </div>
          <p className="text-sm font-bold text-slate-900 font-mono">
            {requirements.quantity || 1} Unit(s)
          </p>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Max Delivery</span>
          </div>
          <p className="text-sm font-bold text-slate-900 font-mono">
            {requirements.maxDeliveryDays ? `≤ ${requirements.maxDeliveryDays} Days` : 'Standard SLA'}
          </p>
        </div>

        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <Tag className="w-3.5 h-3.5 text-purple-600" />
            <span>Use Case</span>
          </div>
          <p className="text-xs font-bold text-slate-900 truncate" title={requirements.useCase || 'General'}>
            {requirements.useCase || 'General'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hard Constraints */}
        <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80">
          <div className="flex items-center space-x-2 mb-2 text-xs font-bold text-rose-900 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Hard Constraints (Non-Negotiable)</span>
          </div>
          <ul className="space-y-1.5">
            {requirements.hardConstraints.length > 0 ? (
              requirements.hardConstraints.map((c, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{c}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 italic">No hard elimination constraints specified</li>
            )}
          </ul>
        </div>

        {/* Soft Preferences */}
        <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80">
          <div className="flex items-center space-x-2 mb-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Soft Preferences (Scoring Weights)</span>
          </div>
          <ul className="space-y-1.5">
            {requirements.softPreferences.length > 0 ? (
              requirements.softPreferences.map((p, i) => (
                <li key={i} className="text-xs text-slate-700 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>{p}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-500 italic">Default balanced MCDA weights applied</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
