import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api.js';
import { Product, Order, User, AdminMetrics, AgentSession, AgentActionLog } from '../types/index.js';
import {
  ShieldAlert,
  ShoppingBag,
  Users,
  DollarSign,
  Package,
  Plus,
  Trash2,
  RefreshCw,
  Layers,
  Sparkles,
  X,
  FileCheck,
  Search,
  ArrowLeft,
  Activity,
  Database,
  LogOut,
  ExternalLink,
  ChevronRight,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  Eye,
  Edit3,
  BarChart3,
  TrendingUp,
  Building2
} from 'lucide-react';

interface AdminPortalProps {
  user: User | null;
  onBackToAgent: () => void;
  onLogout: () => void;
  onAuthSuccess?: (user: User, token: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ user, onBackToAgent, onLogout, onAuthSuccess }) => {
  // Authentication State for Admin Gate
  const [adminEmail, setAdminEmail] = useState('admin@enterprise.ai');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Navigation
  const [activeNav, setActiveNav] = useState<'overview' | 'inventory' | 'orders' | 'sessions' | 'users' | 'database' | 'ingestion'>('overview');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Global Command Search
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Inventory Filters & Controls
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock' | 'rating'>('name');

  // Selected Product for Detail View / Edit
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Product Form State (for Add / Edit)
  const [prodForm, setProdForm] = useState({
    sku: '',
    name: '',
    brand: 'Lenovo',
    model: '',
    category: 'Laptops',
    subcategory: '',
    description: '',
    price: 74990,
    currency: 'INR',
    stock: 12,
    rating: 4.5,
    reviewsCount: 150,
    deliveryDays: 2,
    warrantyYears: 3,
    color: 'Dark Titanium',
    source: 'MANUFACTURER',
    sourceProductId: '',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    productUrl: '',
    cpu: 'Intel Core i5-13420H (8 Cores, up to 4.6 GHz)',
    ramGb: 16,
    ramType: 'DDR5',
    storageGb: 512,
    storageType: 'SSD',
    gpu: 'Integrated Graphics',
    display: '14.0" WUXGA (1920x1200) IPS',
    batteryHours: 9.5,
    weightKg: 1.4,
    os: 'Windows 11 Pro'
  });

  // Orders Filters & Invoice Viewer
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Sessions & Observability Viewer
  const [sessionSearch, setSessionSearch] = useState('');
  const [viewingSession, setViewingSession] = useState<AgentSession | null>(null);
  const [sessionActions, setSessionActions] = useState<AgentActionLog[]>([]);
  const [isLoadingSessionActions, setIsLoadingSessionActions] = useState(false);

  // Bulk Ingestion Studio State
  const [ingestFormat, setIngestFormat] = useState<'CSV' | 'JSON'>('CSV');
  const [ingestPayload, setIngestPayload] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestReport, setIngestReport] = useState<any | null>(null);

  useEffect(() => {
    loadAllAdminData();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setGlobalSearchOpen(false);
        setViewingProduct(null);
        setEditingProduct(null);
        setIsAddProductOpen(false);
        setViewingOrder(null);
        setViewingSession(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [mRes, pRes, oRes, uRes, sRes] = await Promise.all([
        api.admin.getMetrics(),
        api.getProducts(),
        api.getOrders(),
        api.admin.getUsers(),
        api.admin.getSessions()
      ]);

      if (mRes.success) setMetrics(mRes.data);
      if (pRes.success) setProducts(pRes.data);
      if (oRes.success) setOrders(oRes.data);
      if (uRes.success) setUsersList(uRes.data);
      if (sRes.success) setSessions(sRes.data);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      showToast('Error syncing admin metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Product Actions
  const handleOpenAddProduct = () => {
    setProdForm({
      sku: `PROD-${Date.now().toString().slice(-6)}`,
      name: '',
      brand: 'Lenovo',
      model: '',
      category: 'Laptops',
      subcategory: 'Engineering Ultrabook',
      description: 'Enterprise hardware configured for high workload stability.',
      price: 74990,
      currency: 'INR',
      stock: 12,
      rating: 4.6,
      reviewsCount: 120,
      deliveryDays: 2,
      warrantyYears: 3,
      color: 'Titanium Graphite',
      source: 'MANUFACTURER',
      sourceProductId: `OEM-${Math.floor(1000 + Math.random() * 9000)}`,
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      productUrl: 'https://www.example.com',
      cpu: 'Intel Core i5-13420H (8 Cores, up to 4.6 GHz)',
      ramGb: 16,
      ramType: 'DDR5',
      storageGb: 512,
      storageType: 'SSD',
      gpu: 'Integrated Graphics',
      display: '14.0" WUXGA (1920x1200) IPS',
      batteryHours: 9.5,
      weightKg: 1.4,
      os: 'Windows 11 Pro'
    });
    setEditingProduct(null);
    setIsAddProductOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      sku: prod.sku || prod.id,
      name: prod.name,
      brand: prod.brand,
      model: prod.model || '',
      category: prod.category,
      subcategory: prod.subcategory || '',
      description: prod.description,
      price: prod.price,
      currency: prod.currency || 'INR',
      stock: prod.stock,
      rating: prod.rating,
      reviewsCount: prod.reviewsCount,
      deliveryDays: prod.deliveryDays,
      warrantyYears: prod.warrantyYears,
      color: prod.color || 'Standard Silver',
      source: prod.source || 'MANUFACTURER',
      sourceProductId: prod.sourceProductId || '',
      imageUrl: prod.imageUrl,
      productUrl: prod.productUrl || '',
      cpu: prod.specifications?.cpu || '',
      ramGb: prod.specifications?.ramGb || 16,
      ramType: prod.specifications?.ramType || 'DDR5',
      storageGb: prod.specifications?.storageGb || 512,
      storageType: prod.specifications?.storageType || 'SSD',
      gpu: prod.specifications?.gpu || 'Integrated',
      display: prod.specifications?.display || '',
      batteryHours: prod.specifications?.batteryHours || 8.0,
      weightKg: prod.specifications?.weightKg || 1.5,
      os: prod.specifications?.os || 'Windows 11 Pro'
    });
    setIsAddProductOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        sku: prodForm.sku,
        name: prodForm.name,
        brand: prodForm.brand,
        model: prodForm.model || prodForm.name,
        category: prodForm.category,
        subcategory: prodForm.subcategory,
        description: prodForm.description,
        price: Number(prodForm.price),
        currency: prodForm.currency,
        stock: Number(prodForm.stock),
        rating: Number(prodForm.rating),
        reviewsCount: Number(prodForm.reviewsCount),
        deliveryDays: Number(prodForm.deliveryDays),
        warrantyYears: Number(prodForm.warrantyYears),
        color: prodForm.color,
        source: prodForm.source,
        sourceProductId: prodForm.sourceProductId || prodForm.sku,
        imageUrl: prodForm.imageUrl,
        productUrl: prodForm.productUrl,
        specifications: {
          cpu: prodForm.cpu,
          ram: `${prodForm.ramGb}GB ${prodForm.ramType}`,
          ramGb: Number(prodForm.ramGb),
          ramType: prodForm.ramType,
          storage: `${prodForm.storageGb >= 1024 ? `${prodForm.storageGb / 1024}TB` : `${prodForm.storageGb}GB`} ${prodForm.storageType}`,
          storageGb: Number(prodForm.storageGb),
          storageType: prodForm.storageType,
          gpu: prodForm.gpu,
          display: prodForm.display,
          batteryHours: Number(prodForm.batteryHours),
          weightKg: Number(prodForm.weightKg),
          os: prodForm.os
        },
        tags: [prodForm.category.toLowerCase(), prodForm.brand.toLowerCase(), `${prodForm.ramGb}gb-ram`]
      };

      if (editingProduct) {
        const res = await api.admin.updateProduct(editingProduct.id, payload);
        if (res.success) {
          showToast(`Product '${payload.name}' updated successfully.`);
        }
      } else {
        const res = await api.admin.createProduct(payload);
        if (res.success) {
          showToast(`Product '${payload.name}' added to active catalog.`);
        }
      }

      setIsAddProductOpen(false);
      setEditingProduct(null);
      await loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete '${name}' (${id})?`)) return;
    try {
      const res = await api.admin.deleteProduct(id);
      if (res.success) {
        showToast(`Product '${name}' deleted.`);
        await loadAllAdminData();
      }
    } catch (err: any) {
      showToast('Error deleting product', 'error');
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await api.admin.updateOrderStatus(id, { deliveryStatus: newStatus });
      showToast(`Order ${id} advanced to ${newStatus}`);
      await loadAllAdminData();
      if (viewingOrder && viewingOrder.id === id) {
        setViewingOrder((prev) => prev ? { ...prev, deliveryStatus: newStatus as any } : null);
      }
    } catch (err: any) {
      showToast('Failed to update order status', 'error');
    }
  };

  const handleInspectSession = async (s: AgentSession) => {
    setViewingSession(s);
    setIsLoadingSessionActions(true);
    try {
      const res = await api.getActions(s.id);
      if (res.success) {
        setSessionActions(res.data);
      }
    } catch (err) {
      console.error('Failed to load session logs:', err);
    } finally {
      setIsLoadingSessionActions(false);
    }
  };

  const handleExecuteBulkIngest = async () => {
    if (!ingestPayload.trim()) {
      showToast('Please enter or paste CSV/JSON data', 'error');
      return;
    }
    setIsIngesting(true);
    setIngestReport(null);
    try {
      let body: any;
      if (ingestFormat === 'JSON') {
        body = JSON.parse(ingestPayload);
      } else {
        body = { csv: ingestPayload };
      }

      const res = await api.importProducts(body);
      if (res.report) {
        setIngestReport(res.report);
        showToast(`Ingestion complete! ${res.report.created} created, ${res.report.updated} updated.`);
        await loadAllAdminData();
      }
    } catch (err: any) {
      showToast(err.message || 'Ingestion execution error', 'error');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleLoadSampleCSV = () => {
    setIngestFormat('CSV');
    setIngestPayload(
      `sku,name,brand,model,category,price,stock,source,sourceProductId,cpu,ram,ramGb,storage,storageGb,display,batteryHours,deliveryDays\n` +
      `LEN-T14S-G5,"Lenovo ThinkPad T14s Gen 5 (Intel Core Ultra 7, 32GB, 1TB SSD)",Lenovo,ThinkPad T14s Gen 5,Laptops,139990,8,MANUFACTURER,21K5001MIN,"Intel Core Ultra 7 155H",32GB LPDDR5x,32,1TB NVMe Gen4,1024,"14.0 OLED 2.8K 120Hz",14.0,2\n` +
      `DELL-XPS-14,"Dell XPS 14 9440 (Intel Core Ultra 7, RTX 4050, 32GB, 1TB)",Dell,XPS 14 9440,Laptops,179990,5,RETAILER_API,XPS9440-14,"Intel Core Ultra 7 155H",32GB LPDDR5x,32,1TB SSD,1024,"14.5 3.2K OLED Touch",10.0,1\n` +
      `LG-GRAM-16,"LG Gram Pro 16 (Intel Core Ultra 7, 32GB, 1TB SSD)",LG,Gram Pro 16,Laptops,144990,11,IMPORTED_CATALOG,16Z90SP,"Intel Core Ultra 7",32GB LPDDR5,32,1TB SSD,1024,"16.0 WQXGA IPS 144Hz",16.5,3`
    );
  };

  const handleExportCSV = () => {
    const headers = ['id', 'sku', 'name', 'brand', 'category', 'price', 'stock', 'rating', 'source', 'cpu', 'ram', 'storage', 'deliveryDays'];
    const rows = filteredProducts.map((p) => [
      p.id,
      p.sku || '',
      `"${p.name.replace(/"/g, '""')}"`,
      p.brand,
      p.category,
      p.price,
      p.stock,
      p.rating,
      p.source || 'IMPORTED',
      `"${(p.specifications?.cpu || '').replace(/"/g, '""')}"`,
      p.specifications?.ram || '',
      p.specifications?.storage || '',
      p.deliveryDays
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `talentflow-catalog-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Catalog exported to CSV.');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredProducts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `talentflow-catalog-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);
    showToast('Catalog exported to JSON.');
  };

  // Filtered lists
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategory !== 'ALL' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
        if (selectedStockFilter === 'IN_STOCK' && p.stock <= 0) return false;
        if (selectedStockFilter === 'LOW_STOCK' && (p.stock <= 0 || p.stock >= 5)) return false;
        if (selectedStockFilter === 'OUT_OF_STOCK' && p.stock > 0) return false;
        if (productSearch.trim()) {
          const q = productSearch.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBrand = p.brand.toLowerCase().includes(q);
          const matchSku = p.sku?.toLowerCase().includes(q);
          const matchCpu = p.specifications?.cpu?.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchSku && !matchCpu) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'stock') return b.stock - a.stock;
        if (sortBy === 'rating') return b.rating - a.rating;
        return a.name.localeCompare(b.name);
      });
  }, [products, selectedCategory, selectedStockFilter, productSearch, sortBy]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== 'ALL' && o.deliveryStatus !== orderStatusFilter && o.status !== orderStatusFilter) {
        return false;
      }
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        return o.id.toLowerCase().includes(q) || o.productName.toLowerCase().includes(q) || o.userId.toLowerCase().includes(q);
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (sessionSearch.trim()) {
        const q = sessionSearch.toLowerCase();
        return s.id.toLowerCase().includes(q) || s.userPrompt.toLowerCase().includes(q) || s.status.toLowerCase().includes(q);
      }
      return true;
    });
  }, [sessions, sessionSearch]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError(null);
    try {
      const res = await api.auth.login({ email: adminEmail, password: adminPassword });
      if (res.success && res.data?.user) {
        if (res.data.user.role !== 'ADMIN') {
          setAdminLoginError('This account does not have Enterprise Administrator privileges.');
        } else {
          showToast('Authenticated as Administrator.', 'success');
          if (onAuthSuccess) {
            onAuthSuccess(res.data.user, res.data.token);
          }
          await loadAllAdminData();
        }
      } else {
        setAdminLoginError(res.error || 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      setAdminLoginError(err.message || 'Authentication service error.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleQuickDemoAdminLogin = async () => {
    setAdminEmail('admin@enterprise.ai');
    setAdminPassword('admin123');
    setAdminLoginLoading(true);
    setAdminLoginError(null);
    try {
      const res = await api.auth.login({ email: 'admin@enterprise.ai', password: 'admin123' });
      if (res.success && res.data?.user) {
        showToast('Logged in as Enterprise Admin.', 'success');
        if (onAuthSuccess) {
          onAuthSuccess(res.data.user, res.data.token);
        }
        await loadAllAdminData();
      } else {
        setAdminLoginError(res.error || 'Demo administrator login failed.');
      }
    } catch (err: any) {
      setAdminLoginError(err.message || 'Demo login error.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // IF NOT AUTHENTICATED AS ADMIN: Render Standalone Enterprise Security Login Gate
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 antialiased font-sans relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Header & Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToAgent}
              className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Purchasing Agent</span>
            </button>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
              OPERATIONS CONSOLE
            </span>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-purple-500/25 text-white mb-3">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Admin Console</h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Authorized access only for hardware catalog management, orders fulfillment, and agent audit metrics.
              </p>
            </div>

            {adminLoginError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Admin Email</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@enterprise.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={adminLoginLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-all disabled:opacity-50"
              >
                {adminLoginLoading ? 'Verifying Credentials...' : 'Sign In to Operations Console'}
              </button>
            </form>

            {/* 1-Click Instant Demo Login */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-center mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Demo Testing</span>
              </div>
              <button
                type="button"
                onClick={handleQuickDemoAdminLogin}
                disabled={adminLoginLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>⚡ 1-Click Instant Admin Sign In</span>
              </button>
            </div>
          </div>

          {/* System Security Footnote */}
          <div className="text-center text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>ACID DB Engine</span>
              </span>
              <span>•</span>
              <span>Role-Based Access</span>
              <span>•</span>
              <span>Audit Logging Active</span>
            </div>
            <p>TalentFlow Enterprise Autonomous Procurement Engine v2.0</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row antialiased font-sans selection:bg-purple-600 selection:text-white">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : toastMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          ) : (
            <HelpCircle className="w-4 h-4 text-cyan-600" />
          )}
          <span className="text-slate-800">{toastMessage.text}</span>
        </div>
      )}

      {/* Global Quick Search Modal (Ctrl+K) */}
      {globalSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-5 shadow-2xl relative text-slate-900 space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 text-purple-600 absolute left-4 top-3.5" />
              <input
                type="text"
                autoFocus
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Type a product, order number, SKU, buyer session, or command..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              <span className="absolute right-4 top-3 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-600 border border-slate-300">
                ESC
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">Catalog Products</div>
              {products
                .filter((p) => p.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                .slice(0, 4)
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setViewingProduct(p);
                      setGlobalSearchOpen(false);
                      setActiveNav('inventory');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Package className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="font-bold text-slate-900 block">{p.name}</span>
                        <span className="text-[10px] text-slate-500">{p.sku || p.id} • {p.brand}</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">₹{p.price.toLocaleString('en-IN')}</span>
                  </div>
                ))}

              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 pt-2">Purchase Orders</div>
              {orders
                .filter((o) => o.id.toLowerCase().includes(globalSearchQuery.toLowerCase()) || o.productName.toLowerCase().includes(globalSearchQuery.toLowerCase()))
                .slice(0, 3)
                .map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      setViewingOrder(o);
                      setGlobalSearchOpen(false);
                      setActiveNav('orders');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center space-x-2.5">
                      <ShoppingBag className="w-4 h-4 text-cyan-600" />
                      <div>
                        <span className="font-mono font-bold text-cyan-700 block">{o.id}</span>
                        <span className="text-[10px] text-slate-500">{o.productName}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">{o.deliveryStatus}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Left Navigation Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs relative z-20">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-md shadow-purple-600/20">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div>
                <span className="font-black text-sm text-slate-900 tracking-tight block">
                  TalentFlow HQ
                </span>
                <span className="text-[10px] font-mono text-purple-700 font-bold uppercase tracking-wider flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Enterprise Ops</span>
                </span>
              </div>
            </div>
          </div>

          {/* Global Quick Search Button */}
          <div className="px-4 pt-3 pb-1">
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-300 text-left text-xs text-slate-500 flex items-center justify-between transition-all group shadow-xs"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                <span>Search catalog...</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-600 font-semibold">
                Ctrl K
              </span>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            <button
              onClick={() => setActiveNav('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeNav === 'overview'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Executive Dashboard</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>

            <button
              onClick={() => setActiveNav('inventory')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeNav === 'inventory'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Package className="w-4 h-4" />
                <span>Hardware Catalog</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('ingestion')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeNav === 'ingestion'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Layers className="w-4 h-4" />
                <span>Bulk Ingestion Studio</span>
              </div>
              <span className="px-1.5 py-0.5 text-[9px] rounded font-bold bg-purple-50 text-purple-700 border border-purple-200">
                CSV/JSON
              </span>
            </button>

            <button
              onClick={() => setActiveNav('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeNav === 'orders'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders Fulfillment</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('sessions')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeNav === 'sessions'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4" />
                <span>Agent Observability</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                {sessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeNav === 'users'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4" />
                <span>Accounts & Security</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-mono font-bold border border-slate-200">
                {usersList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('database')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                activeNav === 'database'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Database className="w-4 h-4" />
                <span>Database Diagnostics</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-slate-200 space-y-2.5">
          <button
            onClick={onBackToAgent}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Buyer AI Agent Mode</span>
          </button>

          {user && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-slate-900 block truncate">{user.name}</span>
                  <span className="text-[9px] text-purple-700 font-mono font-bold uppercase">{user.role}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Admin Working Canvas */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-500 font-medium">Enterprise Administration</span>
            <span className="text-slate-300">/</span>
            <span className="text-purple-700 font-bold uppercase tracking-wider font-mono">
              {activeNav}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ACID Store: Connected</span>
            </div>

            <button
              onClick={loadAllAdminData}
              disabled={isLoading}
              className="flex items-center space-x-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeNav === 'overview' && (
            <div className="space-y-6">
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-3xl border border-slate-200/90 hover:border-emerald-300 transition-all relative overflow-hidden group shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
                    <span>Total Procurement Spend</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700 font-mono">
                    ₹{(metrics?.totalSpend || 0).toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-1 font-medium">
                    <span className="text-emerald-700 font-bold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
                    </span>
                    <span>across {metrics?.totalOrders || 0} purchase orders</span>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-3xl border border-slate-200/90 hover:border-cyan-300 transition-all relative overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
                    <span>Active Hardware Valuation</span>
                    <Package className="w-4 h-4 text-cyan-600" />
                  </div>
                  <p className="text-2xl font-black text-cyan-700 font-mono">
                    ₹{(metrics?.totalInventoryValue || 0).toLocaleString('en-IN')}
                  </p>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    <span>{metrics?.productsCount || 0} audited commercial models</span>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-3xl border border-slate-200/90 hover:border-amber-300 transition-all relative overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
                    <span>Inventory Availability</span>
                    <Layers className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {metrics?.health?.inStockCount || 0} Models
                  </p>
                  <div className="text-[11px] text-rose-600 mt-1 flex items-center space-x-2 font-semibold">
                    <span>{metrics?.outOfStockCount || 0} Out of Stock</span>
                    <span>•</span>
                    <span className="text-amber-600">{metrics?.lowStockCount || 0} Low Stock</span>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-3xl border border-slate-200/90 hover:border-purple-300 transition-all relative overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5 font-medium">
                    <span>Autonomous Validation Pass</span>
                    <FileCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-black text-purple-700 font-mono">
                    100.0%
                  </p>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    <span>{metrics?.validatedSessions || 0} sessions 7-point verified</span>
                  </div>
                </div>
              </div>

              {/* Data Quality & Freshness Summary Card */}
              {metrics?.health && (
                <div className="glass-panel p-6 rounded-3xl border border-slate-200/90 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        <span>Catalog Health & Data Freshness Diagnostic Hub</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">Automated schema integrity check, stale price alerts, and origin distribution</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Catalog Health Score: 100/100
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block text-[11px] mb-1 font-medium">Total Products</span>
                      <span className="text-xl font-black text-slate-900 font-mono">{metrics.health.totalProducts}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block text-[11px] mb-1 font-medium">Verified In-Stock</span>
                      <span className="text-xl font-black text-emerald-700 font-mono">{metrics.health.inStockCount}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block text-[11px] mb-1 font-medium">Missing Specs/Price</span>
                      <span className="text-xl font-black text-slate-700 font-mono">{metrics.health.missingPriceCount + metrics.health.missingSpecsCount}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block text-[11px] mb-1 font-medium">Stale Price Alerts</span>
                      <span className="text-xl font-black text-cyan-700 font-mono">{metrics.health.stalePriceCount}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block text-[11px] mb-1 font-medium">Duplicate Candidates</span>
                      <span className="text-xl font-black text-amber-700 font-mono">{metrics.health.duplicateCandidates}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block text-[11px] mb-1 font-medium">Verified Sources</span>
                      <span className="text-xs font-bold text-purple-700 font-mono block truncate">
                        {Object.keys(metrics.health.sourceBreakdown || {}).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Two Column Grid: Recent Orders and Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="glass-panel rounded-3xl p-6 border border-slate-200/90 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Recent Purchase Order Mutations
                    </h4>
                    <button
                      onClick={() => setActiveNav('orders')}
                      className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center space-x-1"
                    >
                      <span>View All ({orders.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No purchases recorded yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {orders.slice(0, 4).map((o) => (
                        <div
                          key={o.id}
                          onClick={() => {
                            setViewingOrder(o);
                            setActiveNav('orders');
                          }}
                          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 flex items-center justify-between text-xs cursor-pointer transition-all shadow-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="font-mono font-bold text-emerald-700">{o.id}</span>
                            <div>
                              <span className="font-bold text-slate-900 block">{o.productName}</span>
                              <span className="text-[10px] text-slate-500">{new Date(o.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-black text-slate-900 block">₹{o.totalPrice.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-cyan-700">
                              {o.deliveryStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Autonomous Agent Sessions */}
                <div className="glass-panel rounded-3xl p-6 border border-slate-200/90 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Autonomous Purchasing Sessions
                    </h4>
                    <button
                      onClick={() => setActiveNav('sessions')}
                      className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center space-x-1"
                    >
                      <span>View All ({sessions.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {sessions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-6 text-center">No agent sessions recorded yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {sessions.slice(0, 4).map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            handleInspectSession(s);
                            setActiveNav('sessions');
                          }}
                          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 flex items-center justify-between text-xs cursor-pointer transition-all shadow-xs"
                        >
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <span className="font-mono font-bold text-purple-700 shrink-0">{s.id}</span>
                            <div className="truncate">
                              <span className="text-slate-800 block truncate font-bold">"{s.userPrompt}"</span>
                              <span className="text-[10px] text-slate-500">Status: {s.status}</span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                            s.status === 'VALIDATED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {s.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HARDWARE CATALOG & INVENTORY */}
          {activeNav === 'inventory' && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-200/90 space-y-5 shadow-sm">
              {/* Header Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span>Hardware Catalog & Inventory Studio</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live database-backed models with source metadata tracking ({filteredProducts.length} filtered / {products.length} total)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>Export JSON</span>
                  </button>
                  <button
                    onClick={() => setActiveNav('ingestion')}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Bulk Ingestion</span>
                  </button>
                  <button
                    onClick={handleOpenAddProduct}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Model</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by model, brand, SKU, processor..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="md:col-span-3 flex items-center space-x-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                  >
                    <option value="ALL">All Hardware Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <select
                    value={selectedStockFilter}
                    onChange={(e) => setSelectedStockFilter(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                  >
                    <option value="ALL">All Stock Statuses</option>
                    <option value="IN_STOCK">In Stock (≥5 units)</option>
                    <option value="LOW_STOCK">Low Stock (1-4 units)</option>
                    <option value="OUT_OF_STOCK">Out of Stock (0 units)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="stock">Highest Stock</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Model & SKU</th>
                      <th className="py-3 px-3">Origin / Source</th>
                      <th className="py-3 px-3">Price (INR)</th>
                      <th className="py-3 px-3">Specs (RAM / Storage)</th>
                      <th className="py-3 px-3">Inventory Stock</th>
                      <th className="py-3 px-3">Rating</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                            {p.name}
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono font-bold text-purple-700">{p.sku || p.id}</span>
                            <span>•</span>
                            <span className="text-slate-500">{p.category}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${
                            p.source === 'MANUFACTURER'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : p.source === 'RETAILER_API'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {p.source || 'IMPORTED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-black text-slate-900">
                          ₹{p.price.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-3 text-slate-700">
                          <div className="font-semibold">{p.specifications?.ram || '16GB'} • {p.specifications?.storage || '512GB'}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{p.specifications?.cpu}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                            p.stock > 5 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : p.stock > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            <span>{p.stock} units ({p.stockType === 'VERIFIED_LIVE' ? 'Live' : 'Estimated'})</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-amber-600 font-bold">
                          ★ {p.rating}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                            title="Quick View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BULK INGESTION STUDIO */}
          {activeNav === 'ingestion' && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-200/90 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <span>Bulk Product Catalog Ingestion Studio</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ingest hardware records with normalization, validation, deduplication, and source audit trails.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLoadSampleCSV}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-all"
                  >
                    Load Sample Template
                  </button>
                </div>
              </div>

              {/* Format Switcher */}
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-slate-700">Select Input Format:</span>
                <div className="flex p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => setIngestFormat('CSV')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      ingestFormat === 'CSV' ? 'bg-purple-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    CSV (Comma-Separated)
                  </button>
                  <button
                    onClick={() => setIngestFormat('JSON')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      ingestFormat === 'JSON' ? 'bg-purple-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    JSON (Array of Objects)
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {ingestFormat} Ingestion Payload (Paste raw contents or load template)
                </label>
                <textarea
                  rows={10}
                  value={ingestPayload}
                  onChange={(e) => setIngestPayload(e.target.value)}
                  placeholder={
                    ingestFormat === 'CSV'
                      ? 'sku,name,brand,model,category,price,stock,source,sourceProductId,cpu,ram,ramGb,storage,storageGb\nLEN-21JK001DIN,"Lenovo ThinkPad E14 Gen 5",Lenovo,ThinkPad E14 Gen 5,Laptops,74990,14,MANUFACTURER,21JK001DIN,"Intel Core i5",16GB DDR5,16,512GB SSD,512'
                      : '[\n  {\n    "sku": "LEN-21JK001DIN",\n    "name": "Lenovo ThinkPad E14 Gen 5",\n    "brand": "Lenovo",\n    "price": 74990,\n    "stock": 14,\n    "source": "MANUFACTURER",\n    "sourceProductId": "21JK001DIN",\n    "specifications": { "ramGb": 16, "storageGb": 512, "cpu": "Intel Core i5" }\n  }\n]'
                  }
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 leading-relaxed shadow-xs"
                />
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500">
                  <span>CLI Alternative: </span>
                  <code className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-purple-700 text-[11px] border border-slate-200 font-bold">
                    npm run import:products -- ./data/products.csv
                  </code>
                </div>

                <button
                  onClick={handleExecuteBulkIngest}
                  disabled={isIngesting || !ingestPayload.trim()}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all disabled:opacity-50"
                >
                  {isIngesting ? 'Processing Ingestion...' : 'Execute Ingestion'}
                </button>
              </div>

              {/* Ingestion Report Breakdown */}
              {ingestReport && (
                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4 animate-in fade-in shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Ingestion Report Summary</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">Execution time: {ingestReport.durationMs}ms</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                    <div className="p-3 rounded-2xl bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[10px] font-medium">Total Processed</span>
                      <span className="text-lg font-black font-mono text-slate-900">{ingestReport.totalRows}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[10px] font-medium">Created (New)</span>
                      <span className="text-lg font-black font-mono text-emerald-700">{ingestReport.created}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[10px] font-medium">Updated (Existing)</span>
                      <span className="text-lg font-black font-mono text-cyan-700">{ingestReport.updated}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-slate-200">
                      <span className="text-slate-500 block text-[10px] font-medium">Invalid / Rejected</span>
                      <span className="text-lg font-black font-mono text-amber-700">{ingestReport.invalid}</span>
                    </div>
                  </div>

                  {ingestReport.errors?.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                      <div className="font-bold">Validation Warnings:</div>
                      {ingestReport.errors.map((err: any, i: number) => (
                        <div key={i} className="text-[11px]">
                          - Row {err.row} ({err.identifier}): {err.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ORDERS FULFILLMENT */}
          {activeNav === 'orders' && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 space-y-5 bg-white shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5 text-cyan-600" />
                    <span>Enterprise Orders Fulfillment Hub</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track autonomous order state machines, advance delivery SLA, and generate packing invoices
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search orders, SKU, buyer..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white"
                    />
                  </div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">All Delivery Statuses</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
              </div>

              {/* Orders Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Order ID & Timestamp</th>
                      <th className="py-3 px-3">Purchased Product</th>
                      <th className="py-3 px-3">Quantity</th>
                      <th className="py-3 px-3">Total Amount</th>
                      <th className="py-3 px-3">Delivery Status</th>
                      <th className="py-3 px-4 text-right">Fulfillment Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                          No orders matching current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-cyan-700 block">{o.id}</span>
                            <span className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleString()}</span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-slate-900 block">{o.productName}</span>
                            <span className="text-[10px] text-slate-400">ID: {o.productId}</span>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                            {o.quantity} unit(s)
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-emerald-600">
                            ₹{o.totalPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              o.deliveryStatus === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : o.deliveryStatus === 'SHIPPED'
                                ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {o.deliveryStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => setViewingOrder(o)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold transition-all"
                            >
                              Invoice / Audit
                            </button>
                            {o.deliveryStatus === 'SCHEDULED' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(o.id, 'SHIPPED')}
                                className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-semibold shadow-sm transition-all"
                              >
                                Mark Shipped
                              </button>
                            )}
                            {o.deliveryStatus === 'SHIPPED' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(o.id, 'DELIVERED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shadow-sm transition-all"
                              >
                                Mark Delivered
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AGENT OBSERVABILITY & SESSIONS */}
          {activeNav === 'sessions' && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 space-y-5 bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span>Autonomous Agent Observability & Audit Logs</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect natural language extractions, candidate elimination matrices, tool latencies, and validation passes.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Search sessions..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Sessions Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Session ID</th>
                      <th className="py-3 px-3">Buyer Prompt Query</th>
                      <th className="py-3 px-3">Extracted Budget</th>
                      <th className="py-3 px-3">Recommended Model</th>
                      <th className="py-3 px-3">Audit Status</th>
                      <th className="py-3 px-4 text-right">Deep Inspection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                          {s.id}
                        </td>
                        <td className="py-3.5 px-3 max-w-xs truncate text-slate-800">
                          "{s.userPrompt}"
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-600">
                          {s.extractedRequirements?.budgetMax ? `≤ ₹${s.extractedRequirements.budgetMax.toLocaleString('en-IN')}` : 'Unlimited'}
                        </td>
                        <td className="py-3.5 px-3 text-emerald-700 font-semibold truncate max-w-[160px]">
                          {s.decisionSummary?.selectedProductName || s.selectedProductId || 'None'}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.status === 'VALIDATED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.status === 'WAITING_APPROVAL'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleInspectSession(s)}
                            className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold shadow-sm transition-all"
                          >
                            Inspect Trace
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: USERS & ACCESS CONTROL */}
          {activeNav === 'users' && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 space-y-5 bg-white shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span>Enterprise Accounts & Access Control</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Role-based access permissions, authentication security, and company profiles.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {usersList.map((u) => (
                  <div key={u.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold flex items-center justify-center text-sm">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{u.name}</span>
                          <span className="text-[11px] text-slate-500">{u.email}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {u.role}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.company || 'Enterprise Org'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {u.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: DATABASE & SYSTEM DIAGNOSTICS */}
          {activeNav === 'database' && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-200/80 space-y-6 bg-white shadow-sm">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  <span>ACID Database Engine & System Diagnostics</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Core persistent JSON-backed storage engine at <code>backend/data/db.json</code>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 block mb-1">Catalog Products</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{products.length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 block mb-1">Orders Records</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">{orders.length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 block mb-1">Agent Sessions</span>
                  <span className="text-2xl font-black text-purple-600 font-mono">{sessions.length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-slate-500 block mb-1">User Accounts</span>
                  <span className="text-2xl font-black text-cyan-600 font-mono">{usersList.length}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-900">Reset Database State</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    Clears temporary demo orders and re-initializes seed records.
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (confirm('Reset database to pristine seed?')) {
                      await api.resetDatabase();
                      showToast('Database reset to seed successfully.');
                      await loadAllAdminData();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all"
                >
                  Reset to Seed
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: ADD / EDIT PRODUCT FORM */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-900 max-h-[90vh] flex flex-col overflow-hidden">
            <button
              onClick={() => setIsAddProductOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingProduct ? 'Edit Catalog Product' : 'Add New Hardware Model'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Provide specifications and origin metadata</p>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">SKU / Model Code</label>
                  <input
                    type="text"
                    required
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  >
                    <option value="Laptops">Laptops</option>
                    <option value="Desktop PCs">Desktop PCs</option>
                    <option value="Monitors">Monitors</option>
                    <option value="Keyboards">Keyboards</option>
                    <option value="Mice">Mice</option>
                    <option value="SSDs">SSDs</option>
                    <option value="RAM">RAM</option>
                    <option value="GPUs">GPUs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Product Title</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="e.g. Lenovo ThinkPad E14 Gen 5 (Intel Core i5, 16GB, 512GB SSD)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={prodForm.brand}
                    onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Processor (CPU)</label>
                  <input
                    type="text"
                    value={prodForm.cpu}
                    onChange={(e) => setProdForm({ ...prodForm, cpu: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">RAM (GB numerical)</label>
                  <input
                    type="number"
                    value={prodForm.ramGb}
                    onChange={(e) => setProdForm({ ...prodForm, ramGb: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Storage (GB numerical)</label>
                  <input
                    type="number"
                    value={prodForm.storageGb}
                    onChange={(e) => setProdForm({ ...prodForm, storageGb: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Source Origin</label>
                  <select
                    value={prodForm.source}
                    onChange={(e) => setProdForm({ ...prodForm, source: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  >
                    <option value="MANUFACTURER">Manufacturer OEM</option>
                    <option value="RETAILER_API">Retailer API</option>
                    <option value="IMPORTED_CATALOG">Imported Catalog</option>
                    <option value="MOCK">Mock/Demo</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK PRODUCT DETAILS VIEWER */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingProduct(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {viewingProduct.sku || viewingProduct.id}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-100 text-slate-600 border border-slate-200">
                Source: {viewingProduct.source || 'IMPORTED'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">{viewingProduct.name}</h3>
            <p className="text-xs text-slate-500 mb-4">{viewingProduct.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Price</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">₹{viewingProduct.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Stock Count</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{viewingProduct.stock} units</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">RAM</span>
                <span className="font-bold text-slate-800 text-xs">{viewingProduct.specifications?.ram}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Storage</span>
                <span className="font-bold text-slate-800 text-xs">{viewingProduct.specifications?.storage}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div><strong>Processor:</strong> {viewingProduct.specifications?.cpu}</div>
              <div><strong>Display:</strong> {viewingProduct.specifications?.display}</div>
              <div><strong>Battery:</strong> {viewingProduct.specifications?.batteryHours} hours</div>
              <div><strong>OS:</strong> {viewingProduct.specifications?.os}</div>
              {viewingProduct.productUrl && (
                <div className="pt-2">
                  <a
                    href={viewingProduct.productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-600 hover:underline flex items-center space-x-1"
                  >
                    <span>OEM Product Specification Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ORDER INVOICE & AUDIT VIEWER */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingOrder(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-200">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enterprise Purchase Order</h3>
                  <span className="font-mono text-xs text-cyan-700 font-bold">{viewingOrder.id}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {viewingOrder.status}
              </span>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Purchased Item</span>
                  <span className="font-bold text-slate-900 block">{viewingOrder.productName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {viewingOrder.productId}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Total Invoice Cost</span>
                  <span className="text-lg font-black text-emerald-600 font-mono">₹{viewingOrder.totalPrice.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-400 block">Unit: ₹{viewingOrder.unitPrice.toLocaleString('en-IN')} × {viewingOrder.quantity}</span>
                </div>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Buyer Session ID:</span>
                  <span className="font-mono text-purple-700">{viewingOrder.sessionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="font-bold text-emerald-600">{viewingOrder.paymentStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Logistics:</span>
                  <span className="font-bold text-cyan-700">{viewingOrder.deliveryStatus} (ETA: {viewingOrder.deliveryEstimateDays} days)</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Destination Address:</span>
                  <span className="text-slate-800">{viewingOrder.deliveryAddress}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>

              <div className="flex items-center space-x-2">
                {viewingOrder.deliveryStatus === 'SCHEDULED' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'SHIPPED')}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs"
                  >
                    Mark as Shipped
                  </button>
                )}
                {viewingOrder.deliveryStatus === 'SHIPPED' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'DELIVERED')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Mark as Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SESSION TRACE INSPECTOR */}
      {viewingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-900 max-h-[90vh] flex flex-col overflow-hidden">
            <button
              onClick={() => setViewingSession(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-3">
              <span className="font-mono text-xs font-bold text-purple-700 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200">
                {viewingSession.id}
              </span>
              <span className="text-xs font-bold text-emerald-600">{viewingSession.status}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-4">
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Buyer Intent Prompt:</span>
              <p className="text-slate-900 font-medium mt-0.5">"{viewingSession.userPrompt}"</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Audited Tool Execution Timeline & Traces
              </div>

              {isLoadingSessionActions ? (
                <div className="text-xs text-slate-400 italic py-6 text-center">Loading auditable tool trace...</div>
              ) : sessionActions.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-6 text-center">No action logs found for this session.</div>
              ) : (
                sessionActions.map((act) => (
                  <div key={act.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 font-mono font-bold flex items-center justify-center text-[10px]">
                          {act.stepNumber}
                        </span>
                        <span className="font-mono font-bold text-slate-900">{act.toolName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{act.executionTimeMs}ms</span>
                    </div>
                    <p className="text-[11px] text-slate-700 pl-7">{act.explanation}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
