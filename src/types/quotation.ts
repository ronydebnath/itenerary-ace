
import { z } from 'zod';
import { CURRENCIES, type CurrencyCode } from '@/types/itinerary';
import { isValid, parseISO } from 'date-fns';

export const TRIP_TYPES = ["Leisure", "Business", "Honeymoon", "Family", "Adventure", "Cultural", "Cruise", "Group Tour", "Backpacking", "Other"] as const;
export const BUDGET_RANGES = ["Economy/Budget", "Mid-Range/Comfort", "Luxury/Premium", "Specific Amount (see notes)", "Flexible"] as const;
export const HOTEL_STAR_RATINGS = ["Any", "2 Stars", "3 Stars", "4 Stars", "5 Stars", "Boutique/Unrated"] as const;

export const QuotationRequestClientInfoSchema = z.object({
  name: z.string().min(1, "Client name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  adults: z.coerce.number().int().min(1, "At least one adult is required."),
  children: z.coerce.number().int().min(0, "Number of children must be 0 or more.").default(0),
  childAges: z.string().optional().describe("Comma-separated ages, e.g., 5, 8, 12. Required if children > 0."),
  groupOrFamilyName: z.string().optional(),
}).refine(data => !(data.children > 0 && (!data.childAges || data.childAges.trim() === "")), {
  message: "Please provide ages for children.",
  path: ["childAges"],
});

export const QuotationRequestTripDetailsSchema = z.object({
  destinations: z.string().min(3, "Please specify at least one destination.").describe("Countries, cities, regions"),
  preferredStartDate: z.string().refine(val => val ? isValid(parseISO(val)) : true, { message: "Invalid start date."}).optional(),
  preferredEndDate: z.string().refine(val => val ? isValid(parseISO(val)) : true, { message: "Invalid end date."}).optional(),
  approximateDatesOrSeason: z.string().optional().describe("e.g., Mid-June, Christmas, Around 2 weeks in August"),
  durationDays: z.coerce.number().int().min(1, "Trip duration must be at least 1 day.").optional(),
  durationNights: z.coerce.number().int().min(0).optional(),
  tripType: z.enum(TRIP_TYPES).optional(),
  budgetRange: z.enum(BUDGET_RANGES).optional(),
  budgetAmount: z.coerce.number().positive("Budget amount must be positive.").optional(),
  budgetCurrency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode)).default('USD'),
}).refine(data => {
  if (data.preferredStartDate && data.preferredEndDate) {
    return parseISO(data.preferredEndDate) >= parseISO(data.preferredStartDate);
  }
  return true;
}, {
  message: "End date cannot be before start date.",
  path: ["preferredEndDate"],
}).refine(data => !(data.budgetRange === "Specific Amount (see notes)" && data.budgetAmount === undefined), {
    message: "Please specify the budget amount if 'Specific Amount' is selected.",
    path: ["budgetAmount"],
});


export const QuotationRequestAccommodationPrefsSchema = z.object({
  hotelStarRating: z.enum(HOTEL_STAR_RATINGS).optional(),
  roomPreferences: z.string().optional().describe("e.g., 1 King Bed, 2 Twin + Extra Bed, Connecting rooms"),
  specificHotelRequests: z.string().optional().describe("Preferred hotel names or location details"),
});

export const QuotationRequestActivityPrefsSchema = z.object({
  interests: z.string().optional().describe("e.g., History, Beaches, Hiking, Shopping, Nightlife"),
  mustDoActivities: z.string().optional(),
});

export const QuotationRequestFlightPrefsSchema = z.object({
  includeFlights: z.enum(["Yes", "No", "To be discussed"]).default("To be discussed"),
  departureCity: z.string().optional(),
  preferredAirlineClass: z.string().optional().describe("e.g., Economy, Business, Specific Airline"),
  airportTransfersRequired: z.boolean().default(false),
});

export const QuotationRequestSchema = z.object({
  id: z.string().default(() => `QR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
  requestDate: z.string().default(() => new Date().toISOString()),
  agentId: z.string().optional(), // To be linked if agent auth is implemented
  clientInfo: QuotationRequestClientInfoSchema,
  tripDetails: QuotationRequestTripDetailsSchema,
  accommodationPrefs: QuotationRequestAccommodationPrefsSchema.optional(),
  activityPrefs: QuotationRequestActivityPrefsSchema.optional(),
  flightPrefs: QuotationRequestFlightPrefsSchema.optional(),
  otherRequirements: z.string().optional(),
  quotationDeadline: z.string().refine(val => val ? isValid(parseISO(val)) : true, { message: "Invalid deadline date."}).optional(),
  status: z.enum(["Pending", "Quoted", "Booked", "Cancelled"]).default("Pending"),
});

export type QuotationRequest = z.infer<typeof QuotationRequestSchema>;
export type QuotationRequestClientInfo = z.infer<typeof QuotationRequestClientInfoSchema>;
export type QuotationRequestTripDetails = z.infer<typeof QuotationRequestTripDetailsSchema>;
export type QuotationRequestAccommodationPrefs = z.infer<typeof QuotationRequestAccommodationPrefsSchema>;
export type QuotationRequestActivityPrefs = z.infer<typeof QuotationRequestActivityPrefsSchema>;
export type QuotationRequestFlightPrefs = z.infer<typeof QuotationRequestFlightPrefsSchema>;
