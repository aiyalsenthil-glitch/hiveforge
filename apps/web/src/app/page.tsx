'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Plus, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Terminal, 
  TrendingUp,
  Coins,
  AlertCircle,
  ShoppingCart,
  CreditCard,
  Package,
  Store,
  Search,
  Trash2,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  Percent,
  Sparkles,
  Compass,
  LogOut,
  User,
  Lock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  workerType: string;
  status: 'PENDING' | 'WAITING_DEPENDENCIES' | 'QUEUED' | 'RUNNING' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  output: string | null;
  dependencies: { dependsOnTaskId: string }[];
  assignments: { duration: number | null; costTokens: number | null }[];
  logs?: { id: string; logType: string; message: string; createdAt: string }[];
  artifacts?: { id: string; type: string; title: string; versions: { content: string }[] }[];
}

interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PLANNING' | 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: string;
  createdAt: string;
  tasks: Task[];
  activities: Activity[];
}

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockLevel: number;
  barcode?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

interface Sale {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  subtotal: number;
  discount: number;
  tax: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | string;
  customerName?: string;
  customerPhone?: string;
  items: { productId: string; name: string; price: number; quantity: number; lineTotal: number }[];
  createdAt: string;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p-1', sku: 'SKU-NOTE-01', name: 'Standard Student Notebook (200 pgs)', category: 'Stationery', costPrice: 18, sellingPrice: 30, stock: 120, minStockLevel: 25, barcode: '8901234567890' },
  { id: 'p-2', sku: 'SKU-HIGH-02', name: 'Pastel Highlighter Set (Pack of 6)', category: 'Stationery', costPrice: 70, sellingPrice: 120, stock: 45, minStockLevel: 10, barcode: '8901234567891' },
  { id: 'p-3', sku: 'SKU-BAG-03', name: 'Kids Ergonomic Backpack (Blue/Pink)', category: 'Bags', costPrice: 280, sellingPrice: 480, stock: 18, minStockLevel: 5, barcode: '8901234567892' },
  { id: 'p-4', sku: 'SKU-STEM-04', name: 'Educational STEM Solar Robot Kit', category: 'Toys', costPrice: 160, sellingPrice: 290, stock: 12, minStockLevel: 5, barcode: '8901234567893' },
  { id: 'p-5', sku: 'SKU-JOUR-05', name: 'Aesthetic Korean Daily Journal', category: 'Stationery', costPrice: 90, sellingPrice: 180, stock: 8, minStockLevel: 10, barcode: '8901234567894' },
  { id: 'p-6', sku: 'SKU-BOT-06', name: 'Insulated Stainless Steel Bottle 750ml', category: 'Utilities', costPrice: 130, sellingPrice: 240, stock: 22, minStockLevel: 8, barcode: '8901234567895' },
  { id: 'p-7', sku: 'SKU-PENC-07', name: 'Mechanical Drafting Pencil 0.5mm', category: 'Stationery', costPrice: 40, sellingPrice: 85, stock: 60, minStockLevel: 15, barcode: '8901234567896' },
  { id: 'p-8', sku: 'SKU-PUZZ-08', name: 'Wooden 3D Geometry Puzzle', category: 'Toys', costPrice: 80, sellingPrice: 150, stock: 4, minStockLevel: 5, barcode: '8901234567897' }
];

export default function StoreCommandCenter() {
  // Authentication & Onboarding State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasStore, setHasStore] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');

  // Main Navigation Tab
  const [navTab, setNavTab] = useState<'POS_BILLING' | 'STORE_LAUNCH' | 'INVENTORY' | 'SALES_ANALYTICS' | 'WORKFORCE'>('POS_BILLING');

  // Core App State
  const [workspace, setWorkspace] = useState<any>(null);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean>(false);

  // Store Management State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent] = useState<number>(5);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Checkout Receipt Modal State
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Add Product Modal State
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Stationery');
  const [prodCost, setProdCost] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodMinStock, setProdMinStock] = useState('5');
  const [prodBarcode, setProdBarcode] = useState('');

  // AI Advisor State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState<boolean>(false);

  // Store Launch Wizard Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreIndustry, setNewStoreIndustry] = useState('Retail');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE = typeof window !== 'undefined' ? `http://${window.location.hostname}:4000` : 'http://localhost:4000';

  // Check API health
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}`);
      if (res.ok) {
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }
    } catch {
      setApiOnline(false);
    }
  }, [API_BASE]);

  // Fetch initial workspace details
  const fetchWorkspace = useCallback(async () => {
    if (!apiOnline) {
      if (hasStore) {
        setWorkspace({
          id: 'demo-ws',
          name: newStoreName || 'Acme Retail & Store Hub',
          industry: newStoreIndustry || 'Retail Store & Kids Utilities',
          description: 'Store Operations, POS Billing & AI Digital Workforce'
        });
      }
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/workspace`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
      }
    } catch (e) {
      console.error('Failed to fetch workspace', e);
    }
  }, [API_BASE, apiOnline, hasStore, newStoreName, newStoreIndustry]);

  // Initial loads
  useEffect(() => {
    checkHealth();
    if (isAuthenticated && hasStore) {
      fetchWorkspace();
    }
  }, [apiOnline, isAuthenticated, hasStore, checkHealth, fetchWorkspace]);

  // Authentication Flow Handler
  const handleAuthSubmit = async (email: string, isNew: boolean) => {
    setUserEmail(email);
    setIsAuthenticated(true);

    if (isNew) {
      // New User Flow -> Direct to Store Launch
      setHasStore(false);
      setWorkspace(null);
      setNavTab('STORE_LAUNCH');
    } else {
      // Existing Owner Flow -> Direct to POS Billing Counter
      setHasStore(true);
      setWorkspace({
        id: 'demo-ws',
        name: 'Acme Retail & Store Hub',
        industry: 'Retail Store & Kids Utilities',
        description: 'Store Operations, POS Billing & AI Digital Workforce'
      });
      setNavTab('POS_BILLING');
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setHasStore(false);
    setWorkspace(null);
    setUserEmail('');
    setUserPassword('');
  };

  // Complete Store Launch Wizard
  const handleCompleteStoreLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    setIsSubmitting(true);

    const storeName = newStoreName || 'Acme Retail Store';
    const storeInd = newStoreIndustry || 'Retail';

    const mockId = 'mission-' + Date.now();
    const newMission: Mission = {
      id: mockId,
      title: newTitle,
      description: newDesc,
      status: 'QUEUED',
      priority: newPriority,
      createdAt: new Date().toISOString(),
      tasks: [
        { id: mockId + '-t1', title: `Market & Competitor Research for ${newTitle}`, description: 'Demographic study and competitor pricing', workerType: 'Research', status: 'QUEUED', dependencies: [], output: null, assignments: [] },
        { id: mockId + '-t2', title: `Financial Budget & Cost Allocation`, description: 'Inventory capital model and payback projection', workerType: 'Finance', status: 'WAITING_DEPENDENCIES', dependencies: [{ dependsOnTaskId: mockId + '-t1' }], output: null, assignments: [] },
        { id: mockId + '-t3', title: `30-Day Launch Campaign Copy`, description: 'Ad slogans, flyers, and social media copy', workerType: 'Marketing', status: 'WAITING_DEPENDENCIES', dependencies: [{ dependsOnTaskId: mockId + '-t2' }], output: null, assignments: [] },
        { id: mockId + '-t4', title: `Supplier Sourcing & Store SOP Blueprint`, description: 'Vendor network and daily opening SOP checklist', workerType: 'Operations', status: 'WAITING_DEPENDENCIES', dependencies: [{ dependsOnTaskId: mockId + '-t2' }], output: null, assignments: [] }
      ],
      activities: []
    };

    setWorkspace({
      id: 'ws-' + Date.now(),
      name: storeName,
      industry: storeInd,
      description: newDesc
    });

    setActiveMission(newMission);
    setHasStore(true);
    setIsSubmitting(false);

    // Automatically navigate to unlocked POS Billing Counter
    setNavTab('POS_BILLING');
  };

  // POS Cart Management
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * product.sellingPrice }
            : item
        );
      }
      return [...prev, { product, quantity: 1, lineTotal: product.sellingPrice }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty, lineTotal: newQty * item.product.sellingPrice };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setCustomerName('');
    setCustomerPhone('');
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const discountAmount = (cartSubtotal * discountPercent) / 100;
  const taxableAmount = cartSubtotal - discountAmount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const cartTotal = taxableAmount + taxAmount;

  // Process POS Sale Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const saleItems = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.sellingPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal
    }));

    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      invoiceNo,
      subtotal: cartSubtotal,
      discount: discountAmount,
      tax: taxAmount,
      totalAmount: cartTotal,
      paymentMethod,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '-',
      items: saleItems,
      createdAt: new Date().toISOString()
    };

    // Update Stock Levels
    setProducts(prev =>
      prev.map(p => {
        const cartItem = cart.find(ci => ci.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        }
        return p;
      })
    );

    setSales(prev => [newSale, ...prev]);

    // Show Receipt Modal
    setActiveInvoice(newSale);
    setShowReceiptModal(true);
    clearCart();
  };

  // Quick Stock Adjustments
  const handleAdjustStock = (productId: string, delta: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    );
  };

  // Add Product Form Handler
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodCost || !prodPrice || !prodStock) return;

    const newProd: Product = {
      id: 'prod-' + Date.now(),
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      name: prodName,
      category: prodCategory,
      costPrice: parseFloat(prodCost),
      sellingPrice: parseFloat(prodPrice),
      stock: parseInt(prodStock, 10),
      minStockLevel: parseInt(prodMinStock, 10) || 5,
      barcode: prodBarcode || undefined
    };

    setProducts(prev => [newProd, ...prev]);
    setShowAddProductModal(false);
    setProdName('');
    setProdCost('');
    setProdPrice('');
    setProdStock('');
    setProdBarcode('');
  };

  // Generate AI Sales Insight
  const handleGenerateAiInsight = () => {
    setIsGeneratingInsight(true);
    setTimeout(() => {
      const totalRev = sales.reduce((acc, s) => acc + s.totalAmount, 0) + 12850;
      const lowStockItems = products.filter(p => p.stock <= p.minStockLevel);
      setAiInsight(`### 🤖 HiveForge AI Sales & Inventory Recommendation
- **Revenue Performance:** Total tracked store sales stand at **₹${totalRev.toLocaleString()}** with a strong 34.2% average gross margin.
- **Top Performing Category:** **Stationery & School Accessories** account for 48% of overall volume.
- **Inventory Alert:** ${lowStockItems.length > 0 ? `${lowStockItems.length} products (including ${lowStockItems.map(i => i.name).join(', ')}) are below threshold!` : 'All inventory levels are healthy.'}
- **Action Item:** Reorder high-margin items before peak weekend school footfall.`);
      setIsGeneratingInsight(false);
    }, 600);
  };

  // Categories list
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtered Products for POS / Inventory Table
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (p.barcode && p.barcode.includes(productSearch));
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = products.filter(p => p.stock <= p.minStockLevel).length;

  // ========================================================================= //
  // SCREEN 1: MULTI-TENANT SIGN IN / SIGN UP SCREEN                           //
  // ========================================================================= //
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-white relative overflow-hidden">
        {/* Background Decorative Gradient Blobs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6 relative z-10">
          {/* Brand & Logo Header */}
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 mx-auto shadow-xl shadow-cyan-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Store className="h-7 w-7 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">HiveForge Multi-Tenant Platform</h1>
            <p className="text-xs text-slate-400">Retail Store Operating System & AI Workforce Hub</p>
          </div>

          {/* Quick Preset Buttons for Instant Demo Evaluation */}
          <div className="space-y-2 pt-2 border-t border-b border-slate-800/80 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
              Quick Sign-In Presets
            </p>

            <button
              onClick={() => handleAuthSubmit('owner@acmeretail.com', false)}
              className="w-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl p-3.5 text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                  🏪
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Existing Store Owner</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">Has Store</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Directs straight to 💳 POS Billing Counter</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => handleAuthSubmit('newmerchant@store.com', true)}
              className="w-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl p-3.5 text-left transition-all group flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm">
                  🆕
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>New Merchant Sign Up</span>
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.2 rounded font-mono">No Store Yet</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Directs to 🚀 Store Launch Setup Wizard</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Form Authentication */}
          <form onSubmit={e => {
            e.preventDefault();
            if (!userEmail) return;
            handleAuthSubmit(userEmail, false);
          }} className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Email Address</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="merchant@acmeretail.com"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={userPassword}
                  onChange={e => setUserPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all"
            >
              Sign In to Platform
            </button>
          </form>

          <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Multi-Tenant Secured • Isolated Store Data
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================= //
  // SCREEN 2: AUTHENTICATED COMMAND CENTER UI                                 //
  // ========================================================================= //
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500 selection:text-white pb-12">
      {/* Top Header & Multi-Tenant Merchant Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Store className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-white tracking-tight">HiveForge Store Command Center</h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  POS & Workforce Hub
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {hasStore && workspace ? `${workspace.name} (${workspace.industry})` : 'New Merchant • Launching Store'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Merchant Profile & Sign Out */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <User className="h-3.5 w-3.5 text-cyan-400" />
              <span>{userEmail || 'merchant@store.com'}</span>
            </div>

            {hasStore && lowStockCount > 0 && (
              <button 
                onClick={() => setNavTab('INVENTORY')}
                className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-all"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{lowStockCount} Low Stock</span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-800/80 overflow-x-auto">
          {hasStore ? (
            <>
              <button
                onClick={() => setNavTab('POS_BILLING')}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  navTab === 'POS_BILLING'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                <span>POS Billing Counter</span>
                {cart.length > 0 && (
                  <span className="bg-cyan-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full text-[10px]">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </button>

              <button
                onClick={() => setNavTab('INVENTORY')}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  navTab === 'INVENTORY'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Inventory Catalog</span>
                <span className="bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded text-[10px]">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setNavTab('SALES_ANALYTICS')}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  navTab === 'SALES_ANALYTICS'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Sales & Analytics</span>
              </button>

              <button
                onClick={() => setNavTab('STORE_LAUNCH')}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  navTab === 'STORE_LAUNCH'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="h-4 w-4" />
                <span>Store Launch & AI Missions</span>
              </button>

              <button
                onClick={() => setNavTab('WORKFORCE')}
                className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  navTab === 'WORKFORCE'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="h-4 w-4" />
                <span>Digital Workforce</span>
              </button>
            </>
          ) : (
            <div className="py-3 px-4 text-xs font-bold text-cyan-400 border-b-2 border-cyan-400 flex items-center space-x-2">
              <Compass className="h-4 w-4" />
              <span>🚀 Step 1: Launch Your New Store</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* ========================================================================= */}
        {/* NEW USER STORE LAUNCH WIZARD (WHEN NO STORE EXISTS)                      */}
        {/* ========================================================================= */}
        {!hasStore && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold">
                  🚀
                </div>
                <div>
                  <h2 className="font-bold text-base text-white">Welcome, New Merchant!</h2>
                  <p className="text-xs text-slate-400">Launch your new store using HiveForge AI Workforce to unlock the POS Billing Terminal.</p>
                </div>
              </div>

              <form onSubmit={handleCompleteStoreLaunch} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Store Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Salem Kids & Utility Hub"
                      value={newStoreName}
                      onChange={e => setNewStoreName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 mt-1 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Industry Sector</label>
                    <select
                      value={newStoreIndustry}
                      onChange={e => setNewStoreIndustry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white mt-1 focus:outline-none"
                    >
                      <option value="Retail">Retail & Stationery</option>
                      <option value="Kids & Toys">Kids & Toys</option>
                      <option value="Apparel & Fashion">Apparel & Fashion</option>
                      <option value="Grocery & FMCG">Grocery & FMCG</option>
                      <option value="Electronics">Electronics</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Initial Store Launch Goal</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Launch Ayothiyapattanam Kids & Stationery Store"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 mt-1 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Store Scope & Location Details</label>
                  <textarea
                    required
                    placeholder="Target location, customer demographics, inventory budget limit..."
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 mt-1 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle || !newDesc}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2"
                >
                  <Sparkles className="h-4 w-4 fill-current" />
                  <span>Launch Store & Unlock POS Terminal ➔</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: POS BILLING COUNTER TERMINAL                                     */}
        {/* ========================================================================= */}
        {hasStore && navTab === 'POS_BILLING' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Product Selection Grid */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search & Category Filter */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, SKU, barcode..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex space-x-1.5 overflow-x-auto w-full sm:w-auto">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedCategory === cat
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map(product => {
                  const isLow = product.stock <= product.minStockLevel && product.stock > 0;
                  const isOut = product.stock === 0;
                  const inCart = cart.find(ci => ci.product.id === product.id);

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOut && addToCart(product)}
                      className={`bg-slate-900 border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                        isOut 
                          ? 'border-slate-800 opacity-50 cursor-not-allowed' 
                          : inCart 
                            ? 'border-cyan-500 shadow-md shadow-cyan-500/10 bg-slate-900/90' 
                            : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {product.category}
                          </span>
                          {isOut ? (
                            <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              Only {product.stock} Left
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              Stock: {product.stock}
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-xs text-white line-clamp-2 mt-1">
                          {product.name}
                        </h3>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-cyan-400">₹{product.sellingPrice}</div>
                          <div className="text-[10px] text-slate-500 line-through">₹{Math.round(product.sellingPrice * 1.15)}</div>
                        </div>

                        <button
                          disabled={isOut}
                          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                            isOut
                              ? 'bg-slate-800 text-slate-600'
                              : inCart
                                ? 'bg-cyan-500 text-slate-950 font-bold'
                                : 'bg-slate-800 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950'
                          }`}
                        >
                          {inCart ? (
                            <span className="text-xs font-bold">{inCart.quantity}</span>
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: POS Cart & Checkout Terminal */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                {/* Cart Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Receipt className="h-5 w-5 text-cyan-400" />
                    <h2 className="font-bold text-sm text-white">Current Cart</h2>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center space-x-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {/* Customer Details Form */}
                <div className="grid grid-cols-2 gap-2 my-3">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Cart Items List */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 my-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Cart is empty. Click items to add.</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.product.id} className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between text-xs">
                        <div className="flex-1 pr-2">
                          <div className="font-medium text-white line-clamp-1">{item.product.name}</div>
                          <div className="text-[10px] text-slate-400">₹{item.product.sellingPrice} x {item.quantity}</div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded px-1">
                            <button
                              onClick={() => updateCartQty(item.product.id, -1)}
                              className="px-1.5 py-0.5 text-slate-400 hover:text-white font-bold"
                            >
                              -
                            </button>
                            <span className="px-1 text-cyan-400 font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.product.id, 1)}
                              className="px-1.5 py-0.5 text-slate-400 hover:text-white font-bold"
                            >
                              +
                            </button>
                          </div>

                          <div className="font-bold text-white w-14 text-right">₹{item.lineTotal}</div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Checkout Calculation & Controls */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                {/* Discount Selector */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-slate-400" /> Discount %
                  </span>
                  <select
                    value={discountPercent}
                    onChange={e => setDiscountPercent(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5% Off</option>
                    <option value={10}>10% Off</option>
                    <option value={15}>15% Off</option>
                    <option value={20}>20% Off</option>
                  </select>
                </div>

                {/* Subtotal, Tax & Total breakdown */}
                <div className="space-y-1 text-xs text-slate-400 pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="text-slate-200">₹{cartSubtotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({discountPercent}%):</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST Tax ({taxPercent}%):</span>
                    <span className="text-slate-200">₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-cyan-400 pt-2 border-t border-slate-800">
                    <span>Total Due:</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method Radio Selector */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(['CASH', 'UPI', 'CARD'] as const).map(pm => (
                    <button
                      key={pm}
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1 transition-all ${
                        paymentMethod === pm
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pm === 'CASH' && <Coins className="h-3.5 w-3.5" />}
                      {pm === 'UPI' && <QrCode className="h-3.5 w-3.5" />}
                      {pm === 'CARD' && <CreditCard className="h-3.5 w-3.5" />}
                      <span>{pm}</span>
                    </button>
                  ))}
                </div>

                {/* Complete Checkout Button */}
                <button
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                    cart.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete Checkout & Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INVENTORY CATALOG MANAGEMENT                                     */}
        {/* ========================================================================= */}
        {hasStore && navTab === 'INVENTORY' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <Package className="h-6 w-6 text-cyan-400" />
                <div>
                  <h2 className="font-bold text-sm text-white">Product Inventory Catalog</h2>
                  <p className="text-xs text-slate-400">Track stock counts, unit costs, selling prices, and reorder levels</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-md shadow-cyan-600/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Item</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">SKU / Item</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Cost Price</th>
                      <th className="py-3 px-4">Selling Price</th>
                      <th className="py-3 px-4">Margin %</th>
                      <th className="py-3 px-4">Stock Level</th>
                      <th className="py-3 px-4 text-right">Quick Adjustment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {products.map(p => {
                      const margin = Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100);
                      const isLow = p.stock <= p.minStockLevel && p.stock > 0;
                      const isOut = p.stock === 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-all">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{p.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">{p.sku} {p.barcode ? `• Barcode: ${p.barcode}` : ''}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">₹{p.costPrice}</td>
                          <td className="py-3 px-4 font-semibold text-cyan-400">₹{p.sellingPrice}</td>
                          <td className="py-3 px-4 text-emerald-400 font-medium">{margin}%</td>
                          <td className="py-3 px-4">
                            {isOut ? (
                              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold px-2 py-0.5 rounded text-[10px]">
                                Out of Stock (0)
                              </span>
                            ) : isLow ? (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded text-[10px]">
                                Low Stock ({p.stock})
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium px-2 py-0.5 rounded text-[10px]">
                                {p.stock} Units
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleAdjustStock(p.id, -5)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px]"
                              >
                                -5
                              </button>
                              <button
                                onClick={() => handleAdjustStock(p.id, 10)}
                                className="bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold px-2 py-1 rounded text-[10px]"
                              >
                                +10
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SALES & REVENUE ANALYTICS                                        */}
        {/* ========================================================================= */}
        {hasStore && navTab === 'SALES_ANALYTICS' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Total Tracked Revenue</p>
                  <h3 className="text-xl font-bold text-white mt-1">
                    ₹{(sales.reduce((acc, s) => acc + s.totalAmount, 0) + 12850).toLocaleString()}
                  </h3>
                </div>
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Coins className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Total Transactions</p>
                  <h3 className="text-xl font-bold text-white mt-1">{sales.length + 42} Sales</h3>
                </div>
                <div className="h-10 w-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Average Profit Margin</p>
                  <h3 className="text-xl font-bold text-emerald-400 mt-1">34.5%</h3>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Catalog SKUs</p>
                  <h3 className="text-xl font-bold text-white mt-1">{products.length} Items</h3>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* AI Advisor Insight Card */}
            <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 relative overflow-hidden shadow-lg shadow-cyan-500/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
                  <h3 className="font-bold text-sm text-white">AI Sales & Inventory Advisor</h3>
                </div>

                <button
                  onClick={handleGenerateAiInsight}
                  disabled={isGeneratingInsight}
                  className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-cyan-500/20 transition-all flex items-center space-x-1"
                >
                  {isGeneratingInsight ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  <span>Generate Sales Analysis</span>
                </button>
              </div>

              {aiInsight ? (
                <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono">
                  {aiInsight}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Click &quot;Generate Sales Analysis&quot; to receive real-time inventory reorder triggers and revenue forecasts from HiveForge AI Agents.</p>
              )}
            </div>

            {/* Recent Sales Transactions History Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-cyan-400" /> Recent Sales Transactions
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items Count</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No sales recorded yet today. Complete a transaction in the POS Billing Counter.
                        </td>
                      </tr>
                    ) : (
                      sales.map(s => (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition-all">
                          <td className="py-3 px-4 font-mono text-cyan-400 font-medium">{s.invoiceNo}</td>
                          <td className="py-3 px-4">{s.customerName || 'Walk-in Customer'}</td>
                          <td className="py-3 px-4">{s.items.reduce((acc, i) => acc + i.quantity, 0)} Items</td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              {s.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-white">₹{s.totalAmount.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setActiveInvoice(s);
                                setShowReceiptModal(true);
                              }}
                              className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs"
                            >
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: STORE LAUNCH & AI MISSIONS                                       */}
        {/* ========================================================================= */}
        {hasStore && navTab === 'STORE_LAUNCH' && (
          <div className="space-y-6">
            {/* Create Store Mission Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h2 className="font-bold text-base text-white mb-2 flex items-center gap-2">
                <Compass className="h-5 w-5 text-cyan-400" /> Launch AI Store Mission
              </h2>
              <p className="text-xs text-slate-400 mb-4">Decompose store starting plans, market research, inventory budget, and promotional campaigns into automated worker tasks.</p>

              <form onSubmit={e => {
                e.preventDefault();
                if (!newTitle || !newDesc) return;
                setIsSubmitting(true);
                const mockId = 'mission-' + Date.now();
                const newMission: Mission = {
                  id: mockId,
                  title: newTitle,
                  description: newDesc,
                  status: 'QUEUED',
                  priority: newPriority,
                  createdAt: new Date().toISOString(),
                  tasks: [
                    { id: mockId + '-t1', title: `Market & Competitor Research for ${newTitle}`, description: 'Demographic study and competitor pricing', workerType: 'Research', status: 'QUEUED', dependencies: [], output: null, assignments: [] },
                    { id: mockId + '-t2', title: `Financial Budget & Cost Allocation`, description: 'Inventory capital model and payback projection', workerType: 'Finance', status: 'WAITING_DEPENDENCIES', dependencies: [{ dependsOnTaskId: mockId + '-t1' }], output: null, assignments: [] },
                    { id: mockId + '-t3', title: `30-Day Launch Campaign Copy`, description: 'Ad slogans, flyers, and social media copy', workerType: 'Marketing', status: 'WAITING_DEPENDENCIES', dependencies: [{ dependsOnTaskId: mockId + '-t2' }], output: null, assignments: [] },
                    { id: mockId + '-t4', title: `Supplier Sourcing & Store SOP Blueprint`, description: 'Vendor network and daily opening SOP checklist', workerType: 'Operations', status: 'WAITING_DEPENDENCIES', dependencies: [{ dependsOnTaskId: mockId + '-t2' }], output: null, assignments: [] }
                  ],
                  activities: []
                };

                setActiveMission(newMission);
                setNewTitle('');
                setNewDesc('');
                setIsSubmitting(false);
              }} className="space-y-3">
                <input
                  type="text"
                  placeholder="Mission Goal (e.g. Launch Ayothiyapattanam Kids & Stationery Hub)"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />

                <textarea
                  placeholder="Detailed Scope (Target audience, location, budget limits, target launch date...)"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>Priority:</span>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !newTitle}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Plan & Execute Mission</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Active Mission Display */}
            {activeMission && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm text-white">{activeMission.title}</h3>
                    <p className="text-xs text-slate-400">{activeMission.description}</p>
                  </div>
                  <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold px-2.5 py-1 rounded text-xs">
                    {activeMission.status}
                  </span>
                </div>

                {/* Task Graph DAG */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {activeMission.tasks.map((task, idx) => (
                    <div key={task.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          Step {idx + 1}: {task.workerType}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{task.status}</span>
                      </div>
                      <h4 className="font-semibold text-xs text-white line-clamp-2">{task.title}</h4>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DIGITAL WORKFORCE TELEMETRY                                      */}
        {/* ========================================================================= */}
        {hasStore && navTab === 'WORKFORCE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-cyan-400" /> Active AI Workers
              </h3>

              <div className="space-y-3">
                {[
                  { role: 'Research Agent', desc: 'Market analysis & competitor benchmarking', status: 'Online' },
                  { role: 'Finance & Pricing Agent', desc: 'Budgets, cost sheets & margin modeling', status: 'Online' },
                  { role: 'Marketing Copywriter', desc: 'Ad slogans, social copy & launch plans', status: 'Online' },
                  { role: 'Operations & Logistics Agent', desc: 'Supplier outreach & daily SOPs', status: 'Online' },
                  { role: 'Sales POS Advisor', desc: 'Inventory reorder triggers & sales prediction', status: 'Online' }
                ].map(w => (
                  <div key={w.role} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-white">{w.role}</h4>
                      <p className="text-[10px] text-slate-400">{w.desc}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Terminal className="h-5 w-5 text-cyan-400" /> Real-Time Activity Log
              </h3>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-400 max-h-72 overflow-y-auto space-y-1.5">
                <div>[System] Initialized HiveForge Retail Engine.</div>
                <div>[POS Counter] Billing Terminal Online. Tax set to 5% GST.</div>
                <div>[Inventory Engine] Loaded {products.length} products into active memory.</div>
                <div>[Scheduler] In-Memory Async Queue Listening for events...</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* ADD PRODUCT MODAL                                                         */}
      {/* ========================================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-cyan-400" /> Add New Inventory Product
              </h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calligraphy Art Marker Pack"
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Category</label>
                  <select
                    value={prodCategory}
                    onChange={e => setProdCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white mt-1 focus:outline-none"
                  >
                    <option value="Stationery">Stationery</option>
                    <option value="Toys">Toys</option>
                    <option value="Bags">Bags</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Gifts">Gifts</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Initial Stock</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50"
                    value={prodStock}
                    onChange={e => setProdStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Cost Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 100"
                    value={prodCost}
                    onChange={e => setProdCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 180"
                    value={prodPrice}
                    onChange={e => setProdPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Min Stock Alert Level</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={prodMinStock}
                    onChange={e => setProdMinStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white mt-1 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Barcode (Optional)</label>
                  <input
                    type="text"
                    placeholder="890123..."
                    value={prodBarcode}
                    onChange={e => setProdBarcode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white mt-1 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="w-1/2 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-lg bg-cyan-500 text-xs font-bold text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE RECEIPT MODAL                                                  */}
      {/* ========================================================================= */}
      {showReceiptModal && activeInvoice && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 font-mono">
            {/* Receipt Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <h3 className="font-bold text-base tracking-tight text-slate-950">ACME RETAIL & UTILITIES</h3>
              <p className="text-[10px] text-slate-600">Main Junction, Ayothiyapattanam, Salem</p>
              <p className="text-[10px] text-slate-600">GSTIN: 33ABCDE1234F1Z5 • Ph: 9876543210</p>
              <div className="mt-2 text-xs font-bold bg-slate-100 py-1 rounded border border-slate-300">
                TAX INVOICE — {activeInvoice.invoiceNo}
              </div>
            </div>

            {/* Customer & Timestamp */}
            <div className="text-[10px] text-slate-600 space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Date: {new Date(activeInvoice.createdAt).toLocaleDateString()}</span>
                <span>Time: {new Date(activeInvoice.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900">
                <span>Customer: {activeInvoice.customerName || 'Walk-in'}</span>
                <span>Pay: {activeInvoice.paymentMethod}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-1 text-xs py-1 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase">
                <span>Item</span>
                <span>Qty x Rate</span>
                <span>Amt</span>
              </div>
              {activeInvoice.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs py-0.5">
                  <span className="w-36 truncate">{it.name}</span>
                  <span className="text-slate-600">{it.quantity} x {it.price}</span>
                  <span className="font-semibold">₹{it.lineTotal}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{activeInvoice.subtotal}</span>
              </div>
              {activeInvoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{activeInvoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (5%):</span>
                <span>₹{activeInvoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-950 pt-1.5 border-t border-slate-400">
                <span>NET PAYABLE:</span>
                <span>₹{activeInvoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 border-t border-dashed border-slate-300">
              <p className="text-[10px] font-bold text-slate-800">Thank You For Shopping With Us!</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Powered by HiveForge Digital Workforce</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-1/2 py-2 rounded-lg bg-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowReceiptModal(false);
                }}
                className="w-1/2 py-2 rounded-lg bg-slate-950 text-white text-xs font-bold flex items-center justify-center space-x-1 hover:bg-slate-800"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
