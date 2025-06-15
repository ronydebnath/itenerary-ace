
"use client";

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { TripData, ItineraryItem, CostSummary, DetailedSummaryItem, HotelOccupancyDetail, CurrencyCode, Traveler, CountryItem } from '@/types/itinerary';
import type { QuotationRequest, QuotationRequestStatus } from '@/types/quotation'; // Import QuotationRequest types
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
  ArrowLeft, Globe, Printer, Coins, PackageIcon, MessageSquare, Send
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { CostBreakdownTable } from '@/components/itinerary/cost-breakdown-table';
import { DetailsSummaryTable } from '@/components/itinerary/details-summary-table';
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react"; // Import useSession

const ITINERARY_DATA_PREFIX = 'itineraryAce_data_';
const AGENT_QUOTATION_REQUESTS_KEY = 'itineraryAce_agentQuotationRequests'; // For updating quote status
const VIEW_MODE_TOKEN = 'full_details_v1';

const ITEM_TYPE_ICONS: { [key in ItineraryItem['type']]: React.ElementType } = {
  transfer: Car,
  hotel: Hotel,
  activity: Ticket,
  meal: Utensils,
  misc: ShoppingBag,
};

const BOOKING_STATUS_STYLES: Record<DetailedSummaryItem['bookingStatus'] & string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-700/20 dark:text-yellow-300 dark:border-yellow-600",
  Requested: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-700/20 dark:text-blue-300 dark:border-blue-600",
  Confirmed: "bg-green-100 text-green-800 border-green-300 dark:bg-green-700/20 dark:text-green-300 dark:border-green-600",
  Unavailable: "bg-red-100 text-red-800 border-red-300 dark:bg-red-700/20 dark:text-red-300 dark:border-red-600",
  Cancelled: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-600/20 dark:text-gray-300 dark:border-gray-500",
};


export default function ItineraryClientViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const itineraryId = params.itineraryId as string;
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession(); // Get session data

  const [tripData, setTripData] = React.useState<TripData | null>(null);
  const [costSummary, setCostSummary] = React.useState<CostSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const viewModeTokenParam = searchParams.get('viewMode');
  const showCosts = viewModeTokenParam === VIEW_MODE_TOKEN;


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
        const summary = calculateAllCosts(tripData, countries, allServicePrices, allHotelDefinitions, getRate, showCosts);
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
  }, [tripData, isLoadingServices, isLoadingHotelDefs, isLoadingCountries, isLoadingExchangeRates, countries, allServicePrices, allHotelDefinitions, getRate, isLoading, error, showCosts]);

  const handleSendQuotationToAgent = () => {
    if (!tripData || !tripData.quotationRequestId) {
      toast({ title: "Error", description: "This itinerary is not linked to a quotation request.", variant: "destructive" });
      return;
    }

    try {
      const requestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
      if (requestsString) {
        let allRequests: QuotationRequest[] = JSON.parse(requestsString);
        const requestIndex = allRequests.findIndex(q => q.id === tripData.quotationRequestId);

        if (requestIndex > -1) {
          const currentStatus = allRequests[requestIndex].status;
          let newStatus: QuotationRequestStatus = "Quoted: Waiting for TA Feedback";

          if (["Quoted: Waiting for TA Feedback", "Quoted: Re-quoted", "Quoted: Awaiting TA Approval", "Quoted: Revision Requested"].includes(currentStatus)) {
            newStatus = "Quoted: Re-quoted";
          } else if (currentStatus === "New Request Submitted" || currentStatus === "Quoted: Revision In Progress") {
            newStatus = "Quoted: Waiting for TA Feedback";
          }
          
          allRequests[requestIndex].status = newStatus;
          allRequests[requestIndex].linkedItineraryId = tripData.id;
          allRequests[requestIndex].updatedAt = new Date().toISOString();
          localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allRequests));
          
          toast({ title: "Quotation Sent", description: `Proposal for Quotation ID ${tripData.quotationRequestId.split('-').pop()} marked as ready for agent (Status: ${newStatus}).`, variant: "default" });
        } else {
          toast({ title: "Error", description: "Associated quotation request not found in storage.", variant: "destructive" });
        }
      } else {
        toast({ title: "Error", description: "Quotation request data not found in storage.", variant: "destructive" });
      }
    } catch (e: any) {
      console.error("Error sending quotation from client view:", e);
      toast({ title: "Error", description: `Could not update quotation status: ${e.message}`, variant: "destructive" });
    }
  };


  const getFormattedDateForDay = (dayNum: number): string => {
    if (!tripData?.settings.startDate) return `Day ${dayNum}`;
    try {
      const date = addDays(parseISO(tripData.settings.startDate), dayNum - 1);
      return `Day ${dayNum} - ${format(date, "MMMM d, yyyy (EEEE)")}`;
    } catch (e) {
      return `Day ${dayNum}`;
    }
  };


  if (isLoading || sessionStatus === 'loading') {
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
  
  const isAdmin = session?.user && (session.user as any).role === 'admin';


  return (
    <div className="min-h-screen bg-muted/20 dark:bg-muted/5 p-2 sm:p-4 md:p-6 lg:p-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto bg-card shadow-2xl rounded-lg print:shadow-none print:border-none">
        <CardHeader className="p-4 sm:p-6 border-b print:border-b-2 print:border-black bg-primary/5 dark:bg-primary/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex-grow">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary print:text-black">{tripData.itineraryName}</h1>
              {tripData.clientName && <p className="text-sm sm:text-md text-muted-foreground print:text-gray-700">For: {tripData.clientName}</p>}
            </div>
            <div className="flex gap-2 self-start sm:self-center no-print">
                <Button onClick={() => router.back()} variant="outline" size="sm" className="h-8 text-xs">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
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
           {tripData.overallBookingStatus && (
            <div className="mt-2 pt-2 border-t border-primary/10">
              <Badge variant="outline" className={cn("text-sm font-medium", BOOKING_STATUS_STYLES[tripData.overallBookingStatus] || 'border-gray-300 text-gray-700')}>
                Overall Status: {tripData.overallBookingStatus}
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6 md:space-y-8 print:p-3 sm:print:p-4">
          {Object.entries(days)
            .sort(([dayNumA], [dayNumB]) => parseInt(dayNumA) - parseInt(dayNumB))
            .map(([dayNumStr, dayItinerary]) => {
            const dayNum = parseInt(dayNumStr);
            return (
              <section key={dayNum} className="mb-5 last:mb-0 print:mb-3 page-break-inside-avoid">
                <h2 className="text-xl sm:text-2xl font-semibold text-primary border-b-2 border-primary/30 pb-2 mb-4 sm:mb-5 print:text-lg print:border-gray-400 print:pb-1.5 print:mb-3">
                  {getFormattedDateForDay(dayNum)}
                </h2>
                {dayItinerary.items.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground bg-muted/20 dark:bg-muted/10 rounded-md border border-dashed print:py-3">
                    <PackageIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2 print:h-8 print:w-8" />
                    <p className="text-sm sm:text-md print:text-sm">No activities or services planned for this day.</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-5 print:space-y-3">
                    {dayItinerary.items.map(item => {
                      const IconComponent = ITEM_TYPE_ICONS[item.type] || FileText;
                      const detailedItemInfo = costSummary.detailedItems.find(di => di.id === item.id);
                      const locationDisplay = [detailedItemInfo?.province, detailedItemInfo?.countryName].filter(Boolean).join(', ');

                      return (
                        <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 print:shadow-none print:border-gray-300 page-break-inside-avoid overflow-hidden">
                          <CardHeader className="flex flex-row items-start gap-3 p-3 sm:p-4 bg-muted/30 dark:bg-muted/15 print:bg-gray-50 print:p-2.5 border-b print:border-gray-200">
                            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-accent mt-0.5 sm:mt-1 flex-shrink-0 print:h-4 print:w-4" />
                            <div className="flex-grow min-w-0">
                              <h3 className="text-md sm:text-lg font-semibold text-primary/90 dark:text-primary/80 print:text-base">{item.name}</h3>
                              {locationDisplay && <p className="text-xs text-muted-foreground print:text-gray-600"><MapPin className="inline-block h-3 w-3 mr-1 -mt-px"/>{locationDisplay}</p>}
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4 space-y-2 text-xs sm:text-sm print:p-2.5 print:text-xs">
                            {item.note && (
                              <div className="flex items-start">
                                <MessageSquare className="h-3.5 w-3.5 mr-2 mt-px text-muted-foreground flex-shrink-0 print:h-3 print:w-3"/>
                                <p className="whitespace-pre-wrap text-muted-foreground print:text-gray-700">{item.note}</p>
                              </div>
                            )}
                            {detailedItemInfo?.configurationDetails && (
                              <div>
                                <strong className="text-foreground/80 print:font-normal">Details:</strong>
                                <ul className="list-disc list-inside pl-2 mt-0.5 space-y-0.5 text-xs text-muted-foreground print:text-gray-700">
                                  {detailedItemInfo.configurationDetails.split(';').map(d => d.trim()).filter(Boolean).map((detail, idx) => (
                                    <li key={idx} className="whitespace-normal break-words">{detail}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                             {item.type === 'hotel' && detailedItemInfo?.occupancyDetails && detailedItemInfo.occupancyDetails.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-border/50 dark:border-border/20">
                                <strong className="text-xs text-foreground/80 print:font-normal">Rooming Configuration:</strong>
                                <ul className="list-disc list-inside pl-2 mt-0.5 space-y-1 text-xs">
                                    {detailedItemInfo.occupancyDetails.map((occ, idx) => (
                                    <li key={idx}>
                                        <strong>{occ.roomTypeName}</strong> ({occ.numRooms} room{occ.numRooms > 1 ? 's' : ''} x {occ.nights} night{occ.nights > 1 ? 's' : ''})
                                        {occ.extraBedAdded && " (incl. Extra Bed)"}.
                                        {occ.assignedTravelerLabels && <span className="block text-muted-foreground print:text-gray-600">Guests: {occ.assignedTravelerLabels}</span>}
                                        {occ.characteristics && <span className="block text-muted-foreground print:text-gray-600">Details: {occ.characteristics}</span>}
                                        {showCosts && <span className="block text-muted-foreground print:text-gray-600">Cost: {formatCurrency(occ.totalRoomBlockCost, tripData.pax.currency)}</span>}
                                    </li>
                                    ))}
                                </ul>
                                </div>
                            )}
                            {detailedItemInfo?.bookingStatus && (
                              <p className="mt-2 pt-2 border-t border-border/50 dark:border-border/20"><strong className="text-foreground/80 print:font-normal">Status:</strong> <Badge variant="outline" className={cn("text-xs", BOOKING_STATUS_STYLES[detailedItemInfo.bookingStatus] || 'border-gray-300 text-gray-700')}>{detailedItemInfo.bookingStatus}</Badge>
                                {detailedItemInfo.confirmationRef && <span className="ml-2 text-muted-foreground print:text-gray-600">(Ref: {detailedItemInfo.confirmationRef})</span>}
                              </p>
                            )}
                            {detailedItemInfo?.excludedTravelers && detailedItemInfo.excludedTravelers !== "None" && (
                              <p className="text-xs text-amber-700 dark:text-amber-500 print:text-gray-600 mt-1.5">Excludes: {detailedItemInfo.excludedTravelers}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          <section className="mt-6 pt-5 border-t print:mt-4 print:pt-3 print:border-gray-300 page-break-before-avoid">
            <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3 sm:mb-4 print:text-base">Cost Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-muted/20 dark:bg-muted/10 p-3 sm:p-4 rounded-md border">
                <h3 className="text-sm sm:text-md font-semibold mb-1.5 print:text-sm text-foreground/90">Per Person Total:</h3>
                <CostBreakdownTable summary={costSummary} currency={pax.currency} travelers={travelers} showCosts={true} />
              </div>
              <div className="text-left md:text-right bg-muted/20 dark:bg-muted/10 p-3 sm:p-4 rounded-md border">
                <h3 className="text-sm sm:text-md font-semibold mb-0.5 print:text-sm text-foreground/90">Grand Total:</h3>
                <p className="text-xl sm:text-2xl font-bold text-accent print:text-lg">{formatCurrency(costSummary.grandTotal, pax.currency)}</p>
                {settings.budget && (
                  <p className="text-xs text-muted-foreground print:text-gray-600">
                    Budget: {formatCurrency(settings.budget, pax.currency)}
                    {costSummary.grandTotal > settings.budget && <Badge variant="destructive" className="ml-1.5 text-xs">Over Budget</Badge>}
                  </p>
                )}
              </div>
            </div>
            {!showCosts && <p className="text-sm text-muted-foreground text-center mt-4 print:block hidden">Detailed individual service costs are hidden in this view.</p>}
          </section>
          
        </CardContent>
         <div className="p-4 sm:p-6 pt-0 text-center no-print flex flex-col sm:flex-row justify-center items-center gap-3">
            <Button onClick={() => window.print()} variant="outline" size="sm" className="h-9 text-sm w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4"/> Print Current View
            </Button>
            {isAdmin && tripData.quotationRequestId && (
                <Button onClick={handleSendQuotationToAgent} size="sm" className="h-9 text-sm w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                    <Send className="mr-2 h-4 w-4"/> Send Quotation to Agent
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}

