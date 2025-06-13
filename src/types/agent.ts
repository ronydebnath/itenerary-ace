
import { z } from 'zod';
import { CURRENCIES, type CurrencyCode } from '@/types/itinerary';

export const AgentAddressSchema = z.object({
  street: z.string().min(1, "Street address is required."),
  city: z.string().min(1, "City is required."),
  stateProvince: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required."),
  countryId: z.string().min(1, "Country is required."),
});
export type AgentAddress = z.infer<typeof AgentAddressSchema>;

export const AgentProfileSchema = z.object({
  id: z.string().default(() => `agent_${crypto.randomUUID()}`),
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phoneNumber: z.string().optional(),
  agencyName: z.string().optional(),
  agencyAddress: AgentAddressSchema.optional(),
  preferredCurrency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency code"),
  specializations: z.string().optional().describe("e.g., Luxury Travel, Adventure Tours, Corporate"),
  yearsOfExperience: z.coerce.number().int().min(0).optional(),
  bio: z.string().max(500, "Bio should not exceed 500 characters.").optional(),
  profilePictureUrl: z.string().url("Invalid URL for profile picture.").optional(),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;
