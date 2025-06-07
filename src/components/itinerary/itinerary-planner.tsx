
"use client";

import * as React from 'react';
import type { TripData, ItineraryItem, CostSummary, DetailedSummaryItem, AISuggestion, Traveler } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select components
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Printer, RotateCcw, Sparkles, MapPin, CalendarDays, Users, Edit3 } from 'lucide-react';
import { formatCurrency, generateGUID } from '@/lib/utils';
import { AISuggestions } from './ai-suggestions'; 
import { PrintLayout } from './print-layout'; 
import { DayView } from './day-view';
import { CostBreakdownTable } from './cost-breakdown-table';
import { DetailsSummaryTable } from './details-summary-table';
import { calculateAllCosts } from '@/lib/calculation-utils'; 


interface ItineraryPlannerProps {
  initialTripData: TripData;
  onReset: () => void;
  onUpdateTripData: (updatedTripData: TripData) => void;
}

export function ItineraryPlanner({ initialTripData, onReset, onUpdateTripData }: ItineraryPlannerProps) {
  const [tripData, setTripData] = React.useState<TripData>(initialTripData);
  const [currentDayView, setCurrentDayView] = React.useState<number>(1);
  const [costSummary, setCostSummary] = React.useState<CostSummary | null>(null);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [aiSuggestions, setAiSuggestions] = React.useState<AISuggestion[]>([]);

  React.useEffect(() => {
    setTripData(initialTripData);
  }, [initialTripData]);
  
  React.useEffect(() => {
    const summary = calculateAllCosts(tripData);
    setCostSummary(summary);
    onUpdateTripData(tripData); // Propagate changes up for localStorage saving
  }, [tripData, onUpdateTripData]);

  const handleUpdateItem = (day: number, updatedItem: ItineraryItem) => {
    setTripData(prev => {
      const newDays = { ...prev.days };
      const dayItems = [...(newDays[day]?.items || [])];
      const itemIndex = dayItems.findIndex(item => item.id === updatedItem.id);
      if (itemIndex > -1) {
        dayItems[itemIndex] = updatedItem;
      }
      newDays[day] = { items: dayItems };
      return { ...prev, days: newDays };
    });
  };

  const handleAddItem = (day: number, itemType: ItineraryItem['type']) => {
    let newItem: ItineraryItem;
    const baseNewItem = { 
      id: generateGUID(), 
      day, 
      name: `New ${itemType}`, 
      excludedTravelerIds: [] 
    };

    switch (itemType) {
      case 'transfer':
        newItem = { ...baseNewItem, type: 'transfer', mode: 'ticket', adultTicketPrice: 0, childTicketPrice: 0 };
        break;
      case 'activity':
        newItem = { ...baseNewItem, type: 'activity', adultPrice: 0, childPrice: 0 };
        break;
      case 'hotel':
        newItem = { ...baseNewItem, type: 'hotel', checkoutDay: day + 1, childrenSharingBed: false, rooms: [] };
        break;
      case 'meal':
        newItem = { ...baseNewItem, type: 'meal', adultMealPrice: 0, childMealPrice: 0, totalMeals: 1 };
        break;
      case 'misc':
        newItem = { ...baseNewItem, type: 'misc', unitCost: 0, quantity: 1, costAssignment: 'perPerson' };
        break;
      default:
        return; // Should not happen
    }

    setTripData(prev => {
      const newDays = { ...prev.days };
      const dayItems = [...(newDays[day]?.items || []), newItem];
      newDays[day] = { items: dayItems };
      return { ...prev, days: newDays };
    });
  };

  const handleDeleteItem = (day: number, itemId: string) => {
    setTripData(prev => {
      const newDays = { ...prev.days };
      const dayItems = (newDays[day]?.items || []).filter(item => item.id !== itemId);
      newDays[day] = { items: dayItems };
      return { ...prev, days: newDays };
    });
  };
  
  const handlePrint = () => {
    setIsPrinting(true);
    // Timeout to allow state to update and DOM to re-render for print
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100); 
  };

  const displayStartDate = tripData.settings.startDate ? new Date(tripData.settings.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  if (isPrinting && costSummary) {
    return <PrintLayout tripData={tripData} costSummary={costSummary} />;
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="mb-6 shadow-lg">
        <CardHeader className="bg-primary/10">
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-headline text-primary">Itinerary Ace Planner</CardTitle>
            <Button variant="outline" onClick={onReset} size="sm" className="border-destructive text-destructive hover:bg-destructive/10">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset All
            </Button>
          </div>
          <CardDescription className="text-foreground/70 pt-2">
            Plan and calculate costs for your upcoming trip.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6 p-4 bg-secondary/30 rounded-lg border border-secondary">
                <div className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" /> <strong>Days:</strong><span className="ml-1 font-code">{tripData.settings.numDays}</span></div>
                <div className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> <strong>Adults:</strong><span className="ml-1 font-code">{tripData.pax.adults}</span>, <strong>Children:</strong><span className="ml-1 font-code">{tripData.pax.children}</span></div>
                <div className="flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" /> <strong>Start Date:</strong><span className="ml-1 font-code">{displayStartDate}</span></div>
                <div className="flex items-center col-span-1 md:col-span-3"><Users className="mr-2 h-5 w-5 text-primary" /> <strong>Currency:</strong><span className="ml-1 font-code">{tripData.pax.currency}</span>
                  {tripData.settings.budget && (<span className="ml-4"><strong>Budget:</strong> <span className="ml-1 font-code">{formatCurrency(tripData.settings.budget, tripData.pax.currency)}</span></span>)}
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="md:hidden mb-4">
        <Select value={String(currentDayView)} onValueChange={(val) => setCurrentDayView(Number(val))}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Day" />
            </SelectTrigger>
            <SelectContent>
                {Array.from({ length: tripData.settings.numDays }, (_, i) => i + 1).map(dayNum => (
                    <SelectItem key={dayNum} value={String(dayNum)}>Day {dayNum}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      <div className="hidden md:flex justify-between items-center mb-6 p-3 bg-card border rounded-lg shadow-sm">
        <Button 
          onClick={() => setCurrentDayView(prev => Math.max(1, prev - 1))} 
          disabled={currentDayView === 1}
          variant="outline"
        >
          <ChevronLeft className="h-5 w-5 mr-1" /> Previous Day
        </Button>
        <h2 className="text-xl font-semibold text-primary">Day {currentDayView}</h2>
        <Button 
          onClick={() => setCurrentDayView(prev => Math.min(tripData.settings.numDays, prev + 1))} 
          disabled={currentDayView === tripData.settings.numDays}
          variant="outline"
        >
          Next Day <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ScrollArea className="h-auto lg:max-h-[calc(100vh-280px)] pr-2">
            {Array.from({ length: tripData.settings.numDays }, (_, i) => i + 1).map(dayNum => (
              <div key={dayNum} style={{ display: dayNum === currentDayView ? 'block' : 'none' }}>
                <DayView
                  dayNumber={dayNum}
                  items={tripData.days[dayNum]?.items || []}
                  travelers={tripData.travelers}
                  currency={tripData.pax.currency}
                  onAddItem={handleAddItem}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  tripSettings={tripData.settings}
                />
              </div>
            ))}
          </ScrollArea>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <AISuggestions 
            tripData={tripData} 
            onApplySuggestion={(modifiedTripData) => setTripData(modifiedTripData)} 
          />
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Cost Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {costSummary ? (
                <>
                  <CostBreakdownTable summary={costSummary} currency={tripData.pax.currency} travelers={tripData.travelers}/>
                  <Separator className="my-4" />
                  <div className="text-right">
                    <p className="text-lg font-semibold">Grand Total:</p>
                    <p className="text-2xl font-bold text-accent font-code">
                      {formatCurrency(costSummary.grandTotal, tripData.pax.currency)}
                    </p>
                  </div>
                </>
              ) : <p>Calculating costs...</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Full Itinerary Details</CardTitle>
        </CardHeader>
        <CardContent>
           {costSummary ? (
            <DetailsSummaryTable summary={costSummary} currency={tripData.pax.currency} />
          ) : <p>Loading details...</p>}
        </CardContent>
      </Card>

      <div className="mt-8 py-6 border-t border-border flex flex-col sm:flex-row justify-center items-center gap-4 no-print">
        <Button onClick={onReset} variant="destructive" className="w-full sm:w-auto">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset Calculator
        </Button>
        <Button onClick={handlePrint} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          <Printer className="mr-2 h-4 w-4" /> Print Itinerary
        </Button>
      </div>
    </div>
  );
}
