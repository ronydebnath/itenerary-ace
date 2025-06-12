
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TripSettings, PaxDetails, CurrencyCode, ProvinceItem } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { AlertCircle, MapPinned, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProvinces } from '@/hooks/useProvinces';

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
  const [selectedProvinces, setSelectedProvinces] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const { provinces: availableProvinces, isLoading: isLoadingProvinces } = useProvinces();

  const handleProvinceToggle = (provinceName: string) => {
    setSelectedProvinces(prev =>
      prev.includes(provinceName)
        ? prev.filter(p => p !== provinceName)
        : [...prev, provinceName]
    );
  };

  const handleSubmit = () => {
    const parsedNumDays = parseInt(numDays, 10);
    const parsedAdults = parseInt(globalAdults, 10);
    const parsedChildren = parseInt(globalChildren, 10);
    const parsedBudget = budget ? parseFloat(budget) : undefined;

    if (!startDate) {
      setError("Start date is required.");
      return;
    }
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
      { numDays: parsedNumDays, startDate, budget: parsedBudget, selectedProvinces },
      { adults: parsedAdults, children: parsedChildren, currency }
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-lg shadow-xl">
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
            <Label htmlFor="startDate" className="text-foreground/80">Start Date (Required)</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-base" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numDays" className="text-foreground/80">Number of Days</Label>
            <Input id="numDays" type="number" value={numDays} onChange={(e) => setNumDays(e.target.value)} min="1" className="text-base"/>
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
            <Label className="text-foreground/80 flex items-center"><MapPinned className="h-4 w-4 mr-2 text-primary"/>Select Provinces (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Choose specific provinces to focus your itinerary. If none are selected, all provinces will be considered.
            </p>
            {isLoadingProvinces ? (
              <div className="flex items-center justify-center h-24 border rounded-md bg-muted/50">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading provinces...</span>
              </div>
            ) : availableProvinces.length > 0 ? (
              <ScrollArea className="h-32 w-full rounded-md border p-3 bg-background">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {availableProvinces.map((province) => (
                    <div key={province.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`province-${province.id}`}
                        checked={selectedProvinces.includes(province.name)}
                        onCheckedChange={() => handleProvinceToggle(province.name)}
                      />
                      <Label htmlFor={`province-${province.id}`} className="text-sm font-normal cursor-pointer">
                        {province.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
               <p className="text-sm text-muted-foreground text-center py-4 border rounded-md bg-muted/50">No provinces available for selection. Please add provinces in Admin settings.</p>
            )}
             {selectedProvinces.length > 0 && (
                <div className="pt-1 text-xs text-muted-foreground">
                  Selected: {selectedProvinces.join(', ')}
                </div>
              )}
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
