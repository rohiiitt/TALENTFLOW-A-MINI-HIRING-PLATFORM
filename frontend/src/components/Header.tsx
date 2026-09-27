import React from 'react';
import { User } from '../types/index.js';
import {
  Bot,
  RefreshCw,
  ShoppingBag,
  Terminal,
  User as UserIcon,
  LogOut,
  Layers,
  LayoutDashboard,
  Cpu
} from 'lucide-react';

interface HeaderProps {
  currentView: 'agent' | 'admin';
  onNavigate: (view: 'agent' | 'admin') => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onReset: () => void;
  onOpenLogs: () => void;
  onOpenOrders: () => void;
  onOpenCatalog: () => void;
  actionsCount: number;
  catalogCount: number;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
  onReset,
  onOpenLogs,
  onOpenOrders,
  onOpenCatalog,
  actionsCount,
  catalogCount,
  isProcessing
}) => {
  return (
    <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mode Navigation */}
        <div className="flex items-center space-x-6">
          <div
            onClick={() => onNavigate('agent')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">TalentFlow</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  AI Purchasing Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Enterprise Autonomous Procurement Engine
              </p>
            </div>
          </div>

          {/* View Switcher Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => onNavigate('agent')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                currentView === 'agent'
                  ? 'bg-white text-emerald-700 font-bold shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>Purchasing Agent</span>
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 ${
                currentView === 'admin'
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 font-bold'
              }`}
              title="Open Standalone Enterprise Admin Operations Console"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Admin Console ↗</span>
              {user?.role === 'ADMIN' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </nav>
        </div>

        {/* Right Tools & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenCatalog}
            className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all shadow-sm"
            title="Browse Hardware Catalog"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Catalog ({catalogCount})</span>
          </button>

          <button
            onClick={onOpenOrders}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all shadow-sm"
            title="View Orders History"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Orders</span>
          </button>

          <button
            onClick={onOpenLogs}
            className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all shadow-sm"
            title="Open Agent Audit Log"
          >
            <Terminal className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline">Audit Log</span>
            {actionsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                {actionsCount}
              </span>
            )}
          </button>

          {/* User Auth Profile / Login Button */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:block text-right">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {user.role}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Login / Sign Up</span>
            </button>
          )}

          <button
            onClick={onReset}
            disabled={isProcessing}
            className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
            title="Reset Catalog & Database"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
