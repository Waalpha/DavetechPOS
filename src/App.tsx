import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { POSProvider, usePOS } from './context/POSContext';
import { Navbar } from './components/Navbar';
import { CategoryNav } from './components/CategoryNav';
import { ProductGrid } from './components/ProductGrid';
import { OrderCart } from './components/OrderCart';
import { QuickSaleModal } from './components/QuickSaleModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ReceiptModal } from './components/ReceiptModal';
import { CustomerBillModal } from './components/CustomerBillModal';
import { CashierPinModal } from './components/CashierPinModal';
import { ShiftReportModal } from './components/ShiftReportModal';
import { RestaurantTableModal } from './components/RestaurantTableModal';
import { KitchenDisplaySystem } from './components/KitchenDisplaySystem';
import { HotelRoomSelector } from './components/HotelRoomSelector';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { OwnerDashboard } from './components/OwnerDashboard';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import { ManagerAuthModal } from './components/ManagerAuthModal';
import { WifiPrinterModal } from './components/WifiPrinterModal';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { OfflineSyncModal } from './components/OfflineSyncModal';

const POSMainLayout: React.FC = () => {
  const { currentView, isHighContrast, cart, cartTotals, currencySymbol, selectedTable } = usePOS();

  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans ${
        isHighContrast ? 'bg-black text-amber-50' : 'bg-slate-100 text-slate-850'
      }`}
    >
      {/* Top POS Navbar (Register, Tables, Orders & Bills, KDS, Manager Tabs, PIN switch) */}
      <Navbar />

      {/* Offline Status & Outage Banner */}
      <OfflineStatusBanner onOpenModal={() => setIsOfflineModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative pb-16 md:pb-0">
        {currentView === 'pos' && (
          <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative">
            {/* Left Screen: Touchscreen Category Navigation + Product Grid */}
            <div className="flex-1 flex flex-col p-2.5 sm:p-3 md:p-4 overflow-hidden min-w-0">
              <CategoryNav
                onOpenBarcodeScanner={() => setIsBarcodeModalOpen(true)}
                onOpenQuickSale={() => setIsQuickSaleOpen(true)}
              />
              <div className="flex-1 mt-2.5 sm:mt-3 overflow-hidden flex flex-col">
                <ProductGrid />
              </div>
            </div>

            {/* Desktop / Large Screen Cart (Side Panel) */}
            <div className="hidden lg:flex h-full">
              <OrderCart
                onOpenCheckout={() => setIsCheckoutOpen(true)}
                onOpenTableModal={() => setIsTableModalOpen(true)}
                onOpenRoomModal={() => setIsRoomModalOpen(true)}
              />
            </div>

            {/* Mobile / Tablet Portrait: Floating Bottom Cart Bar */}
            <div className="lg:hidden fixed bottom-16 left-0 right-0 p-2.5 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none z-30">
              <div className="max-w-md mx-auto pointer-events-auto">
                <button
                  onClick={() => setIsMobileCartOpen(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700 transition-all cursor-pointer"
                  id="btn-mobile-open-cart"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black relative">
                      <ShoppingBag className="w-5 h-5" />
                      {cartTotals.itemCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white border-2 border-slate-900">
                          {cartTotals.itemCount}
                        </span>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-extrabold text-xs leading-tight flex items-center gap-1.5">
                        <span>{selectedTable ? selectedTable.name : 'Current Ticket'}</span>
                        {cart.length > 0 && (
                          <span className="text-emerald-400 font-bold">
                            ({cartTotals.itemCount} items)
                          </span>
                        )}
                      </div>
                      <div className="text-emerald-400 font-black text-sm">
                        {currencySymbol} {(cartTotals?.total ?? 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-xs">
                    <span>{cart.length > 0 ? 'View / Pay' : 'Open Ticket'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>

            {/* Mobile / Tablet Full-Height Order Drawer / Modal */}
            {isMobileCartOpen && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in">
                <div className="w-full sm:max-w-md h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
                  <OrderCart
                    isMobileDrawer={true}
                    onCloseMobile={() => setIsMobileCartOpen(false)}
                    onOpenCheckout={() => {
                      setIsMobileCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    onOpenTableModal={() => {
                      setIsMobileCartOpen(false);
                      setIsTableModalOpen(true);
                    }}
                    onOpenRoomModal={() => {
                      setIsMobileCartOpen(false);
                      setIsRoomModalOpen(true);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Orders & Bills (Cashier & Manager) */}
        {currentView === 'orders' && <CustomerOrdersView />}

        {/* Kitchen Display System */}
        {currentView === 'kds' && <KitchenDisplaySystem />}

        {/* Tables Modal / View */}
        {currentView === 'tables' && (
          <RestaurantTableModal
            isOpen={true}
            onClose={() => {}}
          />
        )}

        {/* Hotel Rooms Folio */}
        {currentView === 'rooms' && (
          <HotelRoomSelector
            isOpen={true}
            onClose={() => {}}
          />
        )}

        {/* Manager Dashboard & Dedicated Manager Views */}
        {(currentView === 'dashboard' ||
          currentView === 'products' ||
          currentView === 'inventory' ||
          currentView === 'reports' ||
          currentView === 'users' ||
          currentView === 'settings') && <OwnerDashboard />}
      </main>

      {/* Modals & Dialogs */}
      <QuickSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <CustomerBillModal />
      <ReceiptModal />
      <CashierPinModal />
      <ShiftReportModal />
      <ManagerAuthModal />
      <WifiPrinterModal />

      <RestaurantTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />

      <HotelRoomSelector
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
      />

      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
      />

      <OfflineSyncModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSMainLayout />
    </POSProvider>
  );
}
