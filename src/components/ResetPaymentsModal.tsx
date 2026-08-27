import React, { useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  X,
  CheckCircle2,
  Download,
  Trash2,
  Lock,
  DollarSign,
  Receipt,
  Utensils,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';

interface ResetPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResetPaymentsModal: React.FC<ResetPaymentsModalProps> = ({
  isOpen,
  onOpenChange,
  onClose,
  onSuccess,
}) => {
  const {
    orderHistory,
    activeUnpaidOrders,
    tables,
    kdsTickets,
    activeShift,
    currencySymbol,
    resetAllPaymentsAndStartFresh,
    verifyManagerPin,
  } = usePOS();

  const [confirmWord, setConfirmWord] = useState('');
  const [managerPinInput, setManagerPinInput] = useState('');
  const [resetTablesOpt, setResetTablesOpt] = useState(true);
  const [resetShiftsOpt, setResetShiftsOpt] = useState(true);
  const [resetKdsOpt, setResetKdsOpt] = useState(true);
  const [isDone, setIsDone] = useState(false);
  const [clearedSummary, setClearedSummary] = useState<{
    ordersCleared: number;
    tablesReset: number;
    timestamp: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const totalSalesToClear = orderHistory
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOrdersCount = orderHistory.length;
  const occupiedTablesCount = tables.filter((t) => t.status !== 'available').length;

  const handleExportBackup = () => {
    soundFx.playClick();
    if (orderHistory.length === 0) return;
    const headers = ['Order Number', 'Date', 'Type', 'Table/Room', 'Cashier', 'Payment Method', 'Total Amount', 'Status'];
    const rows = orderHistory.map((o) => [
      o.orderNumber,
      o.createdAt,
      o.orderType,
      o.tableNumber || o.roomNumber || 'Direct',
      o.cashierName,
      o.paymentMethod,
      o.totalAmount,
      o.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales-backup-before-reset-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExecuteReset = () => {
    setErrorMsg('');

    // Check confirmation: word must match 'RESET' or valid manager PIN entered
    const isWordValid = confirmWord.trim().toUpperCase() === 'RESET';
    const isPinValid = managerPinInput.trim() !== '' && verifyManagerPin(managerPinInput.trim());

    if (!isWordValid && !isPinValid) {
      soundFx.playError();
      setErrorMsg('Please type "RESET" or enter a valid Manager PIN (e.g. 9999) to confirm.');
      return;
    }

    const summary = resetAllPaymentsAndStartFresh({
      resetTables: resetTablesOpt,
      resetShifts: resetShiftsOpt,
      resetKds: resetKdsOpt,
    });

    setClearedSummary(summary);
    setIsDone(true);
    if (onSuccess) onSuccess();
  };

  const handleClose = () => {
    setConfirmWord('');
    setManagerPinInput('');
    setIsDone(false);
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      id="modal-reset-all-payments"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Reset All Payments & Start Fresh
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Manager Clean Slate Tool & Ledger Re-zeroing
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-rose-200/60 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isDone ? (
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Warning Callout */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-xs">
                  This will permanently clear all recorded sales transactions and reset the ledger to {currencySymbol} 0.00.
                </p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Use this at the start of a fresh business period or after test ordering. Your product catalog, cashier accounts, and printer settings will stay completely safe.
                </p>
              </div>
            </div>

            {/* Metrics Impact Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Data to be Cleared:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Total Sales</div>
                  <div className="font-extrabold text-rose-600 text-xs sm:text-sm mt-0.5">
                    {currencySymbol} {totalSalesToClear.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Ledger Orders</div>
                  <div className="font-extrabold text-slate-800 text-xs sm:text-sm mt-0.5">
                    {totalOrdersCount} Orders
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Active Tables</div>
                  <div className="font-extrabold text-amber-600 text-xs sm:text-sm mt-0.5">
                    {occupiedTablesCount} Busy
                  </div>
                </div>
              </div>
            </div>

            {/* Scope Checklist */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Reset Options:
              </span>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetTablesOpt}
                    onChange={(e) => setResetTablesOpt(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-slate-800 text-xs">
                    Reset open restaurant tables & unpaid bills to Available
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetShiftsOpt}
                    onChange={(e) => setResetShiftsOpt(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-slate-800 text-xs">
                    Reset active cashier shift sales totals & cash drops to 0.00
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetKdsOpt}
                    onChange={(e) => setResetKdsOpt(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-slate-800 text-xs">
                    Clear active Kitchen Display (KDS) order tickets
                  </span>
                </label>
              </div>
            </div>

            {/* Export Backup Option */}
            <div className="pt-1 flex items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-600" />
                <span className="text-[11px] font-bold text-indigo-900">
                  Recommended: Save CSV ledger copy first
                </span>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={orderHistory.length === 0}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-[11px] rounded-lg shadow-xs cursor-pointer"
              >
                Download CSV
              </button>
            </div>

            {/* Security Confirmation Inputs */}
            <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-2.5">
              <label className="font-bold text-rose-950 block text-xs">
                To confirm reset, type <span className="font-mono bg-rose-200/80 px-1.5 py-0.5 rounded text-rose-900 font-extrabold">RESET</span> or enter Manager PIN:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Type 'RESET'
                  </label>
                  <input
                    type="text"
                    placeholder="RESET"
                    value={confirmWord}
                    onChange={(e) => {
                      setConfirmWord(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Or Manager PIN (e.g. 9999)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="PIN"
                    value={managerPinInput}
                    onChange={(e) => {
                      setManagerPinInput(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2 bg-rose-100 text-rose-800 rounded-xl text-[11px] font-bold">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="p-6 text-center space-y-4 text-xs animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">
                Payment Ledger Successfully Reset!
              </h4>
              <p className="text-xs text-slate-600">
                All sales data, transactions, and open tabs have been wiped clean.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 max-w-sm mx-auto text-xs space-y-1">
              <div className="font-extrabold text-emerald-950 text-sm">
                System Status: Fresh Start ({currencySymbol} 0.00)
              </div>
              <div className="text-[11px]">
                {clearedSummary?.ordersCleared || 0} historical orders cleared • {clearedSummary?.tablesReset || 0} tables reset to available.
              </div>
            </div>

            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Back to POS & Register
            </button>
          </div>
        )}

        {/* Action Footer */}
        {!isDone && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteReset}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer"
              id="btn-confirm-reset-all-payments"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Everything & Start Fresh</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
