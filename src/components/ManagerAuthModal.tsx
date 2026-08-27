import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  X,
  CheckCircle2,
  Delete,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';

export const ManagerAuthModal: React.FC = () => {
  const {
    showManagerAuthModal,
    setShowManagerAuthModal,
    managerAuthPromptText,
    executeManagerAuthorizedAction,
    cashiers,
  } = usePOS();

  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!showManagerAuthModal) return null;

  const managers = cashiers.filter((c) => c.role === 'manager' && c.status !== 'inactive');

  const handleKeyClick = (val: string) => {
    soundFx.playClick();
    setErrorMessage('');
    if (val === 'CLEAR') {
      setPinInput('');
    } else if (val === 'BACK') {
      setPinInput((prev) => prev.slice(0, -1));
    } else {
      if (pinInput.length < 6) {
        const nextPin = pinInput + val;
        setPinInput(nextPin);
      }
    }
  };

  const handleVerify = (pinToTest?: string) => {
    const pin = pinToTest || pinInput;
    if (!pin) {
      setErrorMessage('Please enter manager PIN');
      return;
    }
    const success = executeManagerAuthorizedAction(pin);
    if (!success) {
      setErrorMessage('Invalid Manager PIN. Access denied.');
      setPinInput('');
    } else {
      setPinInput('');
      setErrorMessage('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-60 flex items-center justify-center p-3 select-none animate-in fade-in">
      <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                Manager Authorization
              </h3>
              <p className="text-[11px] text-rose-700 font-bold mt-0.5">
                Restricted Action
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              setShowManagerAuthModal(false);
              setPinInput('');
              setErrorMessage('');
            }}
            className="p-1.5 rounded-xl bg-slate-200/70 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{managerAuthPromptText}</span>
          </div>

          {/* Quick Manager Profiles for Easy Verification */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Available Managers
            </label>
            <div className="space-y-1.5">
              {managers.map((mgr) => (
                <button
                  key={mgr.id}
                  onClick={() => handleVerify(mgr.pin)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {mgr.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-800">{mgr.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-100 text-indigo-800">
                      MANAGER
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-mono font-bold">
                    Tap to Authorize ({mgr.pin})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* PIN Input Field */}
          <div>
            <div className="text-center mb-2">
              <span className="text-xs font-bold text-slate-600">Or enter Manager PIN:</span>
            </div>
            <div className="h-11 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center px-4 tracking-widest text-lg font-mono font-black text-slate-800">
              {pinInput ? '•'.repeat(pinInput.length) : <span className="text-slate-400 text-xs font-normal">Enter 4-6 digit PIN</span>}
            </div>
            {errorMessage && (
              <p className="text-center text-xs font-bold text-rose-600 mt-1.5">{errorMessage}</p>
            )}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-1.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map((val) => (
              <button
                key={val}
                onClick={() => handleKeyClick(val)}
                className={`py-2.5 rounded-xl font-black text-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  val === 'CLEAR'
                    ? 'bg-rose-100 text-rose-700 text-xs hover:bg-rose-200'
                    : val === 'BACK'
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                {val === 'BACK' ? <Delete className="w-4 h-4" /> : val}
              </button>
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={pinInput.length < 4}
            className={`w-full py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
              pinInput.length >= 4
                ? 'bg-slate-900 hover:bg-black text-white active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>AUTHORIZE ACTION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
