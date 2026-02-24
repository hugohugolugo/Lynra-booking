"use client";
import { CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { t, formatDate } from "@/lib/utils";
import type { BookingState } from "@/lib/types";

interface ConfirmationViewProps {
  state: BookingState;
  onNewBooking: () => void;
}

export function ConfirmationView({ state, onNewBooking }: ConfirmationViewProps) {
  const { hotelConfig, checkIn, checkOut, bookingNumber, selectedRoom } = state;

  return (
    <div className="fade-in flex flex-col items-center text-center px-4 py-12 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-full bg-lynra-ember/10 flex items-center justify-center mb-6">
        <CheckCircle size={40} weight="light" className="text-lynra-ember" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-lynra-ember mb-2 font-body">
        Confirmed
      </p>

      <h2 className="font-display font-semibold text-3xl text-lynra-obsidian mb-3">
        Your booking is confirmed
      </h2>

      <p className="text-base text-lynra-granite font-body leading-relaxed mb-8">
        The village is ready for you.
        {bookingNumber && (
          <> Booking reference: <span className="font-semibold text-lynra-obsidian">{bookingNumber}</span></>
        )}
      </p>

      {/* Summary card */}
      <div className="w-full bg-lynra-white rounded-xl p-6 text-left mb-8 ring-1 ring-lynra-aluminium">
        <div className="space-y-3">
          {hotelConfig && (
            <div className="flex justify-between">
              <span className="text-xs text-lynra-haze uppercase tracking-wider font-semibold font-body">Village</span>
              <span className="text-sm text-lynra-obsidian font-body font-medium">{t(hotelConfig.Name)}</span>
            </div>
          )}
          {selectedRoom && (
            <div className="flex justify-between">
              <span className="text-xs text-lynra-haze uppercase tracking-wider font-semibold font-body">Room</span>
              <span className="text-sm text-lynra-obsidian font-body font-medium">{t(selectedRoom.category.Name)}</span>
            </div>
          )}
          {checkIn && checkOut && (
            <div className="flex justify-between">
              <span className="text-xs text-lynra-haze uppercase tracking-wider font-semibold font-body">Dates</span>
              <span className="text-sm text-lynra-obsidian font-body font-medium">
                {formatDate(checkIn)} — {formatDate(checkOut)}
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-lynra-haze font-body mb-6">
        A confirmation has been sent to your email address.
      </p>

      <button
        onClick={onNewBooking}
        className="inline-flex items-center gap-2 text-sm text-lynra-granite font-body hover:text-lynra-obsidian transition-colors"
      >
        Make another booking
        <ArrowRight size={14} weight="light" />
      </button>
    </div>
  );
}
