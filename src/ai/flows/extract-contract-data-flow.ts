
'use server';
/**
 * @fileOverview An AI flow to extract service pricing information from contract text.
 *
 * - extractContractData - A function that takes contract text and returns structured service data.
 * - ExtractContractDataInput - The input type for the extractContractData function.
 * - ExtractContractDataOutput - The return type for the extractContractData function.
 */

import { z } from 'genkit';
import { CURRENCIES, SERVICE_CATEGORIES, ItineraryItemType, CurrencyCode, VEHICLE_TYPES, VehicleType } from '@/types/itinerary';

// Define the validation function for VehicleType separately
const isValidVehicleType = (val: unknown): val is VehicleType => {
  return VEHICLE_TYPES.includes(val as VehicleType);
};

// Define a more flexible output schema for AI extraction
export const AIContractDataOutputSchema = z.object({
  name: z.string().optional().describe('The name of the service or hotel.'),
  province: z.string().optional().describe('The province or location of the service. Extract if explicitly mentioned.'),
  category: z.custom<ItineraryItemType>((val) => SERVICE_CATEGORIES.includes(val as ItineraryItemType), "Invalid category").optional().describe(`The category of the service. Must be one of: ${SERVICE_CATEGORIES.join(', ')}`),
  subCategory: z.string().optional().describe('A sub-category or specific type (e.g., room type for hotels, activity type, vehicle type for transfers).'),
  price1: z.number().optional().describe('Primary price (e.g., adult price, room rate, cost per vehicle).'),
  price2: z.number().optional().describe('Secondary price (e.g., child price, extra bed rate). Only if applicable and clearly distinct.'),
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency").optional().describe(`The currency code. Must be one of: ${CURRENCIES.join(', ')}`),
  unitDescription: z.string().optional().describe('Description of what the price unit refers to (e.g., "per person", "per night", "per vehicle").'),
  notes: z.string().optional().describe('Any additional notes or important details about the service.'),
  maxPassengers: z.number().int().min(1).optional().describe('Maximum number of passengers for vehicle transfers, if specified.'),
  // We are omitting seasonalRates for direct extraction into ServicePriceItem as it's too complex for a single pass.
  // For transfers, try to identify if it's 'ticket' or 'vehicle' basis and extract vehicle type if applicable.
  transferModeAttempt: z.enum(['ticket', 'vehicle']).optional().describe('If the service is a transfer, attempt to identify if it is priced per ticket or per vehicle.'),
  vehicleTypeAttempt: z.custom(isValidVehicleType).optional().describe(`If a vehicle transfer, attempt to identify the vehicle type (e.g., ${VEHICLE_TYPES.join(', ')})`)
});
export type AIContractDataOutput = z.infer<typeof AIContractDataOutputSchema>;

export const ExtractContractDataInputSchema = z.object({
  contractText: z.string().min(50, { message: "Contract text must be at least 50 characters." }).describe('The full text content of the service contract.'),
});
export type ExtractContractDataInput = z.infer<typeof ExtractContractDataInputSchema>;


export async function extractContractData(input: ExtractContractDataInput): Promise<AIContractDataOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const httpReferer = process.env.OPENROUTER_HTTP_REFERER;
  const xTitle = process.env.OPENROUTER_X_TITLE;

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    console.error('OpenRouter API key is missing or not configured in .env file.');
    throw new Error('OpenRouter API key is not configured.');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (httpReferer) headers['HTTP-Referer'] = httpReferer;
  if (xTitle) headers['X-Title'] = xTitle;

  const promptText = `
    You are an AI assistant specialized in extracting structured information from service contracts for a travel agency.
    Your task is to parse the following contract text and extract details for a single service (e.g., hotel, activity, transfer).
    Focus on the primary service being offered.

    Contract Text:
    \`\`\`
    ${input.contractText}
    \`\`\`

    Please extract the following information and provide it in a JSON object format.
    If a field is not mentioned or cannot be reliably determined, omit it or set its value to null.
    - name: The main name of the service, tour, or hotel.
    - province: The city or province where the service is located (e.g., "Bangkok", "Phuket"). Only if explicitly mentioned.
    - category: The type of service. Choose one from: "hotel", "activity", "transfer", "meal", "misc".
    - subCategory: More specific type. For 'hotel', this could be a default room type. For 'transfer', if it's 'vehicle' mode, this should be the vehicle type (e.g., "Sedan", "Van"). For 'activity', a type like "Tour", "Entrance Fee".
    - price1: The primary price. For hotels, this is the default room rate. For activities/meals, adult price. For transfers on ticket basis, adult ticket price. For transfers on vehicle basis, cost per vehicle.
    - price2: A secondary price if applicable. For hotels, default extra bed rate. For activities/meals, child price. For ticket transfers, child ticket price. Omit if not applicable.
    - currency: The currency code (e.g., "THB", "USD"). Must be one of ${CURRENCIES.join(', ')}.
    - unitDescription: What the price refers to (e.g., "per night", "per person", "per vehicle", "per ticket").
    - notes: Any important notes, terms, conditions, or inclusions/exclusions.
    - maxPassengers: For 'transfer' category with 'vehicle' mode, the maximum number of passengers the vehicle can hold.
    - transferModeAttempt: If category is 'transfer', attempt to infer if it's "ticket" basis or "vehicle" basis.
    - vehicleTypeAttempt: If transferModeAttempt is 'vehicle', attempt to infer one of these vehicle types: ${VEHICLE_TYPES.join(', ')}. Match this to subCategory if possible.

    Prioritize accuracy. If unsure, omit the field. For prices, provide numbers only.
    Return ONLY the JSON object.
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        "model": "google/gemma-3-27b-it:free", // Or your preferred model
        "messages": [{ "role": "user", "content": promptText }],
        "response_format": { "type": "json_object" }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenRouter API Error for Contract Parsing: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`OpenRouter API request for contract parsing failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      let content = data.choices[0].message.content;
      if (content.startsWith("```json")) {
        content = content.substring(7);
        if (content.endsWith("```")) {
          content = content.substring(0, content.length - 3);
        }
      }
      try {
        const parsedJson = JSON.parse(content);
        // Validate with Zod schema before returning
        const validationResult = AIContractDataOutputSchema.safeParse(parsedJson);
        if (validationResult.success) {
          return validationResult.data;
        } else {
          console.error('OpenRouter response JSON does not match AIContractDataOutputSchema:', validationResult.error.errors);
          console.error('Received JSON string for contract parsing:', content);
          // Return the raw parsed JSON if validation fails, client can try to make sense of it or show an error.
          // Or throw new Error to indicate partial failure
          return parsedJson; // Or throw new Error('AI response validation failed');
        }
      } catch (jsonError: any) {
        console.error('Error parsing JSON from OpenRouter for contract data:', jsonError);
        console.error('Received content string before parsing:', content);
        throw new Error(`Failed to parse JSON response for contract data: ${jsonError.message}`);
      }
    } else {
      console.error('Unexpected response structure from OpenRouter API for contract parsing:', data);
      throw new Error('Failed to extract contract data from OpenRouter API response.');
    }
  } catch (error: any) {
    console.error('Error calling OpenRouter API for contract parsing:', error);
    throw new Error(`Failed to extract contract data: ${error.message}`);
  }
}
