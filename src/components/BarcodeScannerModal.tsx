import React, { useState, useEffect } from 'react';
import {
  Barcode,
  Camera,
  X,
  Plus,
  CheckCircle2,
  Package,
  Search,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { soundFx } from '../utils/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { products, addToCart, currencySymbol } = usePOS();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleScanBarcode = (code: string) => {
    soundFx.playBeep();
    const found = products.find(
      (p) => p.barcode === code || p.sku?.toLowerCase() === code.toLowerCase()
    );
    if (found) {
      setScannedProduct(found);
      addToCart(found);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleScanBarcode(barcodeInput.trim());
    setBarcodeInput('');
  };

  const barcodeItems = products.filter((p) => p.barcode);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-none">
                Barcode Scanner & Quick Search
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan product barcode with handheld scanner or select below
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200/70 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Laser Scanner Viewport Visual */}
        <div className="p-4 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden border-b border-slate-200">
          <div className="w-64 h-32 border-2 border-dashed border-emerald-500/60 rounded-2xl flex items-center justify-center relative bg-emerald-50/50">
            {/* Animated Laser Beam */}
            <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-bounce" />
            <Camera className="w-8 h-8 text-emerald-600/70" />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Ready to capture standard 1D/2D EAN & UPC barcodes
          </p>
        </div>

        {/* Manual Barcode Input */}
        <form onSubmit={handleManualSubmit} className="p-4 space-y-2 border-b border-slate-200 bg-white">
          <label className="text-xs font-bold text-slate-700 block">
            Scan with USB Scanner or Type Code:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="e.g. 61611004001 or R-HONEY-01"
              className="flex-1 px-3 py-2 bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-xs"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Add
            </button>
          </div>
        </form>

        {/* Scanned Feedback Notification */}
        {scannedProduct && (
          <div className="mx-4 my-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-in zoom-in-95">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <strong className="text-slate-900 block">{scannedProduct.name}</strong>
                <span className="text-emerald-700 font-bold">
                  +{currencySymbol} {scannedProduct.price.toLocaleString()} added to cart!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Tap Products with Barcodes */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Simulate Scan On Catalog Items:
          </span>
          <div className="space-y-1.5">
            {barcodeItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleScanBarcode(item.barcode!)}
                className="w-full p-2.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-left transition-colors shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-slate-900 font-semibold block leading-tight">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Barcode: {item.barcode}</span>
                  </div>
                </div>
                <span className="text-emerald-700 font-bold">
                  {currencySymbol} {item.price.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
