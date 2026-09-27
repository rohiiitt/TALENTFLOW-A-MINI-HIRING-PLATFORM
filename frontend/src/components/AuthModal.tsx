import React, { useState } from 'react';
import { api } from '../services/api.js';
import { User, UserRole } from '../types/index.js';
import {
  Lock,
  Mail,
  User as UserIcon,
  Building,
  ShieldCheck,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState<UserRole>('BUYER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.auth.login({ email, password });
        if (res.success) {
          onAuthSuccess(res.data.user, res.data.token);
          onClose();
        } else {
          setErrorMessage(res.error || 'Invalid credentials');
        }
      } else {
        const res = await api.auth.signup({ email, name, password, company, role });
        if (res.success) {
          onAuthSuccess(res.data.user, res.data.token);
          onClose();
        } else {
          setErrorMessage(res.error || 'Failed to register account');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.auth.login({ email: demoEmail, password: demoPass });
      if (res.success) {
        onAuthSuccess(res.data.user, res.data.token);
        onClose();
      } else {
        setErrorMessage(res.error || 'Demo login failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {mode === 'login' ? 'Sign In to TalentFlow' : 'Create Enterprise Account'}
            </h3>
            <p className="text-xs text-slate-500">
              Secure Role-Based Access Control & Procurement Logs
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* 1-Click Demo Accounts Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center space-x-1 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>1-Click Demo Accounts</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin@talentflow.ai', 'Admin@123')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 text-left transition-all group disabled:opacity-50 shadow-xs"
            >
              <div className="flex items-center space-x-1 text-emerald-700 text-[10px] font-bold uppercase">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Admin Login</span>
              </div>
              <span className="text-xs font-bold text-slate-800 block truncate mt-0.5">
                admin@talentflow.ai
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('dev.buyer@talentflow.ai', 'Buyer@123')}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white hover:bg-cyan-50/60 border border-slate-200 hover:border-cyan-300 text-left transition-all group disabled:opacity-50 shadow-xs"
            >
              <div className="flex items-center space-x-1 text-cyan-700 text-[10px] font-bold uppercase">
                <UserIcon className="w-3 h-3 text-cyan-600" />
                <span>Buyer Login</span>
              </div>
              <span className="text-xs font-bold text-slate-800 block truncate mt-0.5">
                dev.buyer@talentflow.ai
              </span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-4 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Company / Organization</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Tech Solutions"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Account Role</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="BUYER">Procurement Buyer (Hardware Purchasing)</option>
                  <option value="ADMIN">System Administrator (Catalog & Orders Control)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
