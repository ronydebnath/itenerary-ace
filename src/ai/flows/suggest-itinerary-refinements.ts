'use server';
/**
 * @fileOverview AI-powered smart suggestions to improve itinerary costs.
 *
 * - suggestItineraryRefinements - A function that handles the itinerary refinement process.
 * - SuggestItineraryRefinementsInput - The input type for the suggestItineraryRefinements function.
 * - SuggestItineraryRefinementsOutput - The return type for the suggestItineraryRefinements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestItineraryRefinementsInputSchema = z.object({
  itineraryDescription: z.string().describe('A detailed description of the current travel itinerary, including destinations, activities, accommodations, and transportation.'),
  budget: z.number().describe('The total budget for the itinerary.'),
  currentCost: z.number().describe('The current total cost of the itinerary.'),
});
export type SuggestItineraryRefinementsInput = z.infer<typeof SuggestItineraryRefinementsInputSchema>;

const SuggestItineraryRefinementsOutputSchema = z.object({
  refinedItinerarySuggestions: z.array(
    z.object({
      suggestion: z.string().describe('A specific suggestion to refine the itinerary, such as alternate activities, cheaper hotels, or changes in itinerary duration.'),
      estimatedCostSavings: z.number().describe('The estimated cost savings associated with the suggestion.'),
      reasoning: z.string().describe('The reasoning behind the suggestion, explaining why it would improve the itinerary cost-effectively.'),
    })
  ).describe('An array of refined itinerary suggestions.'),
});
export type SuggestItineraryRefinementsOutput = z.infer<typeof SuggestItineraryRefinementsOutputSchema>;

export async function suggestItineraryRefinements(input: SuggestItineraryRefinementsInput): Promise<SuggestItineraryRefinementsOutput> {
  return suggestItineraryRefinementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestItineraryRefinementsPrompt',
  input: {schema: SuggestItineraryRefinementsInputSchema},
  output: {schema: SuggestItineraryRefinementsOutputSchema},
  prompt: `You are an AI travel assistant specializing in optimizing travel itineraries for cost-effectiveness.

  Given the following travel itinerary description, budget, and current cost, provide a list of specific and actionable suggestions to refine the itinerary to reduce costs while maintaining a quality travel experience.

  Itinerary Description: {{{itineraryDescription}}}
  Budget: {{{budget}}}
  Current Cost: {{{currentCost}}}

  Each suggestion should include:
  - A clear and concise description of the refinement.
  - The estimated cost savings associated with the suggestion.
  - A brief explanation of the reasoning behind the suggestion.

  Return the suggestions in JSON format.
  `,
});

const suggestItineraryRefinementsFlow = ai.defineFlow(
  {
    name: 'suggestItineraryRefinementsFlow',
    inputSchema: SuggestItineraryRefinementsInputSchema,
    outputSchema: SuggestItineraryRefinementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
