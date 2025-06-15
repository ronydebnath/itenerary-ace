
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
import type { TripData, ItineraryMetadata, TripSettings, PaxDetails, Traveler, OverallBookingStatus, BookingStatus, Agency, AgentProfile } from '@/types/itinerary';
import { OVERALL_BOOKING_STATUSES, BOOKING_STATUSES, DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID } from '@/types/itinerary';
import type { QuotationRequest, QuotationRequestStatus } from '@/types/quotation';
import { QUOTATION_STATUSES, generateQuotationIdNumericPart } from '@/types/quotation';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { AGENT_ID_JOHN_DOE_GTE, AGENT_ID_BOB_JOHNSON_LAI, AGENT_ID_FATIMA_AHMED_BV } from './useAgents'; // Import demo agent IDs
import { addDays, subDays, formatISO } from 'date-fns';


const ITINERARY_INDEX_KEY = 'itineraryAce_index';
const ITINERARY_DATA_PREFIX = 'itineraryAce_data_';
const AGENT_QUOTATION_REQUESTS_KEY = 'itineraryAce_agentQuotationRequests';
const AGENCIES_STORAGE_KEY = 'itineraryAceAgencies';
const AGENTS_STORAGE_KEY = 'itineraryAceAgents';


const generateItineraryId = (): string => {
  const now = new Date();
  const year = String(now.getFullYear());
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

const getAgencyAndAgentNameFromLocalStorage = (agentId: string): string | undefined => {
  try {
    const agentsString = localStorage.getItem(AGENTS_STORAGE_KEY);
    const agenciesString = localStorage.getItem(AGENCIES_STORAGE_KEY);

    if (agentsString && agenciesString) {
      const allAgents: AgentProfile[] = JSON.parse(agentsString);
      const allAgencies: Agency[] = JSON.parse(agenciesString);

      const agent = allAgents.find(a => a.id === agentId);
      if (agent) {
        const agency = allAgencies.find(ag => ag.id === agent.agencyId);
        if (agency) {
          return `${agency.name} - ${agent.fullName}`;
        }
        return `Agent: ${agent.fullName} (Agency ID: ${agent.agencyId})`;
      }
    }
  } catch (e) {
    console.error("Error fetching agent/agency for clientName:", e);
  }
  return agentId ? `Agent ID: ${agentId}` : undefined;
};


const createDefaultTripData = (quotationRequestId?: string, quotationRequest?: QuotationRequest): TripData => {
  const newId = generateItineraryId();
  const now = new Date().toISOString();

  const defaultStartDate = new Date();
  defaultStartDate.setHours(0, 0, 0, 0);

  let clientNameForTrip: string | undefined = undefined;
  if (quotationRequest?.agentId) {
    clientNameForTrip = getAgencyAndAgentNameFromLocalStorage(quotationRequest.agentId);
  }

  const settings: TripSettings = {
    numDays: quotationRequest?.tripDetails.durationDays || 3,
    startDate: quotationRequest?.tripDetails.preferredStartDate || defaultStartDate.toISOString().split('T')[0],
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
      ? `Proposal for Quotation ${quotationRequest.id.split('-').pop()}`
      : `New Itinerary ${newId.split('-').pop()}`,
    clientName: clientNameForTrip,
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
    let allQuotationRequests: QuotationRequest[] = [];

    try { // Seed Demo Quotations if none exist
      const storedQuotations = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
      if (!storedQuotations) {
        const agentsString = localStorage.getItem(AGENTS_STORAGE_KEY);
        const agenciesString = localStorage.getItem(AGENCIES_STORAGE_KEY);
        let demoAgents: AgentProfile[] = [];
        let demoAgencies: Agency[] = [];
        if (agentsString) demoAgents = JSON.parse(agentsString);
        if (agenciesString) demoAgencies = JSON.parse(agenciesString);

        const getAgencyInitials = (agencyId?: string): string => {
          if (!agencyId) return "AGY";
          const agency = demoAgencies.find(a => a.id === agencyId);
          if (agency?.name) {
            const words = agency.name.split(' ').filter(Boolean);
            if (words.length === 1) return words[0].substring(0, Math.min(3, words[0].length)).toUpperCase();
            return words.map(word => word[0]).slice(0, 3).join("").toUpperCase();
          }
          return "AGY";
        };
        
        const generateFullQuotationId = (agencyId?: string): string => {
            const numericPart = generateQuotationIdNumericPart();
            const initials = getAgencyInitials(agencyId);
            return `${initials}-${numericPart}`;
        };

        const now = new Date();
        const demoQuotationData: Omit<QuotationRequest, 'id' | 'requestDate' | 'updatedAt' | 'status'>[] = [
          {
            agentId: AGENT_ID_JOHN_DOE_GTE, // John Doe from Global Travel Experts
            clientInfo: { adults: 2, children: 0, childAges: "" },
            tripDetails: {
              preferredCountryIds: [DEFAULT_THAILAND_ID],
              preferredProvinceNames: ["Bangkok", "Phuket"],
              preferredStartDate: formatISO(addDays(now, 30), { representation: 'date' }),
              durationDays: 7,
              tripType: "Leisure",
              budgetRange: "Mid-Range/Comfort",
              budgetCurrency: "THB",
            },
            accommodationPrefs: { hotelStarRating: "4 Stars", roomPreferences: "King Bed, Sea View if possible" },
            activityPrefs: { requestedActivities: "Grand Palace Tour, Phi Phi Island Trip" },
            flightPrefs: { airportTransfersRequired: true },
            mealPrefs: {mealPlan: "Breakfast Only"}
          },
          {
            agentId: AGENT_ID_BOB_JOHNSON_LAI, // Bob Johnson from Local Adventures Inc.
            clientInfo: { adults: 2, children: 2, childAges: "6,10" },
            tripDetails: {
              preferredCountryIds: [DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID],
              preferredProvinceNames: ["Krabi", "Langkawi", "Kuala Lumpur"],
              preferredStartDate: formatISO(addDays(now, 60), { representation: 'date' }),
              durationDays: 10,
              tripType: "Family",
              budgetRange: "Specific Amount (see notes)",
              budgetAmount: 5000,
              budgetCurrency: "USD",
            },
            accommodationPrefs: { hotelStarRating: "4 Stars", roomPreferences: "Family room or connecting rooms" },
            activityPrefs: { requestedActivities: "Island hopping, Theme park in KL, Elephant sanctuary" },
            flightPrefs: { airportTransfersRequired: true, activityTransfersRequired: true },
          },
          {
            agentId: AGENT_ID_FATIMA_AHMED_BV, // Fatima Ahmed from Bengal Voyager
            clientInfo: { adults: 2, children: 0, childAges: "" },
            tripDetails: {
              preferredCountryIds: [DEFAULT_THAILAND_ID],
              preferredProvinceNames: ["Phuket", "Chiang Mai"],
              preferredStartDate: formatISO(addDays(now, 90), { representation: 'date' }),
              durationDays: 14,
              tripType: "Luxury",
              budgetRange: "Luxury/Premium",
              budgetCurrency: "USD",
            },
            accommodationPrefs: { hotelStarRating: "5 Stars", roomPreferences: "Villa with private pool, or suite" },
            activityPrefs: { requestedActivities: "Private yacht trip, Spa treatments, Fine dining, Ethical elephant experience" },
            flightPrefs: { airportTransfersRequired: true },
            mealPrefs: { mealPlan: "Breakfast and Lunch/Dinner" }
          },
        ];

        const seededQuotations: QuotationRequest[] = demoQuotationData.map((q, index) => {
          const agent = demoAgents.find(a => a.id === q.agentId);
          const agency = agent ? demoAgencies.find(ag => ag.id === agent.agencyId) : undefined;
          return {
            ...q,
            id: generateFullQuotationId(agency?.id),
            requestDate: subDays(now, (demoQuotationData.length - index) * 10).toISOString(), // Stagger request dates
            updatedAt: subDays(now, (demoQuotationData.length - index) * 10).toISOString(),
            status: "Pending" as QuotationRequestStatus,
          };
        });
        localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(seededQuotations));
        allQuotationRequests = seededQuotations;
        // console.log("Demo quotations seeded to localStorage.");
      } else {
        allQuotationRequests = JSON.parse(storedQuotations);
      }
    } catch (e) { console.error("Error seeding/reading demo quotations:", e); }


    if (quotationRequestIdFromUrl && !allQuotationRequests.length) { // Ensure allQuotationRequests is loaded if only ID is from URL
        try {
            const requestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
            if (requestsString) allQuotationRequests = JSON.parse(requestsString);
        } catch (e) { console.error("Error reading quotation requests when only ID from URL:", e); }
    }
    
    if (quotationRequestIdFromUrl) {
        associatedQuotationRequest = allQuotationRequests.find(q => q.id === quotationRequestIdFromUrl);
        if (associatedQuotationRequest && associatedQuotationRequest.linkedItineraryId && !idToLoad) {
            idToLoad = associatedQuotationRequest.linkedItineraryId;
        }
    }


    if (!idToLoad && !quotationRequestIdFromUrl) {
      try { idToLoad = localStorage.getItem('lastActiveItineraryId'); } catch (e) { console.error("Error reading lastActiveItineraryId:", e); }
    }

    if (idToLoad) {
      try {
        const savedDataString = localStorage.getItem(`${ITINERARY_DATA_PREFIX}${idToLoad}`);
        if (savedDataString) {
          const parsedData = JSON.parse(savedDataString) as Partial<TripData>;
          const defaultTripForContext = createDefaultTripData(parsedData.quotationRequestId || quotationRequestIdFromUrl, associatedQuotationRequest);

          let finalClientName = parsedData.clientName;
          if (!finalClientName && (parsedData.quotationRequestId || quotationRequestIdFromUrl)) {
            const qIdForClientName = parsedData.quotationRequestId || quotationRequestIdFromUrl;
            if (!allQuotationRequests.length && qIdForClientName) {
                const requestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
                if (requestsString) allQuotationRequests = JSON.parse(requestsString);
            }
            const agentIdForClientName = allQuotationRequests.find(q => q.id === qIdForClientName)?.agentId;
            if (agentIdForClientName) {
              finalClientName = getAgencyAndAgentNameFromLocalStorage(agentIdForClientName);
            }
          }

          loadedTripData = {
            id: parsedData.id || idToLoad,
            itineraryName: parsedData.itineraryName || (associatedQuotationRequest ? `Proposal for Quotation ${associatedQuotationRequest.id.split('-').pop()}` : defaultTripForContext.itineraryName),
            clientName: finalClientName || defaultTripForContext.clientName,
            createdAt: parsedData.createdAt || new Date().toISOString(),
            updatedAt: parsedData.updatedAt || new Date().toISOString(),
            settings: { ...defaultTripForContext.settings, ...parsedData.settings },
            pax: { ...defaultTripForContext.pax, ...parsedData.pax },
            travelers: parsedData.travelers && parsedData.travelers.length > 0 ? parsedData.travelers : createDefaultTravelers(parsedData.pax?.adults || defaultTripForContext.pax.adults, parsedData.pax?.children || defaultTripForContext.pax.children),
            days: parsedData.days || defaultTripForContext.days,
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
         const updatedQuotationRequest = { ...associatedQuotationRequest, linkedItineraryId: idToLoad, status: "Quoted" as QuotationRequestStatus, updatedAt: new Date().toISOString() };
         try {
             const existingReqIndex = allQuotationRequests.findIndex(q => q.id === quotationRequestIdFromUrl);
             if (existingReqIndex !== -1) {
                 allQuotationRequests[existingReqIndex] = updatedQuotationRequest;
             } else {
                 allQuotationRequests.push(updatedQuotationRequest);
             }
             localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allQuotationRequests));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, currentItineraryId, pageStatus, tripData]);

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
      const newVersion = (tripData.version || 1);
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

      if (dataToSave.quotationRequestId) {
        const requestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
        if (requestsString) {
          let allRequests: QuotationRequest[] = JSON.parse(requestsString);
          const requestIndex = allRequests.findIndex(q => q.id === dataToSave.quotationRequestId);
          if (requestIndex > -1 && allRequests[requestIndex].status === "Pending") {
            allRequests[requestIndex].status = "Quoted";
            allRequests[requestIndex].linkedItineraryId = currentItineraryId;
            allRequests[requestIndex].updatedAt = new Date().toISOString();
            localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allRequests));
          } else if (requestIndex > -1 && allRequests[requestIndex].status !== "Quoted") {
            allRequests[requestIndex].linkedItineraryId = currentItineraryId; // Ensure it's linked even if status was already changed
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
