
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
  selectedProvinces: string[]; // Stores province names for filtering
  selectedCountries: string[]; // Stores country names for filtering
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
  countryName?: string; // Added
  province?: string; // This will store province name, countryName provides context
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
  vehicleType?: VehicleType;
  costPerVehicle?: number;
  vehicles?: number;
  selectedVehicleOptionId?: string;
}

export interface ActivityPackageDefinition {
  id: string;
  name: string;
  price1: number;
  price2?: number;
  notes?: string;
  validityStartDate?: string;
  validityEndDate?: string;
  closedWeekdays?: number[];
  specificClosedDates?: string[];
}

export interface ActivityItem extends BaseItem {
  type: 'activity';
  adultPrice: number;
  childPrice?: number;
  endDay?: number;
  selectedPackageId?: string;
}

export interface HotelCharacteristic {
  id: string;
  key: string;
  value: string;
}

export interface RoomTypeSeasonalPrice {
  id: string;
  seasonName?: string;
  startDate: string;
  endDate: string;
  rate: number;
  extraBedRate?: number;
}

export interface HotelRoomTypeDefinition {
  id: string;
  name: string;
  extraBedAllowed?: boolean;
  notes?: string;
  seasonalPrices: RoomTypeSeasonalPrice[];
  characteristics: HotelCharacteristic[];
}

export interface HotelDefinition {
  id: string;
  name: string;
  countryId: string; // Added
  province: string; // Province Name
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
  hotelDefinitionId: string; // Refers to HotelDefinition.id
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
  type: string;
  day?: number;
  name: string;
  note?: string;
  countryName?: string; // Added
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
  surchargeAmount: number;
}

export interface ServicePriceItem {
  id: string;
  name: string;
  countryId?: string; // Added
  province?: string; // Name of the province
  category: ItineraryItemType;
  price1?: number;
  price2?: number;
  subCategory?: string;
  transferMode?: 'ticket' | 'vehicle';
  vehicleOptions?: VehicleOption[];
  maxPassengers?: number;
  currency: CurrencyCode;
  unitDescription?: string;
  notes?: string;
  hotelDetails?: HotelDefinition; // This will store the full HotelDefinition now
  activityPackages?: ActivityPackageDefinition[];
  surchargePeriods?: SurchargePeriod[];
  selectedServicePriceId?: string; // Used in forms, not for final storage of this item
}

export interface CountryItem {
  id: string;
  name: string;
}

export interface ProvinceItem {
  id: string;
  name: string;
  countryId: string; // ID of the parent country
}

export type SchedulingData = Pick<ActivityPackageDefinition, 'validityStartDate' | 'validityEndDate' | 'closedWeekdays' | 'specificClosedDates'>;
