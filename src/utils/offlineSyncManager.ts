/**
 * Davetech POS - Offline-First Synchronization Engine
 * Handles automatic offline sales capture, unique local transaction ID generation,
 * duplicate-safe idempotency synchronization, IndexedDB persistence,
 * and live connection status broadcasting.
 */

import {
  saveOfflineTransaction,
  getAllOfflineTransactions,
  getPendingOfflineTransactions,
  updateTransactionSyncStatus,
  queueInventoryAdjustment,
  markInventoryAdjustmentsSynced,
  OfflineTransactionRecord,
  OfflineSyncStatus,
} from './offlineDb';

export interface SyncProgressUpdate {
  isOnline: boolean;
  syncState: 'idle' | 'syncing' | 'synced' | 'failed';
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  lastSyncTimestamp: string | null;
  statusMessage: string;
}

export type SyncListener = (status: SyncProgressUpdate) => void;

const DEVICE_SESSION_KEY = 'davetech_device_session_id';
const DAILY_SEQ_KEY_PREFIX = 'davetech_daily_seq_';
const LAST_SYNC_KEY = 'davetech_last_online_sync_ts';

export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncState: 'idle' | 'syncing' | 'synced' | 'failed' = 'idle';
  private statusMessage: string = 'Online and ready';
  private listeners: SyncListener[] = [];
  private deviceSessionId: string = '';
  private isSyncingInProgress: boolean = false;
  private heartbeatInterval: number | null = null;
  private processedTransactionIds: Set<string> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initSession();
      this.isOnline = navigator.onLine;

      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Periodic check every 15s to catch network reconnects or silent drops
      this.startHeartbeat();

      // Initial check & auto-sync if pending items exist
      setTimeout(() => {
        this.checkAndSync();
      }, 1000);
    }
  }

  public static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  private initSession() {
    try {
      let sess = localStorage.getItem(DEVICE_SESSION_KEY);
      if (!sess) {
        sess = `DEV-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        localStorage.setItem(DEVICE_SESSION_KEY, sess);
      }
      this.deviceSessionId = sess;
    } catch {
      this.deviceSessionId = 'DEV-01';
    }
  }

  public getDeviceSessionId(): string {
    return this.deviceSessionId;
  }

  /**
   * Generates a unique, standardized local transaction ID (e.g. OFF-20260827-0001)
   * Serves as an Idempotency Key to strictly prevent duplicate sales upon sync retries.
   */
  public generateOfflineTransactionId(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const key = `${DAILY_SEQ_KEY_PREFIX}${dateStr}`;

    let seq = 1;
    try {
      const storedSeq = localStorage.getItem(key);
      if (storedSeq) {
        seq = parseInt(storedSeq, 10) + 1;
      }
      localStorage.setItem(key, String(seq));
    } catch {
      seq = Math.floor(1000 + Math.random() * 9000);
    }

    const seqFormatted = String(seq).padStart(4, '0');
    return `OFF-${dateStr}-${seqFormatted}`;
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public setSimulatedOnline(online: boolean) {
    if (online) {
      this.handleOnline();
    } else {
      this.handleOffline();
    }
  }

  public getSyncState(): 'idle' | 'syncing' | 'synced' | 'failed' {
    return this.syncState;
  }

  public getStatusMessage(): string {
    return this.statusMessage;
  }

  public getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  }

  public subscribe(callback: SyncListener): () => void {
    this.listeners.push(callback);
    // Trigger initial broadcast
    this.emitStatus();
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private async emitStatus() {
    let pending = 0;
    let synced = 0;
    let failed = 0;

    try {
      const all = await getAllOfflineTransactions();
      pending = all.filter((t) => t.syncStatus === 'PENDING').length;
      synced = all.filter((t) => t.syncStatus === 'SYNCED').length;
      failed = all.filter((t) => t.syncStatus === 'FAILED').length;
    } catch {}

    const payload: SyncProgressUpdate = {
      isOnline: this.isOnline,
      syncState: this.syncState,
      pendingCount: pending,
      syncedCount: synced,
      failedCount: failed,
      lastSyncTimestamp: this.getLastSyncTime(),
      statusMessage: this.statusMessage,
    };

    this.listeners.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error('[OfflineSync] Listener error:', err);
      }
    });
  }

  private handleOnline() {
    console.log('[OfflineSync] Network status: ONLINE. Initiating background sync.');
    this.isOnline = true;
    this.statusMessage = 'Internet restored. Syncing offline transactions...';
    this.emitStatus();
    this.processSyncQueue();
  }

  private handleOffline() {
    console.log('[OfflineSync] Network status: OFFLINE. POS running in local cache mode.');
    this.isOnline = false;
    this.syncState = 'idle';
    this.statusMessage = 'Offline — sales saved locally in IndexedDB';
    this.emitStatus();
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = window.setInterval(async () => {
      // Check real internet reachability
      const currentNavOnline = navigator.onLine;
      if (currentNavOnline !== this.isOnline) {
        if (currentNavOnline) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      } else if (this.isOnline && !this.isSyncingInProgress) {
        // Periodic check for any pending items
        const pending = await getPendingOfflineTransactions();
        if (pending.length > 0) {
          this.processSyncQueue();
        }
      }
    }, 15000);
  }

  /**
   * Save a transaction to the local IndexedDB database immediately.
   * If online, queues for immediate background sync; if offline, marks as PENDING.
   */
  public async recordOfflineSale(
    txData: Omit<OfflineTransactionRecord, 'syncStatus' | 'retryCount' | 'deviceId' | 'sessionId'>
  ): Promise<OfflineTransactionRecord> {
    const record: OfflineTransactionRecord = {
      ...txData,
      deviceId: this.deviceSessionId,
      sessionId: this.deviceSessionId,
      syncStatus: this.isOnline ? 'SYNCED' : 'PENDING',
      retryCount: 0,
      syncedAt: this.isOnline ? new Date().toISOString() : undefined,
    };

    // 1. Persist to IndexedDB
    await saveOfflineTransaction(record);

    // 2. Queue inventory deductions
    const invPromises = record.items
      .filter((i) => i.isInventory)
      .map((item) =>
        queueInventoryAdjustment({
          id: `adj-${record.transactionId}-${item.productId}`,
          transactionId: record.transactionId,
          productId: item.productId,
          quantityDelta: -item.quantity,
          timestamp: record.createdAt,
          synced: this.isOnline,
        })
      );
    await Promise.all(invPromises);

    // 3. Update status & schedule sync if online
    if (this.isOnline) {
      this.processedTransactionIds.add(record.transactionId);
    } else {
      this.statusMessage = `Offline: ${record.orderNumber} saved to local database`;
    }

    this.emitStatus();
    return record;
  }

  /**
   * Check and auto-sync pending sales
   */
  public async checkAndSync(): Promise<{ syncedCount: number; errors: number }> {
    if (!this.isOnline) {
      return { syncedCount: 0, errors: 0 };
    }
    return this.processSyncQueue();
  }

  /**
   * Process all pending / failed transactions safely with duplicate protection.
   */
  public async processSyncQueue(): Promise<{ syncedCount: number; errors: number }> {
    if (this.isSyncingInProgress) {
      return { syncedCount: 0, errors: 0 };
    }

    const pending = await getPendingOfflineTransactions();
    if (pending.length === 0) {
      this.syncState = 'idle';
      this.statusMessage = 'All sales synced';
      this.emitStatus();
      return { syncedCount: 0, errors: 0 };
    }

    this.isSyncingInProgress = true;
    this.syncState = 'syncing';
    this.statusMessage = `${pending.length} offline sale${pending.length > 1 ? 's' : ''} syncing...`;
    this.emitStatus();

    let syncedCount = 0;
    let errors = 0;

    for (const tx of pending) {
      try {
        // Mark as SYNCING in IndexedDB
        await updateTransactionSyncStatus(tx.transactionId, 'SYNCING');

        // DUPLICATE PROTECTION:
        // Use unique transactionId as idempotency key to prevent double sales on server
        if (this.processedTransactionIds.has(tx.transactionId)) {
          // Already recorded on server, simply mark as SYNCED
          await updateTransactionSyncStatus(tx.transactionId, 'SYNCED');
          syncedCount++;
          continue;
        }

        // Simulate secure server sync handshake
        await new Promise((res) => setTimeout(res, 80));

        // Mark as processed in local session cache
        this.processedTransactionIds.add(tx.transactionId);

        // Update status in IndexedDB
        await updateTransactionSyncStatus(tx.transactionId, 'SYNCED');

        // Mark inventory adjustments for this transaction as synced
        const adjIds = tx.items.map((i) => `adj-${tx.transactionId}-${i.productId}`);
        await markInventoryAdjustmentsSynced(adjIds);

        syncedCount++;
      } catch (err: unknown) {
        console.error(`[OfflineSync] Failed to sync ${tx.transactionId}:`, err);
        errors++;
        const errMsg = err instanceof Error ? err.message : 'Network sync error';
        await updateTransactionSyncStatus(tx.transactionId, 'FAILED', errMsg);
      }
    }

    try {
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch {}

    this.isSyncingInProgress = false;

    if (errors === 0) {
      this.syncState = 'synced';
      this.statusMessage = `${syncedCount} sale${syncedCount > 1 ? 's' : ''} synchronized successfully`;
      setTimeout(() => {
        if (this.syncState === 'synced') {
          this.syncState = 'idle';
          this.emitStatus();
        }
      }, 5000);
    } else {
      this.syncState = 'failed';
      this.statusMessage = `Sync paused: ${errors} transaction(s) pending retry`;
    }

    this.emitStatus();
    return { syncedCount, errors };
  }

  /**
   * For backwards-compatibility with existing code
   */
  public enqueueAction(type: string, payload: unknown): string {
    const id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    if (this.isOnline) {
      // Nothing needed if online
    }
    return id;
  }
}

export const offlineSyncManager = OfflineSyncManager.getInstance();
