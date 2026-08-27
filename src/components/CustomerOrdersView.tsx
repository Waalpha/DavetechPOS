import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Receipt,
  CreditCard,
  Trash2,
  Edit,
  Printer,
  CheckCircle2,
  Calendar,
  User,
  Utensils,
  ShoppingBag,
  Truck,
  BedDouble,
  Wine,
  Filter,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { OrderRecord, OrderType } from '../types/pos';
import { soundFx } from '../utils/audio';

interface CustomerOrdersViewProps {
  onOpenCheckout?: () => void;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({ onOpenCheckout }) => {
  const {
    activeUnpaidOrders,
    orderHistory,
    currentCashier,
    isManager,
    openBillForActiveOrder,
    openPaymentForActiveOrder,
    resumeActiveOrder,
    cancelActiveOrder,
    reprintReceipt,
    currencySymbol,
    setCurrentView,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<'active_unpaid' | 'completed_today'>('active_unpaid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderRecord | null>(null);

  // Filter today's completed orders (for cashiers, this is where they reprint receipts for today's orders)
  const todayOrders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return orderHistory.filter((ord) => {
      const orderDate = ord.createdAt ? ord.createdAt.split('T')[0] : '';
      return orderDate === today && ord.status === 'completed';
    });
  }, [orderHistory]);

  const filteredActiveOrders = useMemo(() => {
    return activeUnpaidOrders.filter((ord) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = ord.orderNumber.toLowerCase().includes(q);
        const matchesCust = ord.customerName?.toLowerCase().includes(q);
        const matchesTbl = ord.tableNumber?.toLowerCase().includes(q);
        const matchesRm = ord.roomNumber?.toLowerCase().includes(q);
        const matchesItems = ord.items.some((i) => i.product.name.toLowerCase().includes(q));
        if (!matchesNum && !matchesCust && !matchesTbl && !matchesRm && !matchesItems) {
          return false;
        }
      }

      // 2. Type Filter
      if (filterType !== 'all' && ord.orderType !== filterType) {
        return false;
      }

      return true;
    });
  }, [activeUnpaidOrders, searchQuery, filterType]);

  const filteredTodayOrders = useMemo(() => {
    return todayOrders.filter((ord) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = ord.orderNumber.toLowerCase().includes(q);
        const matchesCust = ord.customerName?.toLowerCase().includes(q);
        const matchesTbl = ord.tableNumber?.toLowerCase().includes(q);
        const matchesRm = ord.roomNumber?.toLowerCase().includes(q);
        const matchesCashier = ord.cashierName?.toLowerCase().includes(q);
        const matchesItems = ord.items.some((i) => i.product.name.toLowerCase().includes(q));
        if (!matchesNum && !matchesCust && !matchesTbl && !matchesRm && !matchesCashier && !matchesItems) {
          return false;
        }
      }

      // 2. Type Filter
      if (filterType !== 'all' && ord.orderType !== filterType) {
        return false;
      }

      return true;
    });
  }, [todayOrders, searchQuery, filterType]);

  const getOrderTypeBadge = (type: OrderType) => {
    switch (type) {
      case 'dine_in':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
            <Utensils className="w-3 h-3" /> Dine-In
          </span>
        );
      case 'takeaway':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
            <ShoppingBag className="w-3 h-3" /> Takeaway
          </span>
        );
      case 'delivery':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
            <Truck className="w-3 h-3" /> Delivery
          </span>
        );
      case 'room_service':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
            <BedDouble className="w-3 h-3" /> Room Service
          </span>
        );
      case 'quick_bar':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
            <Wine className="w-3 h-3" /> Bar Tab
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 p-3 sm:p-5 overflow-hidden select-none" id="customer-orders-view">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 bg-white p-4 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-black">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Customer Orders & Receipts
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Manage active unpaid orders, print customer bills, and reprint customer receipts
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Active Unpaid vs Completed Today */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('active_unpaid');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'active_unpaid'
                ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            id="tab-btn-unpaid"
          >
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Active Unpaid Orders</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
              {activeUnpaidOrders.length}
            </span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('completed_today');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'completed_today'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            id="tab-btn-today-receipts"
          >
            <Receipt className="w-4 h-4 text-slate-600" />
            <span>Today's Receipts</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
              {todayOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 my-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, table, customer name, or item..."
            className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-xs"
          />
        </div>

        {/* Order Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'dine_in', 'takeaway', 'delivery', 'room_service', 'quick_bar'].map((type) => (
            <button
              key={type}
              onClick={() => {
                soundFx.playClick();
                setFilterType(type);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                filterType === type
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'all'
                ? 'All Types'
                : type === 'dine_in'
                ? 'Dine-In'
                : type === 'takeaway'
                ? 'Takeaway'
                : type === 'delivery'
                ? 'Delivery'
                : type === 'room_service'
                ? 'Room Serv'
                : 'Bar Tab'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Content Area */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'active_unpaid' ? (
          /* ACTIVE UNPAID ORDERS LIST */
          filteredActiveOrders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-slate-200 text-slate-400 shadow-xs">
              <Clock className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-extrabold text-slate-700 text-base">No active unpaid orders</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Orders saved on the register ticket will appear here waiting for customer bill generation or payment.
              </p>
              <button
                onClick={() => setCurrentView('pos')}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Go to Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredActiveOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-emerald-500/60 p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <div>
                    {/* Header: Order Number, Badge, and Elapsed Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{ord.orderNumber}</span>
                        {getOrderTypeBadge(ord.orderType)}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        UNPAID
                      </span>
                    </div>

                    {/* Table / Room / Customer info */}
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">
                        {ord.tableNumber
                          ? `Table: ${ord.tableNumber}`
                          : ord.roomNumber
                          ? `Room ${ord.roomNumber} (${ord.guestName || 'Guest'})`
                          : ord.customerName || 'Walk-in Customer'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="mt-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 max-h-32 overflow-y-auto">
                      {ord.items.map((i, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
                          <span className="font-semibold truncate">
                            {i.quantity}x {i.product.name}
                          </span>
                          <span className="font-bold text-slate-900 shrink-0 ml-2">
                            {currencySymbol} {i.totalPrice.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total Amount Due */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase">Total Due:</span>
                      <span className="text-lg font-black text-emerald-700">
                        {currencySymbol} {ord.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Cashier Order Actions */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* [ CUSTOMER BILL ] */}
                      <button
                        onClick={() => openBillForActiveOrder(ord)}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Print pro-forma bill for customer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-amber-400" />
                        <span>Customer Bill</span>
                      </button>

                      {/* [ PAY NOW ] */}
                      <button
                        onClick={() => {
                          openPaymentForActiveOrder(ord);
                          onOpenCheckout();
                        }}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Record Cash, M-Pesa or Card payment"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Now</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          resumeActiveOrder(ord.id);
                          setCurrentView('pos');
                        }}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit Items</span>
                      </button>

                      <button
                        onClick={() => cancelActiveOrder(ord.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Void / Cancel order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* TODAY'S COMPLETED ORDERS (FOR REPRINTING RECEIPTS) */
          filteredTodayOrders.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-slate-200 text-slate-400 shadow-xs">
              <Receipt className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-extrabold text-slate-700 text-base">No completed receipts found for today</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Completed paid orders recorded by cashiers today will appear here for receipt reprinting and audits.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredTodayOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 p-4 flex flex-col justify-between shadow-xs transition-all space-y-3"
                >
                  <div>
                    {/* Header: Order Number, Badge, and Timestamp */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{ord.orderNumber}</span>
                        {getOrderTypeBadge(ord.orderType)}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                        PAID • {ord.paymentMethod.toUpperCase()}
                      </span>
                    </div>

                    {/* Customer & Cashier info */}
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        {ord.tableNumber
                          ? `Table: ${ord.tableNumber}`
                          : ord.roomNumber
                          ? `Room ${ord.roomNumber}`
                          : ord.customerName || 'Customer'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Cashier: <span className="font-semibold text-slate-700">{ord.cashierName}</span>
                    </div>

                    {/* Items snippet */}
                    <div className="mt-2 p-2 bg-slate-50 rounded-xl text-xs text-slate-600">
                      <p className="line-clamp-2">
                        {ord.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                      </p>
                    </div>

                    {/* Total Amount Paid */}
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase">Paid Total:</span>
                      <span className="text-base font-black text-slate-900">
                        {currencySymbol} {ord.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Reprint Action Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        reprintReceipt(ord);
                      }}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      id={`btn-reprint-receipt-${ord.id}`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>REPRINT RECEIPT</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
