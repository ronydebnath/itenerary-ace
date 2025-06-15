/**
 * @fileoverview This file defines the data structures and Zod schemas related to travel agent profiles and agencies.
 * It includes schemas for agent addresses, agency details, and the main agent profile, which covers personal details,
 * agency information, professional preferences, and contact methods.
 *
 * @bangla এই ফাইলটি ট্রাভেল এজেন্ট প্রোফাইল এবং এজেন্সি সম্পর্কিত ডেটা কাঠামো এবং Zod স্কিমাগুলি সংজ্ঞায়িত করে।
 * এটিতে এজেন্টের ঠিকানা, এজেন্সি বিবরণ এবং মূল এজেন্ট প্রোফাইলের জন্য স্কিমা অন্তর্ভুক্ত রয়েছে, যা ব্যক্তিগত বিবরণ,
 * এজেন্সির তথ্য, পেশাগত পছন্দ এবং যোগাযোগের পদ্ধতিগুলি কভার করে।
 */
import { z } from 'zod';
import { CURRENCIES, type CurrencyCode, type CountryItem } from '@/types/itinerary';

export const AgentAddressSchema = z.object({
  street: z.string().min(1, "Street address is required."),
  city: z.string().min(1, "City is required."),
  stateProvince: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required."),
  countryId: z.string().min(1, "Country is required."), // ID of a CountryItem
});
export type AgentAddress = z.infer<typeof AgentAddressSchema>;

export const AgencySchema = z.object({
  id: z.string().default(() => `agency_${crypto.randomUUID()}`),
  name: z.string().min(2, "Agency name must be at least 2 characters."),
  mainAddress: AgentAddressSchema.optional(),
  contactEmail: z.string().email("Invalid email address.").optional(),
  contactPhone: z.string().optional(),
  preferredCurrency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode) || val === "USD", "Invalid currency code").default("USD"),
});
export type Agency = z.infer<typeof AgencySchema>;

export const AgentProfileSchema = z.object({
  id: z.string().default(() => `agent_${crypto.randomUUID()}`),
  agencyId: z.string().min(1, "Agent must be associated with an agency."), // Link to Agency
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phoneNumber: z.string().optional(),
  agencyName: z.string().optional().describe("Specific office/branch name, if different from main agency"),
  specializations: z.string().optional().describe("e.g., Luxury Travel, Adventure Tours, Corporate"),
  yearsOfExperience: z.coerce.number().int().min(0).optional(),
  bio: z.string().max(500, "Bio should not exceed 500 characters.").optional(),
  profilePictureUrl: z.string()
    .url("Invalid URL for profile picture.")
    .or(z.literal("")) // Allow empty string
    .optional() // Allow undefined
    .nullable(), // Allow null
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;

