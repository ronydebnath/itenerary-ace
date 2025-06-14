/**
 * @fileoverview This custom React hook manages the state and core logic for an itinerary.
 * It handles loading existing itineraries from localStorage or creating new ones,
 * updating itinerary data (settings, passenger details, day-to-day items),
 * and saving changes back to localStorage. It also manages the overall page
 * status (e.g., 'loading', 'planner').
 *
 * @bangla এই কাস্টম রিঅ্যাক্ট হুক একটি ভ্রমণপথের অবস্থা এবং মূল যুক্তি পরিচালনা করে।
 * এটি localStorage থেকে বিদ্যমান ভ্রমণপথ লোড করা বা নতুন তৈরি করা, ভ্রমণপথের ডেটা
 * (সেটিংস, যাত্রী বিবরণ, প্রতিদিনের আইটেম) আপডেট করা এবং পরিবর্তনগুলি localStorage-এ
 * সংরক্ষণ করা পরিচালনা করে। এটি পৃষ্ঠার সামগ্রিক অবস্থা (যেমন, 'লোডিং', 'প্ল্যানার')
 * পরিচালনা করে।
 */
"use client";

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { TripData, ItineraryMetadata, TripSettings, PaxDetails, Traveler, OverallBookingStatus, BookingStatus } from '@/types/itinerary';
import { OVERALL_BOOKING_STATUSES, BOOKING_STATUSES } from '@/types/itinerary';
import type { QuotationRequest, QuotationRequestStatus } from '@/types/quotation';
import { QUOTATION_STATUSES } from '@/types/quotation';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const ITINERARY_INDEX_KEY = 'itineraryAce_index';
const ITINERARY_DATA_PREFIX = 'itineraryAce_data_';
const AGENT_QUOTATION_REQUESTS_KEY = 'itineraryAce_agentQuotationRequests';


const generateItineraryId = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = String(Date.now()).slice(-5) + String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `ITN-${year}${month}${day}-${randomSuffix}`;
};

const createDefaultTravelers = (adults: number, children: number): Traveler[] => {
  const newTravelers: Traveler[] = [];
  for (let i = 1; i <= adults; i++) {
    newTravelers.push({ id: `A${generateGUID()}`, label: `Adult ${i}`, type: 'adult' as const });
  }
  for (let i = 1; i <= children; i++) {
    newTravelers.push({ id: `C${generateGUID()}`, label: `Child ${i}`, type: 'child' as const });
  }
  return newTravelers;
};

const createDefaultTripData = (quotationRequestId?: string, quotationRequest?: QuotationRequest): TripData => {
  const newId = generateItineraryId();
  const now = new Date().toISOString();
  const startDate = quotationRequest?.tripDetails.preferredStartDate ? new Date(quotationRequest.tripDetails.preferredStartDate) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const settings: TripSettings = {
    numDays: quotationRequest?.tripDetails.durationDays || 1,
    startDate: startDate.toISOString().split('T')[0],
    selectedCountries: quotationRequest?.tripDetails.preferredCountryIds || [],
    selectedProvinces: quotationRequest?.tripDetails.preferredProvinceNames || [],
    budget: quotationRequest?.tripDetails.budgetAmount,
  };
  const pax: PaxDetails = {
    adults: quotationRequest?.clientInfo.adults ?? 2,
    children: quotationRequest?.clientInfo.children ?? 0,
    currency: quotationRequest?.tripDetails.budgetCurrency ?? 'THB'
  };
  const travelers = createDefaultTravelers(pax.adults, pax.children);
  const days: { [dayNumber: number]: { items: [] } } = {};
  for (let i = 1; i <= settings.numDays; i++) {
      days[i] = { items: [] };
  }

  return {
    id: newId,
    itineraryName: quotationRequest
      ? `Proposal for Quotation ${quotationRequest.id.slice(-6)}`
      : `New Itinerary ${newId.split('-').pop()}`,
    clientName: undefined, // Client reference removed
    createdAt: now,
    updatedAt: now,
    settings,
    pax,
    travelers,
    days,
    quotationRequestId: quotationRequestId,
    version: 1,
    overallBookingStatus: "NotStarted",
  };
};


export type PageStatus = 'loading' | 'planner';

export function useItineraryManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [tripData, setTripData] = React.useState<TripData | null>(null);
  const [currentItineraryId, setCurrentItineraryId] = React.useState<string | null>(null);
  const [pageStatus, setPageStatus] = React.useState<PageStatus>('loading');

  React.useEffect(() => {
    const itineraryIdFromUrl = searchParams.get('itineraryId');
    const quotationRequestIdFromUrl = searchParams.get('quotationRequestId');

    if (itineraryIdFromUrl && currentItineraryId === itineraryIdFromUrl && pageStatus === 'planner' && (!quotationRequestIdFromUrl || tripData?.quotationRequestId === quotationRequestIdFromUrl)) {
      return;
    }
    if (!itineraryIdFromUrl && currentItineraryId && pageStatus === 'planner' && !quotationRequestIdFromUrl) {
      router.replace(`/planner?itineraryId=${currentItineraryId}`, { shallow: true });
      return;
    }

    if (pageStatus !== 'loading') setPageStatus('loading');

    let idToLoad = itineraryIdFromUrl;
    let loadedTripData: TripData | null = null;
    let associatedQuotationRequest: QuotationRequest | undefined = undefined;

    if (quotationRequestIdFromUrl) {
        try {
            const requestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
            if (requestsString) {
                const allRequests: QuotationRequest[] = JSON.parse(requestsString);
                associatedQuotationRequest = allRequests.find(q => q.id === quotationRequestIdFromUrl);
                if (associatedQuotationRequest && associatedQuotationRequest.linkedItineraryId && !idToLoad) {
                    idToLoad = associatedQuotationRequest.linkedItineraryId; // Load linked itinerary if exists and no specific itineraryId in URL
                }
            }
        } catch (e) { console.error("Error reading quotation requests:", e); }
    }

    if (!idToLoad && !quotationRequestIdFromUrl) { // No ID in URL, try last active
      try { idToLoad = localStorage.getItem('lastActiveItineraryId'); } catch (e) { console.error("Error reading lastActiveItineraryId:", e); }
    }

    if (idToLoad) {
      try {
        const savedDataString = localStorage.getItem(`${ITINERARY_DATA_PREFIX}${idToLoad}`);
        if (savedDataString) {
          const parsedData = JSON.parse(savedDataString) as Partial<TripData>;
          const defaultSettings = createDefaultTripData(quotationRequestIdFromUrl, associatedQuotationRequest).settings;
          loadedTripData = {
            id: parsedData.id || idToLoad,
            itineraryName: parsedData.itineraryName || (associatedQuotationRequest ? `Proposal for Quotation ${associatedQuotationRequest.id.slice(-6)}` : `Itinerary ${idToLoad.slice(-6)}`),
            clientName: parsedData.clientName || undefined,
            createdAt: parsedData.createdAt || new Date().toISOString(),
            updatedAt: parsedData.updatedAt || new Date().toISOString(),
            settings: { ...defaultSettings, ...parsedData.settings },
            pax: parsedData.pax || { adults: associatedQuotationRequest?.clientInfo.adults ?? 1, children: associatedQuotationRequest?.clientInfo.children ?? 0, currency: associatedQuotationRequest?.tripDetails.budgetCurrency ?? 'THB' },
            travelers: parsedData.travelers && parsedData.travelers.length > 0 ? parsedData.travelers : createDefaultTravelers(parsedData.pax?.adults || 1, parsedData.pax?.children || 0),
            days: parsedData.days || { 1: { items: [] } },
            quotationRequestId: parsedData.quotationRequestId || quotationRequestIdFromUrl || undefined,
            version: parsedData.version || 1,
            overallBookingStatus: parsedData.overallBookingStatus || "NotStarted",
          };
        } else {
          if (localStorage.getItem('lastActiveItineraryId') === idToLoad) localStorage.removeItem('lastActiveItineraryId');
          idToLoad = null;
        }
      } catch (error) { console.error("Failed to load data for ID:", idToLoad, error); idToLoad = null; }
    }

    if (!loadedTripData) {
      loadedTripData = createDefaultTripData(quotationRequestIdFromUrl, associatedQuotationRequest);
      idToLoad = loadedTripData.id;
      if (quotationRequestIdFromUrl && associatedQuotationRequest) {
         // Link this new itinerary to the quotation request
         const updatedQuotationRequest = { ...associatedQuotationRequest, linkedItineraryId: idToLoad, status: "Quoted" as QuotationRequestStatus, updatedAt: new Date().toISOString() };
         try {
             const requestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
             let allRequests: QuotationRequest[] = requestsString ? JSON.parse(requestsString) : [];
             allRequests = allRequests.map(q => q.id === quotationRequestIdFromUrl ? updatedQuotationRequest : q);
             localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allRequests));
         } catch (e) { console.error("Error updating quotation request with new itinerary ID:", e); }
      }
    }

    if (currentItineraryId !== idToLoad || pageStatus !== 'planner' || JSON.stringify(tripData) !== JSON.stringify(loadedTripData)) {
        setTripData(loadedTripData);
        setCurrentItineraryId(idToLoad!);
        localStorage.setItem('lastActiveItineraryId', idToLoad!);
        const newUrl = `/planner?itineraryId=${idToLoad}${loadedTripData.quotationRequestId ? `&quotationRequestId=${loadedTripData.quotationRequestId}`: ''}`;
        if (window.location.pathname + window.location.search !== newUrl) {
            router.replace(newUrl, { shallow: true });
        }
        setPageStatus('planner');
    } else if (pageStatus === 'loading') {
        setPageStatus('planner');
    }
  }, [searchParams, router]);

  const handleStartNewItinerary = React.useCallback(() => {
    const newDefaultTripData = createDefaultTripData();
    setTripData(newDefaultTripData);
    setCurrentItineraryId(newDefaultTripData.id);
    localStorage.setItem('lastActiveItineraryId', newDefaultTripData.id);
    router.replace(`/planner?itineraryId=${newDefaultTripData.id}`, { shallow: true });
    toast({ title: "New Itinerary Started", description: "A fresh itinerary has been created." });
  }, [router, toast]);

  const handleUpdateTripData = React.useCallback((updatedTripDataFromPlanner: Partial<TripData>) => {
    setTripData(prevTripData => {
      if (!prevTripData && !currentItineraryId) {
          console.error("Attempted to update trip data without a current itinerary.");
          toast({ title: "Error", description: "No active itinerary to update.", variant: "destructive" });
          return null;
      }
      const baseData = prevTripData || createDefaultTripData(searchParams.get('quotationRequestId') || undefined);
      const dataToSet: TripData = {
        ...baseData,
        ...updatedTripDataFromPlanner,
        id: baseData.id || currentItineraryId!,
        version: (baseData.id || currentItineraryId!) === updatedTripDataFromPlanner.id ? (updatedTripDataFromPlanner.version || baseData.version) : (baseData.version || 1),
      };
      return dataToSet;
    });
  }, [currentItineraryId, toast, searchParams]);

  const handleUpdateSettings = React.useCallback((newSettingsPartial: Partial<TripSettings>) => {
    setTripData(prevTripData => {
      if (!prevTripData) return null;
      const currentSettings = prevTripData.settings;
      let updatedSettings = { ...currentSettings, ...newSettingsPartial };
      const newDaysData = { ...prevTripData.days };
      if (updatedSettings.numDays !== undefined && updatedSettings.numDays !== currentSettings.numDays) {
        const oldNumDays = currentSettings.numDays;
        const newNumDays = updatedSettings.numDays;
        if (newNumDays > oldNumDays) {
          for (let i = oldNumDays + 1; i <= newNumDays; i++) {
            if (!newDaysData[i]) newDaysData[i] = { items: [] };
          }
        } else if (newNumDays < oldNumDays) {
          for (let i = newNumDays + 1; i <= oldNumDays; i++) delete newDaysData[i];
        }
      }
      return { ...prevTripData, settings: updatedSettings, days: newDaysData };
    });
  }, []);

  const handleUpdatePax = React.useCallback((newPaxPartial: Partial<PaxDetails>) => {
    setTripData(prevTripData => {
      if (!prevTripData) return null;
      const updatedPax = { ...prevTripData.pax, ...newPaxPartial };
      let updatedTravelers = prevTripData.travelers;
      if (
        (newPaxPartial.adults !== undefined && newPaxPartial.adults !== prevTripData.pax.adults) ||
        (newPaxPartial.children !== undefined && newPaxPartial.children !== prevTripData.pax.children)
      ) {
        updatedTravelers = createDefaultTravelers(updatedPax.adults, updatedPax.children);
      }
      return { ...prevTripData, pax: updatedPax, travelers: updatedTravelers };
    });
  }, []);

  const handleManualSave = React.useCallback(() => {
    if (!tripData || !currentItineraryId) {
      toast({ title: "Error", description: "No itinerary data to save.", variant: "destructive" });
      return;
    }
    try {
      const newVersion = (tripData.version || 1); // Increment version on manual save if we decide to, for now, keep same
      const dataToSave: TripData = {
        ...tripData,
        version: newVersion,
        updatedAt: new Date().toISOString(),
      };
      setTripData(dataToSave);
      localStorage.setItem(`${ITINERARY_DATA_PREFIX}${currentItineraryId}`, JSON.stringify(dataToSave));
      const indexString = localStorage.getItem(ITINERARY_INDEX_KEY);
      let index: ItineraryMetadata[] = indexString ? JSON.parse(indexString) : [];
      const existingEntryIndex = index.findIndex(entry => entry.id === currentItineraryId);
      const newEntry: ItineraryMetadata = {
        id: currentItineraryId,
        itineraryName: dataToSave.itineraryName,
        clientName: dataToSave.clientName,
        createdAt: dataToSave.createdAt,
        updatedAt: dataToSave.updatedAt,
      };
      if (existingEntryIndex > -1) index[existingEntryIndex] = newEntry;
      else index.push(newEntry);
      localStorage.setItem(ITINERARY_INDEX_KEY, JSON.stringify(index));
      localStorage.setItem('lastActiveItineraryId', currentItineraryId);

      // If linked to a quotation request, update its status to "Quoted"
      if (dataToSave.quotationRequestId) {
        const requestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
        if (requestsString) {
          let allRequests: QuotationRequest[] = JSON.parse(requestsString);
          const requestIndex = allRequests.findIndex(q => q.id === dataToSave.quotationRequestId);
          if (requestIndex > -1 && allRequests[requestIndex].status === "Pending") {
            allRequests[requestIndex].status = "Quoted";
            allRequests[requestIndex].linkedItineraryId = currentItineraryId; // Ensure it's linked
            allRequests[requestIndex].updatedAt = new Date().toISOString();
            localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allRequests));
          }
        }
      }
      toast({ title: "Success", description: `Itinerary "${dataToSave.itineraryName}" (v${newVersion}) saved.` });
    } catch (e: any) {
      console.error("Error during manual save:", e);
      toast({ title: "Error", description: `Could not save itinerary: ${e.message}`, variant: "destructive" });
    }
  }, [tripData, currentItineraryId, toast]);

  return {
    tripData,
    currentItineraryId,
    pageStatus,
    handleStartNewItinerary,
    handleUpdateTripData,
    handleUpdateSettings,
    handleUpdatePax,
    handleManualSave,
  };
}
