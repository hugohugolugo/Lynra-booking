"use client";
import { useReducer, useEffect, useState } from "react";
import { MapPin, CalendarBlank, Warning } from "@phosphor-icons/react";
import { StepIndicator } from "@/components/StepIndicator";
import { DateSelector } from "@/components/DateSelector";
import { GuestSelector } from "@/components/GuestSelector";
import { RoomCard } from "@/components/RoomCard";
import { ProductToggle } from "@/components/ProductToggle";
import { GuestForm } from "@/components/GuestForm";
import { BookingSummary } from "@/components/BookingSummary";
import { ConfirmationView } from "@/components/ConfirmationView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RoomCardSkeleton } from "@/components/ui/Skeleton";
import { getHotel, getAvailability, createReservation, extractPricing } from "@/lib/mews";
import { t, toUtcString, getNightCount, formatDate, formatCurrency } from "@/lib/utils";
import type {
  BookingState,
  BookingStep,
  GuestDetails,
  HotelConfig,
  AvailabilityResponse,
  RoomCategoryAvailability,
  SelectedRoom,
  Product,
} from "@/lib/types";

const CURRENCY = "EUR";

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_CONFIG"; config: HotelConfig }
  | { type: "CONFIG_ERROR"; error: string }
  | { type: "SET_DATES"; checkIn: Date | null; checkOut: Date | null }
  | { type: "SET_ADULTS"; count: number }
  | { type: "FETCH_AVAILABILITY" }
  | { type: "SET_AVAILABILITY"; data: AvailabilityResponse }
  | { type: "AVAILABILITY_ERROR"; error: string }
  | { type: "SELECT_ROOM"; room: SelectedRoom }
  | { type: "TOGGLE_PRODUCT"; productId: string }
  | { type: "SET_GUEST_DETAILS"; details: GuestDetails }
  | { type: "SUBMIT_RESERVATION" }
  | { type: "RESERVATION_SUCCESS"; bookingNumber: string }
  | { type: "RESERVATION_ERROR"; error: string }
  | { type: "GO_TO_STEP"; step: BookingStep }
  | { type: "RESET" };

const initialState: BookingState = {
  step: 1,
  hotelConfig: null,
  configLoading: true,
  configError: null,

  checkIn: null,
  checkOut: null,
  adults: 1,

  availability: null,
  availabilityLoading: false,
  availabilityError: null,
  selectedRoom: null,
  selectedProductIds: [],

  guestDetails: null,

  reservationLoading: false,
  reservationError: null,
  bookingConfirmed: false,
  bookingNumber: null,
};

function reducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case "SET_CONFIG":
      return { ...state, hotelConfig: action.config, configLoading: false, configError: null };
    case "CONFIG_ERROR":
      return { ...state, configLoading: false, configError: action.error };
    case "SET_DATES":
      return { ...state, checkIn: action.checkIn, checkOut: action.checkOut };
    case "SET_ADULTS":
      return { ...state, adults: action.count };
    case "FETCH_AVAILABILITY":
      return { ...state, availabilityLoading: true, availabilityError: null };
    case "SET_AVAILABILITY":
      return { ...state, availability: action.data, availabilityLoading: false, step: 2 };
    case "AVAILABILITY_ERROR":
      return { ...state, availabilityLoading: false, availabilityError: action.error };
    case "SELECT_ROOM":
      return { ...state, selectedRoom: action.room };
    case "TOGGLE_PRODUCT": {
      const ids = state.selectedProductIds;
      return {
        ...state,
        selectedProductIds: ids.includes(action.productId)
          ? ids.filter((id) => id !== action.productId)
          : [...ids, action.productId],
      };
    }
    case "SET_GUEST_DETAILS":
      return { ...state, guestDetails: action.details, step: 4 };
    case "SUBMIT_RESERVATION":
      return { ...state, reservationLoading: true, reservationError: null };
    case "RESERVATION_SUCCESS":
      return {
        ...state,
        reservationLoading: false,
        bookingConfirmed: true,
        bookingNumber: action.bookingNumber,
        step: 4,
      };
    case "RESERVATION_ERROR":
      return { ...state, reservationLoading: false, reservationError: action.error };
    case "GO_TO_STEP":
      return { ...state, step: action.step };
    case "RESET":
      return { ...initialState, hotelConfig: state.hotelConfig, configLoading: false };
    default:
      return state;
  }
}

// ─── Step Section Wrapper ─────────────────────────────────────────────────────

interface StepSectionProps {
  stepNumber: BookingStep;
  currentStep: BookingStep;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  completedSummary?: React.ReactNode;
  onEdit?: () => void;
}

function StepSection({
  stepNumber,
  currentStep,
  title,
  subtitle,
  children,
  completedSummary,
  onEdit,
}: StepSectionProps) {
  const isActive = stepNumber === currentStep;
  const isCompleted = stepNumber < currentStep;

  if (isCompleted && completedSummary) {
    return (
      <div className="bg-lynra-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-lynra-haze font-body">
            Step {stepNumber}
          </p>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-lynra-granite hover:text-lynra-obsidian underline-offset-2 hover:underline font-body transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        {completedSummary}
      </div>
    );
  }

  if (!isActive) return null;

  return (
    <div className="fade-in">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-lynra-ember font-body mb-1">
          Step {stepNumber}
        </p>
        <h2 className="font-display font-semibold text-3xl text-lynra-obsidian">{title}</h2>
        {subtitle && (
          <p className="text-base text-lynra-granite font-body mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BookingFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Load hotel config on mount
  useEffect(() => {
    getHotel()
      .then((config) => dispatch({ type: "SET_CONFIG", config }))
      .catch(() =>
        dispatch({
          type: "CONFIG_ERROR",
          error: "Unable to load hotel information. Please refresh.",
        })
      );
  }, []);

  const nightCount =
    state.checkIn && state.checkOut ? getNightCount(state.checkIn, state.checkOut) : 1;

  // ─── Step 1: Check Availability ──────────────────────────────────────────────

  async function handleCheckAvailability() {
    if (!state.checkIn || !state.checkOut) return;

    dispatch({ type: "FETCH_AVAILABILITY" });

    try {
      const data = await getAvailability({
        startUtc: toUtcString(state.checkIn),
        endUtc: toUtcString(state.checkOut),
        currencyCode: CURRENCY,
      });
      dispatch({ type: "SET_AVAILABILITY", data });
    } catch {
      dispatch({
        type: "AVAILABILITY_ERROR",
        error: "No availability for these dates. Adjust your selection to continue.",
      });
    }
  }

  // ─── Step 2: Room selection ───────────────────────────────────────────────────

  function handleSelectRoom(avail: RoomCategoryAvailability) {
    if (!state.hotelConfig || !state.availability) return;

    const category = state.hotelConfig.RoomCategories.find(
      (c) => c.Id === avail.RoomCategoryId
    );
    if (!category) return;

    const pricing = extractPricing(avail, state.availability.Rates, CURRENCY, nightCount);
    if (!pricing) return;

    dispatch({
      type: "SELECT_ROOM",
      room: {
        category,
        availability: avail,
        rate: pricing.rate,
        perNight: pricing.perNight,
        total: pricing.total,
        currencyCode: CURRENCY,
        nightCount,
      },
    });
  }

  // ─── Step 4: Confirm booking ──────────────────────────────────────────────────

  async function handleConfirmBooking() {
    if (
      !state.selectedRoom ||
      !state.guestDetails ||
      !state.checkIn ||
      !state.checkOut ||
      !state.hotelConfig
    )
      return;

    dispatch({ type: "SUBMIT_RESERVATION" });

    try {
      const result = await createReservation({
        StartUtc: toUtcString(state.checkIn),
        EndUtc: toUtcString(state.checkOut),
        RoomCategoryId: state.selectedRoom.category.Id,
        RateId: state.selectedRoom.rate?.Id ?? "",
        AdultCount: state.adults,
        ProductIds: state.selectedProductIds,
        Customer: state.guestDetails,
        CurrencyCode: CURRENCY,
      });

      const bookingNumber =
        result?.Reservations?.[0]?.Number ?? result?.Id ?? "N/A";
      dispatch({ type: "RESERVATION_SUCCESS", bookingNumber });
    } catch {
      dispatch({
        type: "RESERVATION_ERROR",
        error:
          "Unable to complete your booking. Please review your details and try again.",
      });
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const { step, hotelConfig, configLoading, configError } = state;

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-lynra-ember border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-lynra-haze font-body">Loading village information</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-sm text-center">
          <Warning size={32} weight="light" className="text-lynra-ember mx-auto mb-3" />
          <p className="text-sm text-lynra-granite font-body">{configError}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Card>
      </div>
    );
  }

  if (!hotelConfig) return null;

  if (state.bookingConfirmed) {
    return (
      <ConfirmationView
        state={state}
        onNewBooking={() => dispatch({ type: "RESET" })}
      />
    );
  }

  const allProducts: Product[] = hotelConfig.Products ?? [];
  const availableRooms =
    state.availability?.RoomCategoryAvailabilities?.filter(
      (a) => a.AvailableRoomCount > 0
    ) ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-6">
      {/* Hotel name */}
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={16} weight="light" className="text-lynra-ember" />
        <span className="text-xs font-semibold uppercase tracking-widest text-lynra-ember font-body">
          {t(hotelConfig.Name)}
        </span>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      <div className="space-y-4 pt-2">

        {/* ── Step 1: Village & Dates ── */}
        <StepSection
          stepNumber={1}
          currentStep={step}
          title="Select your dates"
          subtitle="Choose when you arrive and when you leave"
          onEdit={() => dispatch({ type: "GO_TO_STEP", step: 1 })}
          completedSummary={
            state.checkIn && state.checkOut ? (
              <div className="flex items-center gap-2 text-sm text-lynra-obsidian font-body">
                <CalendarBlank size={16} weight="light" className="text-lynra-haze" />
                <span>
                  {formatDate(state.checkIn)} — {formatDate(state.checkOut)}
                  <span className="text-lynra-haze ml-2">
                    · {nightCount} {nightCount === 1 ? "night" : "nights"} ·{" "}
                    {state.adults} {state.adults === 1 ? "adult" : "adults"}
                  </span>
                </span>
              </div>
            ) : null
          }
        >
          <div className="space-y-4">
            <DateSelector
              checkIn={state.checkIn}
              checkOut={state.checkOut}
              onChange={(ci, co) =>
                dispatch({ type: "SET_DATES", checkIn: ci, checkOut: co })
              }
            />
            <GuestSelector
              adults={state.adults}
              onChange={(count) => dispatch({ type: "SET_ADULTS", count })}
            />

            {state.availabilityError && (
              <div className="flex items-start gap-2 p-4 bg-lynra-ember/5 rounded-xl">
                <Warning size={16} weight="light" className="text-lynra-ember mt-0.5 shrink-0" />
                <p className="text-sm text-lynra-ember font-body">{state.availabilityError}</p>
              </div>
            )}

            <Button
              variant="primary"
              arrow
              className="w-full"
              onClick={handleCheckAvailability}
              loading={state.availabilityLoading}
              disabled={!state.checkIn || !state.checkOut}
            >
              Check availability
            </Button>
          </div>
        </StepSection>

        {/* ── Step 2: Room Selection ── */}
        <StepSection
          stepNumber={2}
          currentStep={step}
          title="Select your room"
          subtitle={
            availableRooms.length > 0
              ? `${availableRooms.length} ${availableRooms.length === 1 ? "option" : "options"} available`
              : undefined
          }
          onEdit={() => dispatch({ type: "GO_TO_STEP", step: 2 })}
          completedSummary={
            state.selectedRoom ? (
              <p className="text-sm text-lynra-obsidian font-body font-medium">
                {t(state.selectedRoom.category.Name)}
                <span className="text-lynra-haze ml-2 font-normal">
                  · {formatCurrency(state.selectedRoom.total, CURRENCY)}
                </span>
              </p>
            ) : null
          }
        >
          <div className="space-y-4">
            {state.availabilityLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <RoomCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!state.availabilityLoading && availableRooms.length === 0 && (
              <Card className="text-center py-8">
                <p className="text-sm text-lynra-haze font-body">
                  No rooms available for this period
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => dispatch({ type: "GO_TO_STEP", step: 1 })}
                >
                  Adjust your dates
                </Button>
              </Card>
            )}

            {availableRooms.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRooms.map((avail) => {
                    const category = hotelConfig.RoomCategories.find(
                      (c) => c.Id === avail.RoomCategoryId
                    );
                    if (!category) return null;

                    const pricing = state.availability
                      ? extractPricing(avail, state.availability.Rates, CURRENCY, nightCount)
                      : null;

                    return (
                      <RoomCard
                        key={avail.RoomCategoryId}
                        category={category}
                        availability={avail}
                        rate={pricing?.rate ?? null}
                        perNight={pricing?.perNight ?? null}
                        total={pricing?.total ?? null}
                        nightCount={nightCount}
                        imageBaseUrl={hotelConfig.ImageBaseUrl}
                        selected={state.selectedRoom?.category.Id === category.Id}
                        onSelect={() => handleSelectRoom(avail)}
                        currencyCode={CURRENCY}
                      />
                    );
                  })}
                </div>

                {allProducts.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-lynra-haze font-body mt-2">
                      Add-ons
                    </p>
                    {allProducts.map((product) => (
                      <ProductToggle
                        key={product.Id}
                        product={product}
                        selected={
                          state.selectedProductIds.includes(product.Id) ||
                          product.AlwaysIncluded
                        }
                        onToggle={() =>
                          dispatch({ type: "TOGGLE_PRODUCT", productId: product.Id })
                        }
                        currencyCode={CURRENCY}
                        nightCount={nightCount}
                      />
                    ))}
                  </div>
                )}

                <Button
                  variant="primary"
                  arrow
                  className="w-full"
                  onClick={() => dispatch({ type: "GO_TO_STEP", step: 3 })}
                  disabled={!state.selectedRoom}
                >
                  Continue
                </Button>
              </>
            )}
          </div>
        </StepSection>

        {/* ── Step 3: Guest Details ── */}
        <StepSection
          stepNumber={3}
          currentStep={step}
          title="Your details"
          subtitle="We need a few details to complete your booking"
          onEdit={() => dispatch({ type: "GO_TO_STEP", step: 3 })}
          completedSummary={
            state.guestDetails ? (
              <p className="text-sm text-lynra-obsidian font-body font-medium">
                {state.guestDetails.FirstName} {state.guestDetails.LastName}
                <span className="text-lynra-haze font-normal ml-2">
                  · {state.guestDetails.Email}
                </span>
              </p>
            ) : null
          }
        >
          <GuestForm
            initialValues={state.guestDetails}
            onSubmit={(details) => dispatch({ type: "SET_GUEST_DETAILS", details })}
            onBack={() => dispatch({ type: "GO_TO_STEP", step: 2 })}
          />
        </StepSection>

        {/* ── Step 4: Confirmation & Payment ── */}
        <StepSection
          stepNumber={4}
          currentStep={step}
          title="Confirm your booking"
          subtitle="Review your booking and confirm"
        >
          <div className="space-y-4">
            <BookingSummary state={state} products={allProducts} />

            {/* Payment placeholder */}
            <Card>
              <p className="text-xs font-semibold uppercase tracking-widest text-lynra-haze font-body mb-3">
                Payment details
              </p>
              <div className="bg-lynra-ash rounded-lg p-6 flex items-center justify-center min-h-[120px]">
                <p className="text-sm text-lynra-haze font-body text-center">
                  Secure payment form
                  <br />
                  <span className="text-xs opacity-60">(PCI Proxy integration pending)</span>
                </p>
              </div>
            </Card>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                className={`
                  mt-0.5 w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-colors duration-150
                  ${
                    termsAccepted
                      ? "bg-lynra-obsidian border-lynra-obsidian"
                      : "border-lynra-aluminium bg-lynra-white group-hover:border-lynra-granite"
                  }
                `}
                onClick={() => setTermsAccepted((v) => !v)}
              >
                {termsAccepted && (
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
              <span className="text-sm text-lynra-granite font-body leading-relaxed">
                I agree to the{" "}
                <span className="underline underline-offset-2 hover:text-lynra-obsidian cursor-pointer">
                  terms and conditions
                </span>{" "}
                and{" "}
                <span className="underline underline-offset-2 hover:text-lynra-obsidian cursor-pointer">
                  cancellation policy
                </span>
              </span>
            </label>

            {state.reservationError && (
              <div className="flex items-start gap-2 p-4 bg-lynra-ember/5 rounded-xl">
                <Warning size={16} weight="light" className="text-lynra-ember mt-0.5 shrink-0" />
                <p className="text-sm text-lynra-ember font-body">{state.reservationError}</p>
              </div>
            )}

            <Button
              variant="primary"
              arrow
              className="w-full"
              onClick={handleConfirmBooking}
              loading={state.reservationLoading}
              disabled={!termsAccepted}
            >
              Confirm booking
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => dispatch({ type: "GO_TO_STEP", step: 3 })}
            >
              Back to guest details
            </Button>
          </div>
        </StepSection>
      </div>
    </div>
  );
}
