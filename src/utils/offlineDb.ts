/**
 * IndexedDB Local Database Layer for Davetech POS
 * Provides offline-first durable storage for:
 *  - Offline Transactions (with idempotency transaction IDs and sync status)
 *  - Product & Category Catalogs
 *  - Cashier Profiles & PIN verification
 *  - POS & Tax Configurations
 *  - Cashier Shifts & Cash Drops
 *  - Inventory Adjustments
 */

import {
  ProductItem,
  ProductCategory,
  CashierUser,
  BusinessTenant,
  ShiftRecord,
  PaymentMethod,
  SplitPaymentDetail,
} from '../types/pos';

export type OfflineSyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface OfflineTransactionRecord {
  transactionId: string; // e.g. "OFF-20260827-0001" (Unique Idempotency Key)
  orderId: string;
  orderNumber: string;
  businessId: string;
  businessName: string;
  cashierId: string;
  cashierName: string;
  waiterName?: string;
  shiftId: string;
  createdAt: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiersSummary?: string;
    notes?: string;
    isInventory: boolean;
  }>;
  orderType: string;
  tableNumber?: string;
  tableId?: string;
  roomNumber?: string;
  guestName?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountPercent: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentBreakdown?: SplitPaymentDetail[];
  amountTendered?: number;
  changeGiven?: number;
  mpesaRef?: string;
  cardLast4?: string;
  isOfflineRecord: boolean;
  deviceId: string;
  sessionId: string;
  syncStatus: OfflineSyncStatus;
  syncedAt?: string;
  retryCount: number;
  errorMessage?: string;
}

export interface InventoryAdjustmentRecord {
  id: string; // e.g. "adj-OFF-20260827-0001-prod-1"
  transactionId: string;
  productId: string;
  quantityDelta: number; // e.g. -2
  timestamp: string;
  synced: boolean;
}

const DB_NAME = 'davetech_pos_offline_db';
const DB_VERSION = 2;

const STORES = {
  TRANSACTIONS: 'offline_transactions',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  CASHIERS: 'cashiers',
  CONFIG: 'config',
  SHIFTS: 'shifts',
  INVENTORY_ADJUSTMENTS: 'inventory_adjustments',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open and initialize IndexedDB
 */
export function getOfflineDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Offline Transactions Store
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const transStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'transactionId' });
          transStore.createIndex('orderNumber', 'orderNumber', { unique: false });
          transStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          transStore.createIndex('createdAt', 'createdAt', { unique: false });
          transStore.createIndex('cashierId', 'cashierId', { unique: false });
          transStore.createIndex('businessId', 'businessId', { unique: false });
        }

        // 2. Products Store
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const prodStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
          prodStore.createIndex('categoryId', 'categoryId', { unique: false });
          prodStore.createIndex('isAvailable', 'isAvailable', { unique: false });
        }

        // 3. Categories Store
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        }

        // 4. Cashiers Store
        if (!db.objectStoreNames.contains(STORES.CASHIERS)) {
          const cashierStore = db.createObjectStore(STORES.CASHIERS, { keyPath: 'id' });
          cashierStore.createIndex('pin', 'pin', { unique: false });
          cashierStore.createIndex('role', 'role', { unique: false });
        }

        // 5. Config Store
        if (!db.objectStoreNames.contains(STORES.CONFIG)) {
          db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
        }

        // 6. Shifts Store
        if (!db.objectStoreNames.contains(STORES.SHIFTS)) {
          const shiftStore = db.createObjectStore(STORES.SHIFTS, { keyPath: 'id' });
          shiftStore.createIndex('cashierId', 'cashierId', { unique: false });
          shiftStore.createIndex('status', 'status', { unique: false });
        }

        // 7. Inventory Adjustments Store
        if (!db.objectStoreNames.contains(STORES.INVENTORY_ADJUSTMENTS)) {
          const invStore = db.createObjectStore(STORES.INVENTORY_ADJUSTMENTS, { keyPath: 'id' });
          invStore.createIndex('transactionId', 'transactionId', { unique: false });
          invStore.createIndex('productId', 'productId', { unique: false });
          invStore.createIndex('synced', 'synced', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    });
  }

  return dbPromise;
}

// ----------------------------------------------------
// TRANSACTION OPERATIONS (Idempotent Offline Records)
// ----------------------------------------------------

/**
 * Save an offline sale record into IndexedDB
 */
export async function saveOfflineTransaction(record: OfflineTransactionRecord): Promise<void> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORES.TRANSACTIONS);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] saveOfflineTransaction fallback to localStorage:', err);
    // Secondary fallback
    try {
      const key = `davetech_idb_tx_${record.transactionId}`;
      localStorage.setItem(key, JSON.stringify(record));
    } catch {}
  }
}

/**
 * Get all offline transactions (pending, synced, failed)
 */
export async function getAllOfflineTransactions(): Promise<OfflineTransactionRecord[]> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
      const store = tx.objectStore(STORES.TRANSACTIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = (request.result || []) as OfflineTransactionRecord[];
        // Sort descending by createdAt
        records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Get only pending/failed transactions ready for synchronization
 */
export async function getPendingOfflineTransactions(): Promise<OfflineTransactionRecord[]> {
  try {
    const all = await getAllOfflineTransactions();
    return all.filter((tx) => tx.syncStatus === 'PENDING' || tx.syncStatus === 'FAILED');
  } catch {
    return [];
  }
}

/**
 * Update transaction sync status (atomic update)
 */
export async function updateTransactionSyncStatus(
  transactionId: string,
  syncStatus: OfflineSyncStatus,
  errorMessage?: string
): Promise<void> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORES.TRANSACTIONS);
      const getReq = store.get(transactionId);

      getReq.onsuccess = () => {
        const record = getReq.result as OfflineTransactionRecord | undefined;
        if (record) {
          record.syncStatus = syncStatus;
          if (syncStatus === 'SYNCED') {
            record.syncedAt = new Date().toISOString();
            record.errorMessage = undefined;
          } else if (syncStatus === 'FAILED') {
            record.retryCount = (record.retryCount || 0) + 1;
            record.errorMessage = errorMessage || 'Sync network error';
          }
          store.put(record);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] updateTransactionSyncStatus error:', err);
  }
}

// ----------------------------------------------------
// PRODUCT & CATEGORY CACHING
// ----------------------------------------------------

export async function cacheProductsToDb(products: ProductItem[]): Promise<void> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
      const store = tx.objectStore(STORES.PRODUCTS);
      store.clear();
      products.forEach((p) => store.put(p));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] cacheProductsToDb fallback:', err);
    try {
      localStorage.setItem('davetech_cached_products', JSON.stringify(products));
    } catch {}
  }
}

export async function getCachedProductsFromDb(): Promise<ProductItem[]> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PRODUCTS, 'readonly');
      const store = tx.objectStore(STORES.PRODUCTS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as ProductItem[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const saved = localStorage.getItem('davetech_cached_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}

export async function cacheCategoriesToDb(categories: ProductCategory[]): Promise<void> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
      const store = tx.objectStore(STORES.CATEGORIES);
      store.clear();
      categories.forEach((c) => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] cacheCategoriesToDb fallback:', err);
  }
}

export async function getCachedCategoriesFromDb(): Promise<ProductCategory[]> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CATEGORIES, 'readonly');
      const store = tx.objectStore(STORES.CATEGORIES);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as ProductCategory[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// ----------------------------------------------------
// CASHIER PROFILES CACHING (Offline PIN Login)
// ----------------------------------------------------

export async function cacheCashiersToDb(cashiers: CashierUser[]): Promise<void> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CASHIERS, 'readwrite');
      const store = tx.objectStore(STORES.CASHIERS);
      store.clear();
      cashiers.forEach((c) => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] cacheCashiersToDb fallback:', err);
  }
}

export async function getCachedCashiersFromDb(): Promise<CashierUser[]> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CASHIERS, 'readonly');
      const store = tx.objectStore(STORES.CASHIERS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as CashierUser[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const saved = localStorage.getItem('davetech_cashiers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}

// ----------------------------------------------------
// CONFIG & BUSINESS SETTINGS CACHING
// ----------------------------------------------------

export async function cacheConfigToDb(key: string, data: unknown): Promise<void> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CONFIG, 'readwrite');
      const store = tx.objectStore(STORES.CONFIG);
      store.put({ key, data, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] cacheConfigToDb fallback:', err);
  }
}

export async function getCachedConfigFromDb<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CONFIG, 'readonly');
      const store = tx.objectStore(STORES.CONFIG);
      const req = store.get(key);
      req.onsuccess = () => {
        const res = req.result;
        resolve(res ? (res.data as T) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// SHIFTS CACHING
// ----------------------------------------------------

export async function saveShiftToDb(shift: ShiftRecord): Promise<void> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SHIFTS, 'readwrite');
      const store = tx.objectStore(STORES.SHIFTS);
      store.put(shift);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] saveShiftToDb fallback:', err);
  }
}

export async function getCachedShiftsFromDb(): Promise<ShiftRecord[]> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SHIFTS, 'readonly');
      const store = tx.objectStore(STORES.SHIFTS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as ShiftRecord[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

// ----------------------------------------------------
// INVENTORY ADJUSTMENT QUEUE (Prevent Duplicate Deductions)
// ----------------------------------------------------

export async function queueInventoryAdjustment(adj: InventoryAdjustmentRecord): Promise<void> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVENTORY_ADJUSTMENTS, 'readwrite');
      const store = tx.objectStore(STORES.INVENTORY_ADJUSTMENTS);
      store.put(adj);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] queueInventoryAdjustment fallback:', err);
  }
}

export async function getPendingInventoryAdjustments(): Promise<InventoryAdjustmentRecord[]> {
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVENTORY_ADJUSTMENTS, 'readonly');
      const store = tx.objectStore(STORES.INVENTORY_ADJUSTMENTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result || []) as InventoryAdjustmentRecord[];
        resolve(results.filter((a) => !a.synced));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function markInventoryAdjustmentsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const db = await getOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.INVENTORY_ADJUSTMENTS, 'readwrite');
      const store = tx.objectStore(STORES.INVENTORY_ADJUSTMENTS);
      ids.forEach((id) => {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const item = getReq.result as InventoryAdjustmentRecord | undefined;
          if (item) {
            item.synced = true;
            store.put(item);
          }
        };
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] markInventoryAdjustmentsSynced error:', err);
  }
}
