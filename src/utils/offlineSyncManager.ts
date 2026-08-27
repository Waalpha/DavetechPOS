/**
 * Offline Sync Manager for Davetech POS
 * Handles tracking online/offline status, queueing offline transactions,
 * and performing background reconciliation when network is restored.
 */

export interface QueuedOfflineAction {
  id: string;
  type: 'order_completed' | 'kitchen_round_sent' | 'refund_order' | 'table_status_updated';
  timestamp: string;
  payload: unknown;
  synced: boolean;
}

const OFFLINE_QUEUE_KEY = 'davetech_offline_sync_queue';
const LAST_SYNC_KEY = 'davetech_last_online_sync';

export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private queue: QueuedOfflineAction[] = [];
  private listeners: Array<(isOnline: boolean, queueCount: number) => void> = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue();
      this.isOnline = navigator.onLine;

      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  public static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (e) {
      console.warn('[OfflineSync] Failed to persist queue:', e);
    }
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public getPendingCount(): number {
    return this.queue.filter((q) => !q.synced).length;
  }

  public getQueue(): QueuedOfflineAction[] {
    return [...this.queue];
  }

  public getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  }

  public subscribe(callback: (isOnline: boolean, queueCount: number) => void): () => void {
    this.listeners.push(callback);
    callback(this.isOnline, this.getPendingCount());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    const count = this.getPendingCount();
    this.listeners.forEach((cb) => cb(this.isOnline, count));
  }

  private handleOnline() {
    console.log('[OfflineSync] Internet connectivity restored. Initiating auto-sync.');
    this.isOnline = true;
    this.notifyListeners();
    this.processSyncQueue();
  }

  private handleOffline() {
    console.log('[OfflineSync] Internet connection lost. POS operating in offline cache mode.');
    this.isOnline = false;
    this.notifyListeners();
  }

  public enqueueAction(type: QueuedOfflineAction['type'], payload: unknown): string {
    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const action: QueuedOfflineAction = {
      id,
      type,
      timestamp: new Date().toISOString(),
      payload,
      synced: this.isOnline, // If already online, marked as instantly resolved
    };

    if (!this.isOnline) {
      this.queue.push(action);
      this.saveQueue();
    }

    return id;
  }

  public async processSyncQueue(): Promise<{ syncedCount: number; errors: number }> {
    if (this.queue.length === 0) {
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      this.notifyListeners();
      return { syncedCount: 0, errors: 0 };
    }

    let syncedCount = 0;
    let errors = 0;

    const remainingQueue: QueuedOfflineAction[] = [];

    for (const item of this.queue) {
      try {
        // Simulate network API flush to backend cloud endpoint
        await new Promise((res) => setTimeout(res, 60));
        syncedCount++;
      } catch {
        errors++;
        remainingQueue.push(item);
      }
    }

    this.queue = remainingQueue;
    this.saveQueue();
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    this.notifyListeners();

    return { syncedCount, errors };
  }

  public clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

export const offlineSyncManager = OfflineSyncManager.getInstance();
