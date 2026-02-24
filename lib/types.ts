// ─── Shared ────────────────────────────────────────────────────────────────────

export interface LocalizedString {
  [languageCode: string]: string;
}

export interface AmountValue {
  Currency: string;
  GrossValue: number;
  NetValue: number;
  TaxValues: Array<{ TaxRateCode: string; Value: number }>;
}

// ─── Hotel Config (from /hotels/get) ─────────────────────────────────────────
// Note: response is the hotel object directly (no wrapper key)

export interface RoomCategory {
  Id: string;
  Name: LocalizedString;
  Description: LocalizedString;
  ShortName?: LocalizedString;
  ImageId: string | null;
  ImageIds: string[];
  NormalBedCount: number;
  ExtraBedCount: number;
  Capacity: number | null;
  SpaceType?: string;
}

export interface Product {
  Id: string;
  Name: LocalizedString;
  Description: LocalizedString;
  CategoryId: string;
  ImageId: string | null;
  IncludedByDefault: boolean;
  AlwaysIncluded: boolean;
  // Prices keyed by currency code
  Prices: { [currencyCode: string]: AmountValue };
}

export interface HotelConfig {
  Id: string;
  Name: LocalizedString;
  Description: LocalizedString;
  DefaultLanguageCode: string;
  DefaultCurrencyCode: string;
  ImageId: string | null;
  ImageIds: string[];
  ImageBaseUrl: string;
  RoomCategories: RoomCategory[];
  Products: Product[];
}

// ─── Availability (from /hotels/getAvailability) ───────────────────────────────

export interface PricingItem {
  RateId: string;
  Price: {
    Total: { [currencyCode: string]: AmountValue };
    AveragePerNight: { [currencyCode: string]: AmountValue };
  };
}

export interface RoomOccupancyAvailability {
  Pricing: PricingItem[];
}

export interface RoomCategoryAvailability {
  RoomCategoryId: string;
  AvailableRoomCount: number;
  RoomOccupancyAvailabilities: RoomOccupancyAvailability[];
}

export interface Rate {
  Id: string;
  RateGroupId: string;
  Name: LocalizedString;
  Description: LocalizedString;
}

export interface RateGroup {
  Id: string;
  Name: LocalizedString;
}

export interface AvailabilityResponse {
  RateGroups: RateGroup[];
  Rates: Rate[];
  RoomCategoryAvailabilities: RoomCategoryAvailability[];
}

// ─── Reservation ───────────────────────────────────────────────────────────────

export interface GuestDetails {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  NationalityCode: string;
}

export interface ReservationRequest {
  // HotelId is intentionally omitted — injected server-side by the API route.
  StartUtc: string;
  EndUtc: string;
  RoomCategoryId: string;
  RateId: string;
  AdultCount: number;
  ProductIds: string[];
  Customer: GuestDetails;
  CurrencyCode: string;
}

export interface ReservationResponse {
  Id?: string;
  ReservationGroupId?: string;
  Reservations?: Array<{ Id: string; Number: string }>;
}

// ─── App State ─────────────────────────────────────────────────────────────────

export type BookingStep = 1 | 2 | 3 | 4;

export interface SelectedRoom {
  category: RoomCategory;
  availability: RoomCategoryAvailability;
  rate: Rate | null;
  perNight: number;
  total: number;
  currencyCode: string;
  nightCount: number;
}

export interface BookingState {
  step: BookingStep;
  hotelConfig: HotelConfig | null;
  configLoading: boolean;
  configError: string | null;

  checkIn: Date | null;
  checkOut: Date | null;
  adults: number;

  availability: AvailabilityResponse | null;
  availabilityLoading: boolean;
  availabilityError: string | null;
  selectedRoom: SelectedRoom | null;
  selectedProductIds: string[];

  guestDetails: GuestDetails | null;

  reservationLoading: boolean;
  reservationError: string | null;
  bookingConfirmed: boolean;
  bookingNumber: string | null;
}
