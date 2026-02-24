"use client";
import Image from "next/image";
import { Bed, Users, CheckCircle } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { t, formatCurrency } from "@/lib/utils";
import { buildImageUrl } from "@/lib/mews";
import type { RoomCategory, RoomCategoryAvailability, Rate } from "@/lib/types";

interface RoomCardProps {
  category: RoomCategory;
  availability: RoomCategoryAvailability;
  rate: Rate | null;
  perNight: number | null;
  total: number | null;
  nightCount: number;
  imageBaseUrl: string;
  selected: boolean;
  onSelect: () => void;
  currencyCode: string;
}

export function RoomCard({
  category,
  availability,
  rate,
  perNight,
  total,
  nightCount,
  imageBaseUrl,
  selected,
  onSelect,
  currencyCode,
}: RoomCardProps) {
  const imageId = category.ImageIds?.[0] ?? category.ImageId;
  const imageUrl = imageId ? buildImageUrl(imageBaseUrl, imageId) : null;

  return (
    <Card selected={selected} onClick={onSelect} className="group">
      {/* Room image */}
      {imageUrl ? (
        <div className="relative w-full h-44 rounded-lg overflow-hidden mb-4 bg-lynra-aluminium/40">
          <Image
            src={imageUrl}
            alt={t(category.Name)}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ) : (
        <div className="w-full h-44 rounded-lg bg-lynra-aluminium/30 mb-4 flex items-center justify-center">
          <Bed size={40} weight="light" className="text-lynra-clay" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-display font-semibold text-xl text-lynra-obsidian leading-tight">
          {t(category.Name)}
        </h3>
        {selected && (
          <CheckCircle size={22} weight="fill" className="text-lynra-ember shrink-0 mt-0.5" />
        )}
      </div>

      {/* Description */}
      {t(category.Description) && (
        <p className="text-sm text-lynra-granite font-body leading-relaxed mb-3 line-clamp-2">
          {t(category.Description)}
        </p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-4">
        {category.NormalBedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-lynra-haze font-body">
            <Bed size={14} weight="light" />
            <span>
              {category.NormalBedCount}{" "}
              {category.NormalBedCount === 1 ? "bed" : "beds"}
            </span>
          </div>
        )}
        {category.Capacity != null && category.Capacity > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-lynra-haze font-body">
            <Users size={14} weight="light" />
            <span>Up to {category.Capacity} guests</span>
          </div>
        )}
        {availability.AvailableRoomCount <= 3 && availability.AvailableRoomCount > 0 && (
          <Badge variant="ember">
            {availability.AvailableRoomCount}{" "}
            {availability.AvailableRoomCount === 1 ? "room" : "rooms"} left
          </Badge>
        )}
        {rate && <Badge variant="muted">{t(rate.Name)}</Badge>}
      </div>

      {/* Pricing */}
      <div className="flex items-end justify-between pt-3 border-t border-lynra-aluminium/50">
        <div>
          {perNight != null ? (
            <>
              <p className="text-xs text-lynra-haze font-body">per night</p>
              <p className="text-xl font-semibold text-lynra-obsidian font-body">
                {formatCurrency(perNight, currencyCode)}
              </p>
            </>
          ) : (
            <p className="text-sm text-lynra-haze font-body">Pricing unavailable</p>
          )}
        </div>
        {total != null && nightCount > 1 && (
          <div className="text-right">
            <p className="text-xs text-lynra-haze font-body">{nightCount} nights total</p>
            <p className="text-base font-medium text-lynra-granite font-body">
              {formatCurrency(total, currencyCode)}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
