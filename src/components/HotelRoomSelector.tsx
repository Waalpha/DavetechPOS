import React, { useState } from 'react';
import {
  BedDouble,
  User,
  Phone,
  Search,
  Check,
  X,
  CreditCard,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { HotelRoomInfo } from '../types/pos';
import { soundFx } from '../utils/audio';

interface HotelRoomSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotelRoomSelector: React.FC<HotelRoomSelectorProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    hotelRooms,
    selectedRoom,
    setSelectedRoom,
    setOrderType,
    currencySymbol,
  } = usePOS();

  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredRooms = hotelRooms.filter((rm) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      rm.roomNumber.toLowerCase().includes(q) ||
      rm.guestName.toLowerCase().includes(q) ||
      rm.type.toLowerCase().includes(q)
    );
  });

  const handleSelectRoom = (room: HotelRoomInfo) => {
    soundFx.playClick();
    if (room.status === 'occupied') {
      setSelectedRoom(room);
      setOrderType('room_service');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-none">
                Hotel Room & Guest Folio Billing
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign guest room to post room service or restaurant charges
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

        {/* Search */}
        <div className="p-3 bg-slate-100 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search room number, guest name, or room type..."
              className="w-full pl-10 pr-4 py-2 bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredRooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              const isOccupied = room.status === 'occupied';

              return (
                <div
                  key={room.id}
                  onClick={() => isOccupied && handleSelectRoom(room)}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                      : isOccupied
                      ? 'bg-white border-slate-200 hover:border-indigo-500 cursor-pointer hover:bg-slate-50'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-base text-slate-900">
                        Room {room.roomNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOccupied
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {room.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-800">{room.type}</div>
                      {isOccupied && (
                        <>
                          <div className="flex items-center gap-1 text-slate-700">
                            <User className="w-3 h-3 text-indigo-600" />
                            <span className="font-bold text-indigo-900">{room.guestName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{room.guestPhone}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {isOccupied && (
                    <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[10px]">Folio Balance:</span>
                      <span className="font-bold text-emerald-700">
                        {currencySymbol} {room.folioBalance.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
