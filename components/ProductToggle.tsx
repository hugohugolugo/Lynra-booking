"use client";
import { t, formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface ProductToggleProps {
  product: Product;
  selected: boolean;
  onToggle: () => void;
  currencyCode: string;
  nightCount: number;
}

export function ProductToggle({
  product,
  selected,
  onToggle,
  currencyCode,
  nightCount,
}: ProductToggleProps) {
  const price = product.Prices?.[currencyCode]?.GrossValue ?? null;
  const isForced = product.AlwaysIncluded;

  return (
    <button
      type="button"
      onClick={!isForced ? onToggle : undefined}
      disabled={isForced}
      className={`
        w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-150 text-left
        ${
          isForced
            ? "border-lynra-aluminium/40 bg-lynra-ash/50 cursor-default"
            : selected
            ? "border-lynra-ember bg-lynra-ember/5 ring-1 ring-lynra-ember/30"
            : "border-lynra-aluminium bg-lynra-white hover:border-lynra-clay hover:bg-lynra-ash/60 cursor-pointer"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={`
            mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors duration-150
            ${
              selected || isForced
                ? "bg-lynra-ember border-lynra-ember"
                : "border-lynra-aluminium bg-lynra-white"
            }
          `}
        >
          {(selected || isForced) && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-lynra-obsidian font-body">
            {t(product.Name)}
            {isForced && (
              <span className="ml-2 text-xs font-normal text-lynra-haze">Included</span>
            )}
          </p>
          {t(product.Description) && (
            <p className="text-xs text-lynra-haze font-body mt-0.5 leading-relaxed">
              {t(product.Description)}
            </p>
          )}
        </div>
      </div>

      {price != null && !isForced && (
        <div className="text-right ml-4 shrink-0">
          <p className="text-sm font-semibold text-lynra-obsidian font-body">
            +{formatCurrency(price, currencyCode)}
          </p>
          <p className="text-xs text-lynra-haze font-body">per night</p>
          {nightCount > 1 && (
            <p className="text-xs text-lynra-haze font-body">
              {formatCurrency(price * nightCount, currencyCode)} total
            </p>
          )}
        </div>
      )}
    </button>
  );
}
