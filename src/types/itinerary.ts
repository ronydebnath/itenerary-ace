
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

export interface ActivityItem extends BaseItem {
  type: 'activity';
  adultPrice: number;
  childPrice?: number;
  endDay?: number; 
}

// New Hotel Data Structure Definitions
export interface HotelCharacteristic {
  id: string;
  key: string; // e.g., "Bed Type", "View", "Size", "Amenities"
  value: string; // e.g., "Queen", "City View", "25 m²", "Wi-Fi, Air Conditioning"
}

export interface RoomTypeSeasonalPrice {
  id: string;
  seasonName: string; // e.g., "High Season", "Low Season"
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  rate: number;      // Price per night for this room type during this season
}

export interface HotelRoomTypeDefinition {
  id: string;
  name: string; // e.g., "Standard Room", "Deluxe Room"
  characteristics: HotelCharacteristic[];
  notes?: string;
  seasonalPrices: RoomTypeSeasonalPrice[];
}

export interface HotelDefinition {
  id: string;
  name: string; // e.g., "Grand Riverside Hotel"
  province: string;
  roomTypes: HotelRoomTypeDefinition[];
}
// End of New Hotel Data Structure Definitions


// Updated HotelItem for the itinerary
export interface SelectedHotelRoomConfiguration {
  id: string; // Unique ID for this specific booking of a room type
  roomTypeDefinitionId: string; // Links to HotelRoomTypeDefinition.id
  roomTypeName: string; // Copied from HotelRoomTypeDefinition.name for easy display
  numRooms: number;
  assignedTravelerIds: string[];
}

export interface HotelItem extends BaseItem {
  type: 'hotel';
  checkoutDay: number; // Day number for checkout
  hotelDefinitionId: string; // Links to HotelDefinition.id
  selectedRooms: SelectedHotelRoomConfiguration[];
  // childrenSharingBed is removed, occupancy is handled by room type characteristics and traveler assignment
  // Old 'rooms' field (HotelRoomConfiguration) is removed
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
  occupancyDetails?: HotelOccupancyDetail[]; // For hotels
}

// Updated for new Hotel Structure
export interface HotelOccupancyDetail {
  roomTypeName: string;
  numRooms: number;
  nights: number;
  characteristics?: string; // Comma-separated key: value pairs
  assignedTravelerLabels: string;
  totalRoomBlockCost: number;
}


export type AISuggestion = {
  suggestion: string;
  estimatedCostSavings: number;
  reasoning: string;
};

export const SERVICE_CATEGORIES: ItineraryItemType[] = ['transfer', 'activity', 'hotel', 'meal', 'misc'];

export interface SeasonalRate { // This is for the old ServicePriceItem 'hotel' type, will be deprecated for hotels
  id: string;
  startDate: string; 
  endDate: string;   
  roomRate: number;
  extraBedRate?: number;
}

export interface ServicePriceItem { // This will no longer be primarily used for hotels, HotelDefinition takes over
  id: string;
  name: string;
  province?: string; 
  category: ItineraryItemType;
  subCategory?: string; 
  price1: number; 
  price2?: number; 
  currency: CurrencyCode;
  unitDescription: string; 
  notes?: string;
  seasonalRates?: SeasonalRate[]; // Specific to 'hotel' category (old system)
  maxPassengers?: number; 
}

export interface ProvinceItem {
  id: string;
  name: string;
}
