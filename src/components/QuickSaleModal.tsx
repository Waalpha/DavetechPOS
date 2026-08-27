import React, { useState } from 'react';
import {
  Zap,
  X,
  Plus,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Smartphone,
  CreditCard,
  Banknote,
  Split,
  Tag,
  ShoppingBag,
  Utensils,
  Coffee,
  Wine,
  Scissors,
  BedDouble,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePOS } from '../context/POSContext';
import { PaymentMethod, ProductItem } from '../types/pos';
import { soundFx } from '../utils/audio';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({ isOpen, onClose }) => {
  const {
    currencySymbol,
    addToCart,
    completeCheckout,
    categories,
  } = usePOS();

  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('Quick Sale Item');
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-food');
  const [quickDirectMethod, setQuickDirectMethod] = useState<PaymentMethod | null>(null);

  if (!isOpen) return null;

  const currentAmount = parseFloat(amountStr) || 0;

  const handleKeypadPress = (val: string) => {
    soundFx.playClick();
    if (val === 'CLEAR') {
      setAmountStr('');
      return;
    }
    if (val === 'BACK') {
      setAmountStr((prev) => prev.slice(0, -1));
      return;
    }
    if (val === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr((prev) => (prev ? prev + '.' : '0.'));
      }
      return;
    }
    // Limit to 8 digits
    if (amountStr.length < 8) {
      setAmountStr((prev) => prev + val);
    }
  };

  const handleAddPreset = (addon: number) => {
    soundFx.playClick();
    const curr = parseFloat(amountStr) || 0;
    setAmountStr((curr + addon).toString());
  };

  // 1. Add to Order Cart
  const handleAddToCart = () => {
    if (currentAmount <= 0) return;
    soundFx.playSuccess();

    const quickProduct: ProductItem = {
      id: `quick-${Date.now()}`,
      name: description.trim() || 'Quick Sale Item',
      categoryId: selectedCategory,
      price: currentAmount,
      imageUrl:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      isAvailable: true,
      isInventory: false,
      businessModes: ['restaurant', 'hotel', 'shop', 'bar', 'services'],
    };

    addToCart(quickProduct);
    onClose();
    // reset
    setAmountStr('');
    setDescription('Quick Sale Item');
  };

  // 2. Direct Instant Checkout (Enter Amount -> Choose Payment -> Complete -> Receipt)
  const handleDirectCharge = (method: PaymentMethod) => {
    if (currentAmount <= 0) return;
    soundFx.playSuccess();

    const quickProduct: ProductItem = {
      id: `quick-${Date.now()}`,
      name: description.trim() || 'Quick Sale Item',
      categoryId: selectedCategory,
      price: currentAmount,
      imageUrl:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80',
      isAvailable: true,
      isInventory: false,
      businessModes: ['restaurant', 'hotel', 'shop', 'bar', 'services'],
    };

    // Add to cart and immediately checkout with this item
    addToCart(quickProduct);

    setTimeout(() => {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      completeCheckout(method, {
        amountTendered: method === 'cash' ? currentAmount : undefined,
        mpesaRef: method === 'mpesa' ? `QS${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        cardLast4: method === 'card' ? '4821' : undefined,
      });

      onClose();
      setAmountStr('');
      setDescription('Quick Sale Item');
    }, 50);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                Quick Sale / Open Ring
              </h3>
              <p className="text-xs text-emerald-100 font-medium">
                Sell any custom amount, service or fee instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            id="btn-close-quicksale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Amount Display */}
          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-emerald-500/40 text-center shadow-inner">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Sale Amount ({currencySymbol})
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1">
              <span className="text-emerald-600">{currencySymbol}</span>
              <span className={amountStr ? 'text-slate-900' : 'text-slate-300'}>
                {amountStr ? parseFloat(amountStr).toLocaleString() : '0.00'}
              </span>
            </div>
          </div>

          {/* Quick Preset Cash Chips */}
          <div className="grid grid-cols-6 gap-1.5">
            {[100, 200, 500, 1000, 2000, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => handleAddPreset(preset)}
                className="py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-black text-xs transition-transform active:scale-95 shadow-xs"
              >
                +{preset >= 1000 ? `${preset / 1000}k` : preset}
              </button>
            ))}
          </div>

          {/* Keypad & Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Numeric Touch Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '.'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeypadPress(key)}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 font-black text-lg shadow-xs transition-all flex items-center justify-center cursor-pointer"
                >
                  {key}
                </button>
              ))}
              <button
                onClick={() => handleKeypadPress('CLEAR')}
                className="col-span-1 h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-xs transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => handleKeypadPress('BACK')}
                className="col-span-2 h-11 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs shadow-xs transition-colors"
              >
                ⌫ Backspace
              </button>
            </div>

            {/* Item Details (Description & Category) */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Item / Service Note (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Special Lunch, Delivery Fee, Haircut..."
                  className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 placeholder:text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quick Category Assignment */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Category Tag
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedCategory(c.id);
                      }}
                      className={`p-2 rounded-xl text-center text-xs font-bold border transition-all ${
                        selectedCategory === c.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={currentAmount <= 0}
                className="w-full py-3 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                id="btn-quicksale-add-cart"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Cart ({currencySymbol} {currentAmount.toLocaleString()})</span>
              </button>
            </div>
          </div>

          {/* 1-Tap Direct Checkout Options */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-600 block mb-2">
              ⚡ Or Instant 1-Tap Charge & Print Receipt:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleDirectCharge('cash')}
                disabled={currentAmount <= 0}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 disabled:opacity-40 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group active:scale-95 cursor-pointer shadow-xs"
                id="btn-quicksale-cash"
              >
                <Banknote className="w-5 h-5 text-emerald-700 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xs text-emerald-900">Cash</span>
              </button>

              <button
                onClick={() => handleDirectCharge('mpesa')}
                disabled={currentAmount <= 0}
                className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group active:scale-95 cursor-pointer shadow-md"
                id="btn-quicksale-mpesa"
              >
                <Smartphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xs">M-Pesa</span>
              </button>

              <button
                onClick={() => handleDirectCharge('card')}
                disabled={currentAmount <= 0}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 disabled:opacity-40 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group active:scale-95 cursor-pointer shadow-xs"
                id="btn-quicksale-card"
              >
                <CreditCard className="w-5 h-5 text-indigo-700 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xs text-indigo-900">Card Tap</span>
              </button>

              <button
                onClick={() => handleDirectCharge('split')}
                disabled={currentAmount <= 0}
                className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-300 disabled:opacity-40 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group active:scale-95 cursor-pointer shadow-xs"
                id="btn-quicksale-split"
              >
                <Split className="w-5 h-5 text-purple-700 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-xs text-purple-900">Split Pay</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
