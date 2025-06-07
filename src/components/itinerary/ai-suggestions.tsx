
"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, AlertCircle, Loader2, Lightbulb } from 'lucide-react';
import type { TripData, AISuggestion } from '@/types/itinerary';
import { suggestItineraryRefinements } from '@/ai/flows/suggest-itinerary-refinements';
import { calculateAllCosts } from '@/lib/calculation-utils';
import { formatCurrency } from '@/lib/utils';

interface AISuggestionsProps {
  tripData: TripData;
  onApplySuggestion: (modifiedTripData: TripData) => void; // Placeholder for applying suggestions
}

export function AISuggestions({ tripData, onApplySuggestion }: AISuggestionsProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<AISuggestion[]>([]);

  const generateItineraryDescription = (data: TripData): string => {
    let description = `Trip for ${data.pax.adults} adults and ${data.pax.children} children, for ${data.settings.numDays} days. Currency: ${data.pax.currency}.`;
    if (data.settings.budget) {
      description += ` Budget: ${formatCurrency(data.settings.budget, data.pax.currency)}.`;
    }
    
    Object.entries(data.days).forEach(([dayNum, dayData]) => {
      description += `\nDay ${dayNum}:`;
      if (dayData.items.length === 0) {
        description += " No activities planned.";
      } else {
        dayData.items.forEach(item => {
          description += `\n  - ${item.type}: ${item.name}.`;
          if (item.note) description += ` Note: ${item.note}.`;
        });
      }
    });
    return description;
  };

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    if (!tripData.settings.budget) {
      setError("Please set a budget in the trip settings to get cost-saving suggestions.");
      setIsLoading(false);
      return;
    }

    const currentCostSummary = calculateAllCosts(tripData);
    const itineraryDescription = generateItineraryDescription(tripData);

    try {
      const result = await suggestItineraryRefinements({
        itineraryDescription,
        budget: tripData.settings.budget,
        currentCost: currentCostSummary.grandTotal,
      });
      if (result.refinedItinerarySuggestions) {
        setSuggestions(result.refinedItinerarySuggestions);
      } else {
        setError("No suggestions were returned by the AI.");
      }
    } catch (e: any) {
      console.error("AI Suggestion Error:", e);
      setError(`Failed to get suggestions: ${e.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-primary flex items-center">
          <Sparkles className="mr-2 h-5 w-5" /> AI Cost Saver
        </CardTitle>
        <CardDescription>Get AI-powered suggestions to optimize your itinerary costs.</CardDescription>
      </CardHeader>
      <CardContent>
        {!tripData.settings.budget && (
           <Alert variant="default" className="mb-4 bg-primary/10 border-primary/20">
             <Lightbulb className="h-4 w-4 text-primary" />
             <AlertTitle className="text-primary">Set a Budget</AlertTitle>
             <AlertDescription>
               Add a budget to your trip (via Reset All &rarr; Setup) to enable AI cost-saving suggestions.
             </AlertDescription>
           </Alert>
        )}
        <Button onClick={handleGetSuggestions} disabled={isLoading || !tripData.settings.budget} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching Suggestions...</>
          ) : (
            "Get Smart Suggestions"
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestions.length > 0 && (
          <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2">
            <h3 className="font-semibold text-foreground/90">Suggestions:</h3>
            {suggestions.map((s, index) => (
              <Card key={index} className="bg-background/50 p-3 text-sm">
                <p className="font-medium text-primary">{s.suggestion}</p>
                <p className="text-xs text-muted-foreground">{s.reasoning}</p>
                <p className="text-xs font-semibold mt-1">
                  Est. Savings: <span className="font-code text-green-600">{formatCurrency(s.estimatedCostSavings, tripData.pax.currency)}</span>
                </p>
                {/* Placeholder for apply button - actual implementation would be complex */}
                {/* <Button size="xs" variant="outline" className="mt-1" onClick={() => alert('Apply suggestion functionality not implemented yet.')}>Apply (Demo)</Button> */}
              </Card>
            ))}
          </div>
        )}
         {suggestions.length === 0 && !isLoading && !error && tripData.settings.budget && (
             <p className="mt-4 text-sm text-center text-muted-foreground">Click the button above to get suggestions.</p>
         )}
      </CardContent>
    </Card>
  );
}
