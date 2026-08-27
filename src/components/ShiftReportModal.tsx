import React, { useState } from 'react';
import {
  Receipt,
  Printer,
  X,
  Coins,
  DollarSign,
  Smartphone,
  CreditCard,
  BedDouble,
  MinusCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';

export const ShiftReportModal: React.FC = () => {
  const {
    showShiftReportModal,
    setShowShiftReportModal,
    activeShift,
    endShift,
    addCashDrop,
    currentBusiness,
    currencySymbol,
  } = usePOS();

  const [closingCashInput, setClosingCashInput] = useState<string>('');
  const [cashDropAmount, setCashDropAmount] = useState<string>('');
  const [cashDropReason, setCashDropReason] = useState<string>('');
  const [showDropForm, setShowDropForm] = useState(false);
  const [closedSummary, setClosedSummary] = useState<any | null>(null);

  if (!showShiftReportModal) return null;

  const handlePrintZReport = () => {
    soundFx.playClick();
    window.print();
  };

  const handleAddDrop = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(cashDropAmount) || 0;
    if (amt <= 0 || !cashDropReason) return;
    addCashDrop(amt, cashDropReason);
    setCashDropAmount('');
    setCashDropReason('');
    setShowDropForm(false);
  };

  const handleCloseShift = () => {
    const actualCash = parseFloat(closingCashInput) || (activeShift ? activeShift.openingFloat + activeShift.cashSales : 0);
    const summary = endShift(actualCash);
    setClosedSummary(summary);
  };

  const totalDrops = activeShift?.cashDrops.reduce((sum, d) => sum + d.amount, 0) || 0;
  const expectedCashInDrawer = (activeShift?.openingFloat || 0) + (activeShift?.cashSales || 0) - totalDrops;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-none">
                Shift & Daily Collections Z-Report
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeShift ? `Active Shift: ${activeShift.cashierName}` : 'Shift Report Summary'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowShiftReportModal(false);
              setClosedSummary(null);
            }}
            className="p-1.5 rounded-lg bg-slate-200/70 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeShift && !closedSummary ? (
            <>
              {/* Meta bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[10px]">Cashier On Duty</span>
                  <strong className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    {activeShift.cashierName}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[10px]">Shift Started</span>
                  <strong className="text-slate-900 font-bold flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block text-[10px]">Opening Float</span>
                  <strong className="text-emerald-700 font-bold text-sm">
                    {currencySymbol} {activeShift.openingFloat.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Collections by Payment Method */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Collections Breakdown by Method
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold mb-1">
                      <Coins className="w-4 h-4 text-emerald-600" /> Cash Sales
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {currencySymbol} {activeShift.cashSales.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-teal-800 font-semibold mb-1">
                      <Smartphone className="w-4 h-4 text-teal-600" /> M-Pesa Sales
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {currencySymbol} {activeShift.mpesaSales.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-indigo-800 font-semibold mb-1">
                      <CreditCard className="w-4 h-4 text-indigo-600" /> Card Sales
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {currencySymbol} {activeShift.cardSales.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
                    <div className="flex items-center gap-1.5 text-[11px] text-purple-800 font-semibold mb-1">
                      <BedDouble className="w-4 h-4 text-purple-600" /> Room Charges
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {currencySymbol} {activeShift.roomSales.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Gross Sales & Expected Cash */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Shift Gross Sales:</span>
                  <span className="text-base font-black text-emerald-700">
                    {currencySymbol} {activeShift.totalSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cash Drops / Petty Cash Paid Out:</span>
                  <span className="font-semibold text-rose-600">
                    - {currencySymbol} {totalDrops.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                  <span className="font-bold text-slate-900">Expected Cash in Drawer:</span>
                  <span className="font-black text-amber-700 text-base">
                    {currencySymbol} {expectedCashInDrawer.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Cash Drop Management */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Cash Drops & Expenses ({activeShift.cashDrops.length})
                  </span>
                  <button
                    onClick={() => setShowDropForm(!showDropForm)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Cash Drop / Payout</span>
                  </button>
                </div>

                {showDropForm && (
                  <form onSubmit={handleAddDrop} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={cashDropAmount}
                        onChange={(e) => setCashDropAmount(e.target.value)}
                        placeholder="Amount (KSh)"
                        className="px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                        required
                      />
                      <input
                        type="text"
                        value={cashDropReason}
                        onChange={(e) => setCashDropReason(e.target.value)}
                        placeholder="Reason (e.g. Milk delivery, Ice, Float drop)"
                        className="px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Record Drop
                    </button>
                  </form>
                )}
              </div>

              {/* End Shift Drawer Reconciliation */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-rose-900 text-xs uppercase tracking-wider">
                  End Shift & Drawer Close
                </h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={closingCashInput}
                    onChange={(e) => setClosingCashInput(e.target.value)}
                    placeholder={`Counted Cash (Expected ${expectedCashInDrawer})`}
                    className="flex-1 px-3.5 py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
                  />
                  <button
                    onClick={handleCloseShift}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                    id="btn-close-shift"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CLOSE & PRINT Z-REPORT</span>
                  </button>
                </div>
              </div>
            </>
          ) : closedSummary ? (
            /* Shift Closed Confirmation */
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Shift Closed & Reconciled</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cashier: {closedSummary.cashierName} • Total Shift Sales: {currencySymbol} {closedSummary.totalSales.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Cash Sales:</span>
                  <span className="font-bold text-slate-900">{currencySymbol} {closedSummary.cashSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total M-Pesa Sales:</span>
                  <span className="font-bold text-slate-900">{currencySymbol} {closedSummary.mpesaSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Card Sales:</span>
                  <span className="font-bold text-slate-900">{currencySymbol} {closedSummary.cardSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual Counted Cash:</span>
                  <span className="font-bold text-emerald-700">{currencySymbol} {closedSummary.closingCashActual?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={handlePrintZReport}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Z-Report</span>
                </button>
                <button
                  onClick={() => {
                    setShowShiftReportModal(false);
                    setClosedSummary(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No active shift found. Please log in with Cashier PIN to start shift.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
