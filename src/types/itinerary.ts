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
  mode: 'ticket' | 'vehicle'; // Determines if pricing is per ticket or per vehicle
  adultTicketPrice?: number; // Used if mode is 'ticket'
  childTicketPrice?: number; // Used if mode is 'ticket'
  vehicleType?: 'Sedan' | 'SUV' | 'Van' | 'Bus' | 'Other'; // Used if mode is 'vehicle'
  costPerVehicle?: number; // Used if mode is 'vehicle'
  vehicles?: number; // Used if mode is 'vehicle'
}

export interface ActivityItem extends BaseItem {
  type: 'activity';
  adultPrice: number;
  childPrice?: number;
  endDay?: number; // Optional, defaults to current item's day
}

export interface HotelRoomConfiguration {
  id: string; // Unique ID for this room configuration within a hotel item
  category: string; // User-defined room category name, e.g., "Deluxe King with View"
  roomType: 'Double sharing' | 'Single room' | 'Triple sharing' | 'Family with child'; // Occupancy type
  adultsInRoom: number;
  childrenInRoom: number;
  extraBeds: number;
  numRooms: number;
  roomRate: number; // Nightly rate for this specific configuration
  extraBedRate: number; // Nightly extra bed rate for this specific configuration
  assignedTravelerIds: string[];
}

export interface HotelItem extends BaseItem {
  type: 'hotel';
  checkoutDay: number; // Day number for checkout
  childrenSharingBed: boolean; // Applies if children are not specifically assigned to rooms
  rooms: HotelRoomConfiguration[]; // Array of different room types/configs for this stay
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

export interface SeasonalRate {
  id: string;
  startDate: string; // Stored as YYYY-MM-DD string
  endDate: string;   // Stored as YYYY-MM-DD string
  roomRate: number;
  extraBedRate?: number;
}

export interface ServicePriceItem {
  id: string;
  name: string;
  category: ItineraryItemType;
  subCategory?: string; // Hotel: Default room type name; Transfer: 'ticket' or 'vehicle' (or specific vehicle type like 'Sedan')
  price1: number; // Main price: Activity/Meal: Adult Price; Transfer-Ticket: Adult Ticket; Transfer-Vehicle: Cost per Vehicle; Hotel: Default Room Rate; Misc: Unit Cost
  price2?: number; // Secondary price: Activity/Meal: Child Price; Transfer-Ticket: Child Ticket; Hotel: Default Extra Bed Rate. Not used for Transfer-Vehicle or Misc.
  currency: CurrencyCode;
  unitDescription: string; // e.g., "per adult", "per vehicle", "per night", "per item"
  notes?: string;
  seasonalRates?: SeasonalRate[]; // Specific to 'hotel' category
}
