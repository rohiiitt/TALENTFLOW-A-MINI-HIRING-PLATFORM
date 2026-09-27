import React, { useState } from 'react';
import { CandidateEvaluation } from '../types/index.js';
import { CheckCircle2, XCircle, Star, Truck, Check, AlertOctagon } from 'lucide-react';

interface CandidateComparisonMatrixProps {
  evaluations: CandidateEvaluation[];
  selectedProductId: string | null;
}

export const CandidateComparisonMatrix: React.FC<CandidateComparisonMatrixProps> = ({
  evaluations,
  selectedProductId
}) => {
  const [filter, setFilter] = useState<'all' | 'passed' | 'eliminated'>('all');

  if (!evaluations || evaluations.length === 0) return null;

  const filteredCandidates = evaluations.filter((c) => {
    if (filter === 'passed') return c.hardConstraintsPass;
    if (filter === 'eliminated') return !c.hardConstraintsPass;
    return true;
  });

  const passedCount = evaluations.filter((c) => c.hardConstraintsPass).length;
  const eliminatedCount = evaluations.filter((c) => !c.hardConstraintsPass).length;

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 mb-6 border border-slate-200/90 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-200/80 pb-3.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <span>Candidate Comparison & Decision Matrix</span>
            <span className="px-2.5 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700 font-bold font-mono border border-slate-200">
              {evaluations.length} Evaluated
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Multi-criteria weighted evaluation and elimination audit
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({evaluations.length})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1 ${
              filter === 'passed'
                ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-sm'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Passed ({passedCount})</span>
          </button>
          <button
            onClick={() => setFilter('eliminated')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1 ${
              filter === 'eliminated'
                ? 'bg-rose-50 text-rose-800 font-bold border border-rose-200 shadow-sm'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Eliminated ({eliminatedCount})</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <th className="pb-3 pr-4">Product</th>
              <th className="pb-3 px-3">Price</th>
              <th className="pb-3 px-3">Specs</th>
              <th className="pb-3 px-3">Stock & Delivery</th>
              <th className="pb-3 px-3">Hard Constraints</th>
              <th className="pb-3 px-3">MCDA Soft Score</th>
              <th className="pb-3 pl-3 text-right">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCandidates.map((c) => {
              const isSelected = c.productId === selectedProductId;

              return (
                <tr
                  key={c.productId}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/70 ring-1 ring-emerald-500/40'
                      : !c.hardConstraintsPass
                      ? 'bg-rose-50/20 opacity-80 hover:opacity-100'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center space-x-2">
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{c.productName}</span>
                          {isSelected && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Selected
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">{c.brand}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-mono font-bold text-slate-900">
                      ₹{c.price.toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-amber-600 font-medium">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{c.rating} / 5</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 max-w-xs">
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {c.specsSummary}
                    </p>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-700 font-medium mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{c.stock > 0 ? `${c.stock} in stock` : 'Out of Stock'}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                      <Truck className="w-3 h-3 text-cyan-600" />
                      <span>{c.deliveryDays} day(s) SLA</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    {c.hardConstraintsPass ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>All Passed</span>
                      </span>
                    ) : (
                      <div className="group relative">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 cursor-help">
                          <AlertOctagon className="w-3 h-3 text-rose-600" />
                          <span>Eliminated</span>
                        </span>
                        {c.eliminationReason && (
                          <div className="text-[10px] text-rose-700 font-medium mt-1 max-w-xs leading-tight">
                            {c.eliminationReason}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.hardConstraintsPass
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.min(100, c.totalWeightedScore)}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        {c.totalWeightedScore}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                      P: {c.softScores.priceScore} | S: {c.softScores.specScore} | R: {c.softScores.ratingScore}
                    </div>
                  </td>

                  <td className="py-3.5 pl-3 text-right">
                    {isSelected ? (
                      <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                        Best Match
                      </span>
                    ) : c.hardConstraintsPass ? (
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200">
                        Viable Alt
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200">
                        Rejected
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
