import React from 'react';
import { Sparkles, Laptop, Cpu, Zap, AlertTriangle, Clock } from 'lucide-react';

interface Preset {
  id: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
  tag: string;
  tagColor: string;
}

interface DemoPromptSelectorProps {
  onSelectPrompt: (prompt: string) => void;
  disabled: boolean;
}

export const DEMO_PRESETS: Preset[] = [
  {
    id: 'dev-laptop-80k',
    label: 'Developer Laptop under ₹80k',
    prompt: 'I need a laptop under ₹80,000 for software development, preferably 16GB RAM, 512GB SSD and good battery life.',
    icon: <Laptop className="w-4 h-4 text-emerald-600" />,
    tag: 'Primary Scenario',
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 'budget-coding-55k',
    label: 'Budget Coding Rig under ₹55k',
    prompt: 'Looking for a programming laptop below 55000 with minimum 16GB RAM and fast SSD.',
    icon: <Cpu className="w-4 h-4 text-cyan-600" />,
    tag: 'Cost-Conscious',
    tagColor: 'bg-cyan-50 text-cyan-800 border-cyan-200'
  },
  {
    id: 'urgent-nextday',
    label: 'Urgent Next-Day Delivery',
    prompt: 'Urgent: I need a 16GB RAM developer laptop with next day delivery under ₹85,000.',
    icon: <Clock className="w-4 h-4 text-amber-600" />,
    tag: 'SLA Delivery',
    tagColor: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    id: 'high-end-ml',
    label: 'AI / Machine Learning Rig',
    prompt: 'I need a high performance laptop under 1.5 lakhs for Machine Learning with 32GB RAM and dedicated NVIDIA GPU.',
    icon: <Zap className="w-4 h-4 text-purple-600" />,
    tag: 'High-Compute',
    tagColor: 'bg-purple-50 text-purple-800 border-purple-200'
  },
  {
    id: 'impossible-budget',
    label: 'Unachievable Constraints (Edge Case)',
    prompt: 'Need an ultrabook under ₹25,000 with 32GB RAM and 2TB SSD.',
    icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
    tag: 'Rejection Test',
    tagColor: 'bg-rose-50 text-rose-800 border-rose-200'
  }
];

export const DemoPromptSelector: React.FC<DemoPromptSelectorProps> = ({
  onSelectPrompt,
  disabled
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-2.5">
        <Sparkles className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Quick Demo Presets
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {DEMO_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPrompt(preset.prompt)}
            disabled={disabled}
            className="flex flex-col text-left p-3 rounded-2xl bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-emerald-50 transition-colors">
                {preset.icon}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${preset.tagColor}`}>
                {preset.tag}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-snug">
              {preset.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
