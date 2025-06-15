
/**
 * @fileoverview This component is the core user interface for planning an itinerary.
 * It orchestrates various sub-components like the `PlannerHeader` for global settings,
 * `DayNavigation` for moving between days, and `DayView` for managing items within
 * a specific day. It also displays cost summaries and detailed breakdowns.
 *
 * @bangla এই কম্পোনেন্টটি একটি ভ্রমণপথ পরিকল্পনা করার প্রধান ব্যবহারকারী ইন্টারফেস।
 * এটি বিভিন্ন সাব-কম্পোনেন্ট যেমন গ্লোবাল সেটিংসের জন্য `PlannerHeader`, দিনগুলির মধ্যে
 * নেভিগেট করার জন্য `DayNavigation`, এবং একটি নির্দিষ্ট দিনের মধ্যে আইটেমগুলি পরিচালনা
 * করার জন্য `DayView` সমন্বিত করে। এটি ব্যয়ের সারাংশ এবং বিস্তারিত ভাঙ্গনও প্রদর্শন করে।
 */
"use client";

import * as React from 'react';
import type { TripData, ItineraryItem, CostSummary, TripSettings, PaxDetails, QuotationRequest } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Printer, Eye, EyeOff, Loader2, FileText } from 'lucide-react';
import { formatCurrency, generateGUID } from '@/lib/utils';
import { DayView } from '../itinerary/day-view';
import { CostBreakdownTable } from '../itinerary/cost-breakdown-table';
import { DetailsSummaryTable } from '../itinerary/details-summary-table';
import { calculateAllCosts } from '@/lib/calculation-utils';
import { useServicePrices } from '@/hooks/useServicePrices';
import { useHotelDefinitions } from '@/hooks/useHotelDefinitions';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCountries } from '@/hooks/useCountries';
import { addDays, format, parseISO } from 'date-fns';
import { PlannerHeader } from './planner-header';
import { DayNavigation } from './day-navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import dynamic from 'next/dynamic';


const PrintLayout = dynamic(() => import('../itinerary/print-layout').then(mod => mod.PrintLayout), {
  loading: () => <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">Preparing print view...</span></div>,
  ssr: false
});


interface ItineraryPlannerProps {
  tripData: TripData;
  onReset: () => void;
  onUpdateTripData: (updateFn: (currentTripData: TripData | null) => Partial<TripData> | TripData) => void;
  onUpdateSettings: (updatedSettings: Partial<TripSettings>) => void;
  onUpdatePax: (updatedPax: Partial<PaxDetails>) => void;
  onManualSave: () => void;
  quotationRequestDetails?: QuotationRequest | null; // Added prop
}

export function ItineraryPlanner({
  tripData,
  onReset,
  onUpdateTripData,
  onUpdateSettings,
  onUpdatePax,
  onManualSave,
  quotationRequestDetails
}: ItineraryPlannerProps) {
  const [currentDayView, setCurrentDayView] = React.useState<number>(1);
  const [costSummary, setCostSummary] = React.useState<CostSummary | null>(null);
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [showCosts, setShowCosts] = React.useState<boolean>(true);
  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const { allHotelDefinitions, isLoading: isLoadingHotelDefinitions } = useHotelDefinitions();
  const { getRate, isLoading: isLoadingExchangeRates, exchangeRates, globalMarkupPercentage, specificMarkupRates } = useExchangeRates();
  const { countries, isLoading: isLoadingCountries } = useCountries(); 

  React.useEffect(() => {
    if (tripData && !isLoadingServices && !isLoadingHotelDefinitions && !isLoadingExchangeRates && !isLoadingCountries) {
      const summary = calculateAllCosts(tripData, countries, allServicePrices, allHotelDefinitions, getRate);
      setCostSummary(summary);
    } else {
      setCostSummary(null);
    }
  }, [tripData, isLoadingServices, isLoadingHotelDefinitions, isLoadingExchangeRates, isLoadingCountries, allServicePrices, allHotelDefinitions, getRate, countries, exchangeRates, globalMarkupPercentage, specificMarkupRates]);

  React.useEffect(() => {
    if (tripData.settings.numDays < currentDayView) {
      setCurrentDayView(Math.max(1, tripData.settings.numDays));
    }
  }, [tripData.settings.numDays, currentDayView]);


  const handleUpdateItem = React.useCallback((day: number, updatedItem: ItineraryItem) => {
    onUpdateTripData(currentTripData => {
      if (!currentTripData) return {};
      const newDays = { ...currentTripData.days };
      const dayItems = [...(newDays[day]?.items || [])];
      const itemIndex = dayItems.findIndex(item => item.id === updatedItem.id);
      if (itemIndex > -1) {
        dayItems[itemIndex] = updatedItem;
      }
      newDays[day] = { items: dayItems };
      return { days: newDays };
    });
  }, [onUpdateTripData]);

  const handleAddItem = React.useCallback((day: number, itemType: ItineraryItem['type']) => {
    onUpdateTripData(currentTripData => {
      if (!currentTripData) return {};
      let newItem: ItineraryItem;
      const baseNewItem = {
        id: generateGUID(),
        day,
        name: `New ${itemType}`,
        excludedTravelerIds: [],
        countryId: currentTripData.settings.selectedCountries.length === 1 ? currentTripData.settings.selectedCountries[0] : undefined,
        province: currentTripData.settings.selectedProvinces.length === 1 ? currentTripData.settings.selectedProvinces[0] : undefined,
      };

      switch (itemType) {
        case 'transfer':
          newItem = { ...baseNewItem, type: 'transfer', mode: 'ticket', adultTicketPrice: 0, childTicketPrice: 0 };
          break;
        case 'activity':
          newItem = { ...baseNewItem, type: 'activity', adultPrice: 0, childPrice: 0 };
          break;
        case 'hotel':
          newItem = {
            ...baseNewItem,
            type: 'hotel',
            checkoutDay: day + 1,
            hotelDefinitionId: '',
            selectedRooms: []
          };
          break;
        case 'meal':
          newItem = { ...baseNewItem, type: 'meal', adultMealPrice: 0, childMealPrice: 0, totalMeals: 1 };
          break;
        case 'misc':
          newItem = { ...baseNewItem, type: 'misc', unitCost: 0, quantity: 1, costAssignment: 'perPerson' };
          break;
        default:
          return {}; 
      }

      const newDays = { ...currentTripData.days };
      const dayItems = [...(newDays[day]?.items || []), newItem];
      newDays[day] = { items: dayItems };
      return { days: newDays };
    });
  }, [onUpdateTripData]);

  const handleDeleteItem = React.useCallback((day: number, itemId: string) => {
    onUpdateTripData(currentTripData => {
      if (!currentTripData) return {};
      const newDays = { ...currentTripData.days };
      const dayItems = (newDays[day]?.items || []).filter(item => item.id !== itemId);
      newDays[day] = { items: dayItems };
      return { days: newDays };
    });
  }, [onUpdateTripData]);

  const handlePrint = React.useCallback(() => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  }, []);

  const getFormattedDateForDay = React.useCallback((dayNum: number): string => {
    if (!tripData.settings.startDate) return `Day ${dayNum}`;
    try {
      const date = addDays(parseISO(tripData.settings.startDate), dayNum - 1);
      return `Day ${dayNum} - ${format(date, "MMM d, yyyy (EEEE)")}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return `Day ${dayNum}`;
    }
  }, [tripData.settings.startDate]);

  if (isPrinting && costSummary) {
    return <PrintLayout tripData={tripData} costSummary={costSummary} showCosts={showCosts} />;
  }

  const isLoadingAnything = isLoadingServices || isLoadingHotelDefinitions || isLoadingExchangeRates || isLoadingCountries;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
      <PlannerHeader
        tripData={tripData}
        onUpdateTripData={onUpdateTripData}
        onUpdateSettings={onUpdateSettings}
        onUpdatePax={onUpdatePax}
        onManualSave={onManualSave}
        onReset={onReset}
        showCosts={showCosts}
      />

      {quotationRequestDetails && (
        <Card className="my-4 md:my-6 shadow-md no-print bg-secondary/20 border-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl text-accent flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Original Quotation Request (ID: {quotationRequestDetails.id.split('-').pop()})
            </CardTitle>
            <CardDescription className="text-sm text-accent-foreground/80">
              This information was provided by the agent. Use it to guide your itinerary planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-sm hover:no-underline">Client &amp; Basic Trip Info</AccordionTrigger>
                <AccordionContent className="text-xs space-y-1 pt-2">
                  <p><strong>Agent/Source:</strong> {tripData.clientName || 'N/A'}</p>
                  <p><strong>Adults:</strong> {quotationRequestDetails.clientInfo.adults}, <strong>Children:</strong> {quotationRequestDetails.clientInfo.children} {quotationRequestDetails.clientInfo.children > 0 && `(Ages: ${quotationRequestDetails.clientInfo.childAges || 'N/A'})`}</p>
                  <p><strong>Destinations:</strong></p>
                    <ul className="list-disc pl-5">
                        <li>Countries: {quotationRequestDetails.tripDetails.preferredCountryIds.map(id => countries.find(c=>c.id===id)?.name || id).join(', ') || 'Any'}</li>
                        <li>Provinces: {quotationRequestDetails.tripDetails.preferredProvinceNames?.join(', ') || 'Any'}</li>
                    </ul>
                  <p><strong>Dates:</strong> {quotationRequestDetails.tripDetails.preferredStartDate ? format(parseISO(quotationRequestDetails.tripDetails.preferredStartDate), 'dd MMM yyyy') : 'N/A'} to {quotationRequestDetails.tripDetails.preferredEndDate ? format(parseISO(quotationRequestDetails.tripDetails.preferredEndDate), 'dd MMM yyyy') : 'N/A'} ({quotationRequestDetails.tripDetails.durationDays || 'N/A'} days)</p>
                  <p><strong>Trip Type:</strong> {quotationRequestDetails.tripDetails.tripType || 'N/A'}</p>
                  <p><strong>Budget:</strong> {quotationRequestDetails.tripDetails.budgetRange || 'N/A'} {quotationRequestDetails.tripDetails.budgetRange === "Specific Amount (see notes)" && `(${formatCurrency(quotationRequestDetails.tripDetails.budgetAmount || 0, quotationRequestDetails.tripDetails.budgetCurrency || 'USD')})`}</p>
                </AccordionContent>
              </AccordionItem>
              {quotationRequestDetails.accommodationPrefs && (
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-sm hover:no-underline">Accommodation Preferences</AccordionTrigger>
                  <AccordionContent className="text-xs space-y-1 pt-2">
                    <p><strong>Star Rating:</strong> {quotationRequestDetails.accommodationPrefs.hotelStarRating || 'N/A'}</p>
                    <p><strong>Room Prefs:</strong> {quotationRequestDetails.accommodationPrefs.roomPreferences || 'N/A'}</p>
                    <p><strong>Specific Hotels:</strong> {quotationRequestDetails.accommodationPrefs.specificHotelRequests || 'N/A'}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
              {quotationRequestDetails.activityPrefs && (
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-sm hover:no-underline">Activity & Tour Preferences</AccordionTrigger>
                  <AccordionContent className="text-xs pt-2">
                    <p className="whitespace-pre-wrap">{quotationRequestDetails.activityPrefs.requestedActivities || 'No specific activities requested.'}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
              {quotationRequestDetails.flightPrefs && (
                 <AccordionItem value="item-4">
                  <AccordionTrigger className="text-sm hover:no-underline">Transfer Preferences</AccordionTrigger>
                  <AccordionContent className="text-xs space-y-1 pt-2">
                    <p><strong>Airport Transfers Required:</strong> {quotationRequestDetails.flightPrefs.airportTransfersRequired ? 'Yes' : 'No'}</p>
                    <p><strong>Activity Transfers Required:</strong> {quotationRequestDetails.flightPrefs.activityTransfersRequired ? 'Yes' : 'No'}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
              {quotationRequestDetails.mealPrefs && (
                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-sm hover:no-underline">Meal Preferences</AccordionTrigger>
                  <AccordionContent className="text-xs pt-2">
                    <p><strong>Plan:</strong> {quotationRequestDetails.mealPrefs.mealPlan || 'Not Specified'}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
              {quotationRequestDetails.otherRequirements && (
                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-sm hover:no-underline">Other Requirements</AccordionTrigger>
                  <AccordionContent className="text-xs pt-2">
                    <p className="whitespace-pre-wrap">{quotationRequestDetails.otherRequirements}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </CardContent>
        </Card>
      )}


      <DayNavigation
        currentDayView={currentDayView}
        setCurrentDayView={setCurrentDayView}
        numDays={tripData.settings.numDays}
        getFormattedDateForDay={getFormattedDateForDay}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 min-h-[60vh]">
        <div className="lg:col-span-8 flex flex-col">
          {isLoadingAnything && !tripData.days[currentDayView] ? ( 
            <div className="flex flex-col items-center justify-center p-6 sm:p-10 min-h-[300px] bg-card rounded-lg shadow-sm border flex-grow">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">Loading itinerary data and service definitions...</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-0 lg:pr-2">
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
                    allHotelDefinitions={allHotelDefinitions}
                    allServicePrices={allServicePrices}
                  />
                </div>
              ))}
            </ScrollArea>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col space-y-4 md:space-y-6 no-print">
          <Card className="shadow-lg flex-grow flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-primary">Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              {isLoadingAnything && !costSummary ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary mr-2" />
                  <p className="text-muted-foreground text-sm">Loading costs...</p>
                </div>
              ) : costSummary ? (
                <>
                  <CostBreakdownTable summary={costSummary} currency={tripData.pax.currency} travelers={tripData.travelers} showCosts={showCosts} />
                  {showCosts && (
                    <>
                      <Separator className="my-3 sm:my-4" />
                      <div className="text-right">
                        <p className="text-md sm:text-lg font-semibold">Grand Total:</p>
                        <p className="text-xl sm:text-2xl font-bold text-accent font-code">
                          {formatCurrency(costSummary.grandTotal, tripData.pax.currency)}
                        </p>
                      </div>
                    </>
                  )}
                  {!showCosts && (
                    <p className="text-sm text-muted-foreground text-center mt-4">Cost details are hidden.</p>
                  )}
                </>
              ) : <p className="text-sm text-center">Calculating costs...</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6 md:mt-8 shadow-lg">
        <CardHeader className="no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-xl sm:text-2xl font-headline text-primary">Full Itinerary Details</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowCosts(!showCosts)} className="ml-0 sm:ml-4 mt-2 sm:mt-0 self-start sm:self-center">
              {showCosts ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showCosts ? 'Hide Costs' : 'Show Costs'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAnything && !costSummary ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 animate-spin text-primary mr-3" />
              <p className="text-muted-foreground text-sm sm:text-base">Loading full details...</p>
            </div>
          ) : costSummary ? (
            <DetailsSummaryTable summary={costSummary} currency={tripData.pax.currency} showCosts={showCosts} />
          ) : <p className="text-sm text-center">Loading details...</p>}
        </CardContent>
      </Card>

      <div className="mt-6 md:mt-8 py-4 md:py-6 border-t border-border flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 no-print">
        <Button onClick={handlePrint} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          <Printer className="mr-2 h-4 w-4" /> Print Itinerary
        </Button>
      </div>
    </div>
  );
}

