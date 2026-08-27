import React, { useState } from 'react';
import {
  Wifi,
  Printer,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Settings2,
  RefreshCw,
  Zap,
  Scissors,
  Check,
  X,
  Radio,
  ExternalLink,
  Flame,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';
import { PrinterConnectionType, PrinterPaperSize } from '../types/pos';

export const WifiPrinterModal: React.FC = () => {
  const {
    showWifiPrinterModal,
    setShowWifiPrinterModal,
    printerConfig,
    updatePrinterConfig,
    testWifiPrinter,
    printKitchenTicketToWifi,
  } = usePOS();

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'mobile_guide' | 'kitchen'>('config');

  if (!showWifiPrinterModal) return null;

  const handleTestPrint = async () => {
    soundFx.playClick();
    setTesting(true);
    setTestResult(null);

    try {
      const res = await testWifiPrinter();
      setTestResult({
        success: res.success,
        message: res.message,
        timestamp: new Date().toLocaleTimeString(),
      });
      if (res.success) {
        soundFx.playSuccess();
      } else {
        soundFx.playError();
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Failed to communicate with printer',
        timestamp: new Date().toLocaleTimeString(),
      });
      soundFx.playError();
    } finally {
      setTesting(false);
    }
  };

  const handleTestKitchen = async () => {
    soundFx.playClick();
    setTesting(true);
    setTestResult(null);

    try {
      const sampleTicket = {
        id: `kds-test-${Date.now()}`,
        orderId: 'ord-test',
        orderNumber: 'TEST-KOT-01',
        tableOrRoom: 'Table 4 (Test Round)',
        orderType: 'dine_in' as const,
        serverName: 'Sarah Jenkins (Phone)',
        createdAt: new Date().toISOString(),
        items: [
          { name: 'Double Smash Burger', quantity: 2, notes: 'Medium well', modifiers: ['Sides: Truffle Fries'] },
          { name: 'Caramel Macchiato', quantity: 2, modifiers: ['Milk: Oat Milk'] },
        ],
        status: 'pending' as const,
        elapsedMinutes: 0,
      };

      const res = await printKitchenTicketToWifi(sampleTicket);
      setTestResult({
        success: res.success,
        message: `Kitchen Ticket test: ${res.message}`,
        timestamp: new Date().toLocaleTimeString(),
      });
      soundFx.playKitchenBell();
    } catch {
      setTestResult({
        success: false,
        message: 'Kitchen printer test failed',
        timestamp: new Date().toLocaleTimeString(),
      });
      soundFx.playError();
    } finally {
      setTesting(false);
    }
  };

  const handleIpPreset = (ip: string) => {
    soundFx.playClick();
    updatePrinterConfig({ ipAddress: ip });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Wifi className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                  Wi-Fi Thermal Printer Hub
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {printerConfig.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Connect your mobile phone or tablet to ESC/POS 80mm / 58mm Wi-Fi printers
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              setShowWifiPrinterModal(false);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('config');
            }}
            className={`pb-2.5 px-3 font-extrabold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Connection & IP Settings</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('mobile_guide');
            }}
            className={`pb-2.5 px-3 font-extrabold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'mobile_guide'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Phone / Mobile Pairing Guide</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('kitchen');
            }}
            className={`pb-2.5 px-3 font-extrabold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'kitchen'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Kitchen (KOT) Wi-Fi Printer</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Diagnostic Result Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-3 animate-in fade-in shadow-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-extrabold text-xs">
                  {testResult.success ? 'Wi-Fi Print Signal Dispatched!' : 'Printer Communication Notice'}
                </div>
                <div className="text-[11px] mt-0.5 text-slate-600">{testResult.message}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">{testResult.timestamp}</div>
              </div>
            </div>
          )}

          {/* TAB 1: PRINTER CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {/* Enable Toggle & Current Device Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">
                      Enable Wi-Fi Direct Printing
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Send receipts directly to ESC/POS thermal printer via local Wi-Fi IP
                    </div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printerConfig.enabled}
                    onChange={(e) => updatePrinterConfig({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Protocol / Connection Mode */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-800 block text-xs">
                  Printer Connection Protocol
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'wifi_ip' as PrinterConnectionType,
                      title: 'Wi-Fi / LAN IP (ESC/POS)',
                      desc: 'Port 9100 raw socket over Wi-Fi',
                      icon: Wifi,
                    },
                    {
                      id: 'rawbt_android' as PrinterConnectionType,
                      title: 'Android RawBT Driver',
                      desc: '1-tap print for Android phones',
                      icon: Smartphone,
                    },
                    {
                      id: 'airprint_mopria' as PrinterConnectionType,
                      title: 'AirPrint / Mopria Wi-Fi',
                      desc: 'iOS & Android native print roll',
                      icon: Printer,
                    },
                  ].map((proto) => {
                    const isSelected = printerConfig.connectionType === proto.id;
                    const Icon = proto.icon;
                    return (
                      <button
                        key={proto.id}
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          updatePrinterConfig({ connectionType: proto.id });
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                        <div className="font-extrabold text-slate-900 text-xs">{proto.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{proto.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* IP Address & Port Configuration */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800">Printer Network Address</span>
                  <span className="text-[11px] font-mono text-indigo-600 font-bold">
                    {printerConfig.ipAddress}:{printerConfig.port}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-600 block mb-1">Wi-Fi Printer IP Address</label>
                    <input
                      type="text"
                      value={printerConfig.ipAddress}
                      onChange={(e) => updatePrinterConfig({ ipAddress: e.target.value.trim() })}
                      placeholder="e.g. 192.168.1.200"
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 font-mono font-bold text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Port (Default 9100)</label>
                    <input
                      type="number"
                      value={printerConfig.port}
                      onChange={(e) => updatePrinterConfig({ port: parseInt(e.target.value) || 9100 })}
                      className="w-full px-3 py-2 bg-slate-50 text-slate-900 font-mono font-bold text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Common IP Presets for easy phone setup */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5">
                    Quick Local IP Presets:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['192.168.1.200', '192.168.1.100', '192.168.0.100', '192.168.0.200', '10.0.0.100'].map((ip) => (
                      <button
                        key={ip}
                        type="button"
                        onClick={() => handleIpPreset(ip)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                          printerConfig.ipAddress === ip
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {ip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Paper Roll Width & Hardware Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Paper Width */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="font-extrabold text-slate-800 block text-xs">
                    Thermal Paper Roll Width
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        updatePrinterConfig({ paperSize: '80mm' });
                      }}
                      className={`p-2 rounded-xl border text-center font-extrabold text-xs transition-all cursor-pointer ${
                        printerConfig.paperSize === '80mm'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>80mm Roll</div>
                      <div className="text-[9px] opacity-80">Standard 42-48 Col</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        updatePrinterConfig({ paperSize: '58mm' });
                      }}
                      className={`p-2 rounded-xl border text-center font-extrabold text-xs transition-all cursor-pointer ${
                        printerConfig.paperSize === '58mm'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>58mm Roll</div>
                      <div className="text-[9px] opacity-80">Mobile / Belt 32 Col</div>
                    </button>
                  </div>
                </div>

                {/* Automation Toggles */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="font-extrabold text-slate-800 block text-xs">
                    Automation Preferences
                  </label>
                  <div className="space-y-1.5 text-[11px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printerConfig.autoPrintReceipt}
                        onChange={(e) => updatePrinterConfig({ autoPrintReceipt: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-700">Auto-Print Receipt after Checkout</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printerConfig.openCashDrawerOnCash}
                        onChange={(e) => updatePrinterConfig({ openCashDrawerOnCash: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-700">Pulse Open Cash Drawer on Cash Sale</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printerConfig.cutPaper}
                        onChange={(e) => updatePrinterConfig({ cutPaper: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-slate-700">Send Auto-Cutter Pulse (GS V)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Test Print & Save */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleTestPrint}
                  disabled={testing}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  id="btn-test-wifi-printer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{testing ? 'DISPATCHING TEST TICKET...' : 'TEST PRINT TO WI-FI PRINTER'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playSuccess();
                    setShowWifiPrinterModal(false);
                  }}
                  className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  SAVE & CLOSE
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PHONE / MOBILE PAIRING GUIDE */}
          {activeTab === 'mobile_guide' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <span>How to print from your Phone or Tablet over Wi-Fi</span>
                </div>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  Davetech POS supports standard ESC/POS Wi-Fi thermal printers (Epson, Sunmi, Xprinter, MUNBYN, Rongta, Star Micronics, POS-80, POS-58) across iOS iPhones and Android devices.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Android Phone Instructions */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                      A
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                      Android Phone Setup
                    </h4>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-normal pl-1">
                    <li>
                      <strong className="text-slate-800">Connect to Same Wi-Fi:</strong> Ensure phone is on the same Wi-Fi router as your thermal printer.
                    </li>
                    <li>
                      <strong className="text-slate-800">Find Printer IP:</strong> Turn printer off, hold <em>FEED</em> button, power on to print the self-test slip showing the IP address (e.g. <code>192.168.1.200</code>).
                    </li>
                    <li>
                      <strong className="text-slate-800">1-Tap Thermal Printing:</strong> You can install free <em>RawBT ESC/POS Driver</em> or use <em>Mopria Print Service</em> from Google Play Store for instant background printing without popups.
                    </li>
                  </ol>
                </div>

                {/* iPhone / iPad Instructions */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                      B
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                      iPhone / iPad (iOS) Setup
                    </h4>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 leading-normal pl-1">
                    <li>
                      <strong className="text-slate-800">AirPrint Wi-Fi:</strong> If your thermal printer supports AirPrint (Epson TM-m30, Star TSP), iOS will detect it instantly.
                    </li>
                    <li>
                      <strong className="text-slate-800">Non-AirPrint Wi-Fi Printers:</strong> Set the printer IP in this modal (e.g. <code>192.168.1.200:9100</code>). When you tap Print, Davetech POS formats the 80mm roll stream directly.
                    </li>
                    <li>
                      <strong className="text-slate-800">No Margins:</strong> Receipts are pre-sized to 80mm width with thermal monospace fonts.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Supported Models banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between">
                <span className="text-slate-600">
                  <strong>Compatible with:</strong> Epson TM-T88 / TM-m30, Xprinter XP-N160II / XP-80C, Sunmi V2 / T2, Star TSP100, Rongta, Munbyn Wi-Fi thermal printers.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: KITCHEN (KOT) WI-FI PRINTER */}
          {activeTab === 'kitchen' && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 space-y-2">
                <div className="flex items-center gap-2 text-orange-950 font-extrabold text-sm">
                  <Flame className="w-5 h-5 text-orange-600" />
                  <span>Kitchen Order Ticket (KOT) Routing</span>
                </div>
                <p className="text-xs text-orange-900/80 leading-relaxed">
                  Route food orders taken on waitstaff phones directly to a dedicated kitchen or bar Wi-Fi thermal printer, keeping the kitchen running smoothly.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs">
                      Enable Separate Kitchen Wi-Fi Printer
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Print cooking tickets when waiters tap "Send to Kitchen" from their phones
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerConfig.kitchenPrinterEnabled}
                      onChange={(e) => updatePrinterConfig({ kitchenPrinterEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>

                {printerConfig.kitchenPrinterEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-600 block mb-1">
                        Kitchen Printer IP Address
                      </label>
                      <input
                        type="text"
                        value={printerConfig.kitchenPrinterIp}
                        onChange={(e) => updatePrinterConfig({ kitchenPrinterIp: e.target.value.trim() })}
                        placeholder="e.g. 192.168.1.201"
                        className="w-full px-3 py-2 bg-slate-50 text-slate-900 font-mono font-bold text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Port</label>
                      <input
                        type="number"
                        value={printerConfig.kitchenPrinterPort}
                        onChange={(e) => updatePrinterConfig({ kitchenPrinterPort: parseInt(e.target.value) || 9100 })}
                        className="w-full px-3 py-2 bg-slate-50 text-slate-900 font-mono font-bold text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestKitchen}
                    disabled={testing}
                    className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Flame className="w-4 h-4" />
                    <span>PRINT SAMPLE KITCHEN TICKET (KOT)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
