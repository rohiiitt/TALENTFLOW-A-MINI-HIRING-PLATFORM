import React from 'react';
import { ValidationReport, Order } from '../types/index.js';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Receipt,
  FileCheck
} from 'lucide-react';

interface ValidationReportViewProps {
  report: ValidationReport | null;
  order: Order | null;
}

export const ValidationReportView: React.FC<ValidationReportViewProps> = ({ report, order }) => {
  if (!report) return null;

  const isPassed = report.overallStatus === 'PASSED';
  const passedCount = report.items.filter((i) => i.passed).length;
  const totalCount = report.items.length;

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-6 border border-slate-200/90 shadow-sm">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <div
            className={`p-3 rounded-2xl ${
              isPassed
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                : 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm'
            }`}
          >
            {isPassed ? <ShieldCheck className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isPassed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                Independent Audit: {report.overallStatus}
              </span>
              <span className="text-xs text-slate-500 font-mono font-bold">
                {passedCount}/{totalCount} Checks Verified
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">
              {isPassed ? 'Order Verification & Validation Certificate' : 'Post-Purchase Validation Alert'}
            </h2>
          </div>
        </div>

        {order && (
          <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 flex items-center space-x-3 shadow-sm">
            <Receipt className="w-4 h-4 text-cyan-600" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Confirmed Order ID</span>
              <span className="text-sm font-black text-slate-900 font-mono">{order.id}</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Message */}
      <div
        className={`p-4 rounded-2xl mb-6 text-xs leading-relaxed ${
          isPassed
            ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-medium'
            : 'bg-rose-50/80 border border-rose-200 text-rose-950 font-medium'
        }`}
      >
        <div className="flex items-center space-x-2 font-bold mb-1">
          <FileCheck className="w-4 h-4" />
          <span>Independent Verification Summary</span>
        </div>
        <p>{report.summary}</p>
      </div>

      {/* Checklist Grid */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Comprehensive Audit Checklist
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.items.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                item.passed
                  ? 'bg-slate-50/60 border-slate-200/90 hover:border-emerald-300'
                  : 'bg-rose-50/40 border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <h4 className="text-xs font-bold text-slate-900">
                    {item.criterion}
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    item.passed
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {item.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>

              <p className="text-[11px] text-slate-600 mb-2.5">{item.details}</p>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-slate-200/80">
                <div className="text-slate-500">
                  <span className="text-slate-400 block font-bold">Expected:</span>
                  <span className="text-slate-700 truncate block font-semibold">{String(item.expected)}</span>
                </div>
                <div className="text-slate-500">
                  <span className="text-slate-400 block font-bold">Actual:</span>
                  <span className={item.passed ? 'text-emerald-700 truncate block font-bold' : 'text-rose-700 truncate block font-bold'}>
                    {String(item.actual)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Fulfillment Metadata */}
      {order && (
        <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-0.5 font-medium">Payment State</span>
            <span className="text-emerald-700 font-bold">{order.paymentStatus}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-0.5 font-medium">Fulfillment Status</span>
            <span className="text-cyan-700 font-bold">{order.deliveryStatus}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-0.5 font-medium">Delivery Timeline</span>
            <span className="text-slate-900 font-bold">{order.deliveryEstimateDays} business days</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-0.5 font-medium">Audited At</span>
            <span className="text-slate-900 font-mono font-bold text-[11px]">
              {new Date(report.validatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
