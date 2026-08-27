import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Lock,
  RotateCw,
  Server,
  ShieldCheck,
  Send,
  Sparkles,
  Info,
  Check,
  HelpCircle,
  QrCode,
  Terminal,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Daraja3Config, DarajaEnvironment, DarajaIdentifierType } from '../types/pos';
import { DARAJA3_PRESETS, normalizeKenyanPhone, StkPushResult } from '../utils/darajaService';
import { soundFx } from '../utils/audio';

export const Daraja3SettingsCard: React.FC = () => {
  const { currentBusiness, daraja3Config, updateDaraja3Config, testDaraja3Config, triggerDaraja3StkPush, currencySymbol } = usePOS();

  const [formState, setFormState] = useState<Daraja3Config>({
    ...daraja3Config,
  });

  const [showSecret, setShowSecret] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Testing state
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [authTestResult, setAuthTestResult] = useState<{
    success: boolean;
    token?: string;
    expiresIn?: number;
    message: string;
  } | null>(null);

  // STK Push Simulation state
  const [testPhone, setTestPhone] = useState('0722 000 000');
  const [testAmount, setTestAmount] = useState('10');
  const [isSendingStk, setIsSendingStk] = useState(false);
  const [stkPushResult, setStkPushResult] = useState<StkPushResult | null>(null);
  const [stkError, setStkError] = useState<string | null>(null);

  const handleCopy = (text: string, fieldId: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApplyPreset = (presetKey: keyof typeof DARAJA3_PRESETS) => {
    soundFx.playClick();
    const preset = DARAJA3_PRESETS[presetKey];
    if (preset) {
      setFormState((prev) => ({
        ...prev,
        ...preset.config,
      }));
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setIsSaving(true);
    updateDaraja3Config(formState);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      soundFx.playSuccess();
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  };

  const handleTestAuth = async () => {
    soundFx.playClick();
    setIsTestingAuth(true);
    setAuthTestResult(null);
    try {
      // Temporarily save form to context first
      updateDaraja3Config(formState);
      const res = await testDaraja3Config();
      setAuthTestResult(res);
    } catch (err: any) {
      setAuthTestResult({
        success: false,
        message: err?.message || 'Daraja 3.0 connection handshake failed',
      });
    } finally {
      setIsTestingAuth(false);
    }
  };

  const handleSendTestStkPush = async () => {
    soundFx.playClick();
    setIsSendingStk(true);
    setStkPushResult(null);
    setStkError(null);
    try {
      updateDaraja3Config(formState);
      const res = await triggerDaraja3StkPush({
        phone: testPhone,
        amount: parseFloat(testAmount) || 10,
        orderNumber: `TEST-${Math.floor(100 + Math.random() * 900)}`,
      });
      setStkPushResult(res);
      soundFx.playSuccess();
    } catch (err: any) {
      setStkError(err?.message || 'Failed to dispatch Lipa Na M-Pesa STK Push');
      soundFx.playError();
    } finally {
      setIsSendingStk(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-6" id="card-daraja-settings">
      {/* Brand Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xs text-white shrink-0 shadow-inner">
            <Smartphone className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-lg text-white tracking-tight">
                Safaricom Daraja 3.0 API & Lipa Na M-Pesa
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                formState.environment === 'live'
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-400 text-slate-950 font-black'
              }`}>
                {formState.environment === 'live' ? '● Production Live' : '⚙ Sandbox Test'}
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Direct STK Push (Lipa Na M-Pesa Online), C2B Callbacks, Real-Time Webhooks & Instant Payment Settlements
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider mr-1 hidden sm:inline">
            Quick Fill:
          </span>
          <button
            type="button"
            onClick={() => handleApplyPreset('sandbox')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
          >
            Sandbox Demo
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('livePaybill')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
          >
            Live Paybill
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('liveTill')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
          >
            Live Till
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="p-5 sm:p-6 pt-0 space-y-6 text-xs">
        {/* Environment & Switchers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Enabled Switch */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-extrabold text-slate-800 text-xs">Daraja 3.0 Integration</div>
              <div className="text-[11px] text-slate-500">Enable M-Pesa STK push & webhooks</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formState.enabled}
                onChange={(e) => setFormState({ ...formState, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Environment Mode */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <label className="font-extrabold text-slate-800 block text-xs">API Gateway Environment</label>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setFormState({ ...formState, environment: 'sandbox' });
                }}
                className={`py-1.5 px-2 rounded-xl font-extrabold text-[11px] text-center border cursor-pointer transition-all ${
                  formState.environment === 'sandbox'
                    ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Sandbox (Test)
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setFormState({ ...formState, environment: 'live' });
                }}
                className={`py-1.5 px-2 rounded-xl font-extrabold text-[11px] text-center border cursor-pointer transition-all ${
                  formState.environment === 'live'
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Live (Production)
              </button>
            </div>
          </div>

          {/* Identifier Type */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <label className="font-extrabold text-slate-800 block text-xs">M-Pesa Identifier Type</label>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setFormState({ ...formState, identifierType: 'paybill' });
                }}
                className={`py-1.5 px-2 rounded-xl font-extrabold text-[11px] text-center border cursor-pointer transition-all ${
                  formState.identifierType === 'paybill'
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Paybill Number
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setFormState({ ...formState, identifierType: 'till' });
                }}
                className={`py-1.5 px-2 rounded-xl font-extrabold text-[11px] text-center border cursor-pointer transition-all ${
                  formState.identifierType === 'till'
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Buy Goods (Till)
              </button>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Daraja 3.0 API Key Credentials</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              From Safaricom Developer Portal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Consumer Key */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block text-xs">
                Consumer Key (App Key) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formState.appKey}
                  onChange={(e) => setFormState({ ...formState, appKey: e.target.value })}
                  placeholder="vGjK8sL29QpM4nR7tW1xY5zA3bC6dE8f"
                  className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(formState.appKey, 'appKey')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Copy Consumer Key"
                >
                  {copiedField === 'appKey' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Consumer Secret */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block text-xs">
                Consumer Secret <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={formState.appSecret}
                  onChange={(e) => setFormState({ ...formState, appSecret: e.target.value })}
                  placeholder="9XyZ2aB5cE8hK1mP4rT7wV0sD3gJ6lQ9"
                  className="w-full pl-3 pr-18 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(formState.appSecret, 'appSecret')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Copy Secret"
                  >
                    {copiedField === 'appSecret' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Passkey */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-slate-700 block text-xs">
                Lipa Na M-Pesa Online Passkey <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasskey ? 'text' : 'password'}
                  value={formState.passkey}
                  onChange={(e) => setFormState({ ...formState, passkey: e.target.value })}
                  placeholder="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
                  className="w-full pl-3 pr-18 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(formState.passkey, 'passkey')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Copy Passkey"
                  >
                    {copiedField === 'passkey' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Shortcode */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block text-xs">
                Business Shortcode / Till / Paybill <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formState.shortcode}
                onChange={(e) => setFormState({ ...formState, shortcode: e.target.value })}
                placeholder="174379 (Sandbox) or 247247 / 893421 (Live)"
                className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Account Reference Prefix */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block text-xs">
                Account Reference Prefix
              </label>
              <input
                type="text"
                value={formState.accountReferencePrefix}
                onChange={(e) => setFormState({ ...formState, accountReferencePrefix: e.target.value })}
                placeholder="DAVETECH-POS"
                className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Webhooks & Endpoints Card */}
        <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>STK Push Callback & C2B Webhook Endpoints</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Registered in Safaricom Portal
            </span>
          </div>

          <div className="space-y-3">
            {/* STK Callback */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block text-xs">
                Lipa Na M-Pesa STK Push Callback URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formState.callbackUrl}
                  onChange={(e) => setFormState({ ...formState, callbackUrl: e.target.value })}
                  placeholder="https://api.davetechpos.com/api/v1/mpesa/daraja3/callback"
                  className="w-full pl-3 pr-10 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(formState.callbackUrl, 'callbackUrl')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Copy Callback URL"
                >
                  {copiedField === 'callbackUrl' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* C2B Confirmation Webhook */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block text-xs">
                  C2B Confirmation URL
                </label>
                <input
                  type="text"
                  value={formState.c2bConfirmationUrl || ''}
                  onChange={(e) => setFormState({ ...formState, c2bConfirmationUrl: e.target.value })}
                  placeholder="https://api.davetechpos.com/api/v1/mpesa/daraja3/confirmation"
                  className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-[11px]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block text-xs">
                  C2B Validation URL
                </label>
                <input
                  type="text"
                  value={formState.c2bValidationUrl || ''}
                  onChange={(e) => setFormState({ ...formState, c2bValidationUrl: e.target.value })}
                  placeholder="https://api.davetechpos.com/api/v1/mpesa/daraja3/validation"
                  className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save & Test Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestAuth}
              disabled={isTestingAuth}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              id="btn-test-daraja-oauth"
            >
              {isTestingAuth ? (
                <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span>Test OAuth 2.0 Handshake</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-emerald-700 font-extrabold text-xs flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Settings Saved Successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              id="btn-save-daraja3-settings"
            >
              <Check className="w-4 h-4" />
              <span>Save Daraja 3.0 Settings</span>
            </button>
          </div>
        </div>

        {/* OAuth Handshake Result Box */}
        {authTestResult && (
          <div
            className={`p-4 rounded-2xl border text-xs animate-in fade-in space-y-2 ${
              authTestResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold">
                {authTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <span>
                  {authTestResult.success ? 'Daraja 3.0 OAuth Verified' : 'Handshake Failed'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-500">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <p className="text-[11px] font-medium">{authTestResult.message}</p>
            {authTestResult.token && (
              <div className="p-2 bg-white/80 rounded-xl border border-emerald-200 font-mono text-[10px] text-slate-700 truncate">
                Bearer Token: <span className="text-emerald-700 font-bold">{authTestResult.token}</span>
              </div>
            )}
          </div>
        )}

        {/* Interactive STK Push Simulator Section */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-xs sm:text-sm">
                  Live STK Push Diagnostic & Payment Simulator
                </h4>
                <p className="text-[11px] text-slate-400">
                  Send a test Lipa Na M-Pesa prompt to verify end-to-end phone popups and callbacks
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Customer Phone Number
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="0722 000 000"
                className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Test Amount ({currencySymbol})
              </label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSendTestStkPush}
                disabled={isSendingStk}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                id="btn-simulate-stk-push"
              >
                {isSendingStk ? (
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Dispatch Test STK Push</span>
              </button>
            </div>
          </div>

          {/* STK Result Box */}
          {stkPushResult && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>STK Push Response 200 (Success 0)</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-300">
                  {stkPushResult.mpesaReceiptNumber}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono pt-1">
                <div className="p-2 bg-slate-900/80 rounded-lg">
                  <span className="text-slate-400 block">MerchantRequestID:</span>
                  <span className="text-white truncate block">{stkPushResult.merchantRequestId}</span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg">
                  <span className="text-slate-400 block">CheckoutRequestID:</span>
                  <span className="text-white truncate block">{stkPushResult.checkoutRequestId}</span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg">
                  <span className="text-slate-400 block">Recipient Phone:</span>
                  <span className="text-white truncate block">{stkPushResult.phoneNumber}</span>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg">
                  <span className="text-slate-400 block">Amount / Status:</span>
                  <span className="text-emerald-400 font-bold block">{currencySymbol} {stkPushResult.amount} (Accepted)</span>
                </div>
              </div>
            </div>
          )}

          {stkError && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{stkError}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
