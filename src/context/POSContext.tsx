import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  BusinessTenant,
  BusinessMode,
  CashierUser,
  UserRole,
  POSViewType,
  ShiftRecord,
  ProductCategory,
  ProductItem,
  CartItem,
  CartModifierSelection,
  OrderType,
  OrderRecord,
  PaymentMethod,
  SplitPaymentDetail,
  TableInfo,
  HotelRoomInfo,
  KdsTicket,
  TableStatus,
  WaiterReadyNotification,
  TableOrderRound,
  WifiPrinterConfig,
  Daraja3Config,
} from '../types/pos';
import {
  INITIAL_BUSINESSES,
  INITIAL_CASHIERS,
  CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_TABLES,
  INITIAL_HOTEL_ROOMS,
  INITIAL_ORDER_HISTORY,
} from '../data/mockData';
import { soundFx } from '../utils/audio';
import {
  loadPrinterConfig,
  savePrinterConfig,
  generateReceiptPlainText,
  generateKitchenTicketPlainText,
  printToWifiPrinter,
  sendWifiPrinterTest,
} from '../utils/printerService';
import { syncCoreDataToServiceWorker } from '../utils/serviceWorkerRegistration';
import { offlineSyncManager, SyncProgressUpdate } from '../utils/offlineSyncManager';
import {
  cacheProductsToDb,
  cacheCategoriesToDb,
  cacheCashiersToDb,
  cacheConfigToDb,
  saveShiftToDb,
  getAllOfflineTransactions,
  OfflineTransactionRecord,
} from '../utils/offlineDb';
import {
  DEFAULT_DARAJA3_CONFIG,
  testDaraja3Connection,
  initiateDaraja3StkPush,
  StkPushResult,
} from '../utils/darajaService';

export interface CheckoutTargetInfo {
  tableId?: string;
  tableName?: string;
  roomNumber?: string;
  guestName?: string;
  orderId?: string;
  orderNumber?: string;
  title: string;
  items: CartItem[];
  totalAmount: number;
}

interface POSContextType {
  // Business / Multi-Tenant
  businesses: BusinessTenant[];
  currentBusiness: BusinessTenant;
  switchBusiness: (bizId: string) => void;
  updateBusiness: (updated: Partial<BusinessTenant>) => void;
  businessMode: BusinessMode;
  setBusinessMode: (mode: BusinessMode) => void;

  // Cashier & Shifts
  cashiers: CashierUser[];
  currentCashier: CashierUser | null;
  activeShift: ShiftRecord | null;
  loginWithPin: (pin: string) => boolean;
  logoutCashier: () => void;
  startShift: (openingFloat: number) => void;
  endShift: (closingCashActual: number) => ShiftRecord | null;
  addCashDrop: (amount: number, reason: string) => void;

  // Role-Based Permissions & User Management
  isManager: boolean;
  isCashier: boolean;
  addCashierUser: (user: Omit<CashierUser, 'id'>) => void;
  updateCashierUser: (userId: string, updated: Partial<CashierUser>) => void;
  deleteCashierUser: (userId: string) => boolean;
  verifyManagerPin: (pin: string) => boolean;
  reprintReceipt: (order: OrderRecord) => void;
  showManagerAuthModal: boolean;
  setShowManagerAuthModal: (show: boolean) => void;
  managerAuthPromptText: string;
  setManagerAuthPromptText: (text: string) => void;
  requestManagerAuth: (reason: string, onAuthorized: () => void) => void;
  executeManagerAuthorizedAction: (pin: string) => boolean;

  // Catalog & Navigation
  categories: ProductCategory[];
  products: ProductItem[];
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  inventoryFilter: 'all' | 'inventory' | 'non_inventory';
  setInventoryFilter: (filter: 'all' | 'inventory' | 'non_inventory') => void;
  toggleProductInventoryType: (productId: string) => void;
  updateProductStock: (productId: string, newStock: number) => void;
  updateProduct: (productId: string, updated: Partial<ProductItem>) => void;
  addProduct: (product: Omit<ProductItem, 'id'>) => void;
  deleteProduct: (productId: string) => void;

  // Cart & Active Order
  cart: CartItem[];
  addToCart: (product: ProductItem, modifiers?: CartModifierSelection[], notes?: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  setCartItemQuantity: (cartItemId: string, quantity: number) => void;
  removeCartItem: (cartItemId: string) => void;
  setCartItemDiscount: (cartItemId: string, discountPercent: number) => void;
  updateCartItemNotes: (cartItemId: string, notes: string) => void;
  clearCart: () => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  selectedTable: TableInfo | null;
  setSelectedTable: (table: TableInfo | null) => void;
  selectedRoom: HotelRoomInfo | null;
  setSelectedRoom: (room: HotelRoomInfo | null) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  orderDiscountPercent: number;
  setOrderDiscountPercent: (disc: number) => void;
  cartTotals: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    itemCount: number;
  };

  // Park & Hold Orders
  parkCurrentOrder: () => void;
  parkedOrders: OrderRecord[];
  resumeParkedOrder: (orderId: string) => void;
  cancelParkedOrder: (orderId: string) => void;

  // Active Unpaid Orders (Recorded Orders awaiting Bill / Payment)
  activeUnpaidOrders: OrderRecord[];
  saveActiveOrder: (customCustomerName?: string, notes?: string) => OrderRecord | null;
  resumeActiveOrder: (orderId: string) => void;
  cancelActiveOrder: (orderId: string) => void;
  openBillForActiveOrder: (order: OrderRecord) => void;
  openPaymentForActiveOrder: (order: OrderRecord) => void;

  // Full Restaurant & Hotel Workflow Actions
  startTableOrder: (tableId: string, guests: number, waiterName?: string) => void;
  selectTableForOrder: (table: TableInfo) => void;
  sendCurrentOrderToKitchen: (specialNotes?: string) => void;
  markKitchenOrderReady: (ticketId: string) => void;
  markTableServed: (tableId: string) => void;
  requestTableBill: (tableId: string) => void;
  releaseTable: (tableId: string) => void;

  // Customer Bill / Pro-Forma Modal
  showCustomerBillModal: boolean;
  setShowCustomerBillModal: (show: boolean) => void;
  activeBillData: TableInfo | OrderRecord | null;
  openCustomerBill: (target: TableInfo | OrderRecord) => void;
  closeCustomerBill: () => void;

  // Checkout & Target Setup
  activeCheckoutTarget: CheckoutTargetInfo | null;
  setActiveCheckoutTarget: (target: CheckoutTargetInfo | null) => void;
  openPaymentForTable: (table: TableInfo) => void;
  openPaymentForOrder: (order: OrderRecord) => void;
  openDirectCartPayment: () => void;

  // Checkout & Receipts
  completeCheckout: (
    paymentMethod: PaymentMethod,
    details?: {
      amountTendered?: number;
      mpesaRef?: string;
      cardLast4?: string;
      breakdown?: SplitPaymentDetail[];
      customerPhone?: string;
    }
  ) => OrderRecord;
  lastCompletedOrder: OrderRecord | null;
  setLastCompletedOrder: (order: OrderRecord | null) => void;
  showReceiptModal: boolean;
  setShowReceiptModal: (show: boolean) => void;

  // Waiter Kitchen Notifications
  waiterNotifications: WaiterReadyNotification[];
  dismissNotification: (id: string) => void;

  // Modals & Navigation
  showCashierPinModal: boolean;
  setShowCashierPinModal: (show: boolean) => void;
  showShiftReportModal: boolean;
  setShowShiftReportModal: (show: boolean) => void;
  currentView: POSViewType;
  setCurrentView: (view: POSViewType) => void;

  // Orders Ledger
  orderHistory: OrderRecord[];
  refundOrder: (orderId: string) => void;

  // Tables, Rooms, KDS
  tables: TableInfo[];
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  hotelRooms: HotelRoomInfo[];
  kdsTickets: KdsTicket[];
  updateKdsStatus: (ticketId: string, status: KdsTicket['status']) => void;

  // App Settings
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isHighContrast: boolean;
  setIsHighContrast: (high: boolean) => void;
  currencySymbol: string;

  // Wi-Fi & Thermal ESC/POS Printer
  printerConfig: WifiPrinterConfig;
  updatePrinterConfig: (updated: Partial<WifiPrinterConfig>) => void;
  showWifiPrinterModal: boolean;
  setShowWifiPrinterModal: (show: boolean) => void;
  printReceiptToWifi: (order?: OrderRecord) => Promise<{ success: boolean; message: string; modeUsed?: string }>;
  printKitchenTicketToWifi: (ticket: OrderRecord | KdsTicket) => Promise<{ success: boolean; message: string; modeUsed?: string }>;
  testWifiPrinter: () => Promise<{ success: boolean; message: string }>;

  // Offline-First & Service Worker Resilience
  isOnline: boolean;
  pendingOfflineSyncCount: number;
  lastSyncTimestamp: string | null;
  syncProgress: SyncProgressUpdate;
  offlineTransactions: OfflineTransactionRecord[];
  refreshOfflineTransactions: () => Promise<void>;
  retryFailedOfflineTransactions: () => Promise<{ syncedCount: number; errors: number }>;
  triggerManualSync: () => Promise<{ syncedCount: number; errors: number }>;

  // Payment Reset & Clean Slate
  resetAllPaymentsAndStartFresh: (options?: {
    resetTables?: boolean;
    resetShifts?: boolean;
    resetKds?: boolean;
    preserveCatalog?: boolean;
  }) => { ordersCleared: number; tablesReset: number; timestamp: string };

  // Safaricom Daraja 3.0 Lipa Na M-Pesa API Integration
  daraja3Config: Daraja3Config;
  updateDaraja3Config: (updated: Partial<Daraja3Config>) => void;
  testDaraja3Config: () => Promise<{ success: boolean; message: string; token?: string }>;
  triggerDaraja3StkPush: (params: {
    phone: string;
    amount: number;
    reference?: string;
    orderNumber?: string;
  }) => Promise<StkPushResult>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or fallback to seed
  const [businesses, setBusinesses] = useState<BusinessTenant[]>(() => {
    const saved = localStorage.getItem('davetech_businesses');
    return saved ? JSON.parse(saved) : INITIAL_BUSINESSES;
  });

  const [currentBusinessId, setCurrentBusinessId] = useState<string>(() => {
    const saved = localStorage.getItem('davetech_current_biz_id');
    return saved || INITIAL_BUSINESSES[0].id;
  });

  const currentBusiness = useMemo(() => {
    return businesses.find((b) => b.id === currentBusinessId) || businesses[0];
  }, [businesses, currentBusinessId]);

  const [cashiers, setCashiers] = useState<CashierUser[]>(() => {
    const saved = localStorage.getItem('davetech_cashiers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_CASHIERS;
      }
    }
    return INITIAL_CASHIERS;
  });

  const [currentCashier, setCurrentCashier] = useState<CashierUser | null>(() => {
    const savedCashiers = localStorage.getItem('davetech_cashiers');
    if (savedCashiers) {
      try {
        const parsed = JSON.parse(savedCashiers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0];
        }
      } catch (e) {}
    }
    return INITIAL_CASHIERS[0];
  });

  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(() => {
    return {
      id: 'shift-live-1',
      businessId: INITIAL_BUSINESSES[0].id,
      cashierId: INITIAL_CASHIERS[0].id,
      cashierName: INITIAL_CASHIERS[0].name,
      startTime: new Date().toISOString(),
      openingFloat: 5000,
      totalSales: 16950,
      cashSales: 2900,
      mpesaSales: 3400,
      cardSales: 3750,
      roomSales: 6900,
      cashDrops: [],
      status: 'open',
    };
  });

  const [categories] = useState<ProductCategory[]>(CATEGORIES);
  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('davetech_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-food');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'inventory' | 'non_inventory'>('all');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoomInfo | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);

  const [parkedOrders, setParkedOrders] = useState<OrderRecord[]>([]);
  const [activeUnpaidOrders, setActiveUnpaidOrders] = useState<OrderRecord[]>(() => {
    const saved = localStorage.getItem('davetech_active_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'ord-active-1',
        orderNumber: 'ORD-1095',
        businessId: 'biz-1',
        businessName: 'Davetech Hotel & Restaurant',
        cashierId: 'c-1',
        cashierName: 'Sarah Jenkins',
        waiterName: 'Sarah Jenkins',
        shiftId: 'shift-live',
        createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
        items: [
          {
            cartItemId: 'sample-ug-1',
            product: INITIAL_PRODUCTS[1] || INITIAL_PRODUCTS[0],
            quantity: 2,
            selectedModifiers: [],
            itemDiscountPercent: 0,
            unitPrice: 250,
            totalPrice: 500,
          },
          {
            cartItemId: 'sample-soda-1',
            product: INITIAL_PRODUCTS[8] || INITIAL_PRODUCTS[0],
            quantity: 2,
            selectedModifiers: [],
            itemDiscountPercent: 0,
            unitPrice: 180,
            totalPrice: 360,
          },
        ],
        orderType: 'dine_in',
        tableNumber: 'Table 2',
        tableId: 'tbl-2',
        customerName: 'Table 2 (James Mwangi)',
        subtotal: 741.38,
        taxAmount: 118.62,
        discountAmount: 0,
        discountPercent: 0,
        totalAmount: 860,
        paymentMethod: 'cash',
        status: 'completed',
        billStatus: 'unpaid',
      },
    ];
  });

  const [orderHistory, setOrderHistory] = useState<OrderRecord[]>(() => {
    const saved = localStorage.getItem('davetech_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDER_HISTORY;
  });

  const [tables, setTables] = useState<TableInfo[]>(() => {
    const saved = localStorage.getItem('davetech_tables');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_TABLES;
      }
    }
    // Provide rich sample tables with active rounds
    return [
      {
        id: 'tbl-1',
        name: 'Table 1',
        section: 'Main Hall',
        seats: 2,
        status: 'available',
      },
      {
        id: 'tbl-2',
        name: 'Table 2',
        section: 'Main Hall',
        seats: 4,
        status: 'preparing',
        activeGuests: 3,
        assignedWaiter: 'Sarah Jenkins',
        openedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        activeOrderTotal: 3400,
        rounds: [
          {
            roundNumber: 1,
            createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
            waiterName: 'Sarah Jenkins',
            items: [
              {
                cartItemId: 'tbl2-item-1',
                product: INITIAL_PRODUCTS[0], // Double Smash Burger
                quantity: 2,
                selectedModifiers: [{ groupName: 'Sides', selectedOption: 'Truffle Fries', extraPrice: 250 }],
                itemDiscountPercent: 0,
                itemNotes: 'Well done, extra sauce on side',
                unitPrice: 1200,
                totalPrice: 2400,
                roundNumber: 1,
                sentToKitchen: true,
              },
              {
                cartItemId: 'tbl2-item-2',
                product: INITIAL_PRODUCTS[6], // Caramel Macchiato
                quantity: 2,
                selectedModifiers: [{ groupName: 'Milk Choice', selectedOption: 'Oat Milk', extraPrice: 80 }],
                itemDiscountPercent: 0,
                unitPrice: 500,
                totalPrice: 1000,
                roundNumber: 1,
                sentToKitchen: true,
              },
            ],
          },
        ],
        activeItems: [
          {
            cartItemId: 'tbl2-item-1',
            product: INITIAL_PRODUCTS[0],
            quantity: 2,
            selectedModifiers: [{ groupName: 'Sides', selectedOption: 'Truffle Fries', extraPrice: 250 }],
            itemDiscountPercent: 0,
            itemNotes: 'Well done, extra sauce on side',
            unitPrice: 1200,
            totalPrice: 2400,
            roundNumber: 1,
            sentToKitchen: true,
          },
          {
            cartItemId: 'tbl2-item-2',
            product: INITIAL_PRODUCTS[6],
            quantity: 2,
            selectedModifiers: [{ groupName: 'Milk Choice', selectedOption: 'Oat Milk', extraPrice: 80 }],
            itemDiscountPercent: 0,
            unitPrice: 500,
            totalPrice: 1000,
            roundNumber: 1,
            sentToKitchen: true,
          },
        ],
      },
      {
        id: 'tbl-3',
        name: 'Table 3',
        section: 'Main Hall',
        seats: 4,
        status: 'bill_requested',
        activeGuests: 4,
        assignedWaiter: 'David Mwangi',
        openedAt: new Date(Date.now() - 45 * 60000).toISOString(),
        activeOrderTotal: 5200,
        billRequestedAt: new Date(Date.now() - 3 * 60000).toISOString(),
        rounds: [
          {
            roundNumber: 1,
            createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
            waiterName: 'David Mwangi',
            items: [
              {
                cartItemId: 'tbl3-item-1',
                product: INITIAL_PRODUCTS[1], // BBQ Ribs
                quantity: 2,
                selectedModifiers: [{ groupName: 'Portion', selectedOption: 'Full Rack (700g)', extraPrice: 800 }],
                itemDiscountPercent: 0,
                unitPrice: 2450,
                totalPrice: 4900,
                roundNumber: 1,
                sentToKitchen: true,
              },
              {
                cartItemId: 'tbl3-item-2',
                product: INITIAL_PRODUCTS[8], // Sparkling Water
                quantity: 2,
                selectedModifiers: [],
                itemDiscountPercent: 0,
                unitPrice: 150,
                totalPrice: 300,
                roundNumber: 1,
                sentToKitchen: true,
              },
            ],
          },
        ],
        activeItems: [
          {
            cartItemId: 'tbl3-item-1',
            product: INITIAL_PRODUCTS[1],
            quantity: 2,
            selectedModifiers: [{ groupName: 'Portion', selectedOption: 'Full Rack (700g)', extraPrice: 800 }],
            itemDiscountPercent: 0,
            unitPrice: 2450,
            totalPrice: 4900,
            roundNumber: 1,
            sentToKitchen: true,
          },
          {
            cartItemId: 'tbl3-item-2',
            product: INITIAL_PRODUCTS[8],
            quantity: 2,
            selectedModifiers: [],
            itemDiscountPercent: 0,
            unitPrice: 150,
            totalPrice: 300,
            roundNumber: 1,
            sentToKitchen: true,
          },
        ],
      },
      {
        id: 'tbl-4',
        name: 'Table 4',
        section: 'Main Hall',
        seats: 6,
        status: 'ready',
        activeGuests: 5,
        assignedWaiter: 'Sarah Jenkins',
        openedAt: new Date(Date.now() - 18 * 60000).toISOString(),
        activeOrderTotal: 4600,
        activeItems: [
          {
            cartItemId: 'tbl4-item-1',
            product: INITIAL_PRODUCTS[2], // Margherita Pizza
            quantity: 2,
            selectedModifiers: [{ groupName: 'Crust', selectedOption: 'Stuffed Crust', extraPrice: 200 }],
            itemDiscountPercent: 0,
            itemNotes: 'Extra crispy',
            unitPrice: 1350,
            totalPrice: 2700,
            roundNumber: 1,
            sentToKitchen: true,
          },
          {
            cartItemId: 'tbl4-item-2',
            product: INITIAL_PRODUCTS[10], // Mojito
            quantity: 2,
            selectedModifiers: [{ groupName: 'Flavor', selectedOption: 'Passion Fruit', extraPrice: 50 }],
            itemDiscountPercent: 0,
            unitPrice: 750,
            totalPrice: 1500,
            roundNumber: 1,
            sentToKitchen: true,
          },
          {
            cartItemId: 'tbl4-item-3',
            product: INITIAL_PRODUCTS[7], // Iced Hibiscus Tea
            quantity: 1,
            selectedModifiers: [],
            itemDiscountPercent: 0,
            unitPrice: 400,
            totalPrice: 400,
            roundNumber: 1,
            sentToKitchen: true,
          },
        ],
      },
      { id: 'tbl-5', name: 'Table 5', section: 'Terrace', seats: 2, status: 'available' },
      {
        id: 'tbl-6',
        name: 'Table 6',
        section: 'Terrace',
        seats: 4,
        status: 'occupied',
        activeGuests: 2,
        assignedWaiter: 'David Mwangi',
        activeOrderTotal: 2100,
      },
      { id: 'tbl-7', name: 'Table 7', section: 'Terrace', seats: 4, status: 'reserved' },
      {
        id: 'tbl-8',
        name: 'VIP Lounge 1',
        section: 'VIP Lounge',
        seats: 8,
        status: 'order_sent',
        activeGuests: 6,
        assignedWaiter: 'Sarah Jenkins',
        activeOrderTotal: 14800,
      },
      { id: 'tbl-9', name: 'VIP Lounge 2', section: 'VIP Lounge', seats: 8, status: 'available' },
      { id: 'tbl-10', name: 'Bar Stool 1', section: 'Bar Area', seats: 1, status: 'paid', activeOrderTotal: 850 },
      { id: 'tbl-11', name: 'Bar Stool 2', section: 'Bar Area', seats: 1, status: 'available' },
      { id: 'tbl-12', name: 'Bar Stool 3', section: 'Bar Area', seats: 1, status: 'available' },
    ];
  });

  const [hotelRooms, setHotelRooms] = useState<HotelRoomInfo[]>(INITIAL_HOTEL_ROOMS);

  const [kdsTickets, setKdsTickets] = useState<KdsTicket[]>([
    {
      id: 'kds-1',
      orderId: 'ord-seed-01',
      orderNumber: 'ORD-1088',
      tableOrRoom: 'Table 2',
      orderType: 'dine_in',
      serverName: 'Sarah Jenkins',
      roundNumber: 1,
      createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
      items: [
        { name: 'Davetech Double Smash Burger', quantity: 2, modifiers: ['Truffle Fries'], notes: 'Well done, extra sauce' },
        { name: 'Caramel Macchiato (Large)', quantity: 2, modifiers: ['Oat Milk'] },
      ],
      status: 'cooking',
      elapsedMinutes: 14,
    },
    {
      id: 'kds-2',
      orderId: 'ord-tbl-4',
      orderNumber: 'ORD-1094',
      tableOrRoom: 'Table 4',
      orderType: 'dine_in',
      serverName: 'Sarah Jenkins',
      roundNumber: 1,
      createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
      items: [
        { name: 'Artisan Margherita Pizza', quantity: 2, modifiers: ['Stuffed Crust'], notes: 'Extra crispy' },
        { name: 'Signature Mojito Cocktail', quantity: 2, modifiers: ['Passion Fruit'] },
        { name: 'Iced Hibiscus Berry Tea', quantity: 1 },
      ],
      status: 'ready',
      elapsedMinutes: 18,
    },
  ]);

  // Waiter Ready Notifications
  const [waiterNotifications, setWaiterNotifications] = useState<WaiterReadyNotification[]>([
    {
      id: 'notif-1',
      ticketId: 'kds-2',
      tableOrRoom: 'Table 4',
      orderNumber: 'ORD-1094',
      waiterName: 'Sarah Jenkins',
      readyTime: new Date(Date.now() - 2 * 60000).toISOString(),
      itemsSummary: '2x Margherita Pizza, 2x Mojito, 1x Berry Tea',
      acknowledged: false,
    },
  ]);

  // Customer Pro-Forma Bill Modal State
  const [showCustomerBillModal, setShowCustomerBillModal] = useState<boolean>(false);
  const [activeBillData, setActiveBillData] = useState<TableInfo | OrderRecord | null>(null);

  // Active Payment / Checkout Target
  const [activeCheckoutTarget, setActiveCheckoutTarget] = useState<CheckoutTargetInfo | null>(null);

  const [lastCompletedOrder, setLastCompletedOrder] = useState<OrderRecord | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showCashierPinModal, setShowCashierPinModal] = useState<boolean>(false);
  const [showShiftReportModal, setShowShiftReportModal] = useState<boolean>(false);
  const [currentView, setCurrentViewState] = useState<POSViewType>('pos');

  // Wi-Fi / ESC/POS Printer State
  const [printerConfig, setPrinterConfigState] = useState<WifiPrinterConfig>(() => loadPrinterConfig());
  const [showWifiPrinterModal, setShowWifiPrinterModal] = useState<boolean>(false);

  const updatePrinterConfig = (updated: Partial<WifiPrinterConfig>) => {
    setPrinterConfigState((prev) => {
      const next = { ...prev, ...updated };
      savePrinterConfig(next);
      return next;
    });
  };

  const printReceiptToWifi = async (orderToPrint?: OrderRecord) => {
    const targetOrder = orderToPrint || lastCompletedOrder;
    if (!targetOrder) {
      return { success: false, message: 'No receipt available to print' };
    }
    const text = generateReceiptPlainText(targetOrder, currentBusiness, printerConfig.paperSize);
    return await printToWifiPrinter(text, printerConfig, {
      type: 'receipt',
      openDrawer: printerConfig.openCashDrawerOnCash && targetOrder.paymentMethod === 'cash',
    });
  };

  const printKitchenTicketToWifi = async (ticket: OrderRecord | KdsTicket) => {
    const text = generateKitchenTicketPlainText(ticket, printerConfig.paperSize);
    return await printToWifiPrinter(text, printerConfig, { type: 'kitchen' });
  };

  const testWifiPrinter = async () => {
    return await sendWifiPrinterTest(printerConfig);
  };

  // Manager Authorization Modal State
  const [showManagerAuthModal, setShowManagerAuthModal] = useState<boolean>(false);
  const [managerAuthPromptText, setManagerAuthPromptText] = useState<string>('Manager Authorization Required');
  const [pendingManagerAction, setPendingManagerAction] = useState<(() => void) | null>(null);

  const isManager = useMemo(() => currentCashier?.role === 'manager', [currentCashier]);
  const isCashier = useMemo(() => currentCashier?.role === 'cashier', [currentCashier]);

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  const setSoundEnabled = (val: boolean) => {
    setSoundEnabledState(val);
    soundFx.soundEnabled = val;
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('davetech_businesses', JSON.stringify(businesses));
  }, [businesses]);

  useEffect(() => {
    localStorage.setItem('davetech_current_biz_id', currentBusinessId);
  }, [currentBusinessId]);

  useEffect(() => {
    localStorage.setItem('davetech_cashiers', JSON.stringify(cashiers));
  }, [cashiers]);

  useEffect(() => {
    localStorage.setItem('davetech_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('davetech_orders', JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    localStorage.setItem('davetech_active_orders', JSON.stringify(activeUnpaidOrders));
  }, [activeUnpaidOrders]);

  useEffect(() => {
    localStorage.setItem('davetech_tables', JSON.stringify(tables));
  }, [tables]);

  // Offline-First & Service Worker Resilience State
  const [isOnline, setIsOnline] = useState<boolean>(() => offlineSyncManager.getIsOnline());
  const [syncProgress, setSyncProgress] = useState<SyncProgressUpdate>({
    isOnline: offlineSyncManager.getIsOnline(),
    syncState: offlineSyncManager.getSyncState(),
    pendingCount: 0,
    syncedCount: 0,
    failedCount: 0,
    lastSyncTimestamp: offlineSyncManager.getLastSyncTime(),
    statusMessage: offlineSyncManager.getStatusMessage(),
  });
  const [pendingOfflineSyncCount, setPendingOfflineSyncCount] = useState<number>(0);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(() => offlineSyncManager.getLastSyncTime());
  const [offlineTransactions, setOfflineTransactions] = useState<OfflineTransactionRecord[]>([]);

  const refreshOfflineTransactions = useCallback(async () => {
    try {
      const records = await getAllOfflineTransactions();
      setOfflineTransactions(records);
    } catch {}
  }, []);

  // Subscribe to network status & sync queue changes
  useEffect(() => {
    refreshOfflineTransactions();
    const unsubscribe = offlineSyncManager.subscribe((update) => {
      setIsOnline(update.isOnline);
      setSyncProgress(update);
      setPendingOfflineSyncCount(update.pendingCount);
      setLastSyncTimestamp(update.lastSyncTimestamp);
      refreshOfflineTransactions();

      // Reconcile orderHistory sync status
      if (update.syncState === 'synced' || update.syncedCount > 0) {
        setOrderHistory((prev) =>
          prev.map((ord) => {
            if (ord.isOfflineRecord && ord.syncStatus !== 'SYNCED') {
              return { ...ord, syncStatus: 'SYNCED', offlineSyncTimestamp: new Date().toISOString() };
            }
            return ord;
          })
        );
      }
    });
    return unsubscribe;
  }, [refreshOfflineTransactions]);

  // Proactively cache core POS data to IndexedDB & Service Worker
  useEffect(() => {
    cacheProductsToDb(products);
    cacheCategoriesToDb(categories);
    cacheCashiersToDb(cashiers);
    cacheConfigToDb('current_business', currentBusiness);

    syncCoreDataToServiceWorker({
      businesses,
      currentBusinessId,
      products,
      categories: CATEGORIES,
      tables,
      cashiers,
      lastUpdated: new Date().toISOString(),
    });
  }, [businesses, currentBusiness, currentBusinessId, products, categories, tables, cashiers]);

  // Manual Trigger for sync
  const triggerManualSync = useCallback(async () => {
    soundFx.playClick();
    const result = await offlineSyncManager.processSyncQueue();
    if (result.syncedCount > 0) {
      soundFx.playSuccess();
      setOrderHistory((prev) =>
        prev.map((ord) => {
          if (ord.isOfflineRecord && ord.syncStatus !== 'SYNCED') {
            return { ...ord, syncStatus: 'SYNCED', offlineSyncTimestamp: new Date().toISOString() };
          }
          return ord;
        })
      );
    }
    await refreshOfflineTransactions();
    setLastSyncTimestamp(offlineSyncManager.getLastSyncTime());
    return result;
  }, [refreshOfflineTransactions]);

  // Retry failed transactions
  const retryFailedOfflineTransactions = useCallback(async () => {
    soundFx.playClick();
    const result = await offlineSyncManager.processSyncQueue();
    await refreshOfflineTransactions();
    return result;
  }, [refreshOfflineTransactions]);

  // Protected View Switching
  const setCurrentView = (view: POSViewType) => {
    const managerOnlyViews: POSViewType[] = ['dashboard', 'products', 'inventory', 'reports', 'users', 'settings'];
    if (isCashier && managerOnlyViews.includes(view)) {
      soundFx.playError();
      setManagerAuthPromptText(`Manager Access Required for ${view.toUpperCase()}`);
      setPendingManagerAction(() => () => {
        soundFx.playSuccess();
        setCurrentViewState(view);
      });
      setShowManagerAuthModal(true);
      return;
    }
    soundFx.playClick();
    setCurrentViewState(view);
  };

  const requestManagerAuth = (reason: string, onAuthorized: () => void) => {
    setManagerAuthPromptText(reason);
    setPendingManagerAction(() => onAuthorized);
    setShowManagerAuthModal(true);
  };

  const verifyManagerPin = (pin: string): boolean => {
    return cashiers.some((c) => c.pin === pin && c.role === 'manager');
  };

  const executeManagerAuthorizedAction = (pin: string): boolean => {
    const validManager = cashiers.find((c) => c.pin === pin && c.role === 'manager');
    if (validManager) {
      soundFx.playSuccess();
      setShowManagerAuthModal(false);
      if (pendingManagerAction) {
        pendingManagerAction();
        setPendingManagerAction(null);
      }
      return true;
    }
    soundFx.playError();
    return false;
  };

  // Business Switch & Update
  const switchBusiness = (bizId: string) => {
    soundFx.playClick();
    const found = businesses.find((b) => b.id === bizId);
    if (found) {
      setCurrentBusinessId(bizId);
      clearCart();
    }
  };

  const updateBusiness = (updated: Partial<BusinessTenant>) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === currentBusinessId ? { ...b, ...updated } : b))
    );
  };

  const businessMode = currentBusiness.mode;
  const setBusinessMode = (mode: BusinessMode) => {
    updateBusiness({ mode });
  };

  // Cashier User Management (Manager only)
  const addCashierUser = (user: Omit<CashierUser, 'id'>) => {
    soundFx.playSuccess();
    const newUser: CashierUser = {
      ...user,
      id: `cashier-${Date.now()}`,
    };
    setCashiers((prev) => [...prev, newUser]);
  };

  const updateCashierUser = (userId: string, updated: Partial<CashierUser>) => {
    soundFx.playSuccess();
    setCashiers((prev) =>
      prev.map((c) => (c.id === userId ? { ...c, ...updated } : c))
    );
    if (currentCashier?.id === userId) {
      setCurrentCashier((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  const deleteCashierUser = (userId: string): boolean => {
    const target = cashiers.find((c) => c.id === userId);
    if (!target) return false;
    // Don't delete if it's the last manager
    const managerCount = cashiers.filter((c) => c.role === 'manager').length;
    if (target.role === 'manager' && managerCount <= 1) {
      soundFx.playError();
      return false;
    }
    soundFx.playClick();
    setCashiers((prev) => prev.filter((c) => c.id !== userId));
    if (currentCashier?.id === userId) {
      const remaining = cashiers.filter((c) => c.id !== userId);
      setCurrentCashier(remaining[0] || null);
    }
    return true;
  };

  // Cashier Auth & Shifts
  const loginWithPin = (pin: string): boolean => {
    const user = cashiers.find((c) => c.pin === pin);
    if (user) {
      setCurrentCashier(user);
      soundFx.playSuccess();
      setShowCashierPinModal(false);
      // If logging in as Cashier, ensure not on a restricted manager view
      if (user.role === 'cashier') {
        const managerViews: POSViewType[] = ['dashboard', 'products', 'inventory', 'reports', 'users', 'settings'];
        if (managerViews.includes(currentView)) {
          setCurrentViewState('pos');
        }
      }
      return true;
    }
    soundFx.playError();
    return false;
  };

  const logoutCashier = () => {
    soundFx.playClick();
    setCurrentCashier(null);
    setShowCashierPinModal(true);
  };

  // Reprint Receipt Helper
  const reprintReceipt = (order: OrderRecord) => {
    soundFx.playSuccess();
    setLastCompletedOrder(order);
    setShowReceiptModal(true);
  };

  const startShift = (openingFloat: number) => {
    if (!currentCashier) return;
    soundFx.playSuccess();
    const newShift: ShiftRecord = {
      id: `shift-${Date.now()}`,
      businessId: currentBusiness.id,
      cashierId: currentCashier.id,
      cashierName: currentCashier.name,
      startTime: new Date().toISOString(),
      openingFloat,
      totalSales: 0,
      cashSales: 0,
      mpesaSales: 0,
      cardSales: 0,
      roomSales: 0,
      cashDrops: [],
      status: 'open',
    };
    setActiveShift(newShift);
    saveShiftToDb(newShift).catch(() => {});
  };

  const endShift = (closingCashActual: number): ShiftRecord | null => {
    if (!activeShift) return null;
    soundFx.playSuccess();
    const closed: ShiftRecord = {
      ...activeShift,
      endTime: new Date().toISOString(),
      closingCashActual,
      status: 'closed',
    };
    setActiveShift(null);
    saveShiftToDb(closed).catch(() => {});
    return closed;
  };

  const addCashDrop = (amount: number, reason: string) => {
    if (!activeShift) return;
    soundFx.playSuccess();
    setActiveShift((prev) => {
      if (!prev) return null;
      const updated: ShiftRecord = {
        ...prev,
        cashDrops: [
          ...prev.cashDrops,
          {
            id: `drop-${Date.now()}`,
            amount,
            reason,
            time: new Date().toISOString(),
          },
        ],
      };
      saveShiftToDb(updated).catch(() => {});
      return updated;
    });
  };

  // Product Catalog
  const toggleProductInventoryType = (productId: string) => {
    soundFx.playClick();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const nextIsInventory = !p.isInventory;
          return {
            ...p,
            isInventory: nextIsInventory,
            stock: nextIsInventory ? (p.stock !== undefined ? p.stock : 20) : undefined,
          };
        }
        return p;
      })
    );
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p))
    );
  };

  const updateProduct = (productId: string, updated: Partial<ProductItem>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updated } : p))
    );
  };

  const addProduct = (product: Omit<ProductItem, 'id'>) => {
    soundFx.playSuccess();
    const newProd: ProductItem = {
      ...product,
      id: `prod-custom-${Date.now()}`,
    };
    setProducts((prev) => [newProd, ...prev]);
  };

  const deleteProduct = (productId: string) => {
    soundFx.playClick();
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Cart Operations
  const addToCart = (
    product: ProductItem,
    modifiers: CartModifierSelection[] = [],
    notes?: string
  ) => {
    soundFx.playClick();

    const modifierCost = modifiers.reduce((acc, m) => acc + m.extraPrice, 0);
    const unitPrice = product.price + modifierCost;

    const existingIndex = cart.findIndex((item) => {
      if (item.product.id !== product.id) return false;
      if (item.itemNotes !== notes) return false;
      if (item.selectedModifiers.length !== modifiers.length) return false;
      return item.selectedModifiers.every((m, idx) => {
        const target = modifiers[idx];
        return target && target.groupName === m.groupName && target.selectedOption === m.selectedOption;
      });
    });

    if (existingIndex > -1) {
      setCart((prev) => {
        const updated = [...prev];
        const item = updated[existingIndex];
        const newQty = item.quantity + 1;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          totalPrice: item.unitPrice * (1 - item.itemDiscountPercent / 100) * newQty,
        };
        return updated;
      });
    } else {
      const newItem: CartItem = {
        cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product,
        quantity: 1,
        selectedModifiers: modifiers,
        itemDiscountPercent: 0,
        itemNotes: notes,
        unitPrice,
        totalPrice: unitPrice,
      };
      setCart((prev) => [newItem, ...prev]);
    }
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    soundFx.playClick();
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * (1 - item.itemDiscountPercent / 100) * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const setCartItemQuantity = (cartItemId: string, quantity: number) => {
    soundFx.playClick();
    if (quantity <= 0) {
      removeCartItem(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            quantity,
            totalPrice: item.unitPrice * (1 - item.itemDiscountPercent / 100) * quantity,
          };
        }
        return item;
      })
    );
  };

  const removeCartItem = (cartItemId: string) => {
    soundFx.playClick();
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const setCartItemDiscount = (cartItemId: string, discountPercent: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const validDisc = Math.min(100, Math.max(0, discountPercent));
          return {
            ...item,
            itemDiscountPercent: validDisc,
            totalPrice: item.unitPrice * (1 - validDisc / 100) * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const updateCartItemNotes = (cartItemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.cartItemId === cartItemId ? { ...item, itemNotes: notes } : item))
    );
  };

  const clearCart = () => {
    soundFx.playClick();
    setCart([]);
    setOrderDiscountPercent(0);
    setCustomerName('');
    setSelectedTable(null);
    setSelectedRoom(null);
  };

  // Real-time Cart Totals
  const cartTotals = useMemo(() => {
    const rawItemsTotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
    const orderDiscountAmt = rawItemsTotal * (orderDiscountPercent / 100);
    const postDiscountTotal = Math.max(0, rawItemsTotal - orderDiscountAmt);

    const taxRate = currentBusiness.taxRate || 0.16;
    const subtotal = postDiscountTotal / (1 + taxRate);
    const tax = postDiscountTotal - subtotal;
    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: Math.round(orderDiscountAmt * 100) / 100,
      total: Math.round(postDiscountTotal),
      itemCount,
    };
  }, [cart, orderDiscountPercent, currentBusiness.taxRate]);

  // Park Order
  const parkCurrentOrder = () => {
    if (cart.length === 0) return;
    soundFx.playClick();

    const parked: OrderRecord = {
      id: `ord-parked-${Date.now()}`,
      orderNumber: `HLD-${Math.floor(1000 + Math.random() * 9000)}`,
      businessId: currentBusiness.id,
      businessName: currentBusiness.name,
      cashierId: currentCashier?.id || 'c-1',
      cashierName: currentCashier?.name || 'Cashier',
      shiftId: activeShift?.id || 'shift-1',
      createdAt: new Date().toISOString(),
      items: [...cart],
      orderType,
      tableNumber: selectedTable?.name,
      tableId: selectedTable?.id,
      roomNumber: selectedRoom?.roomNumber,
      guestName: selectedRoom?.guestName,
      customerName,
      subtotal: cartTotals.subtotal,
      taxAmount: cartTotals.tax,
      discountAmount: cartTotals.discount,
      discountPercent: orderDiscountPercent,
      totalAmount: cartTotals.total,
      paymentMethod: 'cash',
      status: 'parked',
      billStatus: 'unpaid',
    };

    setParkedOrders((prev) => [parked, ...prev]);
    clearCart();
  };

  const resumeParkedOrder = (orderId: string) => {
    const target = parkedOrders.find((p) => p.id === orderId);
    if (!target) return;
    soundFx.playClick();

    setCart(target.items);
    setOrderType(target.orderType);
    setOrderDiscountPercent(target.discountPercent || 0);
    setCustomerName(target.customerName || '');

    if (target.tableNumber) {
      const t = tables.find((tbl) => tbl.name === target.tableNumber || tbl.id === target.tableId);
      setSelectedTable(t || null);
    }
    if (target.roomNumber) {
      const r = hotelRooms.find((rm) => rm.roomNumber === target.roomNumber);
      setSelectedRoom(r || null);
    }

    setParkedOrders((prev) => prev.filter((p) => p.id !== orderId));
  };

  const cancelParkedOrder = (orderId: string) => {
    soundFx.playClick();
    setParkedOrders((prev) => prev.filter((p) => p.id !== orderId));
  };

  // ==========================================
  // ACTIVE UNPAID ORDER RECORDING (CASHIER WORKFLOW)
  // ==========================================
  const saveActiveOrder = (customCustomerName?: string, notes?: string): OrderRecord | null => {
    if (cart.length === 0) return null;
    soundFx.playSuccess();

    const orderNum = `ORD-${1100 + orderHistory.length + activeUnpaidOrders.length}`;
    const targetTable = selectedTable;
    const targetRoom = selectedRoom;
    const targetCustomer =
      customCustomerName ||
      customerName ||
      (targetTable
        ? `${targetTable.name}`
        : targetRoom
        ? `Room ${targetRoom.roomNumber} (${targetRoom.guestName})`
        : `Customer #${Math.floor(100 + Math.random() * 900)}`);

    const taxRate = currentBusiness.taxRate || 0.16;
    const subtotal = cartTotals.total / (1 + taxRate);
    const taxAmount = cartTotals.total - subtotal;

    const newActiveOrder: OrderRecord = {
      id: `ord-active-${Date.now()}`,
      orderNumber: orderNum,
      businessId: currentBusiness.id,
      businessName: currentBusiness.name,
      cashierId: currentCashier?.id || 'c-1',
      cashierName: currentCashier?.name || 'Cashier',
      waiterName: targetTable?.assignedWaiter || currentCashier?.name || 'Cashier',
      shiftId: activeShift?.id || 'shift-live',
      createdAt: new Date().toISOString(),
      items: [...cart],
      orderType: targetTable ? 'dine_in' : targetRoom ? 'room_service' : orderType,
      tableNumber: targetTable?.name,
      tableId: targetTable?.id,
      guestCount: targetTable?.activeGuests,
      roomNumber: targetRoom?.roomNumber,
      guestName: targetRoom?.guestName,
      customerName: targetCustomer,
      specialNotes: notes,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: cartTotals.discount,
      discountPercent: orderDiscountPercent,
      totalAmount: cartTotals.total,
      paymentMethod: 'cash',
      status: 'completed',
      billStatus: 'unpaid',
      kitchenStatus: 'pending',
    };

    setActiveUnpaidOrders((prev) => [newActiveOrder, ...prev]);

    // Update table info if table was selected
    if (targetTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === targetTable.id
            ? {
                ...t,
                status: 'occupied',
                activeOrderId: newActiveOrder.id,
                activeOrderTotal: cartTotals.total,
                activeItems: [...cart],
              }
            : t
        )
      );
    }

    clearCart();
    return newActiveOrder;
  };

  const resumeActiveOrder = (orderId: string) => {
    const target = activeUnpaidOrders.find((o) => o.id === orderId);
    if (!target) return;
    soundFx.playClick();

    setCart(target.items);
    setOrderType(target.orderType);
    setOrderDiscountPercent(target.discountPercent || 0);
    setCustomerName(target.customerName || '');

    if (target.tableNumber || target.tableId) {
      const t = tables.find((tbl) => tbl.id === target.tableId || tbl.name === target.tableNumber);
      setSelectedTable(t || null);
    }
    if (target.roomNumber) {
      const r = hotelRooms.find((rm) => rm.roomNumber === target.roomNumber);
      setSelectedRoom(r || null);
    }

    setActiveUnpaidOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const cancelActiveOrder = (orderId: string) => {
    soundFx.playClick();
    const target = activeUnpaidOrders.find((o) => o.id === orderId);
    if (target?.tableId) {
      releaseTable(target.tableId);
    }
    setActiveUnpaidOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const openBillForActiveOrder = (order: OrderRecord) => {
    openCustomerBill(order);
  };

  const openPaymentForActiveOrder = (order: OrderRecord) => {
    openPaymentForOrder(order);
  };

  // ==========================================
  // RESTAURANT / HOTEL SERVICE WORKFLOW METHODS
  // ==========================================

  // 1. Waiter starts a table order
  const startTableOrder = (tableId: string, guests: number, waiterName?: string) => {
    soundFx.playClick();
    const assigned = waiterName || currentCashier?.name || 'Waiter';
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            status: 'occupied',
            activeGuests: guests,
            assignedWaiter: assigned,
            openedAt: new Date().toISOString(),
            rounds: t.rounds || [],
            activeItems: t.activeItems || [],
            activeOrderTotal: t.activeOrderTotal || 0,
          };
        }
        return t;
      })
    );

    const updatedTable = tables.find((t) => t.id === tableId);
    if (updatedTable) {
      setSelectedTable({
        ...updatedTable,
        status: 'occupied',
        activeGuests: guests,
        assignedWaiter: assigned,
      });
    }
    setOrderType('dine_in');
    setCurrentView('pos');
  };

  // 2. Select table to take order or add another round
  const selectTableForOrder = (table: TableInfo) => {
    soundFx.playClick();
    setSelectedTable(table);
    setOrderType('dine_in');
    setCurrentView('pos');
  };

  // 3. Send current cart to Kitchen (KDS) & update table round
  const sendCurrentOrderToKitchen = (specialNotes?: string) => {
    if (cart.length === 0) return;
    soundFx.playOrderSend();

    const waiter = selectedTable?.assignedWaiter || currentCashier?.name || 'Waiter';
    const destinationName = selectedTable?.name || (selectedRoom ? `Room ${selectedRoom.roomNumber}` : 'Direct Order');

    // Create KDS ticket
    const newKdsTicket: KdsTicket = {
      id: `kds-${Date.now()}`,
      orderId: `ord-kds-${Date.now()}`,
      orderNumber: `ORD-${1100 + orderHistory.length + kdsTickets.length}`,
      tableOrRoom: destinationName,
      orderType: selectedTable ? 'dine_in' : (selectedRoom ? 'room_service' : orderType),
      serverName: waiter,
      createdAt: new Date().toISOString(),
      items: cart.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        notes: i.itemNotes || specialNotes,
        modifiers: i.selectedModifiers.map((m) => `${m.groupName}: ${m.selectedOption}`),
      })),
      status: 'pending',
      elapsedMinutes: 0,
    };

    setKdsTickets((prev) => [newKdsTicket, ...prev]);

    // If attached to a table, record the round and update table status to 'order_sent' / 'preparing'
    if (selectedTable) {
      const targetTableId = selectedTable.id;
      const currentRounds = selectedTable.rounds || [];
      const newRoundNumber = currentRounds.length + 1;

      const itemsWithRound: CartItem[] = cart.map((item) => ({
        ...item,
        roundNumber: newRoundNumber,
        sentToKitchen: true,
      }));

      const newRound: TableOrderRound = {
        roundNumber: newRoundNumber,
        createdAt: new Date().toISOString(),
        items: itemsWithRound,
        waiterName: waiter,
      };

      setTables((prev) =>
        prev.map((t) => {
          if (t.id === targetTableId) {
            const existingActive = t.activeItems || [];
            const mergedItems = [...existingActive, ...itemsWithRound];
            const updatedTotal = mergedItems.reduce((sum, itm) => sum + itm.totalPrice, 0);

            return {
              ...t,
              status: 'order_sent',
              rounds: [...(t.rounds || []), newRound],
              activeItems: mergedItems,
              activeOrderTotal: updatedTotal,
              specialInstructions: specialNotes || t.specialInstructions,
            };
          }
          return t;
        })
      );
    }

    // Clear cart for next order round
    setCart([]);

    // Record offline sync queue
    offlineSyncManager.enqueueAction('kitchen_round_sent', {
      ticketId: newKdsTicket.id,
      orderNumber: newKdsTicket.orderNumber,
      destinationName,
    });

    // Auto-print Kitchen Order Ticket (KOT) over Wi-Fi if enabled
    if (printerConfig.enabled && printerConfig.autoPrintKitchenTicket) {
      printKitchenTicketToWifi(newKdsTicket);
    }
  };

  // 4. Kitchen marks order as Ready -> triggers notification for waiter
  const markKitchenOrderReady = (ticketId: string) => {
    soundFx.playKitchenBell();

    setKdsTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id === ticketId) {
          return { ...ticket, status: 'ready' };
        }
        return ticket;
      })
    );

    const ticket = kdsTickets.find((t) => t.id === ticketId);
    if (ticket) {
      // Find matching table
      if (ticket.tableOrRoom) {
        setTables((prev) =>
          prev.map((tbl) =>
            tbl.name === ticket.tableOrRoom ? { ...tbl, status: 'ready' } : tbl
          )
        );
      }

      // Generate waiter ready notification
      const newNotif: WaiterReadyNotification = {
        id: `notif-${Date.now()}`,
        ticketId: ticket.id,
        tableOrRoom: ticket.tableOrRoom || 'Counter',
        orderNumber: ticket.orderNumber,
        waiterName: ticket.serverName,
        readyTime: new Date().toISOString(),
        itemsSummary: ticket.items.map((i) => `${i.quantity}x ${i.name}`).join(', '),
        acknowledged: false,
      };

      setWaiterNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // 5. Waiter serves order to table
  const markTableServed = (tableId: string) => {
    soundFx.playSuccess();
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          return { ...t, status: 'occupied' };
        }
        return t;
      })
    );

    const target = tables.find((t) => t.id === tableId);
    if (target) {
      setKdsTickets((prev) =>
        prev.map((k) => (k.tableOrRoom === target.name ? { ...k, status: 'served' } : k))
      );
    }
  };

  // 6. Request bill for table
  const requestTableBill = (tableId: string) => {
    soundFx.playClick();
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          return { ...t, status: 'bill_requested', billRequestedAt: new Date().toISOString() };
        }
        return t;
      })
    );

    const targetTable = tables.find((t) => t.id === tableId);
    if (targetTable) {
      openCustomerBill({
        ...targetTable,
        status: 'bill_requested',
      });
    }
  };

  // 7. Release table back to available
  const releaseTable = (tableId: string) => {
    soundFx.playClick();
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === tableId) {
          return {
            ...t,
            status: 'available',
            activeOrderId: undefined,
            activeOrderTotal: 0,
            activeGuests: undefined,
            assignedWaiter: undefined,
            rounds: [],
            activeItems: [],
            specialInstructions: undefined,
            billRequestedAt: undefined,
            paidAt: undefined,
          };
        }
        return t;
      })
    );
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
  };

  // Dismiss Waiter Notification
  const dismissNotification = (id: string) => {
    setWaiterNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Open Pro-Forma Customer Bill Modal
  const openCustomerBill = (target: TableInfo | OrderRecord) => {
    soundFx.playClick();
    setActiveBillData(target);
    setShowCustomerBillModal(true);
  };

  const closeCustomerBill = () => {
    setShowCustomerBillModal(false);
    setActiveBillData(null);
  };

  // Payment Setup helpers
  const openPaymentForTable = (table: TableInfo) => {
    soundFx.playClick();
    const items = table.activeItems && table.activeItems.length > 0 ? table.activeItems : cart;
    const total = table.activeOrderTotal || items.reduce((sum, i) => sum + i.totalPrice, 0);

    setActiveCheckoutTarget({
      tableId: table.id,
      tableName: table.name,
      title: `${table.name} Bill Settle`,
      items,
      totalAmount: total,
    });
    setShowCustomerBillModal(false);
  };

  const openPaymentForOrder = (order: OrderRecord) => {
    soundFx.playClick();
    setActiveCheckoutTarget({
      orderId: order.id,
      orderNumber: order.orderNumber,
      title: `Order ${order.orderNumber} Payment`,
      items: order.items,
      totalAmount: order.totalAmount,
    });
    setShowCustomerBillModal(false);
  };

  const openDirectCartPayment = () => {
    soundFx.playClick();
    setActiveCheckoutTarget({
      tableId: selectedTable?.id,
      tableName: selectedTable?.name,
      roomNumber: selectedRoom?.roomNumber,
      guestName: selectedRoom?.guestName,
      title: selectedTable ? `${selectedTable.name} Checkout` : (selectedRoom ? `Room ${selectedRoom.roomNumber} Checkout` : 'Quick Sale Checkout'),
      items: cart,
      totalAmount: cartTotals.total,
    });
  };

  // Complete Sale & Checkout
  const completeCheckout = useCallback(
    (
      paymentMethod: PaymentMethod,
      details: {
        amountTendered?: number;
        mpesaRef?: string;
        cardLast4?: string;
        breakdown?: SplitPaymentDetail[];
        customerPhone?: string;
      } = {}
    ): OrderRecord => {
      const orderNum = `ORD-${1100 + orderHistory.length}`;
      
      // Determine items & total from active checkout target or current cart
      const targetItems = activeCheckoutTarget?.items || cart;
      const targetTotal = activeCheckoutTarget ? activeCheckoutTarget.totalAmount : cartTotals.total;
      const targetTableId = activeCheckoutTarget?.tableId || selectedTable?.id;
      const targetTableName = activeCheckoutTarget?.tableName || selectedTable?.name;
      const targetRoomNumber = activeCheckoutTarget?.roomNumber || selectedRoom?.roomNumber;
      const targetGuestName = activeCheckoutTarget?.guestName || selectedRoom?.guestName;

      const taxRate = currentBusiness.taxRate || 0.16;
      const subtotal = targetTotal / (1 + taxRate);
      const taxAmount = targetTotal - subtotal;

      const change =
        details.amountTendered && details.amountTendered > targetTotal
          ? details.amountTendered - targetTotal
          : 0;

      const billStatusValue = paymentMethod === 'room_charge' ? 'charged_to_room' : 'paid';

      const isCurrentTxOffline = !isOnline;
      const offlineTxId = offlineSyncManager.generateOfflineTransactionId();

      const newOrder: OrderRecord = {
        id: `ord-${Date.now()}`,
        orderNumber: orderNum,
        businessId: currentBusiness.id,
        businessName: currentBusiness.name,
        cashierId: currentCashier?.id || 'c-1',
        cashierName: currentCashier?.name || 'Cashier',
        waiterName: selectedTable?.assignedWaiter || currentCashier?.name || 'Sarah Jenkins',
        shiftId: activeShift?.id || 'shift-live',
        createdAt: new Date().toISOString(),
        items: [...targetItems],
        orderType: targetTableId ? 'dine_in' : (targetRoomNumber ? 'room_service' : orderType),
        tableNumber: targetTableName,
        tableId: targetTableId,
        guestCount: selectedTable?.activeGuests,
        roomNumber: targetRoomNumber,
        guestName: targetGuestName,
        customerName: customerName || undefined,
        customerPhone: details.customerPhone,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        discountAmount: cartTotals.discount,
        discountPercent: orderDiscountPercent,
        totalAmount: targetTotal,
        paymentMethod,
        paymentBreakdown: details.breakdown,
        amountTendered: details.amountTendered,
        changeGiven: change,
        mpesaRef: details.mpesaRef,
        cardLast4: details.cardLast4,
        status: 'completed',
        billStatus: billStatusValue,
        kitchenStatus: 'served',
        transactionId: offlineTxId,
        isOfflineRecord: isCurrentTxOffline,
        syncStatus: isCurrentTxOffline ? 'PENDING' : 'SYNCED',
        offlineSyncTimestamp: !isCurrentTxOffline ? new Date().toISOString() : undefined,
      };

      // Update Order History
      setOrderHistory((prev) => [newOrder, ...prev]);

      // Update Shift stats
      if (activeShift) {
        const amt = targetTotal;
        setActiveShift((prev) => {
          if (!prev) return null;
          let cashAdd = 0;
          let mpesaAdd = 0;
          let cardAdd = 0;
          let roomAdd = 0;

          if (paymentMethod === 'cash') cashAdd = amt;
          else if (paymentMethod === 'mpesa') mpesaAdd = amt;
          else if (paymentMethod === 'card') cardAdd = amt;
          else if (paymentMethod === 'room_charge') roomAdd = amt;
          else if (paymentMethod === 'split' && details.breakdown) {
            details.breakdown.forEach((b) => {
              if (b.method === 'cash') cashAdd += b.amount;
              if (b.method === 'mpesa') mpesaAdd += b.amount;
              if (b.method === 'card') cardAdd += b.amount;
              if (b.method === 'room_charge') roomAdd += b.amount;
            });
          }

          const updatedShift: ShiftRecord = {
            ...prev,
            totalSales: prev.totalSales + amt,
            cashSales: prev.cashSales + cashAdd,
            mpesaSales: prev.mpesaSales + mpesaAdd,
            cardSales: prev.cardSales + cardAdd,
            roomSales: prev.roomSales + roomAdd,
            offlineSalesCount: (prev.offlineSalesCount || 0) + (isCurrentTxOffline ? 1 : 0),
            offlineSalesTotal: (prev.offlineSalesTotal || 0) + (isCurrentTxOffline ? amt : 0),
          };

          // Save shift state to IndexedDB
          saveShiftToDb(updatedShift);
          return updatedShift;
        });
      }

      // If room charged, update folio balance
      if (targetRoomNumber && paymentMethod === 'room_charge') {
        setHotelRooms((prev) =>
          prev.map((rm) =>
            rm.roomNumber === targetRoomNumber
              ? { ...rm, folioBalance: rm.folioBalance + targetTotal }
              : rm
          )
        );
      }

      // If table order, mark table as paid
      if (targetTableId) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === targetTableId
              ? {
                  ...t,
                  status: 'paid',
                  paidAt: new Date().toISOString(),
                  activeOrderTotal: targetTotal,
                }
              : t
          )
        );
      }

      // If this checkout corresponds to an active unpaid order, remove it from active list
      if (activeCheckoutTarget?.orderId) {
        setActiveUnpaidOrders((prev) => prev.filter((o) => o.id !== activeCheckoutTarget.orderId));
      } else if (targetTableId) {
        setActiveUnpaidOrders((prev) => prev.filter((o) => o.tableId !== targetTableId));
      }

      // Automatically decrement stock for inventory items
      setProducts((prevProds) =>
        prevProds.map((prod) => {
          if (prod.isInventory && prod.stock !== undefined) {
            const purchasedQty = targetItems
              .filter((c) => c.product.id === prod.id)
              .reduce((sum, c) => sum + c.quantity, 0);
            if (purchasedQty > 0) {
              return {
                ...prod,
                stock: Math.max(0, prod.stock - purchasedQty),
              };
            }
          }
          return prod;
        })
      );

      setLastCompletedOrder(newOrder);
      setShowReceiptModal(true);
      setActiveCheckoutTarget(null);
      clearCart();
      soundFx.playSuccess();

      // Persist transaction record directly to IndexedDB & sync queue
      offlineSyncManager.recordOfflineSale({
        transactionId: offlineTxId,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        businessId: newOrder.businessId,
        businessName: newOrder.businessName,
        cashierId: newOrder.cashierId,
        cashierName: newOrder.cashierName,
        waiterName: newOrder.waiterName,
        shiftId: newOrder.shiftId,
        createdAt: newOrder.createdAt,
        items: newOrder.items.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          modifiersSummary: i.selectedModifiers.map((m) => m.selectedOption).join(', '),
          notes: i.itemNotes,
          isInventory: !!i.product.isInventory,
        })),
        orderType: newOrder.orderType,
        tableNumber: newOrder.tableNumber,
        tableId: newOrder.tableId,
        roomNumber: newOrder.roomNumber,
        guestName: newOrder.guestName,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        subtotal: newOrder.subtotal,
        taxAmount: newOrder.taxAmount,
        discountAmount: newOrder.discountAmount,
        discountPercent: newOrder.discountPercent,
        totalAmount: newOrder.totalAmount,
        paymentMethod: newOrder.paymentMethod,
        paymentReference: newOrder.mpesaRef || (newOrder.cardLast4 ? `Card ****${newOrder.cardLast4}` : undefined),
        paymentBreakdown: newOrder.paymentBreakdown,
        amountTendered: newOrder.amountTendered,
        changeGiven: newOrder.changeGiven,
        mpesaRef: newOrder.mpesaRef,
        cardLast4: newOrder.cardLast4,
        isOfflineRecord: isCurrentTxOffline,
      }).then(() => {
        refreshOfflineTransactions();
      }).catch((e) => console.warn('[POSContext] recordOfflineSale err:', e));

      // Auto-print receipt to Wi-Fi printer if enabled
      if (printerConfig.enabled && printerConfig.autoPrintReceipt) {
        printReceiptToWifi(newOrder);
      }

      return newOrder;
    },
    [activeCheckoutTarget, cart, cartTotals, currentBusiness, currentCashier, activeShift, orderType, selectedTable, selectedRoom, customerName, orderDiscountPercent, orderHistory.length, isOnline, printerConfig, refreshOfflineTransactions]
  );

  const refundOrder = (orderId: string) => {
    soundFx.playError();
    offlineSyncManager.enqueueAction('refund_order', { orderId });
    setOrderHistory((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: 'refunded' } : ord))
    );
  };

  const updateTableStatus = (tableId: string, status: TableStatus) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    );
    soundFx.playClick();
  };

  const updateKdsStatus = (ticketId: string, status: KdsTicket['status']) => {
    if (status === 'ready') {
      markKitchenOrderReady(ticketId);
    } else {
      setKdsTickets((prev) =>
        prev.map((k) => (k.id === ticketId ? { ...k, status } : k))
      );
      soundFx.playClick();
    }
  };

  // Safaricom Daraja 3.0 Lipa Na M-Pesa Configuration & Helpers
  const daraja3Config = useMemo<Daraja3Config>(() => {
    return currentBusiness.daraja3Config || DEFAULT_DARAJA3_CONFIG;
  }, [currentBusiness]);

  const updateDaraja3Config = useCallback((updated: Partial<Daraja3Config>) => {
    soundFx.playClick();
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === currentBusinessId) {
          const currentConfig = b.daraja3Config || DEFAULT_DARAJA3_CONFIG;
          return {
            ...b,
            daraja3Config: {
              ...currentConfig,
              ...updated,
            },
          };
        }
        return b;
      })
    );
  }, [currentBusinessId]);

  const testDaraja3Config = useCallback(async () => {
    soundFx.playClick();
    const config = currentBusiness.daraja3Config || DEFAULT_DARAJA3_CONFIG;
    const result = await testDaraja3Connection(config);
    
    // Update business state with test status
    updateDaraja3Config({
      lastTestedAt: new Date().toISOString(),
      testStatus: result.success ? 'success' : 'failed',
      lastTestMessage: result.message,
    });

    if (result.success) {
      soundFx.playSuccess();
    } else {
      soundFx.playError();
    }

    return result;
  }, [currentBusiness, updateDaraja3Config]);

  const triggerDaraja3StkPush = useCallback(
    async (params: { phone: string; amount: number; reference?: string; orderNumber?: string }) => {
      const config = currentBusiness.daraja3Config || DEFAULT_DARAJA3_CONFIG;
      return await initiateDaraja3StkPush(config, {
        phone: params.phone,
        amount: params.amount,
        accountReference: params.reference || `${config.accountReferencePrefix}-${params.orderNumber || 'SALE'}`,
        transactionDesc: config.transactionDesc,
      });
    },
    [currentBusiness]
  );

  // Reset all payments, sales ledger, active unpaid tabs, shifts, and start fresh
  const resetAllPaymentsAndStartFresh = useCallback(
    (options?: {
      resetTables?: boolean;
      resetShifts?: boolean;
      resetKds?: boolean;
      preserveCatalog?: boolean;
    }) => {
      const ordersCount = orderHistory.length + activeUnpaidOrders.length + parkedOrders.length;

      // 1. Clear order history, active unpaid orders, parked orders, cart
      setOrderHistory([]);
      setActiveUnpaidOrders([]);
      setParkedOrders([]);
      setCart([]);
      setLastCompletedOrder(null);
      setActiveCheckoutTarget(null);

      localStorage.setItem('davetech_orders', JSON.stringify([]));
      localStorage.setItem('davetech_active_orders', JSON.stringify([]));
      localStorage.setItem('davetech_parked_orders', JSON.stringify([]));

      // 2. Reset Tables to available
      let tablesCount = 0;
      if (options?.resetTables !== false) {
        setTables((prev) =>
          prev.map((t) => ({
            ...t,
            status: 'available',
            activeOrderId: undefined,
            activeOrderTotal: 0,
            activeGuests: 0,
            assignedWaiter: undefined,
            openedAt: undefined,
            rounds: [],
            activeItems: [],
            specialInstructions: undefined,
            billRequestedAt: undefined,
            paidAt: undefined,
          }))
        );
        tablesCount = tables.length;
      }

      // 3. Reset Active Shift float & counters to 0 sales
      if (options?.resetShifts !== false && activeShift) {
        setActiveShift((prev) =>
          prev
            ? {
                ...prev,
                totalSales: 0,
                cashSales: 0,
                mpesaSales: 0,
                cardSales: 0,
                roomSales: 0,
                cashDrops: [],
                startTime: new Date().toISOString(),
              }
            : null
        );
      }

      // 4. Reset KDS tickets & notifications
      if (options?.resetKds !== false) {
        setKdsTickets([]);
        setWaiterNotifications([]);
      }

      // 5. Reset Hotel Rooms folio balances
      setHotelRooms((prev) =>
        prev.map((r) => ({
          ...r,
          folioBalance: 0,
        }))
      );

      soundFx.playSuccess();

      // Enqueue offline action for sync resilience
      offlineSyncManager.enqueueAction('reset_payments_ledger', {
        timestamp: new Date().toISOString(),
        clearedOrdersCount: ordersCount,
      });

      return {
        ordersCleared: ordersCount,
        tablesReset: tablesCount,
        timestamp: new Date().toISOString(),
      };
    },
    [orderHistory.length, activeUnpaidOrders.length, parkedOrders.length, tables.length, activeShift]
  );

  return (
    <POSContext.Provider
      value={{
        businesses,
        currentBusiness,
        switchBusiness,
        updateBusiness,
        businessMode,
        setBusinessMode,
        cashiers,
        currentCashier,
        activeShift,
        loginWithPin,
        logoutCashier,
        startShift,
        endShift,
        addCashDrop,
        isManager,
        isCashier,
        addCashierUser,
        updateCashierUser,
        deleteCashierUser,
        verifyManagerPin,
        reprintReceipt,
        showManagerAuthModal,
        setShowManagerAuthModal,
        managerAuthPromptText,
        setManagerAuthPromptText,
        requestManagerAuth,
        executeManagerAuthorizedAction,
        categories,
        products,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        inventoryFilter,
        setInventoryFilter,
        toggleProductInventoryType,
        updateProductStock,
        updateProduct,
        addProduct,
        deleteProduct,
        cart,
        addToCart,
        updateCartQuantity,
        setCartItemQuantity,
        removeCartItem,
        setCartItemDiscount,
        updateCartItemNotes,
        clearCart,
        orderType,
        setOrderType,
        selectedTable,
        setSelectedTable,
        selectedRoom,
        setSelectedRoom,
        customerName,
        setCustomerName,
        orderDiscountPercent,
        setOrderDiscountPercent,
        cartTotals,
        parkCurrentOrder,
        parkedOrders,
        resumeParkedOrder,
        cancelParkedOrder,
        activeUnpaidOrders,
        saveActiveOrder,
        resumeActiveOrder,
        cancelActiveOrder,
        openBillForActiveOrder,
        openPaymentForActiveOrder,
        startTableOrder,
        selectTableForOrder,
        sendCurrentOrderToKitchen,
        markKitchenOrderReady,
        markTableServed,
        requestTableBill,
        releaseTable,
        showCustomerBillModal,
        setShowCustomerBillModal,
        activeBillData,
        openCustomerBill,
        closeCustomerBill,
        activeCheckoutTarget,
        setActiveCheckoutTarget,
        openPaymentForTable,
        openPaymentForOrder,
        openDirectCartPayment,
        completeCheckout,
        lastCompletedOrder,
        setLastCompletedOrder,
        showReceiptModal,
        setShowReceiptModal,
        waiterNotifications,
        dismissNotification,
        showCashierPinModal,
        setShowCashierPinModal,
        showShiftReportModal,
        setShowShiftReportModal,
        currentView,
        setCurrentView,
        orderHistory,
        refundOrder,
        tables,
        updateTableStatus,
        hotelRooms,
        kdsTickets,
        updateKdsStatus,
        soundEnabled,
        setSoundEnabled,
        isHighContrast,
        setIsHighContrast,
        currencySymbol: currentBusiness.currencySymbol || 'KSh',
        printerConfig,
        updatePrinterConfig,
        showWifiPrinterModal,
        setShowWifiPrinterModal,
        printReceiptToWifi,
        printKitchenTicketToWifi,
        testWifiPrinter,
        isOnline,
        pendingOfflineSyncCount,
        lastSyncTimestamp,
        syncProgress,
        offlineTransactions,
        refreshOfflineTransactions,
        retryFailedOfflineTransactions,
        triggerManualSync,
        resetAllPaymentsAndStartFresh,
        daraja3Config,
        updateDaraja3Config,
        testDaraja3Config,
        triggerDaraja3StkPush,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
