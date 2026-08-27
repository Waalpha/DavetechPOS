import React, { useState, useEffect } from 'react';
import {
  Lock,
  UserCheck,
  ShieldCheck,
  X,
  Sparkles,
  Delete,
  CheckCircle2,
  Coins,
  Shield,
  User,
  LogIn,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';

export const CashierPinModal: React.FC = () => {
  const {
    showCashierPinModal,
    setShowCashierPinModal,
    cashiers,
    currentCashier,
    loginWithPin,
    activeShift,
    startShift,
    currencySymbol,
  } = usePOS();

  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [openingFloatInput, setOpeningFloatInput] = useState<string>('5000');
  const [isSettingFloat, setIsSettingFloat] = useState<boolean>(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'cashier' | 'manager'>('all');

  // Keyboard handler for fast desktop POS entry
  useEffect(() => {
    if (!showCashierPinModal || isSettingFloat) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        soundFx.playClick();
        setErrorMessage('');
        setPinInput((prev) => (prev.length < 6 ? prev + e.key : prev));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        soundFx.playClick();
        setPinInput((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleVerifyPin();
      } else if (e.key === 'Escape' && currentCashier) {
        e.preventDefault();
        setShowCashierPinModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCashierPinModal, isSettingFloat, pinInput, currentCashier]);

  if (!showCashierPinModal) return null;

  const handleVerifyPin = (pinToTest?: string) => {
    const pin = pinToTest || pinInput;
    if (!pin) {
      setErrorMessage('Please enter your 4-6 digit PIN');
      return;
    }
    const success = loginWithPin(pin);
    if (success) {
      if (!activeShift) {
        setIsSettingFloat(true);
      } else {
        setShowCashierPinModal(false);
        setPinInput('');
        setErrorMessage('');
      }
    } else {
      setErrorMessage('Invalid PIN. Please try again.');
      setPinInput('');
    }
  };

  const handleKeyClick = (val: string) => {
    soundFx.playClick();
    setErrorMessage('');
    if (val === 'CLEAR') {
      setPinInput('');
    } else if (val === 'BACK') {
      setPinInput((prev) => prev.slice(0, -1));
    } else if (val === 'ENTER') {
      handleVerifyPin();
    } else {
      if (pinInput.length < 6) {
        const nextPin = pinInput + val;
        setPinInput(nextPin);

        // Auto-attempt when exact pin match is found
        const exactMatch = cashiers.find((c) => c.pin === nextPin);
        if (exactMatch && nextPin.length >= 4) {
          setTimeout(() => {
            const success = loginWithPin(nextPin);
            if (success) {
              if (!activeShift) {
                setIsSettingFloat(true);
              } else {
                setShowCashierPinModal(false);
                setPinInput('');
                setErrorMessage('');
              }
            }
          }, 150);
        }
      }
    }
  };

  // Fast quick-login for demo / testing
  const handleQuickSelectCashier = (pin: string) => {
    soundFx.playClick();
    setPinInput(pin);
    handleVerifyPin(pin);
  };

  const handleConfirmShiftStart = () => {
    const floatVal = parseFloat(openingFloatInput) || 0;
    startShift(floatVal);
    setIsSettingFloat(false);
    setShowCashierPinModal(false);
    setPinInput('');
  };

  const filteredCashiers = cashiers.filter((c) => {
    if (roleFilter === 'all') return true;
    return c.role === roleFilter;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in" id="cashier-pin-modal">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-none">
                POS PIN Sign-In
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your 4–6 digit PIN to unlock POS
              </p>
            </div>
          </div>
          {currentCashier && (
            <button
              onClick={() => {
                soundFx.playClick();
                setShowCashierPinModal(false);
              }}
              className="p-1.5 rounded-xl bg-slate-200/70 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {!isSettingFloat ? (
            <>
              {/* Role filter tab for fast demo selection */}
              <div className="flex items-center justify-between pb-1">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Select User or Enter PIN
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                  {(['all', 'cashier', 'manager'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-2 py-0.5 rounded-md cursor-pointer capitalize transition-all ${
                        roleFilter === r
                          ? 'bg-white text-slate-900 shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Cashier Cards Selector */}
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-0.5">
                {filteredCashiers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleQuickSelectCashier(c.pin)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all shadow-xs cursor-pointer ${
                      currentCashier?.id === c.id
                        ? 'bg-emerald-50 border-emerald-500 text-slate-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${c.avatarColor} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div className="truncate flex-1">
                      <div className="font-extrabold text-xs leading-tight truncate text-slate-900">{c.name}</div>
                      <div className="text-[10px] flex items-center gap-1 mt-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded font-black text-[9px] uppercase ${
                            c.role === 'manager'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {c.role}
                        </span>
                        <span className="text-slate-400 font-mono font-bold">({c.pin})</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* PIN Code Display / Dots Indicator */}
              <div className="flex flex-col items-center justify-center py-2 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs font-extrabold text-slate-500 mb-2">
                  PIN CODE:
                </div>
                <div className="flex items-center gap-2.5 h-6">
                  {pinInput.length === 0 ? (
                    <span className="text-xs text-slate-400 font-medium">Type 4-6 digit PIN...</span>
                  ) : (
                    Array.from({ length: Math.max(4, pinInput.length) }).map((_, idx) => {
                      const isFilled = pinInput.length > idx;
                      return (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full transition-all ${
                            isFilled
                              ? 'bg-emerald-600 scale-110 shadow-sm'
                              : 'border-2 border-slate-300 bg-white'
                          }`}
                        />
                      );
                    })
                  )}
                </div>
                {errorMessage && (
                  <p className="text-xs font-black text-rose-600 mt-2">{errorMessage}</p>
                )}
              </div>

              {/* Touch Numpad */}
              <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyClick(key)}
                    className={`h-12 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-xs flex items-center justify-center border cursor-pointer ${
                      key === 'CLEAR'
                        ? 'bg-rose-50 border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100'
                        : key === 'BACK'
                        ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {key === 'BACK' ? <Delete className="w-5 h-5" /> : key}
                  </button>
                ))}
              </div>

              {/* Enter Button */}
              <button
                onClick={() => handleVerifyPin()}
                disabled={pinInput.length < 4}
                className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  pinInput.length >= 4
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                id="btn-confirm-pin-login"
              >
                <LogIn className="w-4 h-4" />
                <span>SIGN IN TO POS</span>
              </button>
            </>
          ) : (
            /* Opening Float Prompt for new shift */
            <div className="space-y-4 text-center py-2 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">Open Shift & Register Float</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the starting cash float in the cash drawer for {currentCashier?.name} ({currentCashier?.role?.toUpperCase()})
                </p>
              </div>

              <div className="max-w-xs mx-auto">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={openingFloatInput}
                    onChange={(e) => setOpeningFloatInput(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 bg-white text-slate-900 font-black text-lg rounded-2xl border border-slate-200 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsSettingFloat(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmShiftStart}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>START SHIFT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
