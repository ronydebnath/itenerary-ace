
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TripSettings, PaxDetails, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SetupFormProps {
  onStartPlanning: (settings: TripSettings, pax: PaxDetails) => void;
}

export function SetupForm({ onStartPlanning }: SetupFormProps) {
  const [numDays, setNumDays] = React.useState<string>("3");
  const [startDate, setStartDate] = React.useState<string>("");
  const [globalAdults, setGlobalAdults] = React.useState<string>("2");
  const [globalChildren, setGlobalChildren] = React.useState<string>("0");
  const [budget, setBudget] = React.useState<string>("");
  const [currency, setCurrency] = React.useState<CurrencyCode>("THB");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = () => {
    const parsedNumDays = parseInt(numDays, 10);
    const parsedAdults = parseInt(globalAdults, 10);
    const parsedChildren = parseInt(globalChildren, 10);
    const parsedBudget = budget ? parseFloat(budget) : undefined;

    if (isNaN(parsedNumDays) || parsedNumDays < 1) {
      setError("Number of days must be at least 1.");
      return;
    }
    if (isNaN(parsedAdults) || parsedAdults < 0) {
      setError("Number of adults must be 0 or more.");
      return;
    }
    if (isNaN(parsedChildren) || parsedChildren < 0) {
      setError("Number of children must be 0 or more.");
      return;
    }
    if (parsedAdults === 0 && parsedChildren === 0) {
      setError("Please specify at least one adult or child.");
      return;
    }
    if (budget && (isNaN(parsedBudget!) || parsedBudget! < 0)) {
      setError("Budget must be a positive number if specified.");
      return;
    }
    
    setError(null);

    onStartPlanning(
      { numDays: parsedNumDays, startDate: startDate || null, budget: parsedBudget },
      { adults: parsedAdults, children: parsedChildren, currency }
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center text-primary">Itinerary Ace Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="numDays" className="text-foreground/80">Number of Days</Label>
            <Input id="numDays" type="number" value={numDays} onChange={(e) => setNumDays(e.target.value)} min="1" className="text-base"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-foreground/80">Start Date (Optional)</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-base"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="globalAdults" className="text-foreground/80">Adults (Global)</Label>
              <Input id="globalAdults" type="number" value={globalAdults} onChange={(e) => setGlobalAdults(e.target.value)} min="0" className="text-base"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="globalChildren" className="text-foreground/80">Children (Global)</Label>
              <Input id="globalChildren" type="number" value={globalChildren} onChange={(e) => setGlobalChildren(e.target.value)} min="0" className="text-base"/>
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="budget" className="text-foreground/80">Budget (Optional)</Label>
            <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} min="0" placeholder="e.g., 1000" className="text-base"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-foreground/80">Default Currency</Label>
            <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
              <SelectTrigger id="currency" className="w-full text-base">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(curr => (
                  <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-6">
          <Button onClick={handleSubmit} className="w-1/2 bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
            Start Planning
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
