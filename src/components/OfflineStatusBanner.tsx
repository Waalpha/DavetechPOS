import React, { useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle, CloudUpload, HardDrive, AlertTriangle } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';

export const OfflineStatusBanner: React.FC<{ onOpenModal?: () => void }> = ({ onOpenModal }) => {
  const { isOnline, pendingOfflineSyncCount, triggerManualSync, lastSyncTimestamp } = usePOS();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (isOnline && pendingOfflineSyncCount === 0) {
    return null;
  }

  const handleSyncNow = async () => {
    soundFx.playClick();
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await triggerManualSync();
      if (res.syncedCount > 0) {
        setSyncFeedback(`Successfully synced ${res.syncedCount} records!`);
      } else {
        setSyncFeedback('All offline records are up-to-date.');
      }
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback('Sync retry failed. Will retry automatically.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      id="banner-offline-status"
      className={`w-full px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b text-xs transition-colors duration-200 ${
        !isOnline
          ? 'bg-amber-500 text-slate-950 border-amber-600 font-medium'
          : 'bg-indigo-600 text-white border-indigo-700'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-900 shrink-0">
            <WifiOff className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white shrink-0">
            <CloudUpload className="w-3.5 h-3.5 animate-pulse" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-extrabold flex items-center gap-1.5">
            {!isOnline ? 'Internet Outage Mode Active' : 'Pending Background Sync'}
          </span>
          <span className={`text-[11px] ${!isOnline ? 'text-slate-900/90 font-medium' : 'text-indigo-100'}`}>
            {!isOnline
              ? 'Service Worker cache is running offline. All products, orders & Wi-Fi printing work 100% locally.'
              : `${pendingOfflineSyncCount} transaction(s) queued for synchronization.`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {syncFeedback && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/20 text-white flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {syncFeedback}
          </span>
        )}

        <button
          type="button"
          onClick={handleSyncNow}
          disabled={isSyncing}
          className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50 ${
            !isOnline
              ? 'bg-slate-900 text-amber-300 hover:bg-slate-800'
              : 'bg-white text-indigo-700 hover:bg-indigo-50'
          }`}
          title="Retry network connection and sync pending queue"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>

        {onOpenModal && (
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onOpenModal();
            }}
            className={`px-2 py-1 rounded-lg text-xs font-bold underline underline-offset-2 cursor-pointer ${
              !isOnline ? 'text-slate-900 hover:text-black' : 'text-indigo-100 hover:text-white'
            }`}
          >
            Details
          </button>
        )}
      </div>
    </div>
  );
};
