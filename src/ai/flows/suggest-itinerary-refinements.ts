
'use server';
/**
 * @fileOverview AI-powered smart suggestions to improve itinerary costs using OpenRouter.
 *
 * - suggestItineraryRefinements - A function that handles the itinerary refinement process.
 * - SuggestItineraryRefinementsInput - The input type for the suggestItineraryRefinements function.
 * - SuggestItineraryRefinementsOutput - The return type for the suggestItineraryRefinements function.
 */

import { z } from 'genkit'; 

const SuggestItineraryRefinementsInputSchema = z.object({
  itineraryDescription: z.string().describe('A detailed description of the current travel itinerary, including destinations, activities, accommodations, and transportation.'),
  budget: z.number().describe('The total budget for the itinerary.'),
  currentCost: z.number().describe('The current total cost of the itinerary.'),
});
export type SuggestItineraryRefinementsInput = z.infer<typeof SuggestItineraryRefinementsInputSchema>;

const RefinedSuggestionSchema = z.object({
  suggestion: z.string().describe('A specific suggestion to refine the itinerary, such as alternate activities, cheaper hotels, or changes in itinerary duration.'),
  estimatedCostSavings: z.number().describe('The estimated cost savings associated with the suggestion.'),
  reasoning: z.string().describe('The reasoning behind the suggestion, explaining why it would improve the itinerary cost-effectively.'),
});

const SuggestItineraryRefinementsOutputSchema = z.object({
  refinedItinerarySuggestions: z.array(RefinedSuggestionSchema).describe('An array of refined itinerary suggestions.'),
});
export type SuggestItineraryRefinementsOutput = z.infer<typeof SuggestItineraryRefinementsOutputSchema>;

export async function suggestItineraryRefinements(
  input: SuggestItineraryRefinementsInput
): Promise<SuggestItineraryRefinementsOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const httpReferer = process.env.OPENROUTER_HTTP_REFERER;
  const xTitle = process.env.OPENROUTER_X_TITLE;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openrouter_api_key_here') {
    const errorMsg = "OpenRouter API key is not configured. Please ensure OPENROUTER_API_KEY is set correctly in your .env file at the project root (it should not be empty, whitespace, or the placeholder value) and restart your development server.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (httpReferer) {
    headers['HTTP-Referer'] = httpReferer;
  }
  if (xTitle) {
    headers['X-Title'] = xTitle;
  }

  const promptText = `You are an AI travel assistant specializing in optimizing travel itineraries for cost-effectiveness.
Given the following travel itinerary description, budget, and current cost, provide a list of specific and actionable suggestions to refine the itinerary to reduce costs while maintaining a quality travel experience.

Itinerary Description: ${input.itineraryDescription}
Budget: ${input.budget}
Current Cost: ${input.currentCost}

Each suggestion should include:
- A clear and concise description of the refinement (suggestion).
- The estimated cost savings associated with the suggestion (estimatedCostSavings).
- A brief explanation of the reasoning behind the suggestion (reasoning).

Please return your response as a JSON object matching the following structure:
{
  "refinedItinerarySuggestions": [
    {
      "suggestion": "string",
      "estimatedCostSavings": "number",
      "reasoning": "string"
    }
    // ... more suggestions
  ]
}
Ensure the JSON is well-formed.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        "model": "google/gemma-3n-e4b-it:free", 
        "messages": [
          {
            "role": "user",
            "content": promptText
          }
        ],
        "response_format": { "type": "json_object" } 
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenRouter API Error for Itinerary Suggestions: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`OpenRouter API request for itinerary suggestions failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      let suggestionsContent = data.choices[0].message.content;
      
      if (suggestionsContent.startsWith("```json")) {
        suggestionsContent = suggestionsContent.substring(7);
        if (suggestionsContent.endsWith("```")) {
          suggestionsContent = suggestionsContent.substring(0, suggestionsContent.length - 3);
        }
      }
      
      try {
        const parsedJson = JSON.parse(suggestionsContent);
        // Validate against the Zod schema
        const validationResult = SuggestItineraryRefinementsOutputSchema.safeParse(parsedJson);
        if (validationResult.success) {
          return validationResult.data;
        } else {
          console.error('OpenRouter response JSON does not match expected schema:', validationResult.error.errors);
          console.error('Received JSON string:', suggestionsContent);
          // For debugging, you might want to return the raw parsedJson or throw a more specific error.
          // For now, we'll throw an error indicating validation failure.
          throw new Error('Failed to validate itinerary suggestions from OpenRouter API response. Check console for details.');
        }
      } catch (jsonError: any) {
        console.error('Error parsing JSON from OpenRouter for itinerary suggestions:', jsonError);
        console.error('Received content string before parsing:', suggestionsContent);
        throw new Error(`Failed to parse JSON response for itinerary suggestions: ${jsonError.message}`);
      }
    } else {
      console.error('Unexpected response structure from OpenRouter API for itinerary suggestions:', data);
      throw new Error('Failed to extract suggestions from OpenRouter API response.');
    }
  } catch (error: any) {
    console.error('Error calling OpenRouter API for itinerary suggestions:', error);
    if (error.message.startsWith("OpenRouter API key is not configured")) {
      throw error;
    }
    throw new Error(`Failed to get itinerary suggestions: ${error.message}`);
  }
}
