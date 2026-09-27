import React, { useEffect, useState } from 'react';
import { Order } from '../types/index.js';
import { ShoppingBag, X, CheckCircle2, Clock, MapPin, Receipt, Loader2, RefreshCw } from 'lucide-react';

interface OrdersHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrdersHistoryModal: React.FC<OrdersHistoryModalProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/90 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Purchased Orders Database
              </h3>
              <p className="text-xs text-slate-500">
                All confirmed purchases placed by the AI Purchasing Agent
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadOrders}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs">Loading orders from database...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No Orders Placed Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Execute a purchasing query, review the recommended product, and click "Authorize & Place Purchase Order" to generate a verified order.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 hover:border-emerald-300 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-bold text-emerald-700">
                        {order.id}
                      </span>
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{order.status}</span>
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {order.productName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 font-mono">
                      ₹{order.totalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium">
                      Qty: {order.quantity} unit(s)
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span className="truncate" title={order.deliveryAddress}>
                      {order.deliveryAddress}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:justify-end text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
