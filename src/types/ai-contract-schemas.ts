
import { z } from 'zod';
import { CURRENCIES, SERVICE_CATEGORIES, ItineraryItemType, CurrencyCode, VEHICLE_TYPES, VehicleType } from '@/types/itinerary';

// Define the validation function for VehicleType separately
const isValidVehicleType = (val: unknown): val is VehicleType => {
  return VEHICLE_TYPES.includes(val as VehicleType);
};

// Define the validation function for CurrencyCode separately
const isValidCurrencyCode = (val: unknown): val is CurrencyCode => {
  return CURRENCIES.includes(val as CurrencyCode);
};

// Define the validation function for ItineraryItemType separately
const isValidItineraryItemType = (val: unknown): val is ItineraryItemType => {
  return SERVICE_CATEGORIES.includes(val as ItineraryItemType);
};

export const AIContractDataOutputSchema = z.object({
  name: z.string().optional().describe('The name of the service or hotel.'),
  province: z.string().optional().describe('The province or location of the service. Extract if explicitly mentioned.'),
  category: z.custom<ItineraryItemType>(isValidItineraryItemType, "Invalid category").optional().describe(`The category of the service. Must be one of: ${SERVICE_CATEGORIES.join(', ')}`),
  subCategory: z.string().optional().describe('A sub-category or specific type (e.g., room type for hotels, activity type, vehicle type for transfers).'),
  price1: z.number().optional().describe('Primary price (e.g., adult price, room rate, cost per vehicle).'),
  price2: z.number().optional().describe('Secondary price (e.g., child price, extra bed rate). Only if applicable and clearly distinct.'),
  currency: z.custom<CurrencyCode>(isValidCurrencyCode, "Invalid currency").optional().describe(`The currency code. Must be one of: ${CURRENCIES.join(', ')}`),
  unitDescription: z.string().optional().describe('Description of what the price unit refers to (e.g., "per person", "per night", "per vehicle").'), // Made optional
  notes: z.string().optional().describe('Any additional notes or important details about the service.'),
  maxPassengers: z.number().int().min(1).optional().describe('Maximum number of passengers for vehicle transfers, if specified.'),
  transferModeAttempt: z.enum(['ticket', 'vehicle']).optional().describe('If the service is a transfer, attempt to identify if it is priced per ticket or per vehicle.'),
  vehicleTypeAttempt: z.custom<VehicleType>(isValidVehicleType, "Invalid vehicle type").optional().describe(`If a vehicle transfer, attempt to identify the vehicle type (e.g., ${VEHICLE_TYPES.join(', ')})`)
});
export type AIContractDataOutput = z.infer<typeof AIContractDataOutputSchema>;

export const ExtractContractDataInputSchema = z.object({
  contractText: z.string().min(50, { message: "Contract text must be at least 50 characters." }).describe('The full text content of the service contract.'),
});
export type ExtractContractDataInput = z.infer<typeof ExtractContractDataInputSchema>;
