import React, { useState, useEffect } from 'react';
import { api } from './services/api.js';
import {
  AgentSession,
  AgentActionLog,
  Order,
  Product,
  User
} from './types/index.js';
import { Header } from './components/Header.js';
import { DemoPromptSelector } from './components/DemoPromptSelector.js';
import { AgentTimeline } from './components/AgentTimeline.js';
import { RequirementsPanel } from './components/RequirementsPanel.js';
import { CandidateComparisonMatrix } from './components/CandidateComparisonMatrix.js';
import { RecommendedProductCard } from './components/RecommendedProductCard.js';
import { PurchaseConfirmationModal } from './components/PurchaseConfirmationModal.js';
import { ValidationReportView } from './components/ValidationReportView.js';
import { ObservabilityLogDrawer } from './components/ObservabilityLogDrawer.js';
import { OrdersHistoryModal } from './components/OrdersHistoryModal.js';
import { CatalogBrowserModal } from './components/CatalogBrowserModal.js';
import { AuthModal } from './components/AuthModal.js';
import { AdminPortal } from './components/AdminPortal.js';
import {
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  Cpu
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'agent' | 'admin'>(() => {
    const p = window.location.pathname.toLowerCase();
    const h = window.location.hash.toLowerCase();
    return p.includes('admin') || h.includes('admin') ? 'admin' : 'agent';
  });

  const [user, setUser] = useState<User | null>(null);

  const [prompt, setPrompt] = useState(
    'I need a laptop under ₹80,000 for software development, preferably 16GB RAM, 512GB SSD and good battery life.'
  );
  const [session, setSession] = useState<AgentSession | null>(null);
  const [actions, setActions] = useState<AgentActionLog[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    loadCatalog();
    checkStoredAuth();

    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      setCurrentView(p.includes('admin') || h.includes('admin') ? 'admin' : 'agent');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: 'agent' | 'admin') => {
    setCurrentView(view);
    const targetPath = view === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  const checkStoredAuth = async () => {
    const token = localStorage.getItem('talentflow_auth_token');
    if (token) {
      try {
        const res = await api.auth.getMe();
        if (res.success) {
          setUser(res.data);
        } else {
          localStorage.removeItem('talentflow_auth_token');
        }
      } catch (err) {
        console.error('Failed to verify token:', err);
      }
    }
  };

  const handleAuthSuccess = (authUser: User, token: string) => {
    setUser(authUser);
    localStorage.setItem('talentflow_auth_token', token);
    if (authUser.role === 'ADMIN') {
      navigateTo('admin');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('talentflow_auth_token');
    navigateTo('agent');
  };

  const loadCatalog = async () => {
    try {
      const res = await api.getProducts();
      if (res.success) {
        setAllProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to load products catalog:', err);
    }
  };

  const handleStartInvestigation = async (overridePrompt?: string) => {
    const textToSubmit = overridePrompt || prompt;
    if (!textToSubmit.trim() || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setOrder(null);

    try {
      const res = await api.createAndRunSession(textToSubmit, user?.id || 'USER-DEV-01');
      if (res.success) {
        setSession(res.data.session);
        setActions(res.data.actions);
        if (res.data.session.errorMessage) {
          setErrorMessage(res.data.session.errorMessage);
        }
      } else {
        setErrorMessage(res.error || 'Failed to initialize agent session');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while contacting agent service');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPurchase = async (deliveryAddress: string, simulateFailure: boolean) => {
    if (!session) return;
    setIsPurchasing(true);
    setErrorMessage(null);

    try {
      const res = await api.confirmPurchase(session.id, deliveryAddress, simulateFailure);
      if (res.success) {
        setSession(res.data.session);
        setOrder(res.data.order);
        setActions(res.data.actions);
        setIsConfirmModalOpen(false);
        loadCatalog();
      } else {
        setErrorMessage(res.error || 'Purchase failed during execution');
        setIsConfirmModalOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during purchase execution');
      setIsConfirmModalOpen(false);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleResetDatabase = async () => {
    setIsProcessing(true);
    try {
      await api.resetDatabase();
      setSession(null);
      setActions([]);
      setOrder(null);
      setErrorMessage(null);
      await loadCatalog();
    } catch (err) {
      console.error('Failed to reset database:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedProduct = session?.selectedProductId
    ? allProducts.find((p) => p.id === session.selectedProductId) || null
    : null;

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* If on Admin View, render the Dedicated Standalone Admin Page */}
      {currentView === 'admin' ? (
        <AdminPortal
          user={user}
          onBackToAgent={() => navigateTo('agent')}
          onLogout={handleLogout}
          onAuthSuccess={handleAuthSuccess}
        />
      ) : (
        <>
          <Header
            currentView={currentView}
            onNavigate={navigateTo}
            user={user}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onReset={handleResetDatabase}
            onOpenLogs={() => setIsLogDrawerOpen(true)}
            onOpenOrders={() => setIsOrdersModalOpen(true)}
            onOpenCatalog={() => setIsCatalogModalOpen(true)}
            actionsCount={actions.length}
            catalogCount={allProducts.length}
            isProcessing={isProcessing}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-150">
            {/* Hero Heading */}
            <div className="text-center max-w-3xl mx-auto mb-8">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-xs font-bold uppercase tracking-wider mb-3.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Autonomous Multi-Tool Hardware Procurement Agent</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3">
                Procure Computing Hardware With <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">AI Intelligence</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Describe your technical workload in plain English. The agent investigates live hardware specs, audits stock, scores trade-offs, places verified orders, and independently validates fulfillment.
              </p>
            </div>

            {/* Quick Demo Presets */}
            <DemoPromptSelector
              onSelectPrompt={(p) => {
                setPrompt(p);
                handleStartInvestigation(p);
              }}
              disabled={isProcessing || isPurchasing}
            />

            {/* Natural Language Buyer Input Card */}
            <div className="glass-panel rounded-3xl p-5 sm:p-6 mb-8 border border-slate-200/90 shadow-md relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>What computing hardware are you looking to procure?</span>
              </label>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStartInvestigation();
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe target specifications, budget ceiling, memory, storage, or delivery urgency..."
                    disabled={isProcessing || isPurchasing}
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none disabled:opacity-50 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || isPurchasing || !prompt.trim()}
                  className="sm:self-stretch px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transform active:scale-95"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Investigating...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Execute Agent</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error Alert Box */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs mb-6 flex items-start space-x-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-sm mb-0.5 text-rose-950">Agent Pipeline Alert:</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Agent Activity Timeline */}
            {session && (
              <AgentTimeline
                currentStatus={session.status}
                isFailed={session.status === 'FAILED'}
              />
            )}

            {/* Requirements Breakdown Panel */}
            {session?.extractedRequirements && (
              <RequirementsPanel requirements={session.extractedRequirements} />
            )}

            {/* Top Recommended Product Card */}
            {selectedProduct && session?.decisionSummary && (
              <RecommendedProductCard
                product={selectedProduct}
                decisionSummary={session.decisionSummary}
                status={session.status}
                onInitiatePurchase={() => setIsConfirmModalOpen(true)}
                isPurchasing={isPurchasing}
              />
            )}

            {/* Post-Purchase Validation Certificate Report */}
            {session?.validationReport && (
              <ValidationReportView
                report={session.validationReport}
                order={order}
              />
            )}

            {/* Candidate Comparison Matrix */}
            {session?.decisionSummary?.scoringMatrix && (
              <CandidateComparisonMatrix
                evaluations={session.decisionSummary.scoringMatrix}
                selectedProductId={session.selectedProductId}
              />
            )}
          </main>
        </>
      )}

      {/* Purchase Confirmation Modal */}
      {selectedProduct && session?.extractedRequirements && (
        <PurchaseConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          product={selectedProduct}
          requirements={session.extractedRequirements}
          onConfirm={handleConfirmPurchase}
          isProcessing={isPurchasing}
        />
      )}

      {/* Observability & Tool Execution Logs Drawer */}
      <ObservabilityLogDrawer
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        actions={actions}
      />

      {/* Confirmed Orders Database History Modal */}
      <OrdersHistoryModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
      />

      {/* Catalog Browser Modal */}
      <CatalogBrowserModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        products={allProducts}
        onSelectForPrompt={(text) => {
          setPrompt(text);
          handleStartInvestigation(text);
        }}
      />

      {/* Auth Modal (Login / Signup) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};
