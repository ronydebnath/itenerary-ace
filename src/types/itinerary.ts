
export interface Traveler {
  id: string; // e.g., "A1", "C1"
  label: string; // e.g., "Adult 1", "Child 1"
  type: 'adult' | 'child';
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'THB', 'JPY', 'MYR', 'SGD', 'VND'] as const;
export type CurrencyCode = typeof CURRENCIES[number];

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
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
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
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
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
