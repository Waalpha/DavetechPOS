import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  CreditCard,
  Smartphone,
  Coins,
  Receipt,
  Download,
  Search,
  RotateCcw,
  Building,
  Settings,
  Shield,
  Layers,
  Award,
  Sparkles,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Package,
  Zap,
  Boxes,
  Plus,
  Edit2,
  AlertTriangle,
  Check,
  X,
  Trash2,
  Lock,
  UserCheck,
  Phone,
  Mail,
  UserPlus,
  KeyRound,
  FileBarChart,
  Wifi,
  Printer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { usePOS } from '../context/POSContext';
import { BusinessMode, CashierUser, OrderRecord, ProductItem, UserRole } from '../types/pos';
import { soundFx } from '../utils/audio';
import { Daraja3SettingsCard } from './Daraja3SettingsCard';
import { ResetPaymentsModal } from './ResetPaymentsModal';

type DashboardTabType =
  | 'overview'
  | 'products'
  | 'inventory'
  | 'reports'
  | 'daraja'
  | 'cashiers'
  | 'users'
  | 'tenants'
  | 'settings';

export const OwnerDashboard: React.FC = () => {
  const {
    orderHistory,
    currentBusiness,
    updateBusiness,
    businesses,
    switchBusiness,
    cashiers,
    products,
    categories,
    refundOrder,
    setLastCompletedOrder,
    setShowReceiptModal,
    currencySymbol,
    toggleProductInventoryType,
    updateProductStock,
    updateProduct,
    addProduct,
    deleteProduct,
    currentView,
    addCashierUser,
    updateCashierUser,
    deleteCashierUser,
    printerConfig,
    setShowWifiPrinterModal,
  } = usePOS();

  // Tab State
  const [activeTab, setActiveTab] = useState<DashboardTabType>('overview');

  // Sync tab with external POSContext view navigation
  useEffect(() => {
    if (currentView === 'products') setActiveTab('products');
    else if (currentView === 'inventory') setActiveTab('inventory');
    else if (currentView === 'reports') setActiveTab('reports');
    else if (currentView === 'users') setActiveTab('users');
    else if (currentView === 'settings') setActiveTab('settings');
    else if (currentView === 'dashboard') setActiveTab('overview');
  }, [currentView]);

  // Sales Ledger Filters
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerPaymentFilter, setLedgerPaymentFilter] = useState<string>('all');

  // Inventory & Product Filters
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('all');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<'all' | 'inventory' | 'non_inventory' | 'low_stock'>('all');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  // Add/Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormPrice, setProdFormPrice] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState(categories[0]?.id || 'cat-food');
  const [prodFormSku, setProdFormSku] = useState('');
  const [prodFormIsInventory, setProdFormIsInventory] = useState(true);
  const [prodFormStock, setProdFormStock] = useState('50');
  const [prodFormReorder, setProdFormReorder] = useState('10');
  const [prodFormDesc, setProdFormDesc] = useState('');
  const [prodFormImage, setProdFormImage] = useState(
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
  );

  // User Management Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormName, setUserFormName] = useState('');
  const [userFormPin, setUserFormPin] = useState('');
  const [userFormRole, setUserFormRole] = useState<UserRole>('cashier');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormStatus, setUserFormStatus] = useState<'active' | 'inactive'>('active');
  const [userFormAvatarColor, setUserFormAvatarColor] = useState('bg-emerald-600');
  const [userError, setUserError] = useState('');

  // Business settings state
  const [bizName, setBizName] = useState(currentBusiness.name);
  const [bizTagline, setBizTagline] = useState(currentBusiness.tagline);
  const [bizMode, setBizMode] = useState<BusinessMode>(currentBusiness.mode);
  const [bizTaxRate, setBizTaxRate] = useState((currentBusiness.taxRate * 100).toString());
  const [bizTaxPin, setBizTaxPin] = useState(currentBusiness.taxNumber);
  const [bizPhone, setBizPhone] = useState(currentBusiness.phone);
  const [bizAddress, setBizAddress] = useState(currentBusiness.address);
  const [bizFooter, setBizFooter] = useState(currentBusiness.receiptFooter);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showResetPaymentsModal, setShowResetPaymentsModal] = useState(false);

  // Analytics Metrics calculations
  const totalSales = useMemo(() => {
    return orderHistory
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orderHistory]);

  const totalOrders = useMemo(() => {
    return orderHistory.filter((o) => o.status === 'completed').length;
  }, [orderHistory]);

  const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // Estimated COGS & Net Margin
  const netProfit = useMemo(() => {
    return Math.round(totalSales * 0.58);
  }, [totalSales]);

  // Payment Breakdown
  const paymentBreakdownData = useMemo(() => {
    const methods: Record<string, number> = {
      M_Pesa: 0,
      Cash: 0,
      Card: 0,
      Room: 0,
    };

    orderHistory
      .filter((o) => o.status === 'completed')
      .forEach((o) => {
        if (o.paymentMethod === 'mpesa') methods.M_Pesa += o.totalAmount;
        else if (o.paymentMethod === 'cash') methods.Cash += o.totalAmount;
        else if (o.paymentMethod === 'card') methods.Card += o.totalAmount;
        else if (o.paymentMethod === 'room_charge') methods.Room += o.totalAmount;
        else if (o.paymentMethod === 'split' && o.paymentBreakdown) {
          o.paymentBreakdown.forEach((b) => {
            if (b.method === 'cash') methods.Cash += b.amount;
            if (b.method === 'mpesa') methods.M_Pesa += b.amount;
            if (b.method === 'card') methods.Card += b.amount;
            if (b.method === 'room_charge') methods.Room += b.amount;
          });
        }
      });

    return [
      { name: 'M-Pesa', value: methods.M_Pesa, color: '#10b981' },
      { name: 'Cash', value: methods.Cash, color: '#f59e0b' },
      { name: 'Card', value: methods.Card, color: '#6366f1' },
      { name: 'Room Charge', value: methods.Room, color: '#a855f7' },
    ];
  }, [orderHistory]);

  // Hourly Sales Distribution
  const hourlyData = [
    { hour: '08:00', sales: 2400 },
    { hour: '10:00', sales: 5800 },
    { hour: '12:00', sales: 14200 },
    { hour: '14:00', sales: 11600 },
    { hour: '16:00', sales: 8900 },
    { hour: '18:00', sales: 19500 },
    { hour: '20:00', sales: 23800 },
    { hour: '22:00', sales: 12400 },
  ];

  // Best Selling Products
  const bestSellers = useMemo(() => {
    const counts: Record<string, { product: any; qty: number; revenue: number }> = {};

    orderHistory
      .filter((o) => o.status === 'completed')
      .forEach((o) => {
        o.items.forEach((item) => {
          if (!counts[item.product.id]) {
            counts[item.product.id] = {
              product: item.product,
              qty: 0,
              revenue: 0,
            };
          }
          counts[item.product.id].qty += item.quantity;
          counts[item.product.id].revenue += item.subtotal;
        });
      });

    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [orderHistory]);

  // Cashier Performance Scorecard
  const cashierStats = useMemo(() => {
    return cashiers.map((c) => {
      const cashierOrders = orderHistory.filter(
        (o) => o.cashierId === c.id && o.status === 'completed'
      );
      const totalAmount = cashierOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const count = cashierOrders.length;
      const avg = count > 0 ? Math.round(totalAmount / count) : 0;

      return {
        ...c,
        ordersCount: count,
        totalSales: totalAmount,
        avgOrder: avg,
      };
    });
  }, [cashiers, orderHistory]);

  // Inventory KPI statistics
  const inventoryStats = useMemo(() => {
    let inventoryCount = 0;
    let nonInventoryCount = 0;
    let lowStockCount = 0;
    let totalInventoryValue = 0;

    products.forEach((p) => {
      if (p.isInventory !== false) {
        inventoryCount++;
        const stock = p.stock ?? 0;
        totalInventoryValue += stock * p.price;
        if (stock <= (p.reorderLevel || 10)) {
          lowStockCount++;
        }
      } else {
        nonInventoryCount++;
      }
    });

    return {
      totalCount: products.length,
      inventoryCount,
      nonInventoryCount,
      lowStockCount,
      totalInventoryValue,
    };
  }, [products]);

  // Filtered Products Catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (inventorySearch.trim()) {
        const q = inventorySearch.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchBarcode = p.barcode?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBarcode) return false;
      }

      // Category
      if (inventoryCategoryFilter !== 'all' && p.categoryId !== inventoryCategoryFilter) {
        return false;
      }

      // Type Filter
      if (inventoryTypeFilter === 'inventory') return p.isInventory !== false;
      if (inventoryTypeFilter === 'non_inventory') return p.isInventory === false;
      if (inventoryTypeFilter === 'low_stock') {
        return p.isInventory !== false && (p.stock ?? 0) <= (p.reorderLevel || 10);
      }

      return true;
    });
  }, [products, inventorySearch, inventoryCategoryFilter, inventoryTypeFilter]);

  // Filtered Sales Ledger
  const filteredLedger = useMemo(() => {
    return orderHistory.filter((ord) => {
      if (ledgerPaymentFilter !== 'all' && ord.paymentMethod !== ledgerPaymentFilter) {
        return false;
      }
      if (ledgerSearch.trim()) {
        const q = ledgerSearch.toLowerCase();
        return (
          ord.orderNumber.toLowerCase().includes(q) ||
          ord.cashierName.toLowerCase().includes(q) ||
          ord.customerName?.toLowerCase().includes(q) ||
          ord.mpesaRef?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orderHistory, ledgerSearch, ledgerPaymentFilter]);

  // Export Sales CSV
  const handleExportCSV = () => {
    soundFx.playClick();
    let csv = 'Order Number,Date,Cashier,Type,Customer/Table,Items Count,Subtotal,Tax,Discount,Total,Payment Method,Ref\n';
    orderHistory.forEach((o) => {
      csv += `"${o.orderNumber}","${new Date(o.createdAt).toLocaleString()}","${o.cashierName}","${o.orderType}","${o.tableNumber || o.roomNumber || o.customerName || 'Walk-in'}","${o.items.length}","${o.subtotal}","${o.taxAmount}","${o.discountAmount}","${o.totalAmount}","${o.paymentMethod}","${o.mpesaRef || o.cardLast4 || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `davetech_pos_sales_report_${Date.now()}.csv`;
    link.click();
  };

  // Export Inventory CSV
  const handleExportInventoryCSV = () => {
    soundFx.playClick();
    let csv = 'SKU,Name,Category,Classification,Stock,Reorder Level,Unit Price,Valuation\n';
    products.forEach((p) => {
      const isInv = p.isInventory !== false;
      const cat = categories.find((c) => c.id === p.categoryId)?.name || p.categoryId;
      const val = isInv ? (p.stock ?? 0) * p.price : 0;
      csv += `"${p.sku || ''}","${p.name}","${cat}","${isInv ? 'Inventory' : 'Service'}","${isInv ? p.stock ?? 0 : 'N/A'}","${isInv ? p.reorderLevel || 10 : 'N/A'}","${p.price}","${val}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `davetech_pos_inventory_${Date.now()}.csv`;
    link.click();
  };

  // Open Product Modal for Add
  const handleOpenAddProduct = () => {
    soundFx.playClick();
    setEditingProductId(null);
    setProdFormName('');
    setProdFormPrice('');
    setProdFormCategory(categories[0]?.id || 'cat-food');
    setProdFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setProdFormIsInventory(true);
    setProdFormStock('50');
    setProdFormReorder('10');
    setProdFormDesc('');
    setProdFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80');
    setShowProductModal(true);
  };

  // Open Product Modal for Edit
  const handleOpenEditProduct = (prod: ProductItem) => {
    soundFx.playClick();
    setEditingProductId(prod.id);
    setProdFormName(prod.name);
    setProdFormPrice(prod.price.toString());
    setProdFormCategory(prod.categoryId);
    setProdFormSku(prod.sku || '');
    setProdFormIsInventory(prod.isInventory !== false);
    setProdFormStock((prod.stock ?? 0).toString());
    setProdFormReorder((prod.reorderLevel ?? 10).toString());
    setProdFormDesc(prod.description || '');
    setProdFormImage(prod.imageUrl);
    setShowProductModal(true);
  };

  // Save Product (Add or Edit)
  const handleProductFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormName || !prodFormPrice) return;

    soundFx.playSuccess();
    const priceNum = parseFloat(prodFormPrice) || 0;
    const stockNum = prodFormIsInventory ? parseInt(prodFormStock) || 0 : undefined;
    const reorderNum = prodFormIsInventory ? parseInt(prodFormReorder) || 10 : undefined;

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: prodFormName,
        price: priceNum,
        categoryId: prodFormCategory,
        sku: prodFormSku,
        isInventory: prodFormIsInventory,
        stock: stockNum,
        reorderLevel: reorderNum,
        description: prodFormDesc,
        imageUrl: prodFormImage,
      });
    } else {
      addProduct({
        name: prodFormName,
        price: priceNum,
        categoryId: prodFormCategory,
        sku: prodFormSku,
        isInventory: prodFormIsInventory,
        stock: stockNum,
        reorderLevel: reorderNum,
        description: prodFormDesc,
        imageUrl: prodFormImage,
      });
    }

    setShowProductModal(false);
  };

  // Delete Product
  const handleDeleteProduct = (productId: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete "${name}" from POS products?`)) {
      soundFx.playError();
      deleteProduct(productId);
    }
  };

  // Open User Modal for Add
  const handleOpenAddUser = () => {
    soundFx.playClick();
    setEditingUserId(null);
    setUserFormName('');
    setUserFormPin('');
    setUserFormRole('cashier');
    setUserFormPhone('');
    setUserFormEmail('');
    setUserFormStatus('active');
    setUserFormAvatarColor('bg-emerald-600');
    setUserError('');
    setShowUserModal(true);
  };

  // Open User Modal for Edit
  const handleOpenEditUser = (user: CashierUser) => {
    soundFx.playClick();
    setEditingUserId(user.id);
    setUserFormName(user.name);
    setUserFormPin(user.pin);
    setUserFormRole(user.role);
    setUserFormPhone(user.phone || '');
    setUserFormEmail(user.email || '');
    setUserFormStatus(user.status || 'active');
    setUserFormAvatarColor(user.avatarColor);
    setUserError('');
    setShowUserModal(true);
  };

  // Save User (Add or Edit)
  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');

    if (!userFormName.trim()) {
      setUserError('Name is required');
      return;
    }

    if (!/^\d{4,6}$/.test(userFormPin)) {
      setUserError('PIN must be 4 to 6 digits (numbers only)');
      return;
    }

    // Check duplicate PIN
    const duplicate = cashiers.find(
      (c) => c.pin === userFormPin && c.id !== editingUserId
    );
    if (duplicate) {
      setUserError(`PIN code ${userFormPin} is already used by ${duplicate.name}`);
      return;
    }

    soundFx.playSuccess();

    if (editingUserId) {
      updateCashierUser(editingUserId, {
        name: userFormName,
        pin: userFormPin,
        role: userFormRole,
        phone: userFormPhone,
        email: userFormEmail,
        status: userFormStatus,
        avatarColor: userFormAvatarColor,
      });
    } else {
      addCashierUser({
        name: userFormName,
        pin: userFormPin,
        role: userFormRole,
        phone: userFormPhone,
        email: userFormEmail,
        status: userFormStatus,
        avatarColor: userFormRole === 'manager' ? 'bg-indigo-600' : 'bg-emerald-600',
      });
    }

    setShowUserModal(false);
  };

  // Delete User
  const handleDeleteUser = (userId: string, userName: string) => {
    const user = cashiers.find((c) => c.id === userId);
    if (user?.role === 'manager') {
      const managerCount = cashiers.filter((c) => c.role === 'manager').length;
      if (managerCount <= 1) {
        alert('Cannot delete the only remaining Manager account!');
        return;
      }
    }

    if (confirm(`Are you sure you want to delete user "${userName}"?`)) {
      soundFx.playError();
      deleteCashierUser(userId);
    }
  };

  // Save Business Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playSuccess();
    updateBusiness({
      name: bizName,
      tagline: bizTagline,
      mode: bizMode,
      taxRate: (parseFloat(bizTaxRate) || 16) / 100,
      taxNumber: bizTaxPin,
      phone: bizPhone,
      address: bizAddress,
      receiptFooter: bizFooter,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100 p-4 sm:p-6 overflow-hidden select-none" id="owner-dashboard-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            Manager & Executive Dashboard
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
              ROLE: MANAGER
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time sales analytics, products catalog, inventory control, cashier audits, user permissions & tax settings
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              soundFx.playClick();
              setShowResetPaymentsModal(true);
            }}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            id="btn-header-reset-payments"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset All Payments & Start Fresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-emerald-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
            id="btn-export-csv"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sales CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 pb-4 overflow-x-auto">
        {[
          { id: 'overview', label: 'Executive Analytics', icon: TrendingUp },
          { id: 'products', label: `Products & Pricing (${products.length})`, icon: Package },
          { id: 'inventory', label: `Inventory & Stock (${inventoryStats.inventoryCount}/${inventoryStats.totalCount})`, icon: Boxes },
          { id: 'reports', label: `Sales Ledger & Reports (${orderHistory.length})`, icon: FileBarChart },
          { id: 'daraja', label: 'Safaricom Daraja 3.0', icon: Smartphone },
          { id: 'cashiers', label: 'Cashier Performance', icon: Award },
          { id: 'users', label: `Users & Permissions (${cashiers.length})`, icon: Users },
          { id: 'tenants', label: 'Multi-Branch SaaS', icon: Building },
          { id: 'settings', label: 'POS & Tax Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                soundFx.playClick();
                setActiveTab(tab.id as DashboardTabType);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id={`dashboard-tab-${tab.id}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body Container */}
      <div className="flex-1 overflow-y-auto pr-1 pb-6 space-y-5">
        {/* ========================================================
            1. EXECUTIVE OVERVIEW
            ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Gross Sales Today</span>
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {currencySymbol} {totalSales.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+18.4% vs yesterday</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Total Orders</span>
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {totalOrders}
                </div>
                <div className="text-[10px] text-slate-400">Across active cashier shifts</div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Avg Order Value (AOV)</span>
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-700">
                  {currencySymbol} {avgOrderValue.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">Per customer receipt</div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Estimated Net Profit</span>
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-700">
                  {currencySymbol} {netProfit.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">~58% Profit Margin</div>
              </div>
            </div>

            {/* Visual Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Hourly Sales Bar Chart */}
              <div className="lg:col-span-8 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Today's Hourly Sales Volume
                  </h3>
                  <span className="text-[11px] text-slate-500">Peak hours: 18:00 - 20:00</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                      <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#cbd5e1',
                          borderRadius: '12px',
                          color: '#0f172a',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar dataKey="sales" fill="#10b981" radius={[6, 6, 0, 0]} name={`Sales (${currencySymbol})`} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Method Distribution Pie Chart */}
              <div className="lg:col-span-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Payment Method Split
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">M-Pesa, Cash, Card, Room</p>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdownData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {paymentBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  {paymentBreakdownData.map((p) => (
                    <div key={p.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-slate-600">{p.name}:</span>
                      <strong className="text-slate-900 font-bold ml-auto">
                        {currencySymbol} {p.value.toLocaleString()}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Best Sellers */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Top Performing Items Today
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {bestSellers.map((item, idx) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="truncate flex-1">
                      <div className="font-bold text-xs text-slate-900 truncate">{item.product.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.qty} sold • {currencySymbol} {item.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            2. PRODUCTS & PRICING MANAGEMENT
            ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search products by name, SKU, or barcode..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={inventoryCategoryFilter}
                  onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none shadow-xs"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  id="btn-manager-add-product"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Item & Code</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3 text-right">Price ({currencySymbol})</th>
                      <th className="py-3 px-3 text-center">Stock</th>
                      <th className="py-3 px-4 text-right">Manager Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredProducts.map((prod) => {
                      const isInv = prod.isInventory !== false;
                      const cat = categories.find((c) => c.id === prod.categoryId);

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  {prod.name}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  SKU: {prod.sku || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                              {cat?.name || prod.categoryId}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isInv
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isInv ? 'Tracked Stock' : 'Service Item'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                            {currencySymbol} {prod.price.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isInv ? (
                              <span className="font-bold text-slate-800">{prod.stock ?? 0} units</span>
                            ) : (
                              <span className="text-slate-400 italic">Unlimited</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                title="Edit Product & Price"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

        {/* ========================================================
            3. INVENTORY & STOCK
            ======================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Inventory KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tracked Physical Items</span>
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {inventoryStats.inventoryCount}
                </div>
                <div className="text-[10px] text-indigo-700 font-bold">
                  Tracked with stock counts & alerts
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Non-Inventory Services</span>
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {inventoryStats.nonInventoryCount}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">
                  Services, room charges & fees
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Low Stock Warnings</span>
                  <div
                    className={`p-1.5 rounded-lg ${
                      inventoryStats.lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {inventoryStats.lowStockCount}
                </div>
                <div className="text-[10px] text-amber-700 font-bold">
                  {inventoryStats.lowStockCount > 0 ? 'Action needed: reorder soon' : 'All stock levels healthy'}
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Total Stock Valuation</span>
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {currencySymbol} {inventoryStats.totalInventoryValue.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  Retail valuation of physical items
                </div>
              </div>
            </div>

            {/* Inventory Controls: Search, Filter Tabs, Add Product, Export */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search catalog by name, SKU or barcode..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setInventoryTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inventoryTypeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryTypeFilter('inventory')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inventoryTypeFilter === 'inventory'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  <span>Inventory ({inventoryStats.inventoryCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryTypeFilter('low_stock')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inventoryTypeFilter === 'low_stock'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Low Stock ({inventoryStats.lowStockCount})</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleExportInventoryCSV}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                <button
                  onClick={handleOpenAddProduct}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Item & SKU</th>
                      <th className="py-3 px-3">Type & Switch</th>
                      <th className="py-3 px-3">Current Stock</th>
                      <th className="py-3 px-3">Reorder Alert</th>
                      <th className="py-3 px-3 text-right">Unit Price</th>
                      <th className="py-3 px-3 text-right">Stock Valuation</th>
                      <th className="py-3 px-4 text-center">Adjust Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredProducts.map((prod) => {
                      const isInventoryItem = prod.isInventory !== false;
                      const isLowStock =
                        isInventoryItem &&
                        prod.stock !== undefined &&
                        prod.stock <= (prod.reorderLevel || 10) &&
                        prod.stock > 0;
                      const isOutOfStock = isInventoryItem && prod.stock !== undefined && prod.stock <= 0;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                                  <span>{prod.name}</span>
                                  {isOutOfStock && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                      OUT OF STOCK
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                  SKU: {prod.sku || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Inventory Switch Control */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleProductInventoryType(prod.id)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isInventoryItem ? 'bg-indigo-600' : 'bg-slate-300'
                                }`}
                                title={
                                  isInventoryItem
                                    ? 'Click to convert to Non-Inventory Service'
                                    : 'Click to convert to Tracked Physical Stock'
                                }
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    isInventoryItem ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                              <span
                                className={`text-[11px] font-bold ${
                                  isInventoryItem ? 'text-indigo-700' : 'text-emerald-700'
                                }`}
                              >
                                {isInventoryItem ? '📦 Stock' : '⚡ Service'}
                              </span>
                            </div>
                          </td>

                          {/* Current Stock */}
                          <td className="py-3 px-3">
                            {isInventoryItem ? (
                              editingStockId === prod.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    value={tempStockValue}
                                    onChange={(e) => setTempStockValue(parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-1 bg-white border border-indigo-500 rounded-lg text-xs font-bold"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      updateProductStock(prod.id, tempStockValue);
                                      setEditingStockId(null);
                                    }}
                                    className="p-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-2 py-0.8 rounded-md font-extrabold text-xs ${
                                      isOutOfStock
                                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                        : isLowStock
                                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                        : 'bg-slate-100 text-slate-800'
                                    }`}
                                  >
                                    {prod.stock ?? 0} units
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingStockId(prod.id);
                                      setTempStockValue(prod.stock ?? 0);
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                                    title="Edit stock quantity directly"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Unlimited</span>
                            )}
                          </td>

                          {/* Reorder Alert */}
                          <td className="py-3 px-3">
                            {isInventoryItem ? (
                              <span className="text-slate-600 font-semibold">
                                ≤ {prod.reorderLevel || 10} units
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* Price */}
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {currencySymbol} {prod.price.toLocaleString()}
                          </td>

                          {/* Valuation */}
                          <td className="py-3 px-3 text-right font-extrabold text-slate-700">
                            {isInventoryItem ? (
                              `${currencySymbol} ${((prod.stock ?? 0) * prod.price).toLocaleString()}`
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Adjust Stock Buttons */}
                          <td className="py-3 px-4 text-center">
                            {isInventoryItem ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => updateProductStock(prod.id, Math.max(0, (prod.stock ?? 0) - 5))}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px] cursor-pointer"
                                  title="Decrease by 5"
                                >
                                  -5
                                </button>
                                <button
                                  onClick={() => updateProductStock(prod.id, (prod.stock ?? 0) + 10)}
                                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] cursor-pointer"
                                  title="Add 10 units"
                                >
                                  +10
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">N/A</span>
                            )}
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

        {/* ========================================================
            4. SALES LEDGER & REPORTS
            ======================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder="Search receipt #, cashier name, M-Pesa code or customer..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={ledgerPaymentFilter}
                onChange={(e) => setLedgerPaymentFilter(e.target.value)}
                className="px-3 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none shadow-xs"
              >
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash Only</option>
                <option value="mpesa">M-Pesa Only</option>
                <option value="card">Card Only</option>
                <option value="room_charge">Room Charge</option>
              </select>
            </div>

            {/* Sales Table */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">Order #</th>
                    <th className="pb-2">Date & Time</th>
                    <th className="pb-2">Cashier</th>
                    <th className="pb-2">Type / Location</th>
                    <th className="pb-2">Payment</th>
                    <th className="pb-2 text-right">Total Amount</th>
                    <th className="pb-2 text-right">Status</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-bold text-slate-900 font-mono">{ord.orderNumber}</td>
                      <td className="py-3 text-slate-500">
                        {new Date(ord.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 text-slate-700 font-semibold">{ord.cashierName}</td>
                      <td className="py-3 text-slate-500">
                        {ord.tableNumber || ord.roomNumber ? `Room ${ord.roomNumber}` : ord.customerName || ord.orderType}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {ord.paymentMethod}
                          {ord.mpesaRef && ` (${ord.mpesaRef})`}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black text-emerald-700">
                        {currencySymbol} {ord.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ord.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              soundFx.playClick();
                              setLastCompletedOrder(ord);
                              setShowReceiptModal(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 cursor-pointer"
                          >
                            Receipt
                          </button>
                          {ord.status === 'completed' && (
                            <button
                              onClick={() => refundOrder(ord.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200 cursor-pointer"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            5. CASHIER AUDIT & PERFORMANCE
            ======================================================== */}
        {activeTab === 'cashiers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cashierStats.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl ${c.avatarColor} text-white font-black text-sm flex items-center justify-center shadow-xs`}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{c.name}</h4>
                      <p className="text-[10px] text-slate-500 capitalize flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded font-black text-[9px] uppercase ${c.role === 'manager' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {c.role}
                        </span>
                        <span className="font-mono font-bold">PIN: {c.pin}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Transacted:</span>
                      <strong className="text-emerald-700 font-bold">
                        {currencySymbol} {c.totalSales.toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Orders Completed:</span>
                      <strong className="text-slate-900">{c.ordersCount}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Avg Speed & Basket:</span>
                      <span className="text-slate-700">{currencySymbol} {c.avgOrder.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            6. USERS & PERMISSIONS MANAGEMENT (NEW & COMPREHENSIVE)
            ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Header / Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  User Accounts & Role-Based Permissions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage Cashier and Manager login credentials, 4-6 digit PIN codes, and access levels
                </p>
              </div>

              <button
                onClick={handleOpenAddUser}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                id="btn-add-new-user"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User Account</span>
              </button>
            </div>

            {/* Role Comparison Explainer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs uppercase">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  Cashier Role Permissions
                </div>
                <p className="text-[11px] text-emerald-800">
                  Can login with PIN, take customer orders, save/park bills, process Cash/M-Pesa/Card/Split payments, reprint today's customer receipts, and manage tables. Cannot view sales totals, profits, inventory, dashboard, or modify products.
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-1">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs uppercase">
                  <Shield className="w-4 h-4 text-indigo-700" />
                  Manager Role Permissions
                </div>
                <p className="text-[11px] text-indigo-800">
                  Full unrestricted access to executive sales dashboard, today's gross & net sales, product management, pricing adjustments, inventory stock tracking, sales reports, user management, and receipt/tax settings.
                </p>
              </div>
            </div>

            {/* Users List Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">PIN Code</th>
                      <th className="py-3 px-3">Contact</th>
                      <th className="py-3 px-3">Account Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {cashiers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        {/* Avatar & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-2xl ${user.avatarColor} text-white font-black text-xs flex items-center justify-center shadow-xs`}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                {user.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              user.role === 'manager'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* PIN Code */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg w-max">
                            <KeyRound className="w-3 h-3 text-slate-400" />
                            <span>{user.pin}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-3">
                          <div className="text-[11px] text-slate-600 space-y-0.5">
                            {user.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{user.phone}</div>}
                            {user.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{user.email}</div>}
                            {!user.phone && !user.email && <span className="text-slate-400">—</span>}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              user.status !== 'inactive'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {user.status || 'active'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit User & Change PIN"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            DARAJA 3.0 M-PESA INTEGRATION TAB
            ======================================================== */}
        {activeTab === 'daraja' && (
          <div className="space-y-5 animate-in fade-in max-w-4xl">
            <Daraja3SettingsCard />
          </div>
        )}

        {/* ========================================================
            7. MULTI-BRANCH SAAS
            ======================================================== */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" /> Multi-Tenant Branches & Businesses
              </h3>
              <p className="text-xs text-slate-500">
                Davetech POS architecture isolates data per tenant while allowing centralized multi-location management.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {businesses.map((biz) => {
                  const isActive = biz.id === currentBusiness.id;

                  return (
                    <div
                      key={biz.id}
                      className={`p-4 rounded-2xl border transition-all shadow-xs ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500/20'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">{biz.name}</h4>
                          <p className="text-[11px] text-slate-500">{biz.tagline}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{biz.address}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white text-indigo-800 border border-slate-200">
                          {biz.mode}
                        </span>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Tax PIN: {biz.taxNumber}
                        </span>
                        {!isActive ? (
                          <button
                            onClick={() => switchBusiness(biz.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                          >
                            Switch to Branch
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Active Terminal
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            8. POS & TAX SETTINGS
            ======================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <form onSubmit={handleSaveSettings} className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" /> Business Profile & Receipt Configuration
              </h3>

              {settingsSaved && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configuration changes saved successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Name</label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tagline</label>
                  <input
                    type="text"
                    value={bizTagline}
                    onChange={(e) => setBizTagline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business Mode Archetype</label>
                  <select
                    value={bizMode}
                    onChange={(e) => setBizMode(e.target.value as BusinessMode)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize font-bold"
                  >
                    <option value="restaurant">Restaurant & Dining (Tables + KDS)</option>
                    <option value="hotel">Hotel & Resort (Rooms + Folios)</option>
                    <option value="bar">Speed Bar & Club (1-Tap Tabs)</option>
                    <option value="shop">Retail Shop & Supermarket (Barcodes)</option>
                    <option value="services">Service & Salon (Bookings)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">VAT / Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bizTaxRate}
                    onChange={(e) => setBizTaxRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">KRA PIN / Tax Number</label>
                  <input
                    type="text"
                    value={bizTaxPin}
                    onChange={(e) => setBizTaxPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Phone</label>
                  <input
                    type="text"
                    value={bizPhone}
                    onChange={(e) => setBizPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={bizAddress}
                    onChange={(e) => setBizAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Receipt Footer Note</label>
                  <textarea
                    value={bizFooter}
                    onChange={(e) => setBizFooter(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>

            {/* Wi-Fi Thermal Printer & Hardware Card */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-600" />
                  <span>Wi-Fi & Mobile ESC/POS Thermal Printer</span>
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  printerConfig.enabled
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}>
                  {printerConfig.enabled ? 'Active / Online' : 'Disabled'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Connect Android phones, iPhones, and tablets to any 80mm or 58mm ESC/POS Wi-Fi thermal receipt printer over local network IP (e.g. <code>{printerConfig.ipAddress}:{printerConfig.port}</code>).
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Printer IP</div>
                  <div className="font-mono font-extrabold text-slate-800 text-xs mt-0.5">{printerConfig.ipAddress}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Port</div>
                  <div className="font-mono font-extrabold text-slate-800 text-xs mt-0.5">{printerConfig.port}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Roll Width</div>
                  <div className="font-extrabold text-slate-800 text-xs mt-0.5">{printerConfig.paperSize}</div>
                </div>
              </div>

              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setShowWifiPrinterModal(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Configure Wi-Fi Printer & Test</span>
                </button>
              </div>
            </div>

            {/* Safaricom Daraja 3.0 Lipa Na M-Pesa Settings Card */}
            <div className="pt-2">
              <Daraja3SettingsCard />
            </div>

            {/* Financial Maintenance & Clean Slate Reset Card */}
            <div className="p-5 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-4 shadow-xs" id="card-reset-payments-settings">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-rose-600 text-white rounded-2xl shrink-0 mt-0.5 shadow-xs">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Financial Maintenance & Ledger Reset
                    </h3>
                    <p className="text-xs text-rose-700 leading-relaxed mt-0.5">
                      Clear historical payments, re-zero register sales ledger ({currencySymbol} 0.00), reset occupied tables, and start fresh for a new shift or business period.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setShowResetPaymentsModal(true);
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-center"
                  id="btn-settings-open-reset-payments"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset All Payments & Start Fresh</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          ADD / EDIT PRODUCT MODAL
          ======================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <span>{editingProductId ? 'Edit Product & Pricing' : 'Add New Product or Service'}</span>
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductFormSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Classification */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-extrabold text-slate-800 block text-xs">
                  Classification
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setProdFormIsInventory(true);
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                      prodFormIsInventory
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Tracked Inventory</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setProdFormIsInventory(false);
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all ${
                      !prodFormIsInventory
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Non-Inventory Service</span>
                  </button>
                </div>
              </div>

              {/* Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={prodFormName}
                    onChange={(e) => setProdFormName(e.target.value)}
                    placeholder="e.g. Kenya Roast Coffee"
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price ({currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={prodFormPrice}
                    onChange={(e) => setProdFormPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              {/* Category & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={prodFormCategory}
                    onChange={(e) => setProdFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={prodFormSku}
                    onChange={(e) => setProdFormSku(e.target.value)}
                    placeholder="e.g., BEV-001"
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Stock Details */}
              {prodFormIsInventory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <div>
                    <label className="font-bold text-indigo-900 block mb-1">Current Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={prodFormStock}
                      onChange={(e) => setProdFormStock(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-indigo-900 block mb-1">Low Stock Alert Level</label>
                    <input
                      type="number"
                      min="1"
                      value={prodFormReorder}
                      onChange={(e) => setProdFormReorder(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Image URL */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={prodFormImage}
                  onChange={(e) => setProdFormImage(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[11px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingProductId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD / EDIT USER MODAL
          ======================================================== */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span>{editingUserId ? 'Edit User Credentials' : 'Add New Staff User'}</span>
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserFormSubmit} className="p-5 space-y-4 text-xs">
              {userError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs">
                  {userError}
                </div>
              )}

              {/* Role Selector */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 block">User Access Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setUserFormRole('cashier');
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                      userFormRole === 'cashier'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>CASHIER</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setUserFormRole('manager');
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                      userFormRole === 'manager'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>MANAGER</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  placeholder="e.g., Alex Johnson"
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              {/* PIN Code (4-6 digits) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  POS Security PIN (4–6 Digits) *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={userFormPin}
                  onChange={(e) => setUserFormPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4 to 6 digit numerical PIN"
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-black text-center tracking-widest text-base"
                />
                <p className="text-[10px] text-slate-400 mt-1">Used on the login numpad to sign in</p>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={userFormPhone}
                    onChange={(e) => setUserFormPhone(e.target.value)}
                    placeholder="+254 7..."
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={userFormEmail}
                    onChange={(e) => setUserFormEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                <select
                  value={userFormStatus}
                  onChange={(e) => setUserFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize font-bold"
                >
                  <option value="active">Active (Can Login)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingUserId ? 'Save User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Payments Confirmation Modal */}
      <ResetPaymentsModal
        isOpen={showResetPaymentsModal}
        onClose={() => setShowResetPaymentsModal(false)}
      />
    </div>
  );
};
