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
export const QUOTATION_STATUSES = ["Pending", "Quoted", "ConfirmedByAgent", "BookingInProgress", "Booked", "Cancelled"] as const;
export const MEAL_PLAN_OPTIONS = ["No Meal", "Breakfast Only", "Breakfast and Lunch/Dinner", "Breakfast, Lunch and Dinner"] as const;


export const QuotationRequestClientInfoSchema = z.object({
  adults: z.coerce.number().int().min(1, "At least one adult is required."),
  children: z.coerce.number().int().min(0, "Number of children must be 0 or more.").default(0),
  childAges: z.string().optional().describe("Comma-separated ages, e.g., 5, 8, 12. Required if children > 0."),
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
  tripType: z.enum(TRIP_TYPES).optional(),
  budgetRange: z.enum(BUDGET_RANGES).optional(),
  budgetAmount: z.coerce.number().positive("Budget amount must be positive.").optional(),
  budgetCurrency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid budget currency.").default('USD'),
}).refine(data => {
  if (data.preferredStartDate && data.preferredEndDate) {
    try {
        const startDate = parseISO(data.preferredStartDate);
        const endDate = parseISO(data.preferredEndDate);
        if (isValid(startDate) && isValid(endDate)) {
            return endDate >= startDate;
        }
        return true;
    } catch (e) {
        return true;
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
  hotelStarRating: z.enum(HOTEL_STAR_RATINGS).default("3 Stars"),
  roomPreferences: z.string().optional().describe("e.g., 1 King Bed, 2 Twin + Extra Bed, Connecting rooms"),
  specificHotelRequests: z.string().optional().describe("Preferred hotel names or location details"),
});

export const QuotationRequestActivityPrefsSchema = z.object({
  requestedActivities: z.string().optional().describe("List specific tours, activities, or general interests."),
});

export const QuotationRequestFlightPrefsSchema = z.object({
  airportTransfersRequired: z.boolean().default(false),
  activityTransfersRequired: z.boolean().default(false).describe("Request transfers for scheduled activities/tours"),
});

export const QuotationRequestMealPrefsSchema = z.object({
  mealPlan: z.enum(MEAL_PLAN_OPTIONS).optional(),
});
export type QuotationRequestMealPrefs = z.infer<typeof QuotationRequestMealPrefsSchema>;


export const QuotationRequestSchema = z.object({
  id: z.string().default(() => `QR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
  requestDate: z.string().default(() => new Date().toISOString()),
  agentId: z.string().optional(),
  clientInfo: QuotationRequestClientInfoSchema,
  tripDetails: QuotationRequestTripDetailsSchema,
  accommodationPrefs: QuotationRequestAccommodationPrefsSchema.optional(),
  activityPrefs: QuotationRequestActivityPrefsSchema.optional(),
  flightPrefs: QuotationRequestFlightPrefsSchema.optional(),
  mealPrefs: QuotationRequestMealPrefsSchema.optional(),
  otherRequirements: z.string().optional(),
  status: z.enum(QUOTATION_STATUSES).default("Pending"),
  linkedItineraryId: z.string().optional().describe("ID of the itinerary created for this request"),
  updatedAt: z.string().optional().default(() => new Date().toISOString()),
});

export type QuotationRequestStatus = z.infer<typeof QuotationRequestSchema.shape.status>;
export type QuotationRequest = z.infer<typeof QuotationRequestSchema>;
export type QuotationRequestClientInfo = z.infer<typeof QuotationRequestClientInfoSchema>;
export type QuotationRequestTripDetails = z.infer<typeof QuotationRequestTripDetailsSchema>;
export type QuotationRequestAccommodationPrefs = z.infer<typeof QuotationRequestAccommodationPrefsSchema>;
export type QuotationRequestActivityPrefs = z.infer<typeof QuotationRequestActivityPrefsSchema>;
export type QuotationRequestFlightPrefs = z.infer<typeof QuotationRequestFlightPrefsSchema>;
