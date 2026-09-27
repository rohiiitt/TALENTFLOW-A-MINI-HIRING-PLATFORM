import React, { useState } from 'react';
import { Product } from '../types/index.js';
import { ShoppingBag, X, Search, Star, Cpu, HardDrive } from 'lucide-react';

interface CatalogBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectForPrompt?: (productName: string) => void;
}

export const CatalogBrowserModal: React.FC<CatalogBrowserModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectForPrompt
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.specifications.cpu.toLowerCase().includes(term) ||
      p.specifications.ram.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] flex flex-col overflow-hidden text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Enterprise Hardware Catalog</h3>
              <p className="text-xs text-slate-500">
                Audited products available for autonomous agent procurement ({products.length} models)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="py-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by model, brand, processor, or specs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-xs"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between hover:border-cyan-300 transition-all group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-cyan-700">{p.brand}</span>
                    {p.source && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-slate-200 text-slate-700 border border-slate-300">
                        {p.source === 'MANUFACTURER' ? 'OEM' : p.source === 'RETAILER_API' ? 'Retailer' : 'Imported'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-amber-600 text-[11px] font-bold">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{p.rating}</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-900 group-hover:text-cyan-800 transition-colors line-clamp-1">
                  {p.name}
                </h4>
                {p.sku && <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.sku}</div>}

                <p className="text-[11px] text-slate-600 my-2 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div className="space-y-1 text-[10px] text-slate-700 font-medium py-2 border-t border-slate-200/80">
                  <div className="flex items-center space-x-1">
                    <Cpu className="w-3 h-3 text-cyan-600 shrink-0" />
                    <span className="truncate">{p.specifications.cpu}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HardDrive className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{p.specifications.ram} • {p.specifications.storage}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>
                  <span className={`block text-[10px] font-semibold ${p.stock > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {p.stock > 0 ? `${p.stock} units available` : 'Out of Stock'}
                  </span>
                </div>

                {onSelectForPrompt && (
                  <button
                    onClick={() => {
                      onSelectForPrompt(`I need a ${p.name} with ${p.specifications.ram} and ${p.specifications.storage}`);
                      onClose();
                    }}
                    className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-cyan-600 hover:text-white text-slate-800 text-[11px] font-bold transition-all shadow-xs"
                  >
                    Select
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
