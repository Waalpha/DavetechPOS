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
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { offlineSyncManager, QueuedOfflineAction } from '../utils/offlineSyncManager';
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
    tables,
    cashiers,
  } = usePOS();

  const [queue, setQueue] = useState<QueuedOfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cacheRefreshing, setCacheRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [swActive, setSwActive] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setQueue(offlineSyncManager.getQueue());
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        setSwActive(true);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    soundFx.playClick();
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await triggerManualSync();
      setQueue(offlineSyncManager.getQueue());
      if (res.syncedCount > 0) {
        setStatusMessage(`Successfully synced ${res.syncedCount} queued actions to cloud!`);
      } else {
        setStatusMessage('No pending actions needed syncing.');
      }
    } catch {
      setStatusMessage('Sync operation encountered a network error.');
    } finally {
      setIsSyncing(false);
    }
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
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight flex items-center gap-2">
                <span>Service Worker & Offline Engine</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                  isOnline ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'
                }`}>
                  {isOnline ? 'Online' : 'Offline Mode'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Asset caching, local persistence & background synchronization
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Service Worker Status Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <span>Service Worker Cache</span>
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                davetech-pos-v1
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Cached Catalog</div>
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
              The Service Worker intercepts all asset and product catalog requests. During an internet outage, the entire POS, table floorplan, KDS kitchen dispatcher, and Wi-Fi receipt printing execute locally with 0 latency.
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

          {/* Offline Sync Queue */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-emerald-600" />
                <span>Pending Outage Sync Queue</span>
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                pendingOfflineSyncCount > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {pendingOfflineSyncCount} Pending
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-500 opacity-60" />
                <span>All transactions and orders are fully synchronized.</span>
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-extrabold text-slate-800 capitalize">
                        {item.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString()} &bull; ID: {item.id.slice(0, 14)}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.synced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.synced ? 'Synced' : 'Queued'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Sync Queued Transactions Now'}</span>
            </button>
          </div>
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
