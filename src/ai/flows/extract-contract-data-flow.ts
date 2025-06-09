
'use server';
/**
 * @fileOverview An AI flow to extract service pricing information from contract text.
 *
 * - extractContractData - A function that takes contract text and returns structured service data.
 */

import { 
  AIContractDataOutputSchema, 
  type AIContractDataOutput,
  type ExtractContractDataInput,
  AISeasonalRateSchema // Import if you need to reference its structure, though it's used within AIContractDataOutputSchema
} from '@/types/ai-contract-schemas';
import { CURRENCIES, VEHICLE_TYPES } from '@/types/itinerary';


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
    - subCategory: More specific type. For 'hotel', this could be a default room type (e.g., "Deluxe King"). For 'transfer', if it's 'vehicle' mode, this should be the vehicle type (e.g., "Sedan", "Van"). For 'activity', a type like "Tour", "Entrance Fee".
    - price1: The primary price. For hotels, this is the **default/standard room rate per night** if explicitly mentioned. If seasonal rates cover all periods, this default rate might be omitted by you if not separately stated. For activities/meals, adult price. For transfers on ticket basis, adult ticket price. For transfers on vehicle basis, cost per vehicle.
    - price2: A secondary price if applicable. For hotels, default extra bed rate. For activities/meals, child price. For ticket transfers, child ticket price. Omit if not applicable.
    - currency: The currency code (e.g., "THB", "USD"). Must be one of ${CURRENCIES.join(', ')}.
    - unitDescription: What the price refers to (e.g., "per night", "per person", "per vehicle", "per ticket").
    - notes: Any important notes, terms, conditions, or inclusions/exclusions.
    - maxPassengers: For 'transfer' category with 'vehicle' mode, the maximum number of passengers the vehicle can hold.
    - transferModeAttempt: If category is 'transfer', attempt to infer if it's "ticket" basis or "vehicle" basis.
    - vehicleTypeAttempt: If transferModeAttempt is 'vehicle', attempt to infer one of these vehicle types: ${VEHICLE_TYPES.join(', ')}. Match this to subCategory if possible.
    - seasonalRates: An array of seasonal rate objects, ONLY if the category is 'hotel' AND specific seasonal pricing periods WITH THEIR OWN RATES are explicitly mentioned in the contract.
      Each object in the array should represent a distinct pricing period and MUST include:
      - seasonName: (Optional) A name for the season (e.g., "High Season", "Peak Offer", "Booking Period").
      - startDate: (Required) The start date of the season. Convert to YYYY-MM-DD format (e.g., "November 1st, 2024" becomes "2024-11-01").
      - endDate: (Required) The end date of the season. Convert to YYYY-MM-DD format.
      - rate: (Required) The numerical room rate (price per night) for THIS SPECIFIC SEASON/PERIOD. This rate MUST be explicitly stated in the contract alongside, or clearly linked to, this period. Do not infer a rate or use a general hotel rate unless the text explicitly states it applies to this specific period.
      If multiple distinct seasonal periods with different rates are found, extract each as a separate object in the array.
      If a period is mentioned (like a 'Booking Period' or 'Validity Period') but NO specific numerical rate is explicitly associated with IT in the contract text, DO NOT include that period in the seasonalRates array.

    Prioritize accuracy. If unsure, omit the field or part of the structure. For prices, provide numbers only.
    Return ONLY the JSON object.
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        "model": "google/gemma-3n-e4b-it:free", 
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
        const validationResult = AIContractDataOutputSchema.safeParse(parsedJson);
        if (validationResult.success) {
          return validationResult.data;
        } else {
          console.error('OpenRouter response JSON does not match AIContractDataOutputSchema:', validationResult.error.errors);
          console.error('Received JSON string for contract parsing:', content);
          // Return the potentially partially valid data for debugging or partial prefill
          // It's up to the calling function to handle this less-than-perfect data
          return parsedJson as AIContractDataOutput; // Cast, but be aware it might not be fully valid
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
