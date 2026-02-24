"use client";
import { Minus, Plus, User } from "@phosphor-icons/react";

interface GuestSelectorProps {
  adults: number;
  onChange: (adults: number) => void;
  min?: number;
  max?: number;
}

export function GuestSelector({ adults, onChange, min = 1, max = 10 }: GuestSelectorProps) {
  return (
    <div className="flex items-center justify-between bg-lynra-white rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <User size={20} weight="light" className="text-lynra-granite" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-lynra-haze font-body">
            Guests
          </p>
          <p className="text-base text-lynra-obsidian font-body font-medium">
            {adults} {adults === 1 ? "adult" : "adults"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, adults - 1))}
          disabled={adults <= min}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-lynra-aluminium text-lynra-granite hover:bg-lynra-ash transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Decrease guests"
        >
          <Minus size={14} weight="light" />
        </button>
        <span className="w-6 text-center text-base font-semibold text-lynra-obsidian font-body">
          {adults}
        </span>
        <button
          onClick={() => onChange(Math.min(max, adults + 1))}
          disabled={adults >= max}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-lynra-aluminium text-lynra-granite hover:bg-lynra-ash transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Increase guests"
        >
          <Plus size={14} weight="light" />
        </button>
      </div>
    </div>
  );
}
