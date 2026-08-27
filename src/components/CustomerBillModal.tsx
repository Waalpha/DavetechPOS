import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  CreditCard,
  QrCode,
  Receipt,
  Smartphone,
  CheckCircle2,
  Clock,
  User,
  Users,
  Wifi,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { TableInfo, OrderRecord, CartItem } from '../types/pos';
import { soundFx } from '../utils/audio';

interface CustomerBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToPayment: () => void;
}

export const CustomerBillModal: React.FC<CustomerBillModalProps> = ({
  isOpen,
  onClose,
  onProceedToPayment,
}) => {
  const { currentBusiness, activeBillData, currencySymbol, printReceiptToWifi, printerConfig } = usePOS();
  const printRef = useRef<HTMLDivElement>(null);
  const [wifiPrinting, setWifiPrinting] = useState(false);
  const [wifiStatus, setWifiStatus] = useState<string | null>(null);

  if (!isOpen || !activeBillData) return null;

  // Normalize data whether activeBillData is a TableInfo or an OrderRecord
  const isTable = 'seats' in activeBillData;
  const tableData = isTable ? (activeBillData as TableInfo) : null;
  const orderData = !isTable ? (activeBillData as OrderRecord) : null;

  const billNumber = orderData
    ? orderData.orderNumber
    : `BILL-${tableData?.name?.replace(/\s+/g, '').toUpperCase() || '101'}-${Math.floor(100 + Math.random() * 900)}`;

  const items: CartItem[] = isTable
    ? tableData?.activeItems || []
    : orderData?.items || [];

  const rawSubtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const taxRate = currentBusiness.taxRate || 0.16;
  const taxableBase = rawSubtotal / (1 + taxRate);
  const taxAmount = rawSubtotal - taxableBase;
  const totalDue = rawSubtotal;

  const destinationName = isTable
    ? tableData?.name
    : orderData?.tableNumber || (orderData?.roomNumber ? `Room ${orderData.roomNumber}` : 'Customer Tab');

  const waiterName = isTable
    ? tableData?.assignedWaiter || 'Sarah Jenkins'
    : orderData?.waiterName || orderData?.cashierName || 'Sarah Jenkins';

  const guestCount = isTable ? tableData?.activeGuests || 2 : orderData?.guestCount;

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  const handleWifiPrintBill = async () => {
    soundFx.playClick();
    setWifiPrinting(true);
    setWifiStatus(null);
    try {
      const mockOrderRecord: OrderRecord = {
        id: `bill-${Date.now()}`,
        orderNumber: billNumber,
        businessId: currentBusiness.id,
        businessName: currentBusiness.name,
        cashierId: 'c-1',
        cashierName: waiterName,
        waiterName: waiterName,
        shiftId: 'shift-1',
        createdAt: new Date().toISOString(),
        items: items,
        orderType: isTable ? 'dine_in' : 'takeaway',
        tableNumber: destinationName,
        guestCount: guestCount,
        subtotal: taxableBase,
        taxAmount: taxAmount,
        discountAmount: 0,
        discountPercent: 0,
        totalAmount: totalDue,
        paymentMethod: 'cash',
        status: 'parked',
        billStatus: 'unpaid',
      };
      const res = await printReceiptToWifi(mockOrderRecord);
      setWifiStatus(res.message);
      if (res.success) soundFx.playSuccess();
      else soundFx.playError();
    } catch {
      setWifiStatus('Failed to send bill to Wi-Fi printer');
      soundFx.playError();
    } finally {
      setWifiPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Pro-Forma Customer Bill
              </h3>
              <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> Status: UNPAID (Awaiting Settlement)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Printable Bill Section */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
          <div
            ref={printRef}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 font-mono text-slate-800 printable-bill"
            id="customer-bill-paper"
          >
            {/* Header / Business Info */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-black text-slate-900 text-base sm:text-lg uppercase tracking-tight">
                {currentBusiness.name}
              </h2>
              <p className="text-xs text-slate-500 italic">{currentBusiness.tagline}</p>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                <p>{currentBusiness.address}</p>
                <p>Tel: {currentBusiness.phone} • Email: {currentBusiness.email}</p>
                <p className="font-bold text-slate-700">KRA PIN: {currentBusiness.taxNumber}</p>
              </div>
            </div>

            {/* Bill Meta Details */}
            <div className="text-xs space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bill Number:</span>
                <span className="font-black text-slate-900">{billNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Table / Location:</span>
                <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {destinationName}
                </span>
              </div>
              {guestCount && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Guests:</span>
                  <span className="font-bold text-slate-800">{guestCount} Guests</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Waiter / Server:</span>
                <span className="font-bold text-slate-800">{waiterName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="text-slate-700">
                  {new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-bold">BILL STATUS:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                  UNPAID / PRO-FORMA
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-400 pb-1">
                <span>Item & Details</span>
                <span>Amount ({currencySymbol})</span>
              </div>

              {items.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-3 italic">
                  No items ordered yet on this ticket.
                </p>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="text-xs space-y-0.5">
                    <div className="flex items-start justify-between font-bold text-slate-900">
                      <span className="flex-1 pr-2">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="shrink-0">
                        {item.totalPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* Modifiers */}
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <p className="text-[10px] text-slate-500 pl-3">
                        + {item.selectedModifiers.map((m) => `${m.selectedOption}`).join(', ')}
                      </p>
                    )}

                    {/* Kitchen notes */}
                    {item.itemNotes && (
                      <p className="text-[10px] text-amber-700 italic pl-3">
                        &ldquo;{item.itemNotes}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs pb-3 border-b border-dashed border-slate-300">
              <div className="flex items-center justify-between text-slate-600">
                <span>Net Subtotal (Excl. VAT):</span>
                <span>{currencySymbol} {taxableBase.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>VAT (16% Included):</span>
                <span>{currencySymbol} {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL AMOUNT DUE:</span>
                <span className="text-emerald-700 text-lg">
                  {currencySymbol} {totalDue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* M-PESA PAYMENT INSTRUCTIONS BOX */}
            <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-2 text-emerald-950 font-sans">
              <div className="flex items-center justify-between">
                <span className="font-black flex items-center gap-1.5 text-emerald-900 text-xs">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  M-PESA PAYMENT DETAILS
                </span>
                <span className="text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                  {currentBusiness.mpesaType === 'paybill' ? 'Paybill' : 'Buy Goods Till'}
                </span>
              </div>

              {currentBusiness.mpesaType === 'paybill' ? (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-800">Business / Paybill No:</span>
                    <span className="font-black text-sm tracking-wider text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300">
                      {currentBusiness.mpesaPaybillNumber || '247247'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-800">Account No:</span>
                    <span className="font-extrabold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300">
                      {destinationName}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800">Buy Goods Till No:</span>
                  <span className="font-black text-sm tracking-wider text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {currentBusiness.mpesaTillNumber || '893421'}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-emerald-200/80 text-[11px] text-slate-500 font-mono">
                Payment Ref: _____________________________
              </div>
            </div>

            {/* Bill Footer Notice */}
            <div className="text-center text-[10px] text-slate-400 pt-1 space-y-1">
              <p>THIS IS NOT A TAX INVOICE. A FISCAL RECEIPT WILL BE ISSUED UPON PAYMENT.</p>
              <p>{currentBusiness.receiptFooter}</p>
            </div>
          </div>
        </div>

        {/* Wi-Fi Status Banner */}
        {wifiStatus && (
          <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 text-[11px] font-bold text-indigo-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-indigo-600" />
              <span>{wifiStatus}</span>
            </span>
          </div>
        )}

        {/* Modal Action Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleWifiPrintBill}
              disabled={wifiPrinting}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Wifi className="w-4 h-4" />
              <span>{wifiPrinting ? 'Sending...' : 'Wi-Fi Print'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>System (80mm)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <button
            onClick={() => {
              onProceedToPayment();
            }}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>PAY / RECORD PAYMENT ({currencySymbol} {totalDue.toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
