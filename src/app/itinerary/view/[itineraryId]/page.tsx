
"use client";

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { TripData, ItineraryItem, CostSummary, DetailedSummaryItem, HotelOccupancyDetail, CurrencyCode, Traveler, CountryItem } from '@/types/itinerary';
import { calculateAllCosts } from '@/lib/calculation-utils';
import { useServicePrices } from '@/hooks/useServicePrices';
import { useHotelDefinitions } from '@/hooks/useHotelDefinitions';
import { useCountries } from '@/hooks/useCountries';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { addDays, format, parseISO, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, AlertCircle, CalendarDays, Users, MapPin,
  Hotel, Car, Ticket, Utensils, ShoppingBag, FileText,
  ArrowLeft, Globe, Printer, EyeOff, Eye, Coins
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const ITINERARY_DATA_PREFIX = 'itineraryAce_data_';

const ITEM_TYPE_ICONS: { [key in ItineraryItem['type']]: React.ElementType } = {
  transfer: Car,
  hotel: Hotel,
  activity: Ticket,
  meal: Utensils,
  misc: ShoppingBag,
};

const BOOKING_STATUS_STYLES: Record<DetailedSummaryItem['bookingStatus'] & string, string> = {
  Pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Requested: "bg-blue-100 text-blue-700 border-blue-300",
  Confirmed: "bg-green-100 text-green-700 border-green-300",
  Unavailable: "bg-red-100 text-red-700 border-red-300",
  Cancelled: "bg-gray-100 text-gray-700 border-gray-300",
};


export default function ItineraryClientViewPage() {
  const params = useParams();
  const router = useRouter();
  const itineraryId = params.itineraryId as string;

  const [tripData, setTripData] = React.useState<TripData | null>(null);
  const [costSummary, setCostSummary] = React.useState<CostSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showCosts, setShowCosts] = React.useState(true);

  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const { allHotelDefinitions, isLoading: isLoadingHotelDefs } = useHotelDefinitions();
  const { countries, isLoading: isLoadingCountries, getCountryById } = useCountries();
  const { getRate, isLoading: isLoadingExchangeRates } = useExchangeRates();

  React.useEffect(() => {
    if (itineraryId) {
      try {
        const storedData = localStorage.getItem(`${ITINERARY_DATA_PREFIX}${itineraryId}`);
        if (storedData) {
          setTripData(JSON.parse(storedData));
        } else {
          setError("Itinerary not found. Please check the ID or link.");
        }
      } catch (e) {
        console.error("Error loading itinerary from localStorage:", e);
        setError("Failed to load itinerary data due to a storage error.");
      }
    }
  }, [itineraryId]);

  React.useEffect(() => {
    if (tripData && !isLoadingServices && !isLoadingHotelDefs && !isLoadingCountries && !isLoadingExchangeRates) {
      try {
        const summary = calculateAllCosts(tripData, countries, allServicePrices, allHotelDefinitions, getRate);
        setCostSummary(summary);
      } catch (calcError: any) {
        console.error("Error calculating costs:", calcError);
        setError(`Failed to calculate itinerary costs: ${calcError.message}`);
      } finally {
        setIsLoading(false);
      }
    } else if (!tripData && !isLoading && !error) { 
      if (!isLoadingServices && !isLoadingHotelDefs && !isLoadingCountries && !isLoadingExchangeRates) {
         setIsLoading(false); 
      }
    }
  }, [tripData, isLoadingServices, isLoadingHotelDefs, isLoadingCountries, isLoadingExchangeRates, countries, allServicePrices, allHotelDefinitions, getRate, isLoading, error]);


  const getFormattedDateForDay = (dayNum: number): string => {
    if (!tripData?.settings.startDate) return `Day ${dayNum}`;
    try {
      const date = addDays(parseISO(tripData.settings.startDate), dayNum - 1);
      return `Day ${dayNum} - ${format(date, "MMMM d, yyyy (EEEE)")}`;
    } catch (e) {
      return `Day ${dayNum}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Itinerary View...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold text-destructive mb-2">Error Loading Itinerary</h1>
        <p className="text-muted-foreground mb-4 text-center">{error}</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  if (!tripData || !costSummary) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold text-muted-foreground mb-2">Itinerary Not Available</h1>
        <p className="text-muted-foreground mb-4 text-center">The requested itinerary could not be displayed. It might have been deleted or the link is incorrect.</p>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    );
  }

  const { settings, pax, travelers, days } = tripData;
  const displayStartDate = settings.startDate && isValid(parseISO(settings.startDate))
    ? format(parseISO(settings.startDate), "MMMM d, yyyy")
    : 'N/A';


  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-6 lg:p-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto bg-card shadow-xl rounded-lg print:shadow-none print:border-none">
        <CardHeader className="p-4 sm:p-6 border-b print:border-b-2 print:border-black">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex-grow">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary print:text-black">{tripData.itineraryName}</h1>
              {tripData.clientName && <p className="text-sm sm:text-md text-muted-foreground print:text-gray-700">For: {tripData.clientName}</p>}
            </div>
            <div className="flex gap-2 self-start sm:self-center no-print">
                <Button onClick={() => setShowCosts(!showCosts)} variant="outline" size="sm">
                    {showCosts ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showCosts ? 'Hide' : 'Show'} Costs
                </Button>
                <Button onClick={() => router.back()} variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs sm:text-sm print:text-xs">
            <div className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4 text-primary print:text-gray-600" /> <strong>Dates:</strong><span className="ml-1.5">{displayStartDate} ({settings.numDays} days)</span></div>
            <div className="flex items-center"><Users className="mr-1.5 h-4 w-4 text-primary print:text-gray-600" /> <strong>Guests:</strong><span className="ml-1.5">{pax.adults} Adult(s){pax.children > 0 && `, ${pax.children} Child(ren)`}</span></div>
            <div className="flex items-center"><Coins className="mr-1.5 h-4 w-4 text-primary print:text-gray-600" /> <strong>Currency:</strong><span className="ml-1.5">{pax.currency}</span></div>
            {settings.selectedCountries.length > 0 && (
              <div className="flex items-center col-span-full sm:col-span-1"><Globe className="mr-1.5 h-4 w-4 text-primary print:text-gray-600" /> <strong>Countries:</strong><span className="ml-1.5">{settings.selectedCountries.map(id => countries.find(c=>c.id === id)?.name || id).join(', ')}</span></div>
            )}
            {settings.selectedProvinces.length > 0 && (
              <div className="flex items-center col-span-full sm:col-span-2"><MapPin className="mr-1.5 h-4 w-4 text-primary print:text-gray-600" /> <strong>Provinces:</strong><span className="ml-1.5">{settings.selectedProvinces.join(', ')}</span></div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6 md:space-y-8 print:p-3 sm:print:p-4">
          {Object.entries(days)
            .sort(([dayNumA], [dayNumB]) => parseInt(dayNumA) - parseInt(dayNumB))
            .map(([dayNumStr, dayItinerary]) => {
            const dayNum = parseInt(dayNumStr);
            return (
              <section key={dayNum} className="mb-5 last:mb-0 print:mb-3 page-break-inside-avoid">
                <h2 className="text-lg sm:text-xl font-semibold text-primary border-b-2 border-primary/30 pb-1.5 mb-3 sm:mb-4 print:text-base print:border-gray-400">
                  {getFormattedDateForDay(dayNum)}
                </h2>
                {dayItinerary.items.length === 0 ? (
                  <p className="text-muted-foreground italic text-sm print:text-xs">No activities or services planned for this day.</p>
                ) : (
                  <div className="space-y-4 sm:space-y-5 print:space-y-3">
                    {dayItinerary.items.map(item => {
                      const IconComponent = ITEM_TYPE_ICONS[item.type] || FileText; // Fallback to FileText
                      const detailedItemInfo = costSummary.detailedItems.find(di => di.id === item.id);
                      const locationDisplay = [detailedItemInfo?.province, detailedItemInfo?.countryName].filter(Boolean).join(', ');

                      return (
                        <div key={item.id} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden print:shadow-none print:border-gray-300 page-break-inside-avoid">
                          <div className="flex items-start gap-3 p-3 sm:p-4 bg-muted/20 print:bg-gray-50 print:p-2.5">
                            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-accent mt-0.5 sm:mt-1 flex-shrink-0 print:h-4 print:w-4" />
                            <div className="flex-grow">
                              <h3 className="text-sm sm:text-md font-semibold print:text-sm">{item.name}</h3>
                              {locationDisplay && <p className="text-xs text-muted-foreground print:text-gray-600">{locationDisplay}</p>}
                            </div>
                          </div>
                          <div className="p-3 sm:p-4 space-y-1.5 text-xs sm:text-sm print:p-2.5 print:text-xs">
                            {item.note && <p className="whitespace-pre-wrap"><strong className="print:font-normal">Note:</strong> {item.note}</p>}
                            {detailedItemInfo?.configurationDetails && (
                              <div>
                                <strong className="print:font-normal">Details:</strong>
                                <ul className="list-disc list-inside pl-1 mt-0.5 space-y-0.5 text-xs text-muted-foreground print:text-gray-700">
                                  {detailedItemInfo.configurationDetails.split(';').map(d => d.trim()).filter(Boolean).map((detail, idx) => (
                                    <li key={idx}>{detail}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                             {item.type === 'hotel' && detailedItemInfo?.occupancyDetails && detailedItemInfo.occupancyDetails.length > 0 && (
                                <div className="mt-1.5">
                                <strong className="text-xs print:font-normal">Rooming:</strong>
                                <ul className="list-disc list-inside pl-1 mt-0.5 space-y-0.5 text-xs">
                                    {detailedItemInfo.occupancyDetails.map((occ, idx) => (
                                    <li key={idx}>
                                        <strong>{occ.roomTypeName}</strong> ({occ.numRooms} room{occ.numRooms > 1 ? 's' : ''} x {occ.nights} night{occ.nights > 1 ? 's' : ''})
                                        {occ.extraBedAdded && " (incl. Extra Bed)"}.
                                        {occ.assignedTravelerLabels && <span className="block text-muted-foreground print:text-gray-600">Guests: {occ.assignedTravelerLabels}</span>}
                                        {occ.characteristics && <span className="block text-muted-foreground print:text-gray-600">Details: {occ.characteristics}</span>}
                                    </li>
                                    ))}
                                </ul>
                                </div>
                            )}
                            {detailedItemInfo?.bookingStatus && (
                              <p className="mt-1"><strong className="print:font-normal">Status:</strong> <Badge variant="outline" className={`text-xs ${BOOKING_STATUS_STYLES[detailedItemInfo.bookingStatus] || 'border-gray-300 text-gray-700'}`}>{detailedItemInfo.bookingStatus}</Badge>
                                {detailedItemInfo.confirmationRef && <span className="ml-2 text-muted-foreground print:text-gray-600">(Ref: {detailedItemInfo.confirmationRef})</span>}
                              </p>
                            )}
                            {detailedItemInfo?.excludedTravelers && detailedItemInfo.excludedTravelers !== "None" && (
                              <p className="text-xs text-amber-700 print:text-gray-600 mt-1">Excludes: {detailedItemInfo.excludedTravelers}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {showCosts && (
            <section className="mt-6 pt-5 border-t print:mt-4 print:pt-3 print:border-gray-300 page-break-before-avoid">
              <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4 print:text-base">Cost Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-sm sm:text-md font-semibold mb-1.5 print:text-sm">Per Person Total:</h3>
                  <ul className="list-disc list-inside pl-1 space-y-0.5 text-xs sm:text-sm print:text-xs">
                    {travelers.map(traveler => (
                      <li key={traveler.id}>
                        {traveler.label}: <span className="font-semibold">{formatCurrency(costSummary.perPersonTotals[traveler.id] || 0, pax.currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-left md:text-right">
                  <h3 className="text-sm sm:text-md font-semibold mb-0.5 print:text-sm">Grand Total:</h3>
                  <p className="text-xl sm:text-2xl font-bold text-accent print:text-lg">{formatCurrency(costSummary.grandTotal, pax.currency)}</p>
                  {settings.budget && (
                    <p className="text-xs text-muted-foreground print:text-gray-600">
                      Budget: {formatCurrency(settings.budget, pax.currency)}
                      {costSummary.grandTotal > settings.budget && <Badge variant="destructive" className="ml-1.5 text-xs">Over Budget</Badge>}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
           {!showCosts && (
             <p className="text-sm text-muted-foreground text-center mt-6 py-4 border-t print:hidden">Cost details are currently hidden.</p>
           )}
        </CardContent>
         <div className="p-4 sm:p-6 pt-0 text-center no-print">
            <Button onClick={() => window.print()} variant="default" size="sm">
                <Printer className="mr-2 h-4 w-4"/> Print This View
            </Button>
        </div>
      </div>
    </div>
  );
}
