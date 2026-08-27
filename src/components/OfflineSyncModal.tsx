import React, { useState, useEffect } from 'react';
import {
  X,
  Wifi,
  WifiOff,
  CloudUpload,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Layers,
  Sparkles,
  Zap,
  Clock,
  DollarSign,
  Receipt,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { offlineSyncManager } from '../utils/offlineSyncManager';
import {
  getAllOfflineTransactions,
  OfflineTransactionRecord,
  getCachedShiftsFromDb,
} from '../utils/offlineDb';
import { syncCoreDataToServiceWorker } from '../utils/serviceWorkerRegistration';
import { CATEGORIES } from '../data/mockData';
import { soundFx } from '../utils/audio';

export const OfflineSyncModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    isOnline,
    pendingOfflineSyncCount,
    lastSyncTimestamp,
    triggerManualSync,
    products,
    businesses,
    currentBusiness,
    currentBusinessId,
    currencySymbol,
    tables,
    cashiers,
    syncProgress,
  } = usePOS();

  const [dbTransactions, setDbTransactions] = useState<OfflineTransactionRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cacheRefreshing, setCacheRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'cache' | 'diagnostics'>('transactions');

  const loadData = async () => {
    try {
      const txs = await getAllOfflineTransactions();
      setDbTransactions(txs);
    } catch {
      setDbTransactions([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, pendingOfflineSyncCount, syncProgress]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    soundFx.playClick();
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await triggerManualSync();
      await loadData();
      if (res.syncedCount > 0) {
        setStatusMessage(`Successfully synchronized ${res.syncedCount} sales to the cloud server!`);
      } else {
        setStatusMessage('All transactions are already synchronized.');
      }
    } catch {
      setStatusMessage('Sync operation encountered a network error.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleSimulatedNetwork = () => {
    soundFx.playClick();
    const nextState = !isOnline;
    offlineSyncManager.setSimulatedOnline(nextState);
    setStatusMessage(
      nextState
        ? 'Network restored: POS is now ONLINE. Auto-syncing pending sales...'
        : 'Network disconnected: POS is now in OFFLINE-FIRST mode (all sales saved locally to IndexedDB).'
    );
  };

  const handleRefreshCacheSnapshot = async () => {
    soundFx.playClick();
    setCacheRefreshing(true);
    setStatusMessage(null);
    try {
      syncCoreDataToServiceWorker({
        businesses,
        currentBusinessId,
        products,
        categories: CATEGORIES,
        tables,
        cashiers,
        lastUpdated: new Date().toISOString(),
      });
      setTimeout(() => {
        setCacheRefreshing(false);
        setStatusMessage('Core POS catalog snapshot refreshed in Service Worker Cache Storage!');
        soundFx.playSuccess();
      }, 600);
    } catch {
      setCacheRefreshing(false);
      setStatusMessage('Failed to update Service Worker cache.');
      soundFx.playError();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight flex items-center gap-2">
                <span>Offline-First Engine & Sync Center</span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    isOnline ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'
                  }`}
                >
                  {isOnline ? 'Online' : 'Offline Mode'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                IndexedDB local persistence, transaction queues & cloud sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'transactions'
                ? 'border-emerald-600 text-emerald-800 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>IndexedDB Transactions ({dbTransactions.length})</span>
            {pendingOfflineSyncCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full">
                {pendingOfflineSyncCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cache')}
            className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cache'
                ? 'border-emerald-600 text-emerald-800 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Offline Cache</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'border-emerald-600 text-emerald-800 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulation & Testing</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* TAB 1: TRANSACTIONS LIST */}
          {activeTab === 'transactions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    Local IndexedDB Sales Records
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Every transaction is assigned a unique idempotency UUID to prevent duplicates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncing || !isOnline}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Pending Sales'}</span>
                  </button>
                </div>
              </div>

              {dbTransactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-2">
                  <Database className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700">No Offline Transactions Recorded Yet</p>
                  <p className="text-[11px]">
                    When sales are completed (online or offline), they are durably stored here in IndexedDB.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {dbTransactions.map((tx) => (
                    <div
                      key={tx.transactionId}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-colors space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900">
                            {tx.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            UUID: {tx.transactionId}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            tx.syncStatus === 'SYNCED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : tx.syncStatus === 'SYNCING'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {tx.syncStatus === 'SYNCED' ? '✓ Synced to Cloud' : '⏳ Pending Cloud Sync'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span>
                          {tx.items.length} item(s) • Cashier: <strong>{tx.cashierName}</strong>
                          {tx.tableNumber && ` • Table: ${tx.tableNumber}`}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {currencySymbol} {tx.totalAmount.toLocaleString()} (
                          {tx.paymentMethod.toUpperCase()})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <span>Created: {new Date(tx.createdAt).toLocaleTimeString()}</span>
                        {tx.syncedAt && (
                          <span className="text-emerald-700">
                            Synced at: {new Date(tx.syncedAt).toLocaleTimeString()}
                          </span>
                        )}
                        {tx.mpesaRef && (
                          <span className="font-mono text-emerald-800 font-bold">
                            M-Pesa Ref: {tx.mpesaRef}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CACHE SNAPSHOT */}
          {activeTab === 'cache' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-indigo-600" />
                    <span>Service Worker Cache & IndexedDB</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                    davetech-pos-v1
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Cached Products</div>
                    <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                      {products.length} Products
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Tables & Rooms</div>
                    <div className="font-extrabold text-slate-800 text-sm mt-0.5">
                      {tables.length} Tables
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  During an internet outage, the entire POS catalog, cashier PIN authentication, order creation, table floorplan, KDS kitchen dispatcher, and Wi-Fi receipt printing operate 100% locally.
                </p>

                <button
                  type="button"
                  onClick={handleRefreshCacheSnapshot}
                  disabled={cacheRefreshing}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 active:scale-[0.99] text-slate-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cacheRefreshing ? 'animate-spin' : ''}`} />
                  <span>{cacheRefreshing ? 'Refreshing Snapshot...' : 'Refresh Core Catalog in Cache'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTICS & SIMULATION */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-700" />
                    <span>Simulate Internet Disconnection</span>
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      !isOnline ? 'bg-amber-300 text-amber-950' : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {!isOnline ? 'SIMULATING OFFLINE' : 'ONLINE'}
                  </span>
                </div>

                <p className="text-xs text-amber-800 leading-relaxed">
                  Use this toggle to simulate internet failure right in the browser. While disconnected, you can create orders, process cash/card/M-Pesa payments, and print receipts. When re-connected, transactions synchronize automatically.
                </p>

                <button
                  type="button"
                  onClick={handleToggleSimulatedNetwork}
                  className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    isOnline
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <WifiOff className="w-4 h-4" />
                      <span>SIMULATE INTERNET OUTAGE (GO OFFLINE)</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4" />
                      <span>RESTORE INTERNET CONNECTION (GO ONLINE)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            {lastSyncTimestamp
              ? `Last Sync: ${new Date(lastSyncTimestamp).toLocaleTimeString()}`
              : 'Auto-sync active'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

