import React, { useState, useMemo } from 'react';
import {
  Plus,
  SlidersHorizontal,
  Package,
  X,
  Check,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ProductItem, CartModifierSelection } from '../types/pos';
import { soundFx } from '../utils/audio';

export const ProductGrid: React.FC = () => {
  const {
    products,
    selectedCategory,
    searchQuery,
    addToCart,
    cart,
    currencySymbol,
  } = usePOS();

  const [customizingProduct, setCustomizingProduct] = useState<ProductItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<CartModifierSelection[]>([]);
  const [itemNote, setItemNote] = useState<string>('');

  // Filter products by selected category and search keyword
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesSku = product.sku?.toLowerCase().includes(q);
        const matchesBarcode = product.barcode?.toLowerCase().includes(q);
        return matchesName || matchesSku || matchesBarcode;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Open Customize / Modifiers Modal
  const handleOpenCustomize = (product: ProductItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    setCustomizingProduct(product);
    setItemNote('');

    // Pre-select first option for each modifier group
    if (product.modifiers) {
      const defaults: CartModifierSelection[] = product.modifiers.map((group) => ({
        groupName: group.name,
        selectedOption: group.options[0]?.label || '',
        extraPrice: group.options[0]?.extraPrice || 0,
      }));
      setSelectedModifiers(defaults);
    } else {
      setSelectedModifiers([]);
    }
  };

  const handleModifierOptionChange = (
    groupName: string,
    optionLabel: string,
    extraPrice: number
  ) => {
    soundFx.playClick();
    setSelectedModifiers((prev) => {
      const filtered = prev.filter((m) => m.groupName !== groupName);
      return [...filtered, { groupName, selectedOption: optionLabel, extraPrice }];
    });
  };

  const handleConfirmCustomization = () => {
    if (!customizingProduct) return;
    soundFx.playSuccess();
    addToCart(customizingProduct, selectedModifiers, itemNote);
    setCustomizingProduct(null);
  };

  // Helper to count how many of this product are in cart
  const getProductCartCount = (productId: string) => {
    return cart
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 select-none">
      {/* Product Grid Area */}
      <div className="flex-1 overflow-y-auto pr-1 pb-4">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-3xl border border-slate-200 text-slate-500 shadow-xs">
            <Package className="w-12 h-12 text-slate-300 mb-2" />
            <p className="font-extrabold text-slate-800 text-sm">No items found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try selecting a different category or clearing your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-3.5">
            {filteredProducts.map((product) => {
              const inCartCount = getProductCartCount(product.id);
              const hasModifiers = Boolean(product.modifiers && product.modifiers.length > 0);
              const isOutOfStock =
                product.isInventory && product.stock !== undefined && product.stock <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (isOutOfStock) return;
                    if (hasModifiers) {
                      handleOpenCustomize(product, { stopPropagation: () => {} } as React.MouseEvent);
                    } else {
                      addToCart(product);
                    }
                  }}
                  className={`group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200 hover:border-emerald-500 p-3 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                    inCartCount > 0
                      ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/10'
                      : ''
                  } ${isOutOfStock ? 'opacity-60 bg-slate-100' : ''}`}
                  id={`product-card-${product.id}`}
                >
                  {/* Cart Quantity Badge */}
                  {inCartCount > 0 && (
                    <div className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white animate-in zoom-in-50">
                      {inCartCount}
                    </div>
                  )}

                  {/* Large Product Image */}
                  <div className="relative aspect-[4/3] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 mb-2.5">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        isOutOfStock ? 'grayscale' : ''
                      }`}
                      loading="lazy"
                    />

                    {/* Out of stock label if tracked and 0 */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Optional Options Badge on image */}
                    {hasModifiers && (
                      <button
                        onClick={(e) => handleOpenCustomize(product, e)}
                        className="absolute bottom-2 right-2 px-2 py-1 rounded-xl bg-slate-900/80 hover:bg-emerald-600 backdrop-blur-md text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                        title="Customize options & modifiers"
                        id={`btn-options-${product.id}`}
                      >
                        <SlidersHorizontal className="w-3 h-3 text-emerald-300" />
                        <span>Options</span>
                      </button>
                    )}
                  </div>

                  {/* Clean Product Name */}
                  <div className="flex-1 flex flex-col justify-start">
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Bottom Row: Selling Price & Large Tactile + Button */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                    <span className="font-black text-sm sm:text-base text-slate-900 tracking-tight">
                      {currencySymbol} {product.price.toLocaleString()}
                    </span>

                    {/* Large + Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isOutOfStock) return;
                        if (hasModifiers) {
                          handleOpenCustomize(product, e);
                        } else {
                          addToCart(product);
                        }
                      }}
                      disabled={isOutOfStock}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center font-black shadow-sm transition-all cursor-pointer ${
                        isOutOfStock
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white hover:scale-105 active:scale-95'
                      }`}
                      id={`btn-add-${product.id}`}
                      title={`Add ${product.name} to order`}
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modifier & Option Customization Modal */}
      {customizingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={customizingProduct.imageUrl}
                  alt={customizingProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                    {customizingProduct.name}
                  </h3>
                  <p className="text-xs text-emerald-700 font-extrabold">
                    Base Price: {currencySymbol} {customizingProduct.price.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-2 rounded-2xl bg-slate-200/70 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modifier Groups */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {customizingProduct.modifiers?.map((group) => (
                <div key={group.name} className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    {group.name}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((opt) => {
                      const isSelected = selectedModifiers.some(
                        (m) => m.groupName === group.name && m.selectedOption === opt.label
                      );

                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() =>
                            handleModifierOptionChange(group.name, opt.label, opt.extraPrice)
                          }
                          className={`p-3 rounded-2xl text-left border text-xs font-semibold flex items-center justify-between transition-all shadow-xs ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/40'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <div className="font-extrabold">{opt.label}</div>
                            {opt.extraPrice > 0 ? (
                              <span className="text-[10px] text-emerald-700 font-bold">
                                +{currencySymbol} {opt.extraPrice.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Included</span>
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Special Note / Kitchen Request */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Special Instructions / Kitchen Notes
                </label>
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="e.g. Extra hot, dressing on side, no onions..."
                  className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Footer Add Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Calculated Total</span>
                <span className="text-lg font-black text-slate-900">
                  {currencySymbol}{' '}
                  {(
                    customizingProduct.price +
                    selectedModifiers.reduce((sum, m) => sum + m.extraPrice, 0)
                  ).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomizingProduct(null)}
                  className="px-4 py-2.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCustomization}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                  id="btn-confirm-modifiers"
                >
                  Add to Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
