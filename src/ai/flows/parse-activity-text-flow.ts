
'use server';
/**
 * @fileOverview An AI flow to extract activity details, including multiple packages, from text.
 *
 * - parseActivityText - A function that takes activity text and returns structured data.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';

const ActivityPackageAISchema = z.object({
  packageName: z.string().optional().describe("The name of this specific package or option within the activity."),
  adultPrice: z.number().optional().describe("The adult price for this specific package."),
  childPrice: z.number().optional().describe("The child price for this specific package (if different from adult)."),
  // currency is likely global, but can be per package if text suggests
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode)).optional().describe('The currency code for this package (e.g., THB, USD).'),
  notes: z.string().optional().describe("Specific notes for this package (e.g., duration, inclusions, exclusions, times).")
});

const ParseActivityTextOutputSchema = z.object({
  activityName: z.string().optional().describe('The overall name of the activity or tour service.'),
  province: z.string().optional().describe('The province or city where the activity is located (if explicitly mentioned).'),
  // Consider a global currency if most packages share it, otherwise, AI can put it per package.
  // For simplicity now, let's encourage per-package currency if it varies, or a single currency if consistent.
  parsedPackages: z.array(ActivityPackageAISchema).optional().describe("An array of distinct packages or pricing options found for the activity. If only one price set is found, it should still be in this array as a single package.")
});
export type ParseActivityTextOutput = z.infer<typeof ParseActivityTextOutputSchema>;

const ParseActivityTextInputSchema = z.object({
  activityText: z.string().min(10, "Activity text must be at least 10 characters.").describe('The text description of the activity, potentially including multiple packages or options.'),
});
export type ParseActivityTextInput = z.infer<typeof ParseActivityTextInputSchema>;

export async function parseActivityText(input: ParseActivityTextInput): Promise<ParseActivityTextOutput> {
  return parseActivityTextGenkitFlow(input);
}

const parseActivityTextGenkitFlow = ai.defineFlow(
  {
    name: 'parseActivityTextGenkitFlow',
    inputSchema: ParseActivityTextInputSchema,
    outputSchema: ParseActivityTextOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const httpReferer = process.env.OPENROUTER_HTTP_REFERER;
    const xTitle = process.env.OPENROUTER_X_TITLE;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openrouter_api_key_here') {
      const errorMsg = "OpenRouter API key is not configured for activity parsing. Please ensure OPENROUTER_API_KEY is set correctly.";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    if (httpReferer) headers['HTTP-Referer'] = httpReferer;
    if (xTitle) headers['X-Title'] = xTitle;

    const promptForAPI = `You are an AI assistant specialized in extracting structured information about travel activities from text.
The user will provide a description of an activity. Your task is to parse this description and extract key details.
The activity might have a single pricing option or multiple distinct packages/options.

Activity Description:
---
${input.activityText}
---

Extract the following information and provide it in JSON format.

1.  **activityName**: The main, overall name of the activity or tour service.
2.  **province**: The city or province where the activity takes place (e.g., "Bangkok", "Phuket"). Only if explicitly mentioned.
3.  **parsedPackages**: This MUST be an array of objects. Each object represents a distinct package, tour option, or pricing tier found in the text.
    *   If only one set of pricing/details is found, represent it as a single object within this array.
    *   For each package object, extract:
        *   **packageName**: The specific name of this package or option (e.g., "Half-Day Tour", "VIP Experience", "Standard Ticket"). If not explicitly named, try to infer a descriptive name or use a generic one like "Standard Option".
        *   **adultPrice**: The primary price for an adult for THIS package.
        *   **childPrice**: The price for a child for THIS package, if specified separately. If not, omit or set to null.
        *   **currency**: The currency code for THIS package's prices (e.g., "THB", "USD"). Must be one of ${CURRENCIES.join(', ')}. If currency is mentioned globally and applies to all, use that.
        *   **notes**: Any important notes specific to THIS package (e.g., duration, inclusions, exclusions, specific times, what to bring).

Guidelines:
-   If a field is not mentioned or cannot be reliably determined for a package, omit it from that package's object.
-   If no packages or pricing details can be found, `parsedPackages` can be an empty array or omitted.
-   Prioritize accuracy. Prices should be numerical.
-   The top-level `activityName` should be the general name, not a package name unless it's the only one.

Return ONLY the JSON object.
Example of expected structure if multiple packages are found:
{
  "activityName": "Phang Nga Bay Tour",
  "province": "Phuket",
  "parsedPackages": [
    {
      "packageName": "James Bond Island by Longtail Boat",
      "adultPrice": 1200,
      "childPrice": 800,
      "currency": "THB",
      "notes": "Includes lunch, canoeing. Full day."
    },
    {
      "packageName": "Luxury Speedboat to Phi Phi & Phang Nga",
      "adultPrice": 2500,
      "currency": "THB",
      "notes": "Includes premium lunch, snorkeling gear, national park fees. Early bird discount available."
    }
  ]
}
Example if only one option is found:
{
  "activityName": "Thai Cooking Class",
  "province": "Chiang Mai",
  "parsedPackages": [
    {
      "packageName": "Morning Session with Market Visit",
      "adultPrice": 1000,
      "currency": "THB",
      "notes": "Learn 4 dishes. 9 AM - 1 PM."
    }
  ]
}
`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          "model": "google/gemma-3n-e4b-it:free",
          "messages": [{ "role": "user", "content": promptForAPI }],
          "response_format": { "type": "json_object" }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`OpenRouter API Error for Multi-Package Activity Parsing: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`OpenRouter API request for multi-package activity parsing failed with status ${response.status}: ${errorBody}`);
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
          const validationResult = ParseActivityTextOutputSchema.safeParse(parsedJson);
          if (validationResult.success) {
            return validationResult.data;
          } else {
            console.error('OpenRouter response for multi-package activity parsing does not match schema:', validationResult.error.errors);
            console.error('Received JSON for multi-package activity parsing:', content);
            return parsedJson as ParseActivityTextOutput; // Return partially valid data for debugging
          }
        } catch (jsonError: any) {
          console.error('Error parsing JSON from OpenRouter for multi-package activity data:', jsonError);
          console.error('Received content string before parsing (multi-package activity):', content);
          throw new Error(`Failed to parse JSON response for multi-package activity data: ${jsonError.message}`);
        }
      } else {
        console.error('Unexpected response structure from OpenRouter API for multi-package activity parsing:', data);
        throw new Error('Failed to extract multi-package activity data from OpenRouter API response.');
      }
    } catch (error: any) {
      console.error('Error calling OpenRouter API for multi-package activity parsing:', error);
      if (error.message.startsWith("OpenRouter API key is not configured")) {
        throw error;
      }
      throw new Error(`Failed to parse multi-package activity text: ${error.message}`);
    }
  }
);
