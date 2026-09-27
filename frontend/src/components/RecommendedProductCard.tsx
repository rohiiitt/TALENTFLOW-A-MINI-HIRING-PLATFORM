import React from 'react';
import { Product, DecisionSummary, AgentStatus } from '../types/index.js';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Star,
  Cpu,
  HardDrive,
  Battery,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface RecommendedProductCardProps {
  product: Product | null;
  decisionSummary: DecisionSummary | null;
  status: AgentStatus;
  onInitiatePurchase: () => void;
  isPurchasing: boolean;
}

export const RecommendedProductCard: React.FC<RecommendedProductCardProps> = ({
  product,
  decisionSummary,
  status,
  onInitiatePurchase,
  isPurchasing
}) => {
  if (!product || !decisionSummary) return null;

  const isPurchased = status === 'PURCHASE_COMPLETED' || status === 'VALIDATING' || status === 'VALIDATED';

  return (
    <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden border border-emerald-500/30 shadow-lg">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Agent Optimal Selection
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {Math.round(decisionSummary.confidenceScore * 100)}% Confidence Match
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {product.name}
            </h2>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            ₹{product.price.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Enterprise Tax Inclusive • Free Logistics
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Product Image & Key Badges */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video sm:aspect-4/3 group shadow-sm">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 flex flex-col space-y-1.5">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200 shadow-sm">
                {product.brand} {product.sku ? `• ${product.sku}` : ''}
              </span>
              {product.source && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md border ${
                  product.source === 'MANUFACTURER'
                    ? 'bg-blue-50/95 text-blue-800 border-blue-200'
                    : product.source === 'RETAILER_API'
                    ? 'bg-emerald-50/95 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50/95 text-slate-700 border-slate-200'
                }`}>
                  Source: {product.source === 'MANUFACTURER' ? 'Manufacturer OEM' : product.source === 'RETAILER_API' ? 'Retailer Live API' : 'Imported Catalog'}
                </span>
              )}
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 shadow-sm">
              <div className="flex items-center space-x-1 text-amber-600">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{product.rating} ({product.reviewsCount} reviews)</span>
              </div>
              <div className="flex items-center space-x-1 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{product.warrantyYears}y Warranty</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-700 font-medium">
                {product.stock} units ({product.stockType === 'VERIFIED_LIVE' ? 'Live Stock' : 'Imported'})
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-2">
              <Truck className="w-3.5 h-3.5 text-cyan-600" />
              <span className="text-slate-700 font-medium">
                {product.deliveryDays}-day ({product.deliveryType === 'EXPRESS_SLA' ? 'Express SLA' : 'Logistics'})
              </span>
            </div>
          </div>
        </div>

        {/* Specifications Grid & Rationale */}
        <div className="lg:col-span-8 flex flex-col space-y-5">
          {/* Spec badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200">
              <div className="flex items-center space-x-1 text-xs text-slate-500 mb-0.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-600" />
                <span>Processor</span>
              </div>
              <p className="text-xs font-bold text-slate-900 truncate" title={product.specifications.cpu}>
                {product.specifications.cpu}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200">
              <div className="flex items-center space-x-1 text-xs text-slate-500 mb-0.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>RAM</span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {product.specifications.ram}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200">
              <div className="flex items-center space-x-1 text-xs text-slate-500 mb-0.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                <span>Storage</span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {product.specifications.storage}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200">
              <div className="flex items-center space-x-1 text-xs text-slate-500 mb-0.5">
                <Battery className="w-3.5 h-3.5 text-teal-600" />
                <span>Battery</span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {product.specifications.batteryHours} Hours
              </p>
            </div>
          </div>

          {/* Rationale & Trade-off breakdown */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/90">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Why This Product Was Selected by the Agent</span>
              </h3>
              <ul className="space-y-1.5">
                {decisionSummary.keyReasonsForSelection.map((reason, idx) => (
                  <li key={idx} className="text-xs text-slate-800 flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-600" />
                <span>Trade-off & Multi-Candidate Comparative Analysis</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {decisionSummary.tradeOffAnalysis}
              </p>
            </div>
          </div>

          {/* Purchase Action Trigger / State */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              {isPurchased ? (
                <span className="text-emerald-700 font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Purchase authorized and processed successfully.</span>
                </span>
              ) : (
                <span>Human-in-the-loop safety protocol: Requires explicit confirmation.</span>
              )}
            </div>

            {!isPurchased && (
              <button
                onClick={onInitiatePurchase}
                disabled={isPurchasing || status === 'FAILED'}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Authorize & Place Purchase Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
