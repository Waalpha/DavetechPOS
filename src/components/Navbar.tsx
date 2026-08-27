import React, { useState } from 'react';
import {
  Store,
  LayoutDashboard,
  UtensilsCrossed,
  Tv2,
  BedDouble,
  UserCheck,
  Volume2,
  VolumeX,
  Maximize2,
  Sun,
  Moon,
  ChevronDown,
  Lock,
  Receipt,
  Bell,
  Check,
  X,
  Sparkles,
  Package,
  Boxes,
  FileBarChart,
  Users,
  Settings,
  Clock,
  ShieldCheck,
  User,
  Wifi,
  WifiOff,
  CloudUpload,
  HardDrive,
  Printer,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { BusinessMode, POSViewType } from '../types/pos';
import { soundFx } from '../utils/audio';
import { OfflineSyncModal } from './OfflineSyncModal';

export const Navbar: React.FC = () => {
  const {
    businesses,
    currentBusiness,
    switchBusiness,
    businessMode,
    currentCashier,
    isManager,
    isCashier,
    activeShift,
    currentView,
    setCurrentView,
    soundEnabled,
    setSoundEnabled,
    isHighContrast,
    setIsHighContrast,
    setShowShiftReportModal,
    setShowCashierPinModal,
    currencySymbol,
    tables,
    kdsTickets,
    waiterNotifications,
    dismissNotification,
    cartTotals,
    activeUnpaidOrders,
    printerConfig,
    setShowWifiPrinterModal,
    isOnline,
    pendingOfflineSyncCount,
    syncProgress,
  } = usePOS();

  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showMobileManagerMenu, setShowMobileManagerMenu] = useState(false);
  const [showOfflineSyncModal, setShowOfflineSyncModal] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Live count computations
  const readyTablesCount = tables.filter((t) => t.status === 'ready').length;
  const activeTablesCount = tables.filter((t) => ['occupied', 'order_sent', 'preparing', 'ready', 'bill_requested'].includes(t.status)).length;
  const activeKdsCount = kdsTickets.filter((t) => t.status !== 'served').length;

  const isManagerViewActive = ['dashboard', 'products', 'inventory', 'reports', 'users', 'settings'].includes(currentView);

  return (
    <>
      <header className="bg-white border-b border-slate-200 text-slate-850 select-none px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shadow-xs z-30 relative shrink-0" id="main-pos-navbar">
        {/* Left: Brand & Business Switcher */}
        <div className="flex items-center gap-2">
          <div
            onClick={() => setCurrentView('pos')}
            className="flex items-center gap-2 cursor-pointer group"
            id="nav-brand-logo"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-emerald-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-black text-sm sm:text-base md:text-lg tracking-tight text-slate-900 flex items-center gap-0.5 sm:gap-1">
                  Davetech <span className="text-emerald-600 font-black">POS</span>
                </span>
                {/* Active Role Indicator Badge */}
                <span
                  className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wide border ${
                    isManager
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                  id="active-role-indicator-badge"
                >
                  {currentCashier?.role || 'CASHIER'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[110px] sm:max-w-[150px] md:max-w-[170px]">
                {currentBusiness.name}
              </p>
            </div>
          </div>

          {/* Business Tenant Dropdown (Managers only or Quick Switch) */}
          {isManager && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors shadow-xs cursor-pointer"
                id="btn-switch-business"
              >
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                <span className="max-w-[110px] truncate">{currentBusiness.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showBusinessDropdown && (
                <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Business Outlet
                  </div>
                  <div className="space-y-1">
                    {businesses.map((biz) => (
                      <button
                        key={biz.id}
                        onClick={() => {
                          switchBusiness(biz.id);
                          setShowBusinessDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          biz.id === currentBusiness.id
                            ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{biz.name}</div>
                          <div className="text-[10px] opacity-75 capitalize">{biz.mode} • {biz.address}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Strict Role-Based Navigation Tabs (Desktop & Large Tablets) */}
        <nav className="hidden md:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto max-w-full">
          {/* 1. Register (Both Roles) */}
          <button
            onClick={() => setCurrentView('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentView === 'pos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-pos-register"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>

          {/* 2. Tables (Both Roles if hospitality mode) */}
          {(businessMode === 'restaurant' || businessMode === 'hotel' || businessMode === 'bar') && (
            <button
              onClick={() => setCurrentView('tables')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all relative cursor-pointer ${
                currentView === 'tables'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              id="tab-tables-view"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Tables</span>
              {activeTablesCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  readyTablesCount > 0
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : 'bg-amber-200 text-amber-950'
                }`}>
                  {activeTablesCount}
                </span>
              )}
            </button>
          )}

          {/* 3. Customer Orders & Bills (Both Roles) */}
          <button
            onClick={() => setCurrentView('orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              currentView === 'orders'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
            id="tab-customer-orders"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Orders & Bills</span>
          </button>

          {/* 4. Kitchen KDS (Both Roles if enabled) */}
          {(businessMode === 'restaurant' || businessMode === 'hotel' || businessMode === 'bar') && (
            <button
              onClick={() => setCurrentView('kds')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all relative cursor-pointer ${
                currentView === 'kds'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              id="tab-kds-view"
            >
              <Tv2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kitchen</span> KDS
              {activeKdsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                  {activeKdsCount}
                </span>
              )}
            </button>
          )}

          {/* 5. Hotel Rooms Folio (Hospitality Mode) */}
          {businessMode === 'hotel' && (
            <button
              onClick={() => setCurrentView('rooms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentView === 'rooms'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              id="tab-rooms-view"
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>Rooms</span>
            </button>
          )}

          {/* ========================================================
              MANAGER-ONLY MENU TABS (STRICTLY HIDDEN FROM CASHIERS)
              ======================================================== */}
          {isManager && (
            <>
              {/* Dashboard / Analytics */}
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                id="tab-manager-dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              {/* Products Management */}
              <button
                onClick={() => setCurrentView('products')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  currentView === 'products'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                id="tab-manager-products"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Products</span>
              </button>

              {/* Inventory & Stock */}
              <button
                onClick={() => setCurrentView('inventory')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  currentView === 'inventory'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                id="tab-manager-inventory"
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Inventory</span>
              </button>

              {/* Sales & Cashier Reports */}
              <button
                onClick={() => setCurrentView('reports')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  currentView === 'reports'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                id="tab-manager-reports"
              >
                <FileBarChart className="w-3.5 h-3.5" />
                <span>Reports</span>
              </button>

              {/* Users & Permissions */}
              <button
                onClick={() => setCurrentView('users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  currentView === 'users'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                id="tab-manager-users"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Users</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setCurrentView('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  currentView === 'settings'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                id="tab-manager-settings"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            </>
          )}
        </nav>

        {/* Right: Waiter Notifications, Shift Indicator & User Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Waiter Kitchen Ready Bell Notification */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowNotificationDrawer(!showNotificationDrawer);
              }}
              className={`p-2 rounded-xl text-xs border transition-all relative cursor-pointer ${
                waiterNotifications.length > 0
                  ? 'bg-amber-100 text-amber-900 border-amber-400 animate-bounce ring-2 ring-amber-400/40'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
              title="Kitchen Order Ready Alerts"
              id="btn-waiter-bell"
            >
              <Bell className="w-4 h-4" />
              {waiterNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                  {waiterNotifications.length}
                </span>
              )}
            </button>

            {/* Waiter Notification Popover */}
            {showNotificationDrawer && (
              <div className="absolute right-0 mt-2 w-76 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <h4 className="font-extrabold text-xs text-slate-900">
                      Kitchen Food Ready Alerts ({waiterNotifications.length})
                    </h4>
                  </div>
                  <button
                    onClick={() => setShowNotificationDrawer(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {waiterNotifications.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4 italic">
                      No pending food pickup alerts.
                    </p>
                  ) : (
                    waiterNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-emerald-950">
                            🔔 {notif.tableOrRoom} is READY!
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            {notif.orderNumber}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">
                          {notif.itemsSummary}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400">
                            Server: {notif.waiterName || 'Sarah Jenkins'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                dismissNotification(notif.id);
                                setCurrentView('tables');
                                setShowNotificationDrawer(false);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-xs cursor-pointer"
                            >
                              Serve to Table
                            </button>
                            <button
                              onClick={() => dismissNotification(notif.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Shift Indicator:
              - Manager: Sees full sales figure + Z-report modal
              - Cashier: Sees Shift Active status, sales totals hidden per RBAC */}
          {activeShift && (
            <button
              onClick={() => {
                if (isManager) {
                  setShowShiftReportModal(true);
                }
              }}
              className={`hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-colors shadow-xs ${
                isManager ? 'cursor-pointer' : 'cursor-default'
              }`}
              title={isManager ? "View Shift Status / Z-Report" : "Active Shift Open"}
              id="btn-shift-indicator"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <div>
                <span className="text-slate-400 text-[10px] font-semibold block leading-tight">
                  {isManager ? 'Shift Sales' : 'Shift Status'}
                </span>
                {isManager ? (
                  <span className="font-extrabold text-emerald-700">
                    {currencySymbol} {activeShift.totalSales.toLocaleString()}
                  </span>
                ) : (
                  <span className="font-extrabold text-slate-700">
                    Active (Float: {currencySymbol} {activeShift.openingFloat.toLocaleString()})
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Online / Offline Service Worker Resilience Status Indicator */}
          <button
            onClick={() => {
              soundFx.playClick();
              setShowOfflineSyncModal(true);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs border font-extrabold transition-all relative cursor-pointer flex items-center gap-1.5 shadow-xs ${
              !isOnline
                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 ring-1 ring-amber-400/40'
                : syncProgress.syncState === 'syncing'
                ? 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200 animate-pulse'
                : syncProgress.syncState === 'synced' && syncProgress.syncedCount > 0
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
            title={
              !isOnline
                ? `Offline Mode Active — ${pendingOfflineSyncCount} transaction(s) stored locally in IndexedDB`
                : syncProgress.syncState === 'syncing'
                ? `Synchronizing ${pendingOfflineSyncCount} sales with cloud server...`
                : `System Online & Synchronized`
            }
            id="btn-navbar-offline-sync"
          >
            <div className="relative flex items-center">
              {!isOnline ? (
                <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
              ) : syncProgress.syncState === 'syncing' ? (
                <CloudUpload className="w-4 h-4 text-blue-700 animate-spin shrink-0" />
              ) : syncProgress.syncState === 'synced' && syncProgress.syncedCount > 0 ? (
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300 shrink-0 inline-block"></span>
              )}
              {pendingOfflineSyncCount > 0 && !isOnline && (
                <span className="ml-1 px-1 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full">
                  {pendingOfflineSyncCount}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wide">
              {!isOnline
                ? pendingOfflineSyncCount > 0
                  ? `OFFLINE (${pendingOfflineSyncCount} SAVED)`
                  : 'OFFLINE (SAVED LOCALLY)'
                : syncProgress.syncState === 'syncing'
                ? `SYNCING ${pendingOfflineSyncCount} SALES...`
                : syncProgress.syncState === 'synced' && syncProgress.syncedCount > 0
                ? `${syncProgress.syncedCount} SALES SYNCHRONIZED`
                : 'ONLINE'}
            </span>
          </button>

          {/* Wi-Fi Printer Status & Config Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              setShowWifiPrinterModal(true);
            }}
            className={`p-2 rounded-xl text-xs border transition-all relative cursor-pointer flex items-center gap-1.5 ${
              printerConfig.enabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
            }`}
            title={`Wi-Fi Thermal Printer (${printerConfig.ipAddress}) - Click to configure / test`}
            id="btn-navbar-wifi-printer"
          >
            <div className="relative">
              <Wifi className="w-4 h-4" />
              {printerConfig.enabled && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              )}
            </div>
            <span className="text-[10px] font-extrabold hidden md:inline font-mono">
              {printerConfig.ipAddress.split('.').slice(-2).join('.')}
            </span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs border transition-colors shadow-xs cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
            }`}
            title={soundEnabled ? 'Touch Sounds: On' : 'Touch Sounds: Muted'}
            id="btn-toggle-sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* High Contrast */}
          <button
            onClick={() => setIsHighContrast(!isHighContrast)}
            className={`p-2 rounded-xl text-xs border transition-colors shadow-xs cursor-pointer hidden sm:block ${
              isHighContrast
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle High-Contrast Mode"
            id="btn-toggle-contrast"
          >
            {isHighContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 text-xs transition-colors shadow-xs hidden sm:block cursor-pointer"
            title="Fullscreen POS"
            id="btn-toggle-fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Cashier / Manager User Avatar & Switch PIN */}
          {currentCashier ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              <button
                onClick={() => setShowCashierPinModal(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-all group shadow-xs cursor-pointer"
                id="btn-current-cashier"
                title="Click to Switch User or Lock POS"
              >
                <div
                  className={`w-7 h-7 rounded-full ${currentCashier.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                >
                  {currentCashier.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="font-black text-slate-900 block text-xs leading-none">
                    {currentCashier.name.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider ${
                      isManager ? 'text-indigo-600' : 'text-emerald-700'
                    }`}
                  >
                    {currentCashier.role}
                  </span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 ml-0.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCashierPinModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              id="btn-login-cashier"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PIN Login</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================
          MOBILE BOTTOM NAVIGATION BAR (FOR PHONES & COMPACT TABLETS)
          ======================================================== */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-2 py-1.5 flex items-center justify-around shadow-2xl pb-safe select-none"
        id="mobile-pos-bottom-nav"
      >
        {/* 1. Register */}
        <button
          onClick={() => {
            soundFx.playClick();
            setCurrentView('pos');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            currentView === 'pos'
              ? 'text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="mobile-nav-register"
        >
          <div className="relative">
            <Store className="w-5 h-5" />
            {cartTotals.itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs animate-in zoom-in">
                {cartTotals.itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Register</span>
        </button>

        {/* 2. Tables */}
        {(businessMode === 'restaurant' || businessMode === 'hotel' || businessMode === 'bar') && (
          <button
            onClick={() => {
              soundFx.playClick();
              setCurrentView('tables');
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              currentView === 'tables'
                ? 'text-amber-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="mobile-nav-tables"
          >
            <div className="relative">
              <UtensilsCrossed className="w-5 h-5" />
              {activeTablesCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-600 text-white shadow-xs">
                  {activeTablesCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Tables</span>
          </button>
        )}

        {/* 3. Orders & Bills */}
        <button
          onClick={() => {
            soundFx.playClick();
            setCurrentView('orders');
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            currentView === 'orders'
              ? 'text-slate-900 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="mobile-nav-orders"
        >
          <div className="relative">
            <Clock className="w-5 h-5" />
            {activeUnpaidOrders.length > 0 && (
              <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-700 text-white shadow-xs">
                {activeUnpaidOrders.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Orders</span>
        </button>

        {/* 4. Kitchen KDS */}
        {(businessMode === 'restaurant' || businessMode === 'hotel' || businessMode === 'bar') && (
          <button
            onClick={() => {
              soundFx.playClick();
              setCurrentView('kds');
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              currentView === 'kds'
                ? 'text-rose-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="mobile-nav-kds"
          >
            <div className="relative">
              <Tv2 className="w-5 h-5" />
              {activeKdsCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white shadow-xs">
                  {activeKdsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Kitchen</span>
          </button>
        )}

        {/* 5. Hotel Rooms Folio (Hospitality Mode) */}
        {businessMode === 'hotel' && (
          <button
            onClick={() => {
              soundFx.playClick();
              setCurrentView('rooms');
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              currentView === 'rooms'
                ? 'text-indigo-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="mobile-nav-rooms"
          >
            <BedDouble className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Rooms</span>
          </button>
        )}

        {/* 6. Manager Menu (Only visible to Managers) */}
        {isManager && (
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowMobileManagerMenu(!showMobileManagerMenu);
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                isManagerViewActive
                  ? 'text-indigo-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="mobile-nav-manager"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Manager</span>
            </button>

            {/* Mobile Manager Sub-Menu Popover */}
            {showMobileManagerMenu && (
              <div className="absolute bottom-14 right-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in slide-in-from-bottom-2 fade-in">
                <div className="px-2 py-1 text-[10px] font-black uppercase text-indigo-700 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span>Manager Hub</span>
                  <X
                    className="w-3.5 h-3.5 text-slate-400 cursor-pointer"
                    onClick={() => setShowMobileManagerMenu(false)}
                  />
                </div>

                <div className="space-y-0.5">
                  <button
                    onClick={() => {
                      setCurrentView('dashboard');
                      setShowMobileManagerMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      currentView === 'dashboard'
                        ? 'bg-indigo-50 text-indigo-900 font-black'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('products');
                      setShowMobileManagerMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      currentView === 'products'
                        ? 'bg-indigo-50 text-indigo-900 font-black'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>Products</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('inventory');
                      setShowMobileManagerMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      currentView === 'inventory'
                        ? 'bg-indigo-50 text-indigo-900 font-black'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Boxes className="w-4 h-4 text-indigo-600" />
                    <span>Inventory</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('reports');
                      setShowMobileManagerMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      currentView === 'reports'
                        ? 'bg-indigo-50 text-indigo-900 font-black'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FileBarChart className="w-4 h-4 text-indigo-600" />
                    <span>Reports</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('users');
                      setShowMobileManagerMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      currentView === 'users'
                        ? 'bg-indigo-50 text-indigo-900 font-black'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Users</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('settings');
                      setShowMobileManagerMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                      currentView === 'settings'
                        ? 'bg-indigo-50 text-indigo-900 font-black'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Settings className="w-4 h-4 text-indigo-600" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Service Worker & Offline Sync Modal */}
      <OfflineSyncModal
        isOpen={showOfflineSyncModal}
        onClose={() => setShowOfflineSyncModal(false)}
      />
    </>
  );
};
