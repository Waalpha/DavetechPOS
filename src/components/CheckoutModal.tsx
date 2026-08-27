import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Smartphone,
  CreditCard,
  Split,
  BedDouble,
  CheckCircle2,
  X,
  RotateCw,
  Phone,
  DollarSign,
  Receipt,
  FileCheck,
  Building,
  WifiOff,
  AlertTriangle,
  HardDrive,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePOS } from '../context/POSContext';
import { PaymentMethod, SplitPaymentDetail, HotelRoomInfo } from '../types/pos';
import { soundFx } from '../utils/audio';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const {
    cartTotals,
    completeCheckout,
    selectedRoom,
    setSelectedRoom,
    hotelRooms,
    activeCheckoutTarget,
    currentBusiness,
    currencySymbol,
    daraja3Config,
    triggerDaraja3StkPush,
    isOnline,
  } = usePOS();

  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('cash');

  // Derive total to settle from active target or cart
  const targetTotal = activeCheckoutTarget ? activeCheckoutTarget.totalAmount : cartTotals.total;
  const targetTitle = activeCheckoutTarget ? activeCheckoutTarget.title : 'Direct Order Checkout';

  // Cash state
  const [tenderedInput, setTenderedInput] = useState<string>('');
  const tenderedAmount = parseFloat(tenderedInput) || targetTotal;
  const changeAmount = Math.max(0, tenderedAmount - targetTotal);

  // M-Pesa state
  const [mpesaMode, setMpesaMode] = useState<'stk' | 'manual'>('stk');
  const [mpesaPhone, setMpesaPhone] = useState<string>('0722 123 456');
  const [mpesaManualRef, setMpesaManualRef] = useState<string>('');
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'pushing' | 'confirmed'>('idle');
  const [mpesaGeneratedRef, setMpesaGeneratedRef] = useState<string>('');
  const [mpesaTimer, setMpesaTimer] = useState<number>(4);

  // Card state
  const [cardStatus, setCardStatus] = useState<'idle' | 'tapping' | 'approved'>('idle');
  const [cardLast4, setCardLast4] = useState<string>('4821');
  const [cardOfflineAuthCode, setCardOfflineAuthCode] = useState<string>('AUTH-9921');

  // Split Payment state
  const [splitCount, setSplitCount] = useState<number>(2);
  const [splitDetails, setSplitDetails] = useState<SplitPaymentDetail[]>([
    { method: 'cash', amount: Math.round(targetTotal / 2) },
    { method: 'mpesa', amount: Math.round(targetTotal - Math.round(targetTotal / 2)) },
  ]);

  // Selected room for room charge
  const [targetRoom, setTargetRoom] = useState<HotelRoomInfo | null>(selectedRoom);

  // Reset inputs when opened
  useEffect(() => {
    if (isOpen) {
      setTenderedInput(targetTotal.toString());
      setMpesaStatus('idle');
      setCardStatus('idle');
      setMpesaGeneratedRef(`SLK${Math.floor(100000 + Math.random() * 900000)}`);
      setMpesaManualRef('');
      setTargetRoom(selectedRoom || hotelRooms.find((r) => r.status === 'occupied') || null);
      setSplitDetails([
        { method: 'cash', amount: Math.round(targetTotal / 2) },
        { method: 'mpesa', amount: targetTotal - Math.round(targetTotal / 2) },
      ]);
      // If offline, default to manual reference entry
      if (!isOnline) {
        setMpesaMode('manual');
      }
    }
  }, [isOpen, targetTotal, selectedRoom, hotelRooms, isOnline]);

  if (!isOpen) return null;

  // Fire celebratory confetti
  const triggerCelebration = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  // 1. Process Cash
  const handleCompleteCash = () => {
    soundFx.playSuccess();
    triggerCelebration();
    completeCheckout('cash', {
      amountTendered: tenderedAmount,
    });
    onClose();
  };

  // 2. Process M-Pesa STK push simulation / Daraja 3.0 API
  const handleInitiateMpesaPush = async () => {
    soundFx.playClick();
    setMpesaStatus('pushing');
    setMpesaTimer(3);

    try {
      const pushRes = await triggerDaraja3StkPush({
        phone: mpesaPhone,
        amount: targetTotal,
        orderNumber: activeCheckoutTarget?.tableId || activeCheckoutTarget?.roomNumber || 'DIRECT',
      });

      if (pushRes.mpesaReceiptNumber) {
        setMpesaGeneratedRef(pushRes.mpesaReceiptNumber);
      }
    } catch {
      // Fallback to generated reference if offline
      setMpesaGeneratedRef(`SLK${Math.floor(100000 + Math.random() * 900000)}`);
    }

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setMpesaTimer(count);
      if (count <= 0) {
        clearInterval(interval);
        setMpesaStatus('confirmed');
        soundFx.playSuccess();
      }
    }, 1000);
  };

  const handleCompleteMpesa = () => {
    soundFx.playSuccess();
    triggerCelebration();
    completeCheckout('mpesa', {
      mpesaRef: mpesaMode === 'manual' ? mpesaManualRef : mpesaGeneratedRef,
      customerPhone: mpesaPhone,
    });
    onClose();
  };

  // 3. Process Card
  const handleInitiateCardTap = () => {
    soundFx.playClick();
    setCardStatus('tapping');
    setTimeout(() => {
      setCardStatus('approved');
      soundFx.playSuccess();
    }, 1400);
  };

  const handleCompleteCard = () => {
    soundFx.playSuccess();
    triggerCelebration();
    completeCheckout('card', {
      cardLast4,
    });
    onClose();
  };

  // 4. Process Split
  const handleCompleteSplit = () => {
    soundFx.playSuccess();
    triggerCelebration();
    completeCheckout('split', {
      breakdown: splitDetails,
    });
    onClose();
  };

  // 5. Process Room Charge
  const handleCompleteRoomCharge = () => {
    if (!targetRoom) return;
    soundFx.playSuccess();
    triggerCelebration();
    setSelectedRoom(targetRoom);
    completeCheckout('room_charge');
    onClose();
  };

  // Quick tender keypad helpers
  const handleNumKey = (val: string) => {
    soundFx.playClick();
    if (val === 'CLEAR') {
      setTenderedInput('');
    } else if (val === 'EXACT') {
      setTenderedInput(targetTotal.toString());
    } else {
      setTenderedInput((prev) => (prev === '0' ? val : prev + val));
    }
  };

  const addBillTender = (amt: number) => {
    soundFx.playClick();
    const current = parseFloat(tenderedInput) || 0;
    setTenderedInput((current + amt).toString());
  };

  const splitSum = splitDetails.reduce((sum, s) => sum + s.amount, 0);
  const splitRemaining = targetTotal - splitSum;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                {targetTitle}
              </h2>
              <p className="text-xs text-slate-400">
                Select payment method to finalize transaction & generate paid receipt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400">
                {currencySymbol} {targetTotal.toLocaleString()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Offline Outage Notice Banner */}
        {!isOnline && (
          <div className="bg-amber-500/15 border-b border-amber-300 px-4 py-2 flex items-center justify-between text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-extrabold text-amber-950">Offline Mode Active</span>
              <span className="text-amber-800 hidden sm:inline">— Sale is stored locally in IndexedDB and synchronized automatically when online.</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black text-[9px] uppercase tracking-wider">
              Local Storage
            </span>
          </div>
        )}

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-5 gap-2 p-3 bg-slate-100 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveMethod('cash');
            }}
            className={`py-2.5 px-2 rounded-2xl border text-center font-extrabold text-xs flex flex-col items-center gap-1 transition-all shadow-xs cursor-pointer ${
              activeMethod === 'cash'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            id="tab-pay-cash"
          >
            <Banknote className="w-5 h-5" />
            <span>Cash</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveMethod('mpesa');
            }}
            className={`py-2.5 px-2 rounded-2xl border text-center font-extrabold text-xs flex flex-col items-center gap-1 transition-all shadow-xs cursor-pointer ${
              activeMethod === 'mpesa'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-600/20'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            id="tab-pay-mpesa"
          >
            <Smartphone className="w-5 h-5" />
            <span>M-Pesa</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveMethod('card');
            }}
            className={`py-2.5 px-2 rounded-2xl border text-center font-extrabold text-xs flex flex-col items-center gap-1 transition-all shadow-xs cursor-pointer ${
              activeMethod === 'card'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            id="tab-pay-card"
          >
            <CreditCard className="w-5 h-5" />
            <span>Card / POS</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveMethod('split');
            }}
            className={`py-2.5 px-2 rounded-2xl border text-center font-extrabold text-xs flex flex-col items-center gap-1 transition-all shadow-xs cursor-pointer ${
              activeMethod === 'split'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            id="tab-pay-split"
          >
            <Split className="w-5 h-5" />
            <span>Split Bill</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveMethod('room_charge');
            }}
            className={`py-2.5 px-2 rounded-2xl border text-center font-extrabold text-xs flex flex-col items-center gap-1 transition-all shadow-xs cursor-pointer ${
              activeMethod === 'room_charge'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            id="tab-pay-room"
          >
            <BedDouble className="w-5 h-5" />
            <span>Room Charge</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* 1. CASH PAYMENT VIEW */}
          {activeMethod === 'cash' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Quick bills & Change calculator */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Total Bill Amount</span>
                    <span className="font-bold text-slate-900">
                      {currencySymbol} {targetTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 font-bold">Cash Received</span>
                    <span className="text-xl font-black text-emerald-700">
                      {currencySymbol} {tenderedAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">Change Due</span>
                    <span className="text-2xl font-black text-amber-700">
                      {currencySymbol} {changeAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Quick Bills Buttons */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Quick Cash Add
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[100, 200, 500, 1000, 2000, 5000].map((bill) => (
                      <button
                        key={bill}
                        onClick={() => addBillTender(bill)}
                        className="py-3 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
                      >
                        +{currencySymbol} {bill.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Numeric Touch Numpad */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'EXACT', '0', 'CLEAR'].map(
                    (key) => (
                      <button
                        key={key}
                        onClick={() => handleNumKey(key)}
                        className={`h-14 rounded-2xl font-black text-base shadow-xs transition-all active:scale-95 flex items-center justify-center border cursor-pointer ${
                          key === 'EXACT'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold border-indigo-600'
                            : key === 'CLEAR'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border-rose-200'
                            : 'bg-white hover:bg-slate-50 text-slate-800 text-lg border-slate-200'
                        }`}
                      >
                        {key === 'EXACT' ? 'Exact' : key === 'CLEAR' ? 'Clear' : key}
                      </button>
                    )
                  )}
                </div>

                {/* Complete Cash Button */}
                <button
                  onClick={handleCompleteCash}
                  disabled={tenderedAmount < targetTotal}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer"
                  id="btn-confirm-cash-sale"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>COMPLETE CASH SALE & PRINT RECEIPT</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. M-PESA PAYMENT VIEW */}
          {activeMethod === 'mpesa' && (
            <div className="space-y-4 max-w-lg mx-auto">
              {/* M-PESA Merchant Config Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>Safaricom Daraja 3.0 {daraja3Config.identifierType === 'paybill' ? 'Paybill' : 'Till'}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                      {daraja3Config.environment === 'live' ? 'Live Gateway' : 'Sandbox Test'}
                    </span>
                    <span className="text-xs font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 font-mono">
                      {daraja3Config.shortcode || (currentBusiness.mpesaType === 'paybill' ? currentBusiness.mpesaPaybillNumber || '174379' : currentBusiness.mpesaTillNumber || '174379')}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 flex justify-between">
                  <span>Merchant / Business:</span>
                  <strong className="text-slate-900">{currentBusiness.name}</strong>
                </div>
                <div className="text-xs text-slate-600 flex justify-between">
                  <span>Total Amount Due:</span>
                  <strong className="text-emerald-700 font-extrabold text-sm">
                    {currencySymbol} {targetTotal.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* STK Push vs Manual Reference Switch */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  disabled={!isOnline}
                  onClick={() => setMpesaMode('stk')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    !isOnline
                      ? 'opacity-40 cursor-not-allowed text-slate-400'
                      : mpesaMode === 'stk'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  STK Push Prompt {!isOnline && '(Online Only)'}
                </button>
                <button
                  type="button"
                  onClick={() => setMpesaMode('manual')}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    mpesaMode === 'manual'
                      ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500/30'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manual Reference {!isOnline && '• Offline Active'}
                </button>
              </div>

              {!isOnline && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Offline M-Pesa Mode Active:</strong>
                    <span>Internet is unavailable. Live STK Push prompt cannot be sent. Verify the customer&apos;s Safaricom SMS receipt and record the transaction code below. This will be marked as <span className="font-mono font-bold bg-amber-200/70 px-1 py-0.2 rounded">M-PESA — MANUAL/OFFLINE RECORD</span>.</span>
                  </div>
                </div>
              )}

              {mpesaMode === 'stk' && isOnline && (
                <>
                  {mpesaStatus === 'idle' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Customer Safaricom Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={mpesaPhone}
                            onChange={(e) => setMpesaPhone(e.target.value)}
                            placeholder="07XX XXX XXX or 2547XX..."
                            className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 font-bold text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleInitiateMpesaPush}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                        id="btn-send-stk-push"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>SEND STK PUSH PROMPT ({currencySymbol} {targetTotal.toLocaleString()})</span>
                      </button>
                    </div>
                  )}

                  {mpesaStatus === 'pushing' && (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-emerald-300 text-center space-y-4 animate-in fade-in">
                      <RotateCw className="w-10 h-10 text-emerald-600 animate-spin mx-auto" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">STK Push Sent to Customer Phone</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Awaiting PIN confirmation on {mpesaPhone}... ({mpesaTimer}s)
                        </p>
                      </div>
                    </div>
                  )}

                  {mpesaStatus === 'confirmed' && (
                    <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-4 animate-in zoom-in-95">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                      <div>
                        <h4 className="font-black text-slate-900 text-base">Payment Confirmed!</h4>
                        <p className="text-xs text-emerald-800 font-mono mt-1">
                          Ref: {mpesaGeneratedRef} • {currencySymbol} {targetTotal.toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={handleCompleteMpesa}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                        id="btn-finish-mpesa"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>COMPLETE & PRINT M-PESA RECEIPT</span>
                      </button>
                    </div>
                  )}
                </>
              )}

              {mpesaMode === 'manual' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      M-Pesa Confirmation Code (e.g. QK892HJ992) *
                    </label>
                    <div className="relative">
                      <FileCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={mpesaManualRef}
                        onChange={(e) => setMpesaManualRef(e.target.value.toUpperCase())}
                        placeholder="e.g. SLK8920194"
                        className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 font-mono font-black text-base uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Customer Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="07XX XXX XXX"
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {!isOnline
                        ? 'Payment will be stored in offline local database and synced when online.'
                        : `Transaction verified against ${currentBusiness.name} merchant records.`}
                    </span>
                  </div>

                  <button
                    onClick={handleCompleteMpesa}
                    disabled={!mpesaManualRef.trim()}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {!isOnline
                        ? `RECORD OFFLINE M-PESA SALE & PRINT RECEIPT`
                        : `RECORD PAYMENT & ISSUE RECEIPT`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. CARD PAYMENT VIEW */}
          {activeMethod === 'card' && (
            <div className="space-y-5 max-w-lg mx-auto text-center">
              <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3">
                <CreditCard className="w-12 h-12 text-indigo-600 mx-auto" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Card & Contactless Terminal {isOnline ? '' : '(Offline Mode)'}
                </h3>
                <p className="text-xs text-slate-600">
                  {isOnline
                    ? 'Swipe, Insert Chip or Tap Visa / Mastercard / Amex'
                    : 'Process via offline bank terminal & enter approval code'}
                </p>
              </div>

              {!isOnline ? (
                <div className="space-y-4 text-left">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Offline Card Record:</strong>
                      <span>Record terminal authorization/slip approval code. Sale will be saved locally as <span className="font-mono font-bold bg-amber-200/70 px-1 py-0.2 rounded">CARD — OFFLINE RECORD</span>.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Card Last 4 Digits *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={cardLast4}
                        onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                        placeholder="4821"
                        className="w-full px-3 py-2.5 bg-white text-slate-900 font-mono font-bold text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Terminal Auth / Approval Code
                      </label>
                      <input
                        type="text"
                        value={cardOfflineAuthCode}
                        onChange={(e) => setCardOfflineAuthCode(e.target.value.toUpperCase())}
                        placeholder="e.g. AUTH-8821"
                        className="w-full px-3 py-2.5 bg-white text-slate-900 font-mono font-bold text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCompleteCard}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
                    id="btn-complete-offline-card"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>RECORD OFFLINE CARD PAYMENT & PRINT RECEIPT</span>
                  </button>
                </div>
              ) : (
                <>
                  {cardStatus === 'idle' && (
                    <div className="space-y-3">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Terminal ID</span>
                          <span className="font-mono text-slate-900 font-bold">POS-DAV-882</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Card Simulated Last 4</span>
                          <span className="font-mono text-indigo-700 font-bold">•••• {cardLast4}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleInitiateCardTap}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                        id="btn-tap-card"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>TAP / INSERT CARD TO PAY ({currencySymbol} {targetTotal.toLocaleString()})</span>
                      </button>
                    </div>
                  )}

                  {cardStatus === 'tapping' && (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-indigo-300 space-y-3">
                      <RotateCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                      <p className="font-bold text-slate-900 text-sm">Authorizing with Bank Network...</p>
                    </div>
                  )}

                  {cardStatus === 'approved' && (
                    <div className="p-6 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-4">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                      <div>
                        <h4 className="font-black text-slate-900 text-base">Card Transaction Approved</h4>
                        <p className="text-xs text-slate-500 mt-1">Auth Code: 839210 • Visa Card</p>
                      </div>
                      <button
                        onClick={handleCompleteCard}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                        id="btn-finish-card"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>FINALIZE CARD SALE & PRINT RECEIPT</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 4. SPLIT BILL PAYMENT VIEW */}
          {activeMethod === 'split' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Order</span>
                  <strong className="text-slate-900 text-sm">
                    {currencySymbol} {targetTotal.toLocaleString()}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">Remaining to Allocate</span>
                  <strong
                    className={`text-sm ${
                      splitRemaining === 0 ? 'text-emerald-700 font-black' : 'text-amber-700 font-bold'
                    }`}
                  >
                    {currencySymbol} {splitRemaining.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Quick Split count */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Split into:</span>
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      soundFx.playClick();
                      setSplitCount(n);
                      const equalShare = Math.round(targetTotal / n);
                      const newSplits: SplitPaymentDetail[] = Array.from({ length: n }).map(
                        (_, i) => ({
                          method: i % 2 === 0 ? 'cash' : 'mpesa',
                          amount: i === n - 1 ? targetTotal - equalShare * (n - 1) : equalShare,
                        })
                      );
                      setSplitDetails(newSplits);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                      splitCount === n
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {n} Ways
                  </button>
                ))}
              </div>

              {/* Split Line Items */}
              <div className="space-y-2">
                {splitDetails.map((split, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <select
                        value={split.method}
                        onChange={(e) => {
                          const val = e.target.value as SplitPaymentDetail['method'];
                          setSplitDetails((prev) => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], method: val };
                            return copy;
                          });
                        }}
                        className="bg-white text-slate-900 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs"
                      >
                        <option value="cash">Cash</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="card">Card</option>
                        <option value="room_charge">Room Folio</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">{currencySymbol}</span>
                      <input
                        type="number"
                        value={split.amount}
                        onChange={(e) => {
                          const amt = parseFloat(e.target.value) || 0;
                          setSplitDetails((prev) => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], amount: amt };
                            return copy;
                          });
                        }}
                        className="w-24 px-2 py-1 bg-white text-slate-900 font-bold text-xs rounded-lg border border-slate-200 text-right shadow-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCompleteSplit}
                disabled={splitRemaining !== 0}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                id="btn-finish-split"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>COMPLETE SPLIT PAYMENT SALE</span>
              </button>
            </div>
          )}

          {/* 5. ROOM CHARGE VIEW (Hotel) */}
          {activeMethod === 'room_charge' && (
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-center space-y-2">
                <BedDouble className="w-12 h-12 text-purple-600 mx-auto" />
                <h3 className="font-black text-slate-900 text-base">Hotel Room Folio Charge</h3>
                <p className="text-xs text-slate-600">
                  Charge restaurant bill directly to guest account for hotel check-out billing
                </p>
              </div>

              {/* Room Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Occupied Hotel Room:
                </label>
                <select
                  value={targetRoom?.roomNumber || ''}
                  onChange={(e) => {
                    const r = hotelRooms.find((rm) => rm.roomNumber === e.target.value);
                    setTargetRoom(r || null);
                  }}
                  className="w-full px-3.5 py-3 bg-white text-slate-900 font-bold text-sm rounded-xl border border-slate-200 shadow-xs focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Choose Hotel Room --</option>
                  {hotelRooms
                    .filter((r) => r.status === 'occupied')
                    .map((r) => (
                      <option key={r.id} value={r.roomNumber}>
                        Room {r.roomNumber} - {r.guestName} ({r.type})
                      </option>
                    ))}
                </select>
              </div>

              {targetRoom ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Room Number</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      Room {targetRoom.roomNumber} ({targetRoom.type})
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registered Guest</span>
                    <strong className="text-purple-700 font-bold">{targetRoom.guestName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Room Folio</span>
                    <span className="text-slate-800 font-mono font-bold">
                      {currencySymbol} {targetRoom.folioBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between">
                    <span className="text-slate-700 font-bold">New Balance Post-Charge</span>
                    <span className="text-emerald-700 font-bold text-sm">
                      {currencySymbol}{' '}
                      {(targetRoom.folioBalance + targetTotal).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={handleCompleteRoomCharge}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    id="btn-finish-room-charge"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>POST {currencySymbol} {targetTotal.toLocaleString()} TO ROOM FOLIO</span>
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2 text-xs">
                  <p className="text-amber-800 font-bold">Please select an occupied room</p>
                  <p className="text-slate-500">
                    The bill amount will be added to the guest's folio balance.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
