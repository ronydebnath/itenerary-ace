
'use server';
/**
 * @fileOverview An AI flow to extract activity details from text.
 *
 * - parseActivityText - A function that takes activity text and returns structured data.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit'; // Genkit v1.x example uses this for Zod
import type { CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';

const ParseActivityTextOutputSchema = z.object({
  name: z.string().optional().describe('The name of the activity.'),
  province: z.string().optional().describe('The province where the activity is located.'),
  adultPrice: z.number().optional().describe('The price for an adult.'),
  childPrice: z.number().optional().describe('The price for a child.'),
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode)).optional().describe('The currency code (e.g., THB, USD).'),
  notes: z.string().optional().describe('Any additional notes or details about the activity (e.g., duration, inclusions).'),
});
export type ParseActivityTextOutput = z.infer<typeof ParseActivityTextOutputSchema>;

const ParseActivityTextInputSchema = z.object({
  activityText: z.string().min(10, "Activity text must be at least 10 characters.").describe('The text description of the activity.'),
});
export type ParseActivityTextInput = z.infer<typeof ParseActivityTextInputSchema>;

// Exported function now calls the Genkit flow
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

    const promptForAPI = `You are an AI assistant specialized in extracting structured information about travel activities.
Parse the following activity description:
---
${input.activityText}
---
Extract the following details and provide them in JSON format. If a field is not mentioned or cannot be reliably determined, omit it or set its value to null.
- name: The main name of the activity or tour.
- province: The city or province where the activity takes place (e.g., "Bangkok", "Phuket"). Only if explicitly mentioned.
- adultPrice: The primary price for an adult participant.
- childPrice: The price for a child participant, if specified separately.
- currency: The currency code for the prices (e.g., "THB", "USD"). Must be one of ${CURRENCIES.join(', ')}.
- notes: Any important notes, duration, inclusions, or exclusions.

Return ONLY the JSON object.`;

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
        console.error(`OpenRouter API Error for Activity Parsing: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`OpenRouter API request for activity parsing failed with status ${response.status}: ${errorBody}`);
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
            console.error('OpenRouter response for activity parsing does not match schema:', validationResult.error.errors);
            console.error('Received JSON for activity parsing:', content);
            // For debugging, you might want to return the raw parsedJson or throw a more specific error
            // For now, let's attempt to return what was parsed, even if not fully matching
            return parsedJson as ParseActivityTextOutput;
          }
        } catch (jsonError: any) {
          console.error('Error parsing JSON from OpenRouter for activity data:', jsonError);
          console.error('Received content string before parsing (activity):', content);
          throw new Error(`Failed to parse JSON response for activity data: ${jsonError.message}`);
        }
      } else {
        console.error('Unexpected response structure from OpenRouter API for activity parsing:', data);
        throw new Error('Failed to extract activity data from OpenRouter API response.');
      }
    } catch (error: any) {
      console.error('Error calling OpenRouter API for activity parsing:', error);
      if (error.message.startsWith("OpenRouter API key is not configured")) {
        throw error;
      }
      throw new Error(`Failed to parse activity text: ${error.message}`);
    }
  }
);
