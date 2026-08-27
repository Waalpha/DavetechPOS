import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Users,
  Clock,
  Plus,
  Check,
  X,
  Receipt,
  CreditCard,
  ChefHat,
  Bell,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { TableInfo, TableStatus } from '../types/pos';
import { soundFx } from '../utils/audio';

interface RestaurantTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RestaurantTableModal: React.FC<RestaurantTableModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    tables,
    selectedTable,
    setSelectedTable,
    startTableOrder,
    selectTableForOrder,
    requestTableBill,
    markTableServed,
    releaseTable,
    openPaymentForTable,
    currentCashier,
    currencySymbol,
  } = usePOS();

  const [activeSection, setActiveSection] = useState<'All' | 'Main Hall' | 'VIP Lounge' | 'Terrace' | 'Bar Area'>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'active' | 'ready' | 'billing'>('all');
  
  // Selected table for detailed view / guest selection modal
  const [inspectingTable, setInspectingTable] = useState<TableInfo | null>(null);
  const [selectedGuestCount, setSelectedGuestCount] = useState<number>(2);

  if (!isOpen) return null;

  const sections: ('All' | 'Main Hall' | 'VIP Lounge' | 'Terrace' | 'Bar Area')[] = [
    'All',
    'Main Hall',
    'VIP Lounge',
    'Terrace',
    'Bar Area',
  ];

  const filteredTables = tables.filter((t) => {
    // Section filter
    if (activeSection !== 'All' && t.section !== activeSection) return false;

    // Status filter
    if (statusFilter === 'available' && t.status !== 'available') return false;
    if (
      statusFilter === 'active' &&
      !['occupied', 'order_sent', 'preparing', 'ready'].includes(t.status)
    )
      return false;
    if (statusFilter === 'ready' && t.status !== 'ready') return false;
    if (statusFilter === 'billing' && t.status !== 'bill_requested') return false;

    return true;
  });

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Available
          </span>
        );
      case 'occupied':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Occupied
          </span>
        );
      case 'order_sent':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span> Order Sent
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-900 border border-orange-300 flex items-center gap-1">
            <ChefHat className="w-3 h-3 text-orange-700 animate-spin" /> Preparing
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white border border-emerald-600 flex items-center gap-1 animate-pulse shadow-sm">
            <Bell className="w-3 h-3" /> Ready to Serve
          </span>
        );
      case 'bill_requested':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
            <Receipt className="w-3 h-3 text-purple-700" /> Bill Requested
          </span>
        );
      case 'paid':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1">
            <Check className="w-3 h-3 text-teal-700" /> Paid
          </span>
        );
      case 'reserved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-700 border border-slate-300">
            Reserved
          </span>
        );
    }
  };

  const handleTableClick = (table: TableInfo) => {
    soundFx.playClick();
    if (table.status === 'available') {
      setInspectingTable(table);
      setSelectedGuestCount(table.seats || 2);
    } else {
      // Show action sheet for occupied table
      setInspectingTable(table);
    }
  };

  const handleConfirmStartOrder = () => {
    if (!inspectingTable) return;
    startTableOrder(inspectingTable.id, selectedGuestCount, currentCashier?.name || 'Sarah Jenkins');
    setInspectingTable(null);
    onClose();
  };

  const handleAddItems = (table: TableInfo) => {
    selectTableForOrder(table);
    setInspectingTable(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Floor Plan & Table Service Management
              </h3>
              <p className="text-xs text-slate-400">
                Live Status: Waiter → Order → Kitchen → Serve → Bill → Settle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Quick Filter Banner */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {/* Section Selector */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {sections.map((sec) => (
              <button
                key={sec}
                onClick={() => {
                  soundFx.playClick();
                  setActiveSection(sec);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  activeSection === sec
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sec} ({sec === 'All' ? tables.length : tables.filter((t) => t.section === sec).length})
              </button>
            ))}
          </div>

          {/* Status Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Tables
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                statusFilter === 'available'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Available ({tables.filter((t) => t.status === 'available').length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                statusFilter === 'active'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              Active Dining ({tables.filter((t) => ['occupied', 'order_sent', 'preparing', 'ready'].includes(t.status)).length})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                statusFilter === 'ready'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
              }`}
            >
              Food Ready ({tables.filter((t) => t.status === 'ready').length})
            </button>
            <button
              onClick={() => setStatusFilter('billing')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                statusFilter === 'billing'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
              }`}
            >
              Bill Requested ({tables.filter((t) => t.status === 'bill_requested').length})
            </button>
          </div>
        </div>

        {/* Main Grid + Action Panel Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tables Grid */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredTables.map((table) => {
                const isSelected = inspectingTable?.id === table.id || selectedTable?.id === table.id;
                const isReady = table.status === 'ready';
                const isBilling = table.status === 'bill_requested';
                const isPaid = table.status === 'paid';

                return (
                  <div
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative shadow-xs active:scale-[0.98] group ${
                      isSelected
                        ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/20'
                        : isReady
                        ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/40 hover:bg-emerald-100/80'
                        : isBilling
                        ? 'bg-purple-50/70 border-purple-300 hover:bg-purple-100/70'
                        : isPaid
                        ? 'bg-teal-50/70 border-teal-300 hover:bg-teal-100/70'
                        : table.status === 'available'
                        ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-slate-50'
                        : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/30'
                    }`}
                    id={`table-tile-${table.id}`}
                  >
                    <div>
                      {/* Top row: Table name & Status Badge */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div>
                          <h4 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                            {table.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {table.section}
                          </span>
                        </div>
                        {getStatusBadge(table.status)}
                      </div>

                      {/* Guest & Waiter info */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{table.seats} Seats</span>
                        {table.activeGuests && (
                          <span className="text-amber-900 font-bold bg-amber-100 px-1.5 py-0.2 rounded text-[11px]">
                            {table.activeGuests} Guests
                          </span>
                        )}
                      </div>

                      {table.assignedWaiter && (
                        <p className="text-[10px] text-slate-500 truncate mb-1">
                          Server: <span className="font-bold text-slate-700">{table.assignedWaiter}</span>
                        </p>
                      )}
                    </div>

                    {/* Active Order Summary & Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {table.activeOrderTotal ? (
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">
                            Total Bill
                          </span>
                          <span className="text-xs sm:text-sm font-black text-emerald-700">
                            {currencySymbol} {table.activeOrderTotal.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Available
                        </span>
                      )}

                      <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-amber-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Drawer: Table Actions & Inspector */}
          {inspectingTable && (
            <div className="w-full md:w-96 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="space-y-4">
                {/* Header of Drawer */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">
                      {inspectingTable.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {inspectingTable.section} • {inspectingTable.seats} Seats
                    </p>
                  </div>
                  {getStatusBadge(inspectingTable.status)}
                </div>

                {/* IF TABLE IS AVAILABLE: Start New Order Flow */}
                {inspectingTable.status === 'available' && (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                      Start New Dining Session
                    </h4>

                    {/* Guest Count Selector */}
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">
                        Number of Guests:
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                          <button
                            key={num}
                            onClick={() => setSelectedGuestCount(num)}
                            className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                              selectedGuestCount === num
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleConfirmStartOrder}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Open Table & Take Order</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* IF TABLE IS OCCUPIED / ACTIVE: Show Rounds & Live Actions */}
                {inspectingTable.status !== 'available' && (
                  <div className="space-y-3">
                    {/* Active Bill Summary Box */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Assigned Server:</span>
                        <span className="font-bold text-slate-800">
                          {inspectingTable.assignedWaiter || 'Sarah Jenkins'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Guests Seated:</span>
                        <span className="font-bold text-slate-800">
                          {inspectingTable.activeGuests || 2} Guests
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                        <span>Total Due:</span>
                        <span className="text-emerald-700 text-lg">
                          {currencySymbol} {(inspectingTable.activeOrderTotal || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2 max-h-48 overflow-y-auto">
                      <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                        Current Order Items ({inspectingTable.activeItems?.length || 0})
                      </h5>
                      {inspectingTable.activeItems && inspectingTable.activeItems.length > 0 ? (
                        <div className="space-y-1.5 text-xs">
                          {inspectingTable.activeItems.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-slate-800">
                                  {item.quantity}x {item.product.name}
                                </span>
                                {item.itemNotes && (
                                  <p className="text-[10px] text-amber-700 italic">
                                    &ldquo;{item.itemNotes}&rdquo;
                                  </p>
                                )}
                              </div>
                              <span className="font-black text-slate-900">
                                {currencySymbol} {item.totalPrice.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No items added yet to this table ticket.
                        </p>
                      )}
                    </div>

                    {/* WORKFLOW ACTION BUTTONS */}
                    <div className="space-y-2 pt-1">
                      {/* 1. Add more items / new round */}
                      <button
                        onClick={() => handleAddItems(inspectingTable)}
                        className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add More Items (Next Round)</span>
                      </button>

                      {/* 2. If food ready -> Mark food served */}
                      {inspectingTable.status === 'ready' && (
                        <button
                          onClick={() => {
                            markTableServed(inspectingTable.id);
                            setInspectingTable((prev) => prev ? { ...prev, status: 'occupied' } : null);
                          }}
                          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer animate-pulse"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Mark Food as SERVED to Table</span>
                        </button>
                      )}

                      {/* 3. Request / Print Bill */}
                      <button
                        onClick={() => {
                          requestTableBill(inspectingTable.id);
                          setInspectingTable(null);
                        }}
                        className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Receipt className="w-4 h-4 text-amber-700" />
                        <span>Request / Print Customer Bill</span>
                      </button>

                      {/* 4. Pay / Settle Bill */}
                      <button
                        onClick={() => {
                          openPaymentForTable(inspectingTable);
                          setInspectingTable(null);
                          onClose();
                        }}
                        className="w-full py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>PAY / SETTLE BILL</span>
                      </button>

                      {/* 5. Clear / Release Table */}
                      <button
                        onClick={() => {
                          releaseTable(inspectingTable.id);
                          setInspectingTable(null);
                        }}
                        className="w-full py-2 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Release / Make Table Available</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
