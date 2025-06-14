/**
 * @fileoverview This file defines the data structures and Zod schemas for quotation requests.
 * It includes schemas for client information, trip details (destinations, dates, budget),
 * accommodation preferences, activity preferences, and flight requirements. These types are
 * used when an agent submits a request for a new travel quotation.
 *
 * @bangla এই ফাইলটি উদ্ধৃতি অনুরোধের জন্য ডেটা কাঠামো এবং Zod স্কিমাগুলি সংজ্ঞায়িত করে।
 * এটিতে ক্লায়েন্টের তথ্য, ভ্রমণের বিবরণ (গন্তব্য, তারিখ, বাজেট), আবাসনের পছন্দ, কার্যকলাপের
 * পছন্দ এবং ফ্লাইটের প্রয়োজনীয়তার জন্য স্কিমা অন্তর্ভুক্ত রয়েছে। এই প্রকারগুলি ব্যবহৃত হয়
 * যখন কোনও এজেন্ট নতুন ভ্রমণ উদ্ধৃতির জন্য অনুরোধ জমা দেয়।
 */
import { z } from 'zod';
import { CURRENCIES, type CurrencyCode } from '@/types/itinerary';
import { isValid, parseISO } from 'date-fns';

export const TRIP_TYPES = ["Leisure", "Business", "Honeymoon", "Family", "Adventure", "Cultural", "Cruise", "Group Tour", "Backpacking", "Other"] as const;
export const BUDGET_RANGES = ["Economy/Budget", "Mid-Range/Comfort", "Luxury/Premium", "Specific Amount (see notes)"] as const;
export const HOTEL_STAR_RATINGS = ["Any", "2 Stars", "3 Stars", "4 Stars", "5 Stars", "Boutique/Unrated"] as const;

export const QuotationRequestClientInfoSchema = z.object({
  clientReference: z.string().optional().describe("Agent's internal reference for the client"),
  adults: z.coerce.number().int().min(1, "At least one adult is required."),
  children: z.coerce.number().int().min(0, "Number of children must be 0 or more.").default(0),
  childAges: z.string().optional().describe("Comma-separated ages, e.g., 5, 8, 12. Required if children > 0."),
  // groupOrFamilyName: z.string().optional(), // Removed as per user request
}).refine(data => !(data.children > 0 && (!data.childAges || data.childAges.trim() === "")), {
  message: "Please provide ages for children if number of children is greater than 0.",
  path: ["childAges"],
});

export const QuotationRequestTripDetailsSchema = z.object({
  preferredCountryIds: z.array(z.string()).min(1, "At least one country must be selected."),
  preferredProvinceNames: z.array(z.string()).optional().describe("Specific provinces of interest within selected countries."),
  preferredStartDate: z.string().refine(val => val ? isValid(parseISO(val)) : true, { message: "Invalid start date."}).optional(),
  preferredEndDate: z.string().refine(val => val ? isValid(parseISO(val)) : true, { message: "Invalid end date."}).optional(),
  durationDays: z.coerce.number().int().min(1, "Trip duration must be at least 1 day.").optional(),
  durationNights: z.coerce.number().int().min(0).optional(),
  tripType: z.enum(TRIP_TYPES).optional(), // Made optional
  budgetRange: z.enum(BUDGET_RANGES).optional(),
  budgetAmount: z.coerce.number().positive("Budget amount must be positive.").optional(),
  budgetCurrency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode)).default('USD'),
}).refine(data => {
  if (data.preferredStartDate && data.preferredEndDate) {
    try { // Add try-catch for robustness against invalid date strings during validation
        const startDate = parseISO(data.preferredStartDate);
        const endDate = parseISO(data.preferredEndDate);
        if (isValid(startDate) && isValid(endDate)) {
            return endDate >= startDate;
        }
        return true; // If dates are invalid at this stage, let individual field validation handle it
    } catch (e) {
        return true; // If parsing fails, let field validation handle it
    }
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

