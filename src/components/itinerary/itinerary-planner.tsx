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
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Loader2, FileText, Users as UsersIcon, MapPin as MapPinIcon, CalendarDays as CalendarDaysIcon, Briefcase as BriefcaseIcon, Coins as CoinsIcon, BedDouble as BedDoubleIcon, Zap as ZapIcon, Car as CarIcon, Utensils as UtensilsIcon, MessageSquare as MessageSquareIcon, Share2, Info, Send } from 'lucide-react';
import { formatCurrency, generateGUID } from '@/lib/utils';
import { DayView } from '../itinerary/day-view';
import { CostBreakdownTable } from '../itinerary/cost-breakdown-table';
import { DetailsSummaryTable } from '../itinerary/details-summary-table';
import { calculateAllCosts } from '@/lib/calculation-utils';
import { useServicePrices } from '@/hooks/useServicePrices';
import { useHotelDefinitions } from '@/hooks/useHotelDefinitions';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useCountries } from '@/hooks/useCountries';
import { addDays, format, parseISO, isValid } from 'date-fns';
import { PlannerHeader } from './planner-header';
import { DayNavigation } from './day-navigation';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

const SHOW_DETAILS_TOKEN = 'full_details_v1'; 

interface ItineraryPlannerProps {
  tripData: TripData;
  onReset: () => void;
  onUpdateTripData: (updateFn: (currentTripData: TripData | null) => Partial<TripData> | TripData) => void;
  onUpdateSettings: (updatedSettings: Partial<TripSettings>) => void;
  onUpdatePax: (updatedPax: Partial<PaxDetails>) => void;
  onManualSave: () => void;
  quotationRequestDetails?: QuotationRequest | null;
  handleSendQuotationToAgent: () => boolean; // Updated function name
}

export function ItineraryPlanner({
  tripData,
  onReset,
  onUpdateTripData,
  onUpdateSettings,
  onUpdatePax,
  onManualSave,
  quotationRequestDetails,
  handleSendQuotationToAgent // Updated prop name
}: ItineraryPlannerProps) {
  const router = useRouter();
  const [currentDayView, setCurrentDayView] = React.useState<number>(1);
  const [costSummary, setCostSummary] = React.useState<CostSummary | null>(null);
  const [plannerShowCosts, setPlannerShowCosts] = React.useState<boolean>(true);
  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const { allHotelDefinitions, isLoading: isLoadingHotelDefinitions } = useHotelDefinitions();
  const { getRate, isLoading: isLoadingExchangeRates, exchangeRates, globalMarkupPercentage, specificMarkupRates } = useExchangeRates();
  const { countries, isLoading: isLoadingCountries } = useCountries();

  React.useEffect(() => {
    if (tripData && !isLoadingServices && !isLoadingHotelDefinitions && !isLoadingExchangeRates && !isLoadingCountries) {
      const summary = calculateAllCosts(tripData, countries, allServicePrices, allHotelDefinitions, getRate, true);
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

  const handleSaveAndGoToView = React.useCallback((withDetailedCosts: boolean) => {
    onManualSave(); 
    if (tripData?.id) {
      let url = `/itinerary/view/${tripData.id}`;
      if (withDetailedCosts) {
        url += `?viewMode=${SHOW_DETAILS_TOKEN}`;
      }
      router.push(url);
    }
  }, [tripData?.id, router, onManualSave]);
  
  const handleSendQuotationClick = () => {
    onManualSave(); // Save latest changes first
    if(handleSendQuotationToAgent) {
        handleSendQuotationToAgent(); // Then mark as ready for agent
    }
  };


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


  const isLoadingAnything = isLoadingServices || isLoadingHotelDefinitions || isLoadingExchangeRates || isLoadingCountries;
  const canSendQuoteToAgent = !!tripData.quotationRequestId && !!quotationRequestDetails && !!handleSendQuotationToAgent;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
      {quotationRequestDetails && (
        <Card className="my-4 md:my-6 shadow-md no-print bg-secondary/20 border-secondary">
          <CardHeader className="pb-3 p-3 sm:p-4">
            <CardTitle className="text-base sm:text-lg md:text-xl text-primary flex items-center">
              <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Original Quotation Request (ID: {quotationRequestDetails.id.split('-').pop()})
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              This information was provided by the agent. Use it to guide your itinerary planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 text-xs sm:text-sm space-y-3 sm:space-y-4 p-3 sm:p-4">
            <div className="space-y-1 sm:space-y-2">
                <h4 className="font-semibold text-sm sm:text-md flex items-center text-foreground/90 mb-1">
                <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-primary" />Client & Basic Trip Info
                </h4>
                <p className="break-words"><strong>Agent/Source:</strong> <Badge variant="outline" className="font-normal text-xs">{tripData.clientName || 'N/A'}</Badge></p>
                <p className="break-words"><strong>Pax:</strong> {quotationRequestDetails.clientInfo.adults} Adult(s)
                {quotationRequestDetails.clientInfo.children > 0 && `, ${quotationRequestDetails.clientInfo.children} Child(ren)`}
                {quotationRequestDetails.clientInfo.children > 0 && quotationRequestDetails.clientInfo.childAges && ` (Ages: ${quotationRequestDetails.clientInfo.childAges})`}
                </p>
                <div>
                <p className="font-medium">Destinations:</p>
                <ul className="list-disc pl-4 sm:pl-5 text-xs">
                    <li>Countries: <span className="font-semibold break-words">{quotationRequestDetails.tripDetails.preferredCountryIds.map(id => countries.find(c => c.id === id)?.name || id).join(', ') || 'Any'}</span></li>
                    <li>Provinces: <span className="font-semibold break-words">{quotationRequestDetails.tripDetails.preferredProvinceNames?.join(', ') || 'Any'}</span></li>
                </ul>
                </div>
                <p className="break-words"><strong>Dates:</strong> {quotationRequestDetails.tripDetails.preferredStartDate && isValid(parseISO(quotationRequestDetails.tripDetails.preferredStartDate)) ? format(parseISO(quotationRequestDetails.tripDetails.preferredStartDate), 'dd MMM yyyy') : 'N/A'} to {quotationRequestDetails.tripDetails.preferredEndDate && isValid(parseISO(quotationRequestDetails.tripDetails.preferredEndDate)) ? format(parseISO(quotationRequestDetails.tripDetails.preferredEndDate), 'dd MMM yyyy') : 'N/A'} <span className="text-muted-foreground">({quotationRequestDetails.tripDetails.durationDays || 'N/A'} days)</span></p>
                <p><strong>Trip Type:</strong> <Badge variant="secondary" className="font-normal text-xs">{quotationRequestDetails.tripDetails.tripType || 'N/A'}</Badge></p>
                <p className="break-words"><strong>Budget:</strong> {quotationRequestDetails.tripDetails.budgetRange || 'N/A'}
                {quotationRequestDetails.tripDetails.budgetRange === "Specific Amount (see notes)" &&
                    <span className="font-semibold"> ({formatCurrency(quotationRequestDetails.tripDetails.budgetAmount || 0, quotationRequestDetails.tripDetails.budgetCurrency || 'USD')})</span>
                }
                </p>
            </div>
            <Separator />
            {quotationRequestDetails.accommodationPrefs && (
                <div className="space-y-1 sm:space-y-1.5">
                <h4 className="font-semibold text-sm sm:text-md flex items-center text-foreground/90 mb-1"><BedDoubleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-primary" />Accommodation Preferences</h4>
                <p className="break-words"><strong>Star Rating:</strong> {quotationRequestDetails.accommodationPrefs.hotelStarRating || 'N/A'}</p>
                <p className="break-words"><strong>Room Prefs:</strong> {quotationRequestDetails.accommodationPrefs.roomPreferences || 'N/A'}</p>
                <p className="break-words"><strong>Specific Hotels/Locations:</strong> {quotationRequestDetails.accommodationPrefs.specificHotelRequests || 'N/A'}</p>
                </div>
            )}
            <Separator />
            {quotationRequestDetails.activityPrefs && (
                <div className="space-y-1 sm:space-y-1.5">
                <h4 className="font-semibold text-sm sm:text-md flex items-center text-foreground/90 mb-1"><ZapIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-primary" />Activity & Tour Preferences</h4>
                <p className="whitespace-pre-wrap bg-muted/30 p-1.5 sm:p-2 rounded-sm text-xs">{quotationRequestDetails.activityPrefs.requestedActivities || 'No specific activities requested.'}</p>
                </div>
            )}
            <Separator />
            {quotationRequestDetails.flightPrefs && (
                <div className="space-y-1 sm:space-y-1.5">
                <h4 className="font-semibold text-sm sm:text-md flex items-center text-foreground/90 mb-1"><CarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-primary" />Transfer Preferences</h4>
                <p><strong>Airport Transfers Required:</strong> <Badge variant={quotationRequestDetails.flightPrefs.airportTransfersRequired ? "default" : "outline"} className="text-xs">{quotationRequestDetails.flightPrefs.airportTransfersRequired ? 'Yes' : 'No'}</Badge></p>
                <p><strong>Activity Transfers Required:</strong> <Badge variant={quotationRequestDetails.flightPrefs.activityTransfersRequired ? "default" : "outline"} className="text-xs">{quotationRequestDetails.flightPrefs.activityTransfersRequired ? 'Yes' : 'No'}</Badge></p>
                </div>
            )}
            <Separator />
            {quotationRequestDetails.mealPrefs && (
                <div className="space-y-1 sm:space-y-1.5">
                <h4 className="font-semibold text-sm sm:text-md flex items-center text-foreground/90 mb-1"><UtensilsIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-primary" />Meal Preferences</h4>
                <p><strong>Plan:</strong> {quotationRequestDetails.mealPrefs.mealPlan || 'Not Specified'}</p>
                </div>
            )}
            <Separator />
            {quotationRequestDetails.otherRequirements && (
                <div className="space-y-1 sm:space-y-1.5">
                <h4 className="font-semibold text-sm sm:text-md flex items-center text-foreground/90 mb-1"><MessageSquareIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-primary" />Other Requirements</h4>
                <p className="whitespace-pre-wrap bg-muted/30 p-1.5 sm:p-2 rounded-sm text-xs">{quotationRequestDetails.otherRequirements}</p>
                </div>
            )}
            </CardContent>
        </Card>
      )}

      <PlannerHeader
        tripData={tripData}
        onUpdateTripData={onUpdateTripData}
        onUpdateSettings={onUpdateSettings}
        onUpdatePax={onUpdatePax}
        onManualSave={onManualSave}
        onReset={onReset}
        showCosts={plannerShowCosts}
        quotationRequestDetails={quotationRequestDetails}
        handleSendQuotationToAgent={handleSendQuotationClick} 
      />

      <DayNavigation
        currentDayView={currentDayView}
        setCurrentDayView={setCurrentDayView}
        numDays={tripData.settings.numDays}
        getFormattedDateForDay={getFormattedDateForDay}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-8 flex flex-col">
          {isLoadingAnything && !tripData.days[currentDayView] ? (
            <div className="flex flex-col items-center justify-center p-6 sm:p-10 min-h-[300px] bg-card rounded-lg shadow-sm border flex-grow">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">Loading itinerary data and service definitions...</p>
            </div>
          ) : (
            <div>
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
            </div>
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
                  <CostBreakdownTable summary={costSummary} currency={tripData.pax.currency} travelers={tripData.travelers} showCosts={plannerShowCosts} />
                  {plannerShowCosts && (
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
                  {!plannerShowCosts && (
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
            <CardTitle className="text-xl sm:text-2xl font-headline text-primary">Full Itinerary Details (For Planner)</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setPlannerShowCosts(!plannerShowCosts)} className="ml-0 sm:ml-4 mt-2 sm:mt-0 self-start sm:self-center">
              {plannerShowCosts ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {plannerShowCosts ? 'Hide Costs' : 'Show Costs'}
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
            <DetailsSummaryTable summary={costSummary} currency={tripData.pax.currency} showCosts={plannerShowCosts} />
          ) : <p className="text-sm text-center">Loading details...</p>}
        </CardContent>
      </Card>

      <div className="mt-6 md:mt-8 py-4 md:py-6 border-t border-border flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 no-print">
         <Button onClick={() => handleSaveAndGoToView(true)} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          <Share2 className="mr-2 h-4 w-4" /> View/Share with Details
        </Button>
        <Button onClick={() => handleSaveAndGoToView(false)} className="w-full sm:w-auto bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          <EyeOff className="mr-2 h-4 w-4" /> View/Share without Details
        </Button>
         <div className="mt-2 sm:mt-0 text-xs text-muted-foreground text-center sm:text-left">
            <Info className="inline h-3 w-3 mr-1 -mt-px" /> All actions save the current itinerary before navigating.
          </div>
      </div>
    </div>
  );
}
