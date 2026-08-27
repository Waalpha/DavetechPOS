import React, { useState } from 'react';
import {
  Printer,
  Share2,
  CheckCircle2,
  Copy,
  Check,
  X,
  PlusCircle,
  QrCode,
  Store,
  Phone,
  Mail,
  Send,
  Wifi,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';

export const ReceiptModal: React.FC = () => {
  const {
    showReceiptModal,
    setShowReceiptModal,
    lastCompletedOrder,
    currentBusiness,
    currencySymbol,
    printerConfig,
    setShowWifiPrinterModal,
    printReceiptToWifi,
  } = usePOS();

  const [copied, setCopied] = useState(false);
  const [digitalPhone, setDigitalPhone] = useState('');
  const [sentSms, setSentSms] = useState(false);
  const [wifiPrinting, setWifiPrinting] = useState(false);
  const [wifiPrintStatus, setWifiPrintStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!showReceiptModal || !lastCompletedOrder) return null;

  const order = lastCompletedOrder;
  const orderDate = new Date(order.createdAt).toLocaleString();

  // Print receipt via browser dialog / AirPrint
  const handleBrowserPrint = () => {
    soundFx.playClick();
    window.print();
  };

  // Direct Wi-Fi Thermal Print (ESC/POS)
  const handleWifiPrint = async () => {
    soundFx.playClick();
    setWifiPrinting(true);
    setWifiPrintStatus(null);
    try {
      const res = await printReceiptToWifi(order);
      setWifiPrintStatus(res);
      if (res.success) {
        soundFx.playSuccess();
      } else {
        soundFx.playError();
      }
    } catch {
      setWifiPrintStatus({ success: false, message: 'Print command failed' });
      soundFx.playError();
    } finally {
      setWifiPrinting(false);
    }
  };

  // Generate clean plaintext receipt for SMS / WhatsApp
  const generateReceiptText = () => {
    let txt = `==============================\n`;
    txt += `${currentBusiness.name.toUpperCase()}\n`;
    txt += `${currentBusiness.tagline}\n`;
    txt += `Tel: ${currentBusiness.phone}\n`;
    txt += `PIN: ${currentBusiness.taxNumber}\n`;
    txt += `==============================\n`;
    txt += `Order #: ${order.orderNumber}\n`;
    txt += `Date: ${orderDate}\n`;
    txt += `Cashier: ${order.cashierName}\n`;
    if (order.tableNumber) txt += `Table: ${order.tableNumber}\n`;
    if (order.roomNumber) txt += `Room: ${order.roomNumber} (${order.guestName})\n`;
    txt += `------------------------------\n`;
    order.items.forEach((item) => {
      txt += `${item.quantity}x ${item.product.name} @ ${currencySymbol} ${item.unitPrice}\n`;
      txt += `   = ${currencySymbol} ${item.totalPrice}\n`;
    });
    txt += `------------------------------\n`;
    txt += `Subtotal: ${currencySymbol} ${order.subtotal}\n`;
    txt += `VAT (16%): ${currencySymbol} ${order.taxAmount}\n`;
    if (order.discountAmount > 0) {
      txt += `Discount: -${currencySymbol} ${order.discountAmount}\n`;
    }
    txt += `TOTAL DUE: ${currencySymbol} ${order.totalAmount}\n`;
    txt += `Payment: ${order.paymentMethod.toUpperCase()}`;
    if (order.mpesaRef) txt += ` (Ref: ${order.mpesaRef})`;
    if (order.cardLast4) txt += ` (Card: •••• ${order.cardLast4})`;
    if (order.amountTendered) {
      txt += `\nTendered: ${currencySymbol} ${order.amountTendered}`;
      txt += `\nChange: ${currencySymbol} ${order.changeGiven}`;
    }
    txt += `\n==============================\n`;
    txt += `${currentBusiness.receiptFooter}\n`;
    txt += `Powered by Davetech POS Cloud\n`;
    return txt;
  };

  const handleCopyDigital = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(generateReceiptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    soundFx.playClick();
    const encoded = encodeURIComponent(generateReceiptText());
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playSuccess();
    setSentSms(true);
    setTimeout(() => setSentSms(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-none">
                Sale Completed Successfully
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Receipt generated for {order.orderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowReceiptModal(false)}
            className="p-1.5 rounded-lg bg-slate-200/70 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Receipt Preview & Digital Actions */}
        <div className="p-4 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Thermal Receipt Paper (80mm preview) */}
          <div className="md:col-span-7 flex justify-center">
            <div
              id="printable-receipt"
              className="w-full max-w-[340px] bg-white text-slate-900 p-5 rounded-2xl shadow-lg font-mono text-[11px] leading-tight border border-slate-300"
            >
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-slate-300">
                <h2 className="font-black text-sm tracking-tight text-slate-950 uppercase">
                  {currentBusiness.name}
                </h2>
                <p className="text-[10px] text-slate-600 leading-none">{currentBusiness.tagline}</p>
                <p className="text-[10px] text-slate-600">{currentBusiness.address}</p>
                <p className="text-[10px] text-slate-600">Tel: {currentBusiness.phone}</p>
                <p className="text-[10px] text-slate-700 font-bold">PIN: {currentBusiness.taxNumber}</p>
              </div>

              {/* Order Metadata */}
              <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300 text-[10px]">
                <div className="flex justify-between">
                  <span>RECEIPT NO:</span>
                  <strong className="text-slate-950 font-bold">{order.orderNumber}</strong>
                </div>
                {order.transactionId && (
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>TXN UUID:</span>
                    <span>{order.transactionId}</span>
                  </div>
                )}
                {order.isOfflineRecord && (
                  <div className="p-1 my-1 bg-amber-100 border border-amber-300 text-amber-900 font-bold text-center rounded text-[9px] uppercase tracking-wider">
                    Offline Transaction • Saved Locally ({order.syncStatus === 'SYNCED' ? 'Synced' : 'Pending Cloud Sync'})
                  </div>
                )}
                <div className="flex justify-between">
                  <span>DATE & TIME:</span>
                  <span>{orderDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{order.cashierName}</span>
                </div>
                {order.tableNumber && (
                  <div className="flex justify-between">
                    <span>TABLE / DINE:</span>
                    <strong className="text-slate-950">{order.tableNumber}</strong>
                  </div>
                )}
                {order.roomNumber && (
                  <div className="flex justify-between">
                    <span>HOTEL ROOM:</span>
                    <strong className="text-slate-950">
                      Room {order.roomNumber} ({order.guestName})
                    </strong>
                  </div>
                )}
                {order.customerName && (
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span>{order.customerName}</span>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div className="py-2.5 space-y-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-[10px] text-slate-700 pb-1 border-b border-slate-200">
                  <span>QTY & ITEM</span>
                  <span>AMOUNT</span>
                </div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between text-slate-900 font-medium">
                      <span className="truncate pr-2">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-bold shrink-0">
                        {currencySymbol} {item.totalPrice.toLocaleString()}
                      </span>
                    </div>
                    {item.selectedModifiers.length > 0 && (
                      <div className="text-[9px] text-slate-500 pl-3">
                        {item.selectedModifiers.map((m) => m.selectedOption).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals & Tax */}
              <div className="py-2.5 space-y-1 border-b-2 border-dashed border-slate-300 text-[10px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Excl. Tax</span>
                  <span>
                    {currencySymbol} {order.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>VAT (16%) Included</span>
                  <span>
                    {currencySymbol} {order.taxAmount.toLocaleString()}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount ({order.discountPercent}%)</span>
                    <span>
                      -{currencySymbol} {order.discountAmount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="pt-1.5 flex justify-between text-xs font-black text-slate-950">
                  <span>TOTAL PAID</span>
                  <span className="text-sm">
                    {currencySymbol} {order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-2 space-y-0.5 text-[10px] border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>PAYMENT METHOD:</span>
                  <span className="font-bold uppercase text-slate-950">
                    {order.paymentMethod.replace('_', ' ')}
                  </span>
                </div>
                {order.mpesaRef && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>M-PESA REF:</span>
                    <span>{order.mpesaRef}</span>
                  </div>
                )}
                {order.cardLast4 && (
                  <div className="flex justify-between">
                    <span>CARD NUMBER:</span>
                    <span>•••• {order.cardLast4}</span>
                  </div>
                )}
                {order.amountTendered !== undefined && (
                  <>
                    <div className="flex justify-between">
                      <span>CASH TENDERED:</span>
                      <span>
                        {currencySymbol} {order.amountTendered.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>CHANGE RETURNED:</span>
                      <span>
                        {currencySymbol} {order.changeGiven?.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Barcode & Footer */}
              <div className="pt-3 text-center space-y-2">
                <div className="font-mono text-[9px] tracking-widest text-slate-500">
                  * {order.orderNumber} *
                </div>
                <p className="text-[9px] text-slate-600 italic leading-tight">
                  {currentBusiness.receiptFooter}
                </p>
                <div className="text-[8px] text-slate-400 uppercase tracking-wider">
                  Powered by Davetech Cloud POS
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Panel: Thermal Print, Wi-Fi Print, Digital SMS/WhatsApp */}
          <div className="md:col-span-5 space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Print & Share
                </h4>
                <button
                  type="button"
                  onClick={() => setShowWifiPrinterModal(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Wifi className="w-3 h-3" />
                  <span>{printerConfig.ipAddress}</span>
                </button>
              </div>

              {/* Status Alert */}
              {wifiPrintStatus && (
                <div
                  className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                    wifiPrintStatus.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {wifiPrintStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="truncate">{wifiPrintStatus.message}</span>
                </div>
              )}

              {/* Primary Wi-Fi Thermal Print Button */}
              <button
                onClick={handleWifiPrint}
                disabled={wifiPrinting}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                id="btn-wifi-print-receipt"
              >
                <Wifi className="w-4 h-4" />
                <span>{wifiPrinting ? 'SENDING TO WI-FI PRINTER...' : 'PRINT OVER WI-FI (ESC/POS)'}</span>
              </button>

              {/* Native System Print / AirPrint */}
              <button
                onClick={handleBrowserPrint}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-300 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="btn-print-receipt"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>System Print / AirPrint Dialog</span>
              </button>

              {/* WhatsApp Share Button */}
              <button
                onClick={handleSendWhatsApp}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="btn-whatsapp-receipt"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>

              {/* Copy Plaintext Digital Receipt */}
              <button
                onClick={handleCopyDigital}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Receipt Plaintext'}</span>
              </button>

              {/* Digital SMS Form */}
              <form onSubmit={handleSendSms} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Send Digital SMS E-Receipt
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={digitalPhone}
                    onChange={(e) => setDigitalPhone(e.target.value)}
                    placeholder="07XX XXX XXX"
                    className="flex-1 px-3 py-1.5 bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
                {sentSms && (
                  <p className="text-[10px] text-emerald-700 font-bold">
                    ✓ E-Receipt dispatched successfully!
                  </p>
                )}
              </form>
            </div>

            {/* NEW SALE BIG BUTTON */}
            <button
              onClick={() => setShowReceiptModal(false)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer"
              id="btn-next-sale"
            >
              <PlusCircle className="w-5 h-5" />
              <span>START NEXT SALE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
