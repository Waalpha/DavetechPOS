export type BusinessMode = 'restaurant' | 'hotel' | 'shop' | 'bar' | 'services';

export type PaymentMethod = 'cash' | 'mpesa' | 'card' | 'split' | 'room_charge';

export type TableStatus =
  | 'available'
  | 'occupied'
  | 'order_sent'
  | 'preparing'
  | 'ready'
  | 'bill_requested'
  | 'paid'
  | 'reserved';

export type BillStatus = 'unpaid' | 'partially_paid' | 'paid' | 'voided' | 'charged_to_room';

export type KitchenStatus = 'pending' | 'cooking' | 'ready' | 'served';

export type DarajaEnvironment = 'sandbox' | 'live';
export type DarajaIdentifierType = 'till' | 'paybill';

export interface Daraja3Config {
  enabled: boolean;
  environment: DarajaEnvironment; // 'sandbox' | 'live'
  appKey: string; // Daraja 3.0 Consumer Key
  appSecret: string; // Daraja 3.0 Consumer Secret
  passkey: string; // Lipa Na M-Pesa Online Passkey
  shortcode: string; // Business ShortCode (e.g. 174379 sandbox or Till/Paybill number)
  identifierType: DarajaIdentifierType; // 'till' | 'paybill'
  partyB?: string; // Store number / Till number
  callbackUrl: string; // Webhook callback URL
  c2bValidationUrl?: string; // C2B Validation URL
  c2bConfirmationUrl?: string; // C2B Confirmation URL
  accountReferencePrefix: string; // e.g. 'DAVETECH'
  transactionDesc: string; // e.g. 'Payment for Food & Drinks'
  autoQueryTimeoutSec: number; // Timeout in seconds (e.g. 25)
  enableInstantPush: boolean; // Auto-trigger STK on phone number entry
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed' | 'idle';
  lastTestMessage?: string;
}

export interface BusinessTenant {
  id: string;
  name: string;
  tagline: string;
  mode: BusinessMode;
  currency: string;
  currencySymbol: string;
  taxRate: number; // e.g. 0.16 for 16% VAT
  taxNumber: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  receiptFooter: string;
  // M-Pesa Configuration for customer bill payments
  mpesaType: 'till' | 'paybill';
  mpesaTillNumber: string; // e.g. '893421'
  mpesaPaybillNumber: string; // e.g. '247247'
  mpesaAccountInstructions: string; // e.g. 'Table Number or Guest Name'
  daraja3Config?: Daraja3Config;
}

export type UserRole = 'manager' | 'cashier';

export interface CashierUser {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // 4 to 6 digit PIN
  avatarColor: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive';
  activeShiftId?: string;
}

export type POSViewType =
  | 'pos'
  | 'tables'
  | 'orders'
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'reports'
  | 'users'
  | 'settings'
  | 'kds'
  | 'rooms';

export interface ShiftRecord {
  id: string;
  businessId: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  openingFloat: number;
  closingCashActual?: number;
  totalSales: number;
  cashSales: number;
  mpesaSales: number;
  cardSales: number;
  roomSales: number;
  offlineSalesCount?: number;
  offlineSalesTotal?: number;
  cashDrops: { id: string; amount: number; reason: string; time: string }[];
  status: 'open' | 'closed';
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  applicableModes?: BusinessMode[];
}

export interface ProductItem {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  imageUrl: string;
  sku?: string;
  barcode?: string;
  stock?: number;
  reorderLevel?: number;
  isAvailable: boolean;
  isInventory: boolean; // true = Tracked physical stock / goods, false = Non-inventory (service, labor, uncounted, fee)
  businessModes: BusinessMode[];
  description?: string;
  modifiers?: {
    name: string;
    options: { label: string; extraPrice: number }[];
  }[];
}

export interface CartModifierSelection {
  groupName: string;
  selectedOption: string;
  extraPrice: number;
}

export interface CartItem {
  cartItemId: string; // unique per line in cart
  product: ProductItem;
  quantity: number;
  selectedModifiers: CartModifierSelection[];
  itemDiscountPercent: number;
  itemNotes?: string;
  unitPrice: number; // base price + modifiers
  totalPrice: number; // (unitPrice * (1 - discount)) * quantity
  roundNumber?: number; // e.g. Round 1, Round 2
  sentToKitchen?: boolean;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'room_service' | 'quick_bar';

export interface SplitPaymentDetail {
  method: 'cash' | 'mpesa' | 'card' | 'room_charge';
  amount: number;
  reference?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string; // e.g. ORD-1042
  businessId: string;
  businessName: string;
  cashierId: string;
  cashierName: string;
  waiterName?: string;
  shiftId: string;
  createdAt: string;
  items: CartItem[];
  orderType: OrderType;
  tableNumber?: string;
  tableId?: string;
  guestCount?: number;
  roomNumber?: string;
  guestName?: string;
  customerName?: string;
  customerPhone?: string;
  specialNotes?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountPercent: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown?: SplitPaymentDetail[];
  amountTendered?: number;
  changeGiven?: number;
  mpesaRef?: string;
  cardLast4?: string;
  status: 'completed' | 'parked' | 'cancelled' | 'refunded';
  billStatus: BillStatus; // 'unpaid' | 'partially_paid' | 'paid' | 'voided' | 'charged_to_room'
  kitchenStatus?: KitchenStatus;
  roundCount?: number;
  // Offline Resilience & Idempotency
  transactionId?: string; // Unique Local ID / Idempotency Key (e.g. OFF-20260827-0001)
  isOfflineRecord?: boolean;
  syncStatus?: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  offlineSyncTimestamp?: string;
}

export interface TableOrderRound {
  roundNumber: number;
  createdAt: string;
  items: CartItem[];
  waiterName: string;
}

export interface TableInfo {
  id: string;
  name: string;
  section: 'Main Hall' | 'VIP Lounge' | 'Terrace' | 'Bar Area';
  seats: number;
  status: TableStatus;
  activeOrderId?: string;
  activeOrderTotal?: number;
  activeGuests?: number;
  assignedWaiter?: string;
  openedAt?: string;
  rounds?: TableOrderRound[];
  activeItems?: CartItem[];
  specialInstructions?: string;
  billRequestedAt?: string;
  paidAt?: string;
}

export interface HotelRoomInfo {
  id: string;
  roomNumber: string;
  type: 'Deluxe' | 'Executive Suite' | 'Standard' | 'Penthouse';
  guestName: string;
  guestPhone: string;
  status: 'occupied' | 'vacant' | 'cleaning';
  checkInDate: string;
  checkOutDate: string;
  folioBalance: number;
}

export interface KdsTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  tableOrRoom?: string;
  orderType: OrderType;
  serverName: string;
  roundNumber?: number;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    notes?: string;
    modifiers?: string[];
  }[];
  status: KitchenStatus;
  elapsedMinutes: number;
}

export interface WaiterReadyNotification {
  id: string;
  ticketId: string;
  tableOrRoom: string;
  orderNumber: string;
  waiterName: string;
  readyTime: string;
  itemsSummary: string;
  acknowledged: boolean;
}

export type PrinterConnectionType =
  | 'wifi_ip'
  | 'airprint_mopria'
  | 'rawbt_android'
  | 'bluetooth_escpos'
  | 'epson_epos';

export type PrinterPaperSize = '80mm' | '58mm';

export interface WifiPrinterConfig {
  enabled: boolean;
  name: string;
  connectionType: PrinterConnectionType;
  ipAddress: string; // e.g. 192.168.1.100 or 192.168.0.87
  port: number; // default 9100 (standard raw socket) or 8008 (epos)
  paperSize: PrinterPaperSize;
  autoPrintReceipt: boolean;
  autoPrintKitchenTicket: boolean;
  openCashDrawerOnCash: boolean;
  cutPaper: boolean;
  copies: number;
  kitchenPrinterIp: string;
  kitchenPrinterPort: number;
  kitchenPrinterEnabled: boolean;
  lastConnectedAt?: string;
  status: 'connected' | 'idle' | 'printing' | 'error';
}
