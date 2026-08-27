import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  Utensils,
  Truck,
  BedDouble,
  Wine,
  User,
  PauseCircle,
  X,
  Receipt,
  CreditCard,
  Save,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { OrderType, OrderRecord } from '../types/pos';
import { soundFx } from '../utils/audio';

interface OrderCartProps {
  onOpenCheckout: () => void;
  onOpenTableModal: () => void;
  onOpenRoomModal: () => void;
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

export const OrderCart: React.FC<OrderCartProps> = ({
  onOpenCheckout,
  onOpenTableModal,
  onOpenRoomModal,
  isMobileDrawer = false,
  onCloseMobile,
}) => {
  const {
    cart,
    updateCartQuantity,
    removeCartItem,
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
    currencySymbol,
    openCustomerBill,
    openDirectCartPayment,
  } = usePOS();

  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [discountInput, setDiscountInput] = useState<string>('');
  const [showParkedList, setShowParkedList] = useState<boolean>(false);
  const [showActiveOrdersDrawer, setShowActiveOrdersDrawer] = useState<boolean>(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const orderTypes: { type: OrderType; label: string; icon: React.ReactNode }[] = [
    { type: 'dine_in', label: 'Dine-In', icon: <Utensils className="w-3.5 h-3.5" /> },
    { type: 'takeaway', label: 'Takeaway', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
    { type: 'delivery', label: 'Delivery', icon: <Truck className="w-3.5 h-3.5" /> },
    { type: 'room_service', label: 'Room Serv', icon: <BedDouble className="w-3.5 h-3.5" /> },
    { type: 'quick_bar', label: 'Bar Tab', icon: <Wine className="w-3.5 h-3.5" /> },
  ];

  const handleApplyDiscount = (pct: number) => {
    soundFx.playClick();
    setOrderDiscountPercent(pct);
    setShowDiscountModal(false);
  };

  // 1. SAVE ORDER (Records order as active & unpaid without kitchen requirement)
  const handleSaveOrder = () => {
    if (cart.length === 0) return;
    const saved = saveActiveOrder();
    if (saved) {
      setSaveBanner(`Order ${saved.orderNumber} recorded as ACTIVE (UNPAID)`);
      setTimeout(() => setSaveBanner(null), 4000);
    }
  };

  // 2. CUSTOMER BILL (Opens pro-forma customer bill with amount due & payment info)
  const handleOpenCustomerBill = () => {
    if (cart.length > 0) {
      // Build a pro-forma order record for the current cart to view/print bill
      const taxRate = 0.16;
      const subtotal = cartTotals.total / (1 + taxRate);
      const taxAmount = cartTotals.total - subtotal;
      const tempOrder: OrderRecord = {
        id: `ord-temp-${Date.now()}`,
        orderNumber: `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
        businessId: 'biz-1',
        businessName: 'Davetech POS',
        cashierId: 'c-1',
        cashierName: 'Cashier',
        shiftId: 'shift-live',
        createdAt: new Date().toISOString(),
        items: [...cart],
        orderType: selectedTable ? 'dine_in' : (selectedRoom ? 'room_service' : orderType),
        tableNumber: selectedTable?.name,
        tableId: selectedTable?.id,
        roomNumber: selectedRoom?.roomNumber,
        guestName: selectedRoom?.guestName,
        customerName: customerName || (selectedTable ? selectedTable.name : (selectedRoom ? `Room ${selectedRoom.roomNumber}` : 'Walk-in Customer')),
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        discountAmount: cartTotals.discount,
        discountPercent: orderDiscountPercent,
        totalAmount: cartTotals.total,
        paymentMethod: 'cash',
        status: 'completed',
        billStatus: 'unpaid',
      };
      openCustomerBill(tempOrder);
    } else if (selectedTable && selectedTable.activeItems && selectedTable.activeItems.length > 0) {
      openCustomerBill(selectedTable);
    } else if (activeUnpaidOrders.length > 0) {
      setShowActiveOrdersDrawer(true);
    }
  };

  // 3. PAY / RECORD PAYMENT (Opens Checkout Modal)
  const handlePay = () => {
    if (cart.length === 0) return;
    openDirectCartPayment();
    onOpenCheckout();
  };

  const hasItems = cart.length > 0;

  return (
    <aside
      className={`bg-white border-l border-slate-200 flex flex-col h-full select-none z-10 ${
        isMobileDrawer
          ? 'w-full h-full'
          : 'w-full lg:w-[400px] xl:w-[440px] 2xl:w-[480px] shrink-0 shadow-lg'
      }`}
      id="pos-order-cart-panel"
    >
      {/* 1. Header: Order Context, Active Orders Pill, and Customer Info */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-black">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm leading-tight">
                {selectedTable ? `${selectedTable.name} Order` : 'Cashier Order Ticket'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {selectedTable
                  ? `${selectedTable.section} • ${selectedTable.activeGuests || selectedTable.seats} Guests`
                  : `${cartTotals.itemCount} ${cartTotals.itemCount === 1 ? 'item' : 'items'} in current ticket`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Active Unpaid Orders Counter */}
            {activeUnpaidOrders.length > 0 && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowActiveOrdersDrawer(!showActiveOrdersDrawer);
                  setShowParkedList(false);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-black transition-all shadow-xs cursor-pointer ${
                  showActiveOrdersDrawer
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
                }`}
                id="btn-active-orders-drawer"
                title="View recorded unpaid customer orders"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">{activeUnpaidOrders.length} Unpaid</span>
                <span className="xs:hidden">{activeUnpaidOrders.length}</span>
                {showActiveOrdersDrawer ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
              </button>
            )}

            {/* Held / Parked Orders Counter */}
            {parkedOrders.length > 0 && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowParkedList(!showParkedList);
                  setShowActiveOrdersDrawer(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                id="btn-parked-orders"
                title="View held tickets"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>{parkedOrders.length} Held</span>
              </button>
            )}

            {/* Mobile Drawer Close Button */}
            {onCloseMobile && (
              <button
                onClick={() => {
                  soundFx.playClick();
                  onCloseMobile();
                }}
                className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors ml-1 cursor-pointer"
                title="Close Order Sheet"
                id="btn-close-mobile-cart"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Order Type Selector Pills */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-200/80 rounded-2xl border border-slate-300/60">
          {orderTypes.map((ot) => (
            <button
              key={ot.type}
              type="button"
              onClick={() => {
                soundFx.playClick();
                setOrderType(ot.type);
              }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-extrabold transition-all duration-150 cursor-pointer ${
                orderType === ot.type
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
              id={`ordertype-${ot.type}`}
            >
              {ot.icon}
              <span className="mt-0.5 whitespace-nowrap">{ot.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Context Linking: Table / Room / Customer Name */}
        <div className="flex items-center gap-1.5">
          {/* Table assignment */}
          <button
            onClick={onOpenTableModal}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-between cursor-pointer ${
              selectedTable
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-black'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            id="btn-select-table"
          >
            <span className="truncate">
              {selectedTable ? `Table: ${selectedTable.name}` : '+ Table'}
            </span>
            {selectedTable && (
              <X
                className="w-3.5 h-3.5 text-emerald-700 hover:text-emerald-900 shrink-0 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTable(null);
                }}
              />
            )}
          </button>

          {/* Room assignment */}
          <button
            onClick={onOpenRoomModal}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-between cursor-pointer ${
              selectedRoom
                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-black'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            id="btn-select-room"
          >
            <span className="truncate">
              {selectedRoom ? `Room ${selectedRoom.roomNumber}` : '+ Room'}
            </span>
            {selectedRoom && (
              <X
                className="w-3.5 h-3.5 text-indigo-700 hover:text-indigo-900 shrink-0 ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRoom(null);
                }}
              />
            )}
          </button>

          {/* Customer Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer / Tab..."
              className="w-full pl-6 pr-2 py-1.5 bg-white text-slate-800 placeholder:text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <User className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Success Notification Banner after saving order */}
      {saveBanner && (
        <div className="bg-emerald-600 text-white px-3.5 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{saveBanner}</span>
          </div>
          <button
            onClick={() => setSaveBanner(null)}
            className="p-1 hover:bg-emerald-700 rounded text-emerald-200 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Unpaid Orders Drawer (Find Customer's Recorded Order) */}
      {showActiveOrdersDrawer && (
        <div className="bg-emerald-50/95 border-b border-emerald-200 p-3 space-y-2 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between text-xs font-black text-emerald-950">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-700" />
              Recorded Active Orders (ORDERED • UNPAID)
            </span>
            <button
              onClick={() => setShowActiveOrdersDrawer(false)}
              className="text-emerald-700 hover:text-emerald-900 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {activeUnpaidOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-xs space-y-2"
                id={`active-order-${ord.id}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-900 text-xs">{ord.orderNumber}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                        UNPAID
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-700 mt-0.5">
                      {ord.tableNumber ? `Table: ${ord.tableNumber}` : (ord.roomNumber ? `Room ${ord.roomNumber}` : ord.customerName || 'Walk-in Customer')}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {ord.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Due</span>
                    <span className="font-black text-emerald-700 text-sm">
                      {currencySymbol} {ord.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons for Active Order */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => {
                      openBillForActiveOrder(ord);
                      setShowActiveOrdersDrawer(false);
                    }}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>Customer Bill</span>
                  </button>

                  <button
                    onClick={() => {
                      openPaymentForActiveOrder(ord);
                      onOpenCheckout();
                      setShowActiveOrdersDrawer(false);
                    }}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] rounded-lg flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Now</span>
                  </button>

                  <button
                    onClick={() => {
                      resumeActiveOrder(ord.id);
                      setShowActiveOrdersDrawer(false);
                    }}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer"
                    title="Edit order items"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => cancelActiveOrder(ord.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    title="Void / Cancel order"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Held / Parked Orders Drawer */}
      {showParkedList && (
        <div className="bg-amber-50/90 border-b border-amber-200 p-3 space-y-2 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span>Parked Orders ({parkedOrders.length})</span>
            <button
              onClick={() => setShowParkedList(false)}
              className="text-amber-700 hover:text-amber-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {parkedOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-2 bg-white rounded-xl border border-amber-200 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-extrabold text-slate-900 text-xs">
                    {ord.orderNumber} • {ord.tableNumber || ord.roomNumber || ord.customerName || 'Walk-in'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {ord.items.length} items • {currencySymbol} {ord.totalAmount.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      resumeParkedOrder(ord.id);
                      setShowParkedList(false);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => cancelParkedOrder(ord.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="font-extrabold text-slate-700 text-sm">Ticket is empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                {selectedTable
                  ? `Select items for ${selectedTable.name} and click Save Order or Pay.`
                  : 'Tap menu products to take customer order.'}
              </p>
            </div>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.cartItemId}
              className="p-2.5 bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 flex items-start gap-2.5 shadow-2xs transition-all"
              id={`cart-item-${item.cartItemId}`}
            >
              {/* Product Thumbnail */}
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0 mt-0.5"
              />

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight truncate">
                    {item.product.name}
                  </h4>
                  <button
                    onClick={() => removeCartItem(item.cartItemId)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Modifiers & Notes */}
                {item.selectedModifiers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {item.selectedModifiers.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium"
                      >
                        {m.selectedOption}
                        {m.extraPrice > 0 && ` (+${currencySymbol}${m.extraPrice})`}
                      </span>
                    ))}
                  </div>
                )}
                {item.itemNotes && (
                  <p className="text-[10px] text-amber-700 italic mt-0.5 line-clamp-1">
                    &ldquo;{item.itemNotes}&rdquo;
                  </p>
                )}

                {/* Price & Quantity Stepper */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {currencySymbol} {item.unitPrice.toLocaleString()} ea
                    </span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                      {currencySymbol} {item.totalPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* Tactile Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      onClick={() => updateCartQuantity(item.cartItemId, -1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center font-extrabold transition-colors shadow-2xs cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-black text-xs text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.cartItemId, 1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center font-extrabold transition-colors shadow-2xs cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Cart Summary & Action Buttons */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        {/* Subtotal, Discount & Tax calculation */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Subtotal ({cartTotals.itemCount} items)</span>
            <span className="font-bold text-slate-900">
              {currencySymbol} {cartTotals.subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <button
              onClick={() => setShowDiscountModal(true)}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Discount {orderDiscountPercent > 0 && `(${orderDiscountPercent}%)`}</span>
            </button>
            <span className="font-extrabold text-rose-600">
              {cartTotals.discount > 0
                ? `- ${currencySymbol} ${cartTotals.discount.toLocaleString()}`
                : `${currencySymbol} 0.00`}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>VAT / Tax (16% Incl.)</span>
            <span className="font-bold text-slate-800">
              {currencySymbol} {cartTotals.tax.toLocaleString()}
            </span>
          </div>

          {/* Grand Total */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Total Amount
            </span>
            <span
              className="text-2xl font-black text-emerald-700 tracking-tight"
              id="cart-grand-total"
            >
              {currencySymbol} {cartTotals.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* EXACT CASHIER BUTTON LAYOUT REQUESTED:
            Row 1: [ SAVE ORDER ]     [ CUSTOMER BILL ]
            Row 2: [ HOLD ORDER ]     [ CLEAR ORDER ]
            Row 3: [ PAY / RECORD PAYMENT ]
        */}
        <div className="space-y-2 pt-1">
          {/* Row 1: [ SAVE ORDER ] and [ CUSTOMER BILL ] */}
          <div className="grid grid-cols-2 gap-2">
            {/* [ SAVE ORDER ] Button */}
            <button
              onClick={handleSaveOrder}
              disabled={!hasItems}
              className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              id="btn-save-order"
              title="Save & record order as active unpaid"
            >
              <Save className="w-4 h-4" />
              <span>SAVE ORDER</span>
            </button>

            {/* [ CUSTOMER BILL ] Button */}
            <button
              onClick={handleOpenCustomerBill}
              disabled={!hasItems && activeUnpaidOrders.length === 0 && !selectedTable}
              className="py-3 px-3 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              id="btn-customer-bill"
              title="Generate / Print Customer Pro-Forma Bill"
            >
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>CUSTOMER BILL</span>
            </button>
          </div>

          {/* Row 2: [ HOLD ORDER ] and [ CLEAR ORDER ] */}
          <div className="grid grid-cols-2 gap-2">
            {/* [ HOLD ORDER ] Button */}
            <button
              onClick={parkCurrentOrder}
              disabled={!hasItems}
              className="py-2.5 px-3 bg-white hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 text-amber-900 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              id="btn-hold-order"
              title="Hold current ticket for later"
            >
              <PauseCircle className="w-4 h-4 text-amber-600" />
              <span>HOLD ORDER</span>
            </button>

            {/* [ CLEAR ORDER ] Button */}
            <button
              onClick={clearCart}
              disabled={!hasItems}
              className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 disabled:opacity-40 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              id="btn-clear-order"
              title="Clear current cart"
            >
              <Trash2 className="w-4 h-4" />
              <span>CLEAR ORDER</span>
            </button>
          </div>

          {/* Row 3: [ PAY / RECORD PAYMENT ] */}
          <button
            onClick={handlePay}
            disabled={!hasItems}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-700/20 flex items-center justify-between transition-all cursor-pointer"
            id="btn-pay-record-payment"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span className="tracking-wide">PAY / RECORD PAYMENT</span>
            </div>

            <div className="font-black text-base sm:text-lg">
              {currencySymbol} {cartTotals.total.toLocaleString()}
            </div>
          </button>
        </div>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" /> Apply Order Discount
              </h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[0, 5, 10, 15, 20, 25, 50, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleApplyDiscount(pct)}
                  className={`py-2 rounded-xl font-black text-xs border transition-colors shadow-xs cursor-pointer ${
                    orderDiscountPercent === pct
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pct === 0 ? 'None (0%)' : `${pct}%`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <input
                type="number"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="Custom %"
                className="flex-1 px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none"
              />
              <button
                onClick={() => handleApplyDiscount(parseFloat(discountInput) || 0)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Apply %
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
