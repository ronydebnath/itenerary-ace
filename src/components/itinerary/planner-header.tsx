
"use client";

import * as React from 'react';
import type { TripData } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit3, Save, Info, CalendarDays, Users, MapPin, Route } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface PlannerHeaderProps {
  tripData: TripData;
  onUpdateTripData: (updatedTripData: Partial<TripData>) => void;
  onManualSave: () => void;
  onReset: () => void; // This is for "Start New Itinerary"
  showCosts: boolean;
}

export function PlannerHeader({ tripData, onUpdateTripData, onManualSave, onReset, showCosts }: PlannerHeaderProps) {
  const displayStartDate = React.useMemo(() => {
    return tripData.settings.startDate ? format(parseISO(tripData.settings.startDate), "MMMM d, yyyy") : 'N/A';
  }, [tripData.settings.startDate]);

  const { selectedProvinces = [] } = tripData.settings;

  return (
    <Card className="mb-6 shadow-xl no-print">
      <CardHeader className="bg-primary/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-3xl font-headline text-primary">Itinerary Ace Planner</CardTitle>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={onManualSave} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Save className="mr-2 h-4 w-4" /> Save Itinerary
            </Button>
            <Button variant="outline" onClick={onReset} size="sm" className="border-accent text-accent hover:bg-accent/10">
              <Edit3 className="mr-2 h-4 w-4" /> Start New Itinerary
            </Button>
          </div>
        </div>
        <CardDescription className="text-foreground/70 pt-2">
          Plan and calculate costs for your upcoming trip. Use the fields below to name your itinerary and assign a client.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6 p-4 bg-secondary/30 rounded-lg border border-secondary">
          {tripData.id ? (
            <div className="md:col-span-3 flex items-center mb-3">
              <Info className="mr-2 h-5 w-5 text-muted-foreground" />
              <strong>ID:</strong><span className="ml-1 font-mono text-xs bg-muted px-2 py-1 rounded">{tripData.id}</span>
            </div>
          ) : (
            <div className="md:col-span-3 text-red-500 font-bold mb-3 bg-red-100 p-2 rounded-md border border-red-300">DEBUG: Itinerary ID is NOT available in tripData!</div>
          )}
          <div className="md:col-span-3 space-y-2 mb-3">
            <Label htmlFor="itineraryName" className="text-xs font-medium text-muted-foreground">Itinerary Name</Label>
            <Input
              id="itineraryName"
              value={tripData.itineraryName || ''}
              onChange={(e) => onUpdateTripData({ itineraryName: e.target.value })}
              placeholder="Enter itinerary name"
              className="text-base font-semibold h-9 bg-background/70"
            />
          </div>
          <div className="md:col-span-3 space-y-2 mb-3">
            <Label htmlFor="clientName" className="text-xs font-medium text-muted-foreground">Client Name (Optional)</Label>
            <Input
              id="clientName"
              value={tripData.clientName || ''}
              onChange={(e) => onUpdateTripData({ clientName: e.target.value })}
              placeholder="Enter client name"
              className="text-base h-9 bg-background/70"
            />
          </div>
          <div className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" /> <strong>Days:</strong><span className="ml-1 font-code">{tripData.settings.numDays}</span></div>
          <div className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> <strong>Adults:</strong><span className="ml-1 font-code">{tripData.pax.adults}</span>, <strong>Children:</strong><span className="ml-1 font-code">{tripData.pax.children}</span></div>
          <div className="flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" /> <strong>Start Date:</strong><span className="ml-1 font-code">{displayStartDate}</span></div>
          <div className="flex items-center col-span-1 md:col-span-3"><Route className="mr-2 h-5 w-5 text-primary" /> <strong>Selected Provinces:</strong>
            {selectedProvinces.length > 0 ? (
              <span className="ml-1 flex flex-wrap gap-1">
                {selectedProvinces.map(p => <Badge key={p} variant="outline" className="bg-background">{p}</Badge>)}
              </span>
            ) : (
              <span className="ml-1 font-code text-muted-foreground italic">All provinces</span>
            )}
          </div>
          <div className="flex items-center col-span-1 md:col-span-3"><Users className="mr-2 h-5 w-5 text-primary" /> <strong>Currency:</strong><span className="ml-1 font-code">{tripData.pax.currency}</span>
            {showCosts && tripData.settings.budget && (<span className="ml-4"><strong>Budget:</strong> <span className="ml-1 font-code">{formatCurrency(tripData.settings.budget, tripData.pax.currency)}</span></span>)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
