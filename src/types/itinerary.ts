
/**
 * @fileoverview This file defines the core data structures and types used throughout the Itinerary Ace application,
 * particularly for representing trip data, itinerary items, pricing, and related entities. It establishes
 * the shape of data for features like itinerary planning, cost calculation, and service management.
 *
 * Key types include:
 * - `TripData`: The root object for an entire itinerary.
 * - `ItineraryItem`: A union type representing various services like transfers, activities, hotels, etc.
 * - `ServicePriceItem`: Defines the structure for master service pricing records.
 * - `HotelDefinition`: Defines the structure for master hotel data.
 * - `Traveler`, `PaxDetails`, `TripSettings`: Supporting types for managing trip participants and global settings.
 * - Various enums like `CURRENCIES`, `VEHICLE_TYPES`.
 *
 * @bangla এই ফাইলটি ইটিনেরারি এস অ্যাপ্লিকেশনের মূল ডেটা কাঠামো এবং টাইপগুলি সংজ্ঞায়িত করে,
 * বিশেষত ট্রিপ ডেটা, ভ্রমণপথের আইটেম, মূল্য নির্ধারণ এবং সম্পর্কিত সত্তাগুলির উপস্থাপনার জন্য। এটি
 * ভ্রমণপথ পরিকল্পনা, খরচ গণনা এবং পরিষেবা ব্যবস্থাপনার মতো বৈশিষ্ট্যগুলির জন্য ডেটার আকার নির্ধারণ করে।
 *
 * মূল টাইপগুলির মধ্যে রয়েছে:
 * - `TripData`: সম্পূর্ণ ভ্রমণপথের জন্য রুট অবজেক্ট।
 * - `ItineraryItem`: একটি ইউনিয়ন টাইপ যা ট্রান্সফার, কার্যকলাপ, হোটেল ইত্যাদির মতো বিভিন্ন পরিষেবা উপস্থাপন করে।
 * - `ServicePriceItem`: মাস্টার পরিষেবা মূল্য রেকর্ডের জন্য কাঠামো সংজ্ঞায়িত করে।
 * - `HotelDefinition`: মাস্টার হোটেল ডেটার জন্য কাঠামো সংজ্ঞায়িত করে।
 * - `Traveler`, `PaxDetails`, `TripSettings`: ট্রিপ অংশগ্রহণকারীদের এবং গ্লোবাল সেটিংস পরিচালনার জন্য সহায়ক টাইপ।
 * - `CURRENCIES`, `VEHICLE_TYPES` এর মতো বিভিন্ন enum।
 */
export interface Traveler {
  id: string; // e.g., "A1", "C1"
  label: string; // e.g., "Adult 1", "Child 1"
  type: 'adult' | 'child';
}

// Base system currencies. Custom currencies can be added via localStorage.
export const CURRENCIES = ['USD', 'THB', 'MYR', 'BDT'] as const; // Added USD
export const REFERENCE_CURRENCY: CurrencyCode = "USD";
// Updated CurrencyCode to reflect that (typeof CURRENCIES)[number] now includes USD
export type CurrencyCode = (typeof CURRENCIES)[number] | (string & {}); // Allows for custom string currency codes

export interface PaxDetails {
  adults: number;
  children: number;
  currency: CurrencyCode;
}

export interface TripSettings {
  numDays: number;
  startDate: string; // ISO date string, now mandatory
  budget?: number;
  selectedCountries: string[]; // Array of selected country IDs
  selectedProvinces: string[]; // Stores province names for filtering
  isTemplate?: boolean;
  templateCategory?: string;
}

export const VEHICLE_TYPES = [
  'Sedan', 'MPV', 'SUV', 'Van', 'Minibus', 'Bus',
  'Ferry', 'Longtail Boat', 'Speedboat',
  'Motorbike Taxi', 'Tuk-tuk', 'Other'
] as const;
export type VehicleType = typeof VEHICLE_TYPES[number];

export const BOOKING_STATUSES = ["Pending", "Requested", "Confirmed", "Unavailable", "Cancelled"] as const;
export type BookingStatus = typeof BOOKING_STATUSES[number];

export const OVERALL_BOOKING_STATUSES = ["NotStarted", "InProgress", "PartiallyBooked", "FullyBooked", "Issues"] as const;
export type OverallBookingStatus = typeof OVERALL_BOOKING_STATUSES[number];


export interface BaseItem {
  id: string;
  day: number;
  name: string;
  note?: string;
  excludedTravelerIds: string[];
  selectedServicePriceId?: string;
  aiSuggested?: boolean;
  originalCost?: number;
  countryId?: string; // ID of the country for this item
  countryName?: string; // Name of the country for this item (denormalized for convenience)
  province?: string; // Province name
  bookingStatus?: BookingStatus;
  confirmationRef?: string;
}

export interface VehicleOption {
  id: string;
  vehicleType: VehicleType;
  price: number;
  maxPassengers: number;
  notes?: string;
}

export interface TransferItem extends BaseItem {
  type: 'transfer';
  mode: 'ticket' | 'vehicle';
  adultTicketPrice?: number;
  childTicketPrice?: number;
  vehicleType?: VehicleType; // For vehicle mode if not using detailed vehicleOptions from service
  costPerVehicle?: number;   // For vehicle mode if not using detailed vehicleOptions from service
  vehicles?: number;         // For vehicle mode
  selectedVehicleOptionId?: string; // Refers to VehicleOption.id within a ServicePriceItem
}

export interface ActivityPackageDefinition {
  id: string;
  name: string;
  price1: number; // Typically adult price
  price2?: number; // Typically child price
  notes?: string;
  validityStartDate?: string; // YYYY-MM-DD
  validityEndDate?: string;   // YYYY-MM-DD
  closedWeekdays?: number[]; // 0 (Sun) to 6 (Sat)
  specificClosedDates?: string[]; // Array of YYYY-MM-DD
}

export interface ActivityItem extends BaseItem {
  type: 'activity';
  adultPrice: number;    // Actual price used for this item instance
  childPrice?: number;   // Actual price used for this item instance
  endDay?: number;       // For multi-day activities
  selectedPackageId?: string; // Refers to ActivityPackageDefinition.id within a ServicePriceItem
}

export interface HotelCharacteristic {
  id: string;
  key: string;
  value: string;
}

export interface RoomTypeSeasonalPrice {
  id: string;
  seasonName?: string;
  startDate: string | Date; // YYYY-MM-DD or Date object, needs consistent handling
  endDate: string | Date;   // YYYY-MM-DD or Date object
  rate: number;      // Nightly rate for the room
  extraBedRate?: number;
}

export interface HotelRoomTypeDefinition {
  id: string;
  name: string;
  extraBedAllowed?: boolean;
  notes?: string;
  seasonalPrices: RoomTypeSeasonalPrice[];
  characteristics: HotelCharacteristic[];
  price1?: number; // Fallback for simple data, but seasonalPrices is preferred
}

// Represents the master definition of a hotel, stored globally
export interface HotelDefinition {
  id: string;
  name: string;
  countryId: string;
  province: string; // Province Name
  starRating?: number | null; // Star rating from 1 to 5, or null/undefined if not rated
  roomTypes: HotelRoomTypeDefinition[];
}

// Represents a specific room configuration selected for an itinerary item
export interface SelectedHotelRoomConfiguration {
  id: string; // Unique ID for this specific booking instance of a room type
  roomTypeDefinitionId: string; // Refers to HotelRoomTypeDefinition.id
  roomTypeNameCache: string; // Denormalized for display convenience
  numRooms: number;
  assignedTravelerIds: string[]; // IDs of travelers assigned to this room block
  addExtraBed?: boolean; // User's choice to add an extra bed for this booking
}

export interface HotelItem extends BaseItem {
  type: 'hotel';
  checkoutDay: number;
  hotelDefinitionId: string; // Refers to HotelDefinition.id
  selectedRooms: SelectedHotelRoomConfiguration[]; // Array of specific room bookings
  childrenSharingBed?: boolean; // Added for clarity in hotel calculations, default true for now
}

export interface MealItem extends BaseItem {
  type: 'meal';
  adultMealPrice: number;
  childMealPrice?: number;
  totalMeals: number; // Number of this meal (e.g., 2 for 2 dinners)
}

export interface MiscItem extends BaseItem {
  type: 'misc';
  unitCost: number;
  quantity: number;
  costAssignment: 'perPerson' | 'total'; // How the cost is applied
}

export type ItineraryItemType = 'transfer' | 'activity' | 'hotel' | 'meal' | 'misc';
export type ItineraryItem = TransferItem | ActivityItem | HotelItem | MealItem | MiscItem;

export interface DayItinerary {
  items: ItineraryItem[];
}

export interface ItineraryMetadata {
  id: string;
  itineraryName: string;
  clientName?: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface TripData {
  id: string; // Unique Itinerary ID
  itineraryName: string;
  clientName?: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  settings: TripSettings;
  pax: PaxDetails;
  travelers: Traveler[];
  days: { [dayNumber: number]: DayItinerary };
  quotationRequestId?: string;
  version?: number;
  overallBookingStatus?: OverallBookingStatus;
  adminRevisionNotes?: string; 
}

export interface CostSummary {
  grandTotal: number;
  perPersonTotals: { [travelerId: string]: number };
  detailedItems: DetailedSummaryItem[];
}

export interface DetailedSummaryItem {
  id: string;
  type: string; // e.g., "Hotels", "Activities"
  day?: number;
  name: string;
  note?: string;
  countryName?: string; // For display in summary
  province?: string;  // For display in summary
  configurationDetails: string;
  excludedTravelers: string;
  adultCost: number;
  childCost: number;
  totalCost: number;
  occupancyDetails?: HotelOccupancyDetail[]; // Specific to hotels
  bookingStatus?: BookingStatus; // Added for summary display
  confirmationRef?: string;    // Added for summary display
}

export interface HotelOccupancyDetail { // For cost summary display
  roomTypeName: string;
  numRooms: number;
  nights: number;
  characteristics?: string;
  assignedTravelerLabels: string;
  totalRoomBlockCost: number;
  extraBedAdded?: boolean; // To show if an extra bed was included in this block's cost
}

export type AISuggestion = {
  suggestion: string;
  estimatedCostSavings: number;
  reasoning: string;
};

export const SERVICE_CATEGORIES: ItineraryItemType[] = ['transfer', 'activity', 'hotel', 'meal', 'misc'];

export interface SurchargePeriod {
  id: string;
  name: string;
  startDate: string | Date; // YYYY-MM-DD
  endDate: string | Date;   // YYYY-MM-DD
  surchargeAmount: number;
}
// Represents a master service price definition, stored globally
export interface ServicePriceItem {
  id: string;
  name: string;
  countryId?: string; // Country this service is primarily associated with
  province?: string;  // Province this service is primarily associated with
  category: ItineraryItemType;

  // For simple pricing (ticket transfers, meals, misc, or fallback for activities)
  price1?: number;       // e.g., Adult price, Unit cost
  price2?: number;       // e.g., Child price
  subCategory?: string;  // e.g., Meal type, Misc item type, or "ticket" for transfers

  // Transfer specific
  transferMode?: 'ticket' | 'vehicle';
  vehicleOptions?: VehicleOption[]; // For vehicle-based transfers
  maxPassengers?: number; // General max pax if not using vehicleOptions

  // Currency for this service's price(s)
  currency: CurrencyCode;
  unitDescription?: string; // e.g., "per person", "per night", "per vehicle"
  notes?: string;

  // Complex pricing structures
  hotelDetails?: HotelDefinition; // If category is 'hotel', this links to full hotel def
  activityPackages?: ActivityPackageDefinition[]; // If category is 'activity'
  surchargePeriods?: SurchargePeriod[]; // Mainly for vehicle transfers

  // For UI state in forms, not part of the core definition itself
  selectedServicePriceId?: string;
}


export interface CountryItem {
  id: string;
  name: string;
  defaultCurrency: CurrencyCode;
}

export interface ProvinceItem {
  id: string;
  name: string;
  countryId: string; // ID of the parent country
}

export type SchedulingData = Pick<ActivityPackageDefinition, 'validityStartDate' | 'validityEndDate' | 'closedWeekdays' | 'specificClosedDates'>;

export interface ExchangeRate {
  id: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  updatedAt: string; // ISO Date string
  source?: 'api' | 'manual';
}

// Type for a managed currency (can be system or custom)
export interface ManagedCurrency {
  code: CurrencyCode;
  isCustom: boolean;
}

export interface SpecificMarkupRate {
  id: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  markupPercentage: number;
  updatedAt: string; // ISO Date string
}

// Default Country IDs for demo data
export const DEFAULT_THAILAND_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
export const DEFAULT_MALAYSIA_ID = "986a76d0-9490-4e0f-806a-1a3e9728a708";
export const DEFAULT_BANGLADESH_ID = "bd010101-0000-0000-0000-000000000001";
