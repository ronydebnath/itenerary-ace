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
  startDate: string | null; // ISO date string or null
  budget?: number;
}

export interface BaseItem {
  id: string;
  day: number;
  name: string;
  note?: string;
  excludedTravelerIds: string[];
  selectedServicePriceId?: string; // ID of the predefined service, if selected
  // For AI suggestions, we might store original values if AI modifies them
  aiSuggested?: boolean; 
  originalCost?: number;
}

export interface TransferItem extends BaseItem {
  type: 'transfer';
  mode: 'ticket' | 'vehicle';
  adultTicketPrice?: number;
  childTicketPrice?: number;
  vehicleType?: 'Sedan' | 'SUV' | 'Van' | 'Bus' | 'Other';
  costPerVehicle?: number;
  vehicles?: number;
}

export interface ActivityItem extends BaseItem {
  type: 'activity';
  adultPrice: number;
  childPrice?: number;
  endDay?: number; // Optional, defaults to current item's day
}

export interface HotelRoomConfiguration {
  id: string; // Unique ID for this room configuration within a hotel item
  category: string;
  roomType: 'Double sharing' | 'Single room' | 'Triple sharing' | 'Family with child';
  adultsInRoom: number;
  childrenInRoom: number;
  extraBeds: number;
  numRooms: number;
  roomRate: number; // Nightly
  extraBedRate: number; // Nightly
  assignedTravelerIds: string[];
}

export interface HotelItem extends BaseItem {
  type: 'hotel';
  checkoutDay: number; // Day number for checkout
  childrenSharingBed: boolean;
  rooms: HotelRoomConfiguration[];
}

export interface MealItem extends BaseItem {
  type: 'meal';
  adultMealPrice: number;
  childMealPrice?: number;
  totalMeals: number; // Number of units/meals
}

export interface MiscItem extends BaseItem {
  type: 'misc';
  unitCost: number;
  quantity: number;
  costAssignment: 'perPerson' | 'total'; // 'total' means shared
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

// For calculated summaries
export interface CostSummary {
  grandTotal: number;
  perPersonTotals: { [travelerId: string]: number };
  detailedItems: DetailedSummaryItem[];
}

export interface DetailedSummaryItem {
  id: string; // original item id
  type: string; // e.g., 'Transfers', 'Hotels'
  day?: number; // Optional day display
  name: string;
  note?: string;
  configurationDetails: string;
  excludedTravelers: string; // Comma-separated labels
  adultCost: number;
  childCost: number;
  totalCost: number;
  // For hotels, additional occupancy details
  occupancyDetails?: HotelOccupancyDetail[];
}

export interface HotelOccupancyDetail {
  roomCategory: string;
  numRooms: number;
  nights: number;
  roomType: string;
  adults: number;
  children: number;
  extraBeds: number;
  roomRate: number;
  extraBedRate: number;
  totalOccupancyCost: number;
  assignedTravelerLabels: string;
}

// For AI suggestions
export type AISuggestion = {
  suggestion: string;
  estimatedCostSavings: number;
  reasoning: string;
};

// For Service Price Management
export const SERVICE_CATEGORIES: ItineraryItemType[] = ['transfer', 'activity', 'hotel', 'meal', 'misc'];

export interface ServicePriceItem {
  id: string;
  name: string;
  category: ItineraryItemType;
  subCategory?: string; // e.g., for Transfer: 'ticket' or 'vehicle'. For Hotel: 'Room Type A'
  price1: number; // Main price (e.g., adult price, unit cost, vehicle cost, room rate)
  price2?: number; // Secondary price (e.g., child price, extra bed rate)
  currency: CurrencyCode;
  unitDescription: string; // e.g., "per adult", "per vehicle", "per night", "per item"
  notes?: string;
}
