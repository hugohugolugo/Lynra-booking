"use client";
import { MapPin, CalendarBlank, Bed, Users, Coffee } from "@phosphor-icons/react";
import { t, formatCurrency, formatDate, getNightCount } from "@/lib/utils";
import type { BookingState, Product } from "@/lib/types";

interface BookingSummaryProps {
  state: BookingState;
  products: Product[];
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-lynra-aluminium/50 last:border-0">
      <span className="text-lynra-haze mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-lynra-haze uppercase tracking-wider font-semibold font-body">
          {label}
        </p>
        <p className="text-sm text-lynra-obsidian font-body font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function BookingSummary({ state, products }: BookingSummaryProps) {
  const { hotelConfig, checkIn, checkOut, adults, selectedRoom, selectedProductIds } = state;

  if (!hotelConfig || !checkIn || !checkOut || !selectedRoom) return null;

  const nightCount = getNightCount(checkIn, checkOut);
  const currency = selectedRoom.currencyCode;

  const selectedProducts = products.filter(
    (p) => selectedProductIds.includes(p.Id) || p.AlwaysIncluded
  );

  const productsTotal = selectedProducts.reduce((sum, p) => {
    const price = p.Prices?.[currency]?.GrossValue ?? 0;
    return sum + price * nightCount;
  }, 0);

  const grandTotal = selectedRoom.total + productsTotal;

  return (
    <div className="bg-lynra-white rounded-xl p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-lynra-ember mb-4 font-body">
        Booking summary
      </p>

      <SummaryRow
        icon={<MapPin size={16} weight="light" />}
        label="Village"
        value={t(hotelConfig.Name)}
      />
      <SummaryRow
        icon={<CalendarBlank size={16} weight="light" />}
        label="Dates"
        value={`${formatDate(checkIn)} — ${formatDate(checkOut)} · ${nightCount} ${nightCount === 1 ? "night" : "nights"}`}
      />
      <SummaryRow
        icon={<Bed size={16} weight="light" />}
        label="Room"
        value={t(selectedRoom.category.Name)}
      />
      <SummaryRow
        icon={<Users size={16} weight="light" />}
        label="Guests"
        value={`${adults} ${adults === 1 ? "adult" : "adults"}`}
      />
      {selectedProducts.length > 0 && (
        <SummaryRow
          icon={<Coffee size={16} weight="light" />}
          label="Add-ons"
          value={selectedProducts.map((p) => t(p.Name)).join(", ")}
        />
      )}

      {/* Pricing breakdown */}
      <div className="mt-4 pt-4 border-t border-lynra-aluminium/50 space-y-2">
        <div className="flex justify-between text-sm font-body text-lynra-granite">
          <span>
            {t(selectedRoom.category.Name)} × {nightCount}{" "}
            {nightCount === 1 ? "night" : "nights"}
          </span>
          <span>{formatCurrency(selectedRoom.total, currency)}</span>
        </div>
        {selectedProducts.map((p) => {
          const price = p.Prices?.[currency]?.GrossValue;
          if (!price) return null;
          return (
            <div key={p.Id} className="flex justify-between text-sm font-body text-lynra-granite">
              <span>
                {t(p.Name)} × {nightCount} {nightCount === 1 ? "night" : "nights"}
              </span>
              <span>+{formatCurrency(price * nightCount, currency)}</span>
            </div>
          );
        })}
        <div className="flex justify-between pt-2 border-t border-lynra-aluminium/50">
          <span className="text-base font-semibold text-lynra-obsidian font-body">Total</span>
          <span className="text-base font-semibold text-lynra-obsidian font-body">
            {formatCurrency(grandTotal, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
