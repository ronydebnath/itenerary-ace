
export interface Traveler {
  id: string; // e.g., "A1", "C1"
  label: string; // e.g., "Adult 1", "Child 1"
  type: 'adult' | 'child';
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'THB', 'JPY'] as const;
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
  province?: string;
}

export interface TransferItem extends BaseItem {
  type: 'transfer';
  mode: 'ticket' | 'vehicle';
  adultTicketPrice?: number;
  childTicketPrice?: number;
  vehicleType?: VehicleType;
  costPerVehicle?: number;
  vehicles?: number;
}

// New Activity Package Definition
export interface ActivityPackageDefinition {
  id: string;
  name: string;
  price1: number; // Adult Price
  price2?: number; // Child Price (optional)
  notes?: string; // Package-specific details
  validityStartDate?: string; // ISO date string, e.g., "2024-12-01"
  validityEndDate?: string;   // ISO date string
  closedWeekdays?: number[];  // Array of day numbers (0 for Sun, 1 for Mon, ..., 6 for Sat)
  specificClosedDates?: string[]; // Array of ISO date strings for specific non-operational dates
}

export interface ActivityItem extends BaseItem {
  type: 'activity';
  adultPrice: number; // Default/main package adult price if simple activity
  childPrice?: number; // Default/main package child price if simple activity
  endDay?: number;
  selectedPackageId?: string; // To store which package is selected in the itinerary
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
  rate: number;      // Price per night for this room type during this season
  extraBedRate?: number;
}

export interface HotelRoomTypeDefinition {
  id: string;
  name: string;
  extraBedAllowed?: boolean;
  notes?: string; // For Room Details: Size, Amenities, Bed Type, View etc.
  seasonalPrices: RoomTypeSeasonalPrice[];
  characteristics: HotelCharacteristic[];
}

export interface HotelDefinition {
  id: string;
  name: string;
  province: string;
  roomTypes: HotelRoomTypeDefinition[];
}

export interface SelectedHotelRoomConfiguration {
  id: string;
  roomTypeDefinitionId: string;
  roomTypeNameCache: string;
  numRooms: number;
  assignedTravelerIds: string[];
}

export interface HotelItem extends BaseItem {
  type: 'hotel';
  checkoutDay: number;
  hotelDefinitionId: string;
  selectedRooms: SelectedHotelRoomConfiguration[];
}


export interface MealItem extends BaseItem {
  type: 'meal';
  adultMealPrice: number;
  childMealPrice?: number;
  totalMeals: number;
}

export interface MiscItem extends BaseItem {
  type: 'misc';
  unitCost: number;
  quantity: number;
  costAssignment: 'perPerson' | 'total';
}

export type ItineraryItemType = 'transfer' | 'activity' | 'hotel' | 'meal' | 'misc';
export type ItineraryItem = TransferItem | ActivityItem | HotelItem | MealItem | MiscItem;

export interface DayItinerary {
  items: ItineraryItem[];
}

export interface TripData {
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
  type: string;
  day?: number;
  name: string;
  note?: string;
  province?: string;
  configurationDetails: string;
  excludedTravelers: string;
  adultCost: number;
  childCost: number;
  totalCost: number;
  occupancyDetails?: HotelOccupancyDetail[];
}

export interface HotelOccupancyDetail {
  roomTypeName: string;
  numRooms: number;
  nights: number;
  characteristics?: string;
  assignedTravelerLabels: string;
  totalRoomBlockCost: number;
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
  surchargeAmount: number; // Fixed amount to add per vehicle for transfers
}

export interface ServicePriceItem {
  id: string;
  name: string;
  province?: string;
  category: ItineraryItemType;
  subCategory?: string; // For non-hotels or simple hotel representation
  price1?: number; // For non-hotels, simple hotels, or default activity package
  price2?: number; // For non-hotels, simple hotels, or default activity package
  currency: CurrencyCode;
  unitDescription: string;
  notes?: string;
  maxPassengers?: number;
  hotelDetails?: HotelDefinition;
  activityPackages?: ActivityPackageDefinition[]; // New field for activities
  surchargePeriods?: SurchargePeriod[]; // For vehicle-based transfer surcharges
}

export interface ProvinceItem {
  id: string;
  name: string;
}

export type SchedulingData = Pick<ActivityPackageDefinition, 'validityStartDate' | 'validityEndDate' | 'closedWeekdays' | 'specificClosedDates'>;

