import React, { useState } from 'react';
import { Product, ExtractedRequirements } from '../types/index.js';
import {
  ShieldCheck,
  CreditCard,
  MapPin,
  Truck,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';

interface PurchaseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  requirements: ExtractedRequirements;
  onConfirm: (deliveryAddress: string, simulateFailure: boolean) => void;
  isProcessing: boolean;
}

export const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
  isOpen,
  onClose,
  product,
  requirements,
  onConfirm,
  isProcessing
}) => {
  const [address, setAddress] = useState(
    'Tech Ops Hub, Suite 400, Electronic City Phase 1, Bengaluru, KA 560100'
  );
  const [simulateFailure, setSimulateFailure] = useState(false);

  if (!isOpen) return null;

  const quantity = requirements.quantity || 1;
  const subtotal = product.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Purchase Authorization
            </h3>
            <p className="text-xs text-slate-500">
              Review order parameters before agent executes atomic mutation
            </p>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 mb-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Product</span>
              <h4 className="text-sm font-bold text-slate-900">{product.name}</h4>
              <p className="text-xs text-slate-600">{product.specifications.ram} • {product.specifications.storage}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium">Unit Price</span>
              <p className="text-sm font-bold text-slate-900 font-mono">₹{product.price.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Order Quantity:</span>
            <span className="font-bold text-slate-900">{quantity} unit(s)</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Logistics & Shipping:</span>
            <span className="text-emerald-700 font-bold flex items-center space-x-1">
              <Truck className="w-3.5 h-3.5" />
              <span>FREE Priority (Est. {product.deliveryDays} days)</span>
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono">
            <span className="text-sm font-bold text-slate-800">Total Purchase Commitment:</span>
            <span className="text-lg font-black text-emerald-700">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Delivery Address Input */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-600" />
            <span>Delivery Destination</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isProcessing}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors disabled:opacity-50"
          />
        </div>

        {/* Failure Simulation Mode Toggle */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-4 h-4 ${simulateFailure ? 'text-rose-600' : 'text-slate-400'}`} />
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Simulate Gateway / Order Failure
              </span>
              <span className="text-[10px] text-slate-500">
                Demonstrates agent failure handling and error isolation
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              disabled={isProcessing}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(address, simulateFailure)}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Order...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Authorize & Place Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
