import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Flame,
  Bell,
  UtensilsCrossed,
  Filter,
  CheckSquare,
  Square,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { KdsTicket, KitchenStatus } from '../types/pos';
import { soundFx } from '../utils/audio';

export const KitchenDisplaySystem: React.FC = () => {
  const { kdsTickets, updateKdsStatus, setCurrentView } = usePOS();
  const [statusFilter, setStatusFilter] = useState<'active' | 'pending' | 'cooking' | 'ready' | 'served'>('active');
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  const toggleItemDone = (ticketId: string, itemIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playClick();
    const key = `${ticketId}-${itemIdx}`;
    setCompletedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleAdvanceStatus = (ticket: KdsTicket) => {
    if (ticket.status === 'pending') {
      soundFx.playClick();
      updateKdsStatus(ticket.id, 'cooking');
    } else if (ticket.status === 'cooking') {
      soundFx.playKitchenBell();
      updateKdsStatus(ticket.id, 'ready');
    } else if (ticket.status === 'ready') {
      soundFx.playSuccess();
      updateKdsStatus(ticket.id, 'served');
    }
  };

  const filteredTickets = kdsTickets.filter((t) => {
    if (statusFilter === 'active') return t.status !== 'served';
    return t.status === statusFilter;
  });

  const getStatusAction = (ticket: KdsTicket) => {
    switch (ticket.status) {
      case 'pending':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAdvanceStatus(ticket);
            }}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Flame className="w-4 h-4 animate-pulse" />
            <span>START PREPARING / COOK</span>
          </button>
        );
      case 'cooking':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAdvanceStatus(ticket);
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>MARK READY FOR SERVER (BELL 🔔)</span>
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAdvanceStatus(ticket);
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>DISPATCH / MARK SERVED</span>
          </button>
        );
      case 'served':
        return (
          <div className="w-full text-center py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-black border border-emerald-200">
            ✓ ORDER COMPLETED & DISPATCHED
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 p-4 sm:p-6 overflow-hidden select-none text-slate-100">
      {/* KDS Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-black">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-tight flex items-center gap-2">
              Kitchen Display System (KDS)
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                LIVE EXPEDITER
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Kitchen orders, modifier customizations, waiter tickets & preparation dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Sound Bell Test */}
          <button
            onClick={() => soundFx.playKitchenBell()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition-colors"
            title="Test Service Bell"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentView('pos')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to POS Register</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-3 mb-2 overflow-x-auto">
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border ${
            statusFilter === 'active'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          Active Kitchen ({kdsTickets.filter((t) => t.status !== 'served').length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          New / Pending ({kdsTickets.filter((t) => t.status === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('cooking')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border ${
            statusFilter === 'cooking'
              ? 'bg-orange-600 text-white border-orange-600 shadow-md'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          Cooking ({kdsTickets.filter((t) => t.status === 'cooking').length})
        </button>
        <button
          onClick={() => setStatusFilter('ready')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border ${
            statusFilter === 'ready'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          Ready for Server ({kdsTickets.filter((t) => t.status === 'ready').length})
        </button>
        <button
          onClick={() => setStatusFilter('served')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border ${
            statusFilter === 'served'
              ? 'bg-slate-700 text-white border-slate-700'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
          }`}
        >
          History ({kdsTickets.filter((t) => t.status === 'served').length})
        </button>
      </div>

      {/* Tickets Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredTickets.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <ChefHat className="w-14 h-14 mb-3 opacity-40 text-slate-400" />
            <p className="font-extrabold text-slate-300 text-base">No Kitchen Tickets in this view</p>
            <p className="text-xs text-slate-500 mt-1">
              New orders sent from waiter handhelds and POS will appear instantly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTickets.map((ticket) => {
              const isOld = ticket.elapsedMinutes > 12;

              return (
                <div
                  key={ticket.id}
                  className={`bg-slate-800/90 rounded-3xl border p-4 sm:p-5 flex flex-col justify-between shadow-lg transition-all ${
                    ticket.status === 'ready'
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/30'
                      : ticket.status === 'cooking'
                      ? 'border-orange-500/80 bg-orange-950/20'
                      : ticket.status === 'pending'
                      ? 'border-amber-500/80 bg-slate-800'
                      : 'border-slate-700 opacity-60'
                  }`}
                  id={`kds-card-${ticket.id}`}
                >
                  {/* Ticket Header */}
                  <div>
                    <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-700">
                      <div>
                        <span className="font-black text-base text-white block">
                          {ticket.orderNumber}
                        </span>
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                          {ticket.tableOrRoom || 'Direct Order'}
                        </span>
                        {ticket.roundNumber && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            Round {ticket.roundNumber}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <div
                          className={`flex items-center gap-1 text-xs font-black ${
                            isOld ? 'text-rose-400 animate-pulse' : 'text-slate-400'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{ticket.elapsedMinutes}m ago</span>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize block">
                          Server: {ticket.serverName}
                        </span>
                      </div>
                    </div>

                    {/* Items Checklist */}
                    <div className="space-y-3 py-1">
                      {ticket.items.map((item, idx) => {
                        const itemKey = `${ticket.id}-${idx}`;
                        const isDone = completedItems[itemKey];

                        return (
                          <div
                            key={idx}
                            onClick={(e) => toggleItemDone(ticket.id, idx, e)}
                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                              isDone
                                ? 'bg-slate-900/60 border-slate-700/60 opacity-50 line-through text-slate-500'
                                : 'bg-slate-900/90 border-slate-700 text-white hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold">
                              <div className="flex items-center gap-2">
                                <button className="shrink-0 text-emerald-400">
                                  {isDone ? (
                                    <CheckSquare className="w-4 h-4" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-500" />
                                  )}
                                </button>
                                <span>
                                  <strong className="text-amber-400 font-black text-sm mr-1.5">
                                    {item.quantity}x
                                  </strong>
                                  {item.name}
                                </span>
                              </div>
                            </div>

                            {/* Modifiers */}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="text-[11px] text-emerald-400 pl-6 font-mono mt-1">
                                {item.modifiers.join(', ')}
                              </div>
                            )}

                            {/* Kitchen Notes */}
                            {item.notes && (
                              <div className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-700/50 p-1.5 rounded-xl italic pl-2.5 font-bold mt-1.5 flex items-center gap-1">
                                <span>⚠️ Note: {item.notes}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                    {/* Footer Status Action */}
                  <div className="pt-3 mt-3 border-t border-slate-700">
                    {getStatusAction(ticket)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
