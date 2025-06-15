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
import type { TripData, ItineraryMetadata, TripSettings, PaxDetails, Traveler, OverallBookingStatus, BookingStatus, Agency, AgentProfile, CurrencyCode } from '@/types/itinerary';
import { OVERALL_BOOKING_STATUSES, BOOKING_STATUSES, DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID, DEFAULT_BANGLADESH_ID } from '@/types/itinerary';
import type { QuotationRequest, QuotationRequestStatus } from '@/types/quotation';
import { QUOTATION_STATUSES, generateQuotationIdNumericPart } from '@/types/quotation';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { AGENT_ID_JOHN_DOE_GTE, AGENT_ID_BOB_JOHNSON_LAI, AGENT_ID_FATIMA_AHMED_BV, AGENCY_ID_GLOBAL_TRAVEL, AGENCY_ID_LOCAL_ADVENTURES, AGENCY_ID_BENGAL_VOYAGER } from './useAgents';
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


const createDefaultTripData = (quotationRequestId?: string, quotationRequest?: QuotationRequest | null): TripData => {
  const newId = generateItineraryId();
  const now = new Date().toISOString();

  const defaultStartDate = new Date();
  defaultStartDate.setHours(0, 0, 0, 0);

  let clientNameForTrip: string | undefined = undefined;
  let paxCurrency: CurrencyCode = 'THB'; // System default

  if (quotationRequest?.agentId) {
    clientNameForTrip = getAgencyAndAgentNameFromLocalStorage(quotationRequest.agentId);
    try {
        const agentsString = localStorage.getItem(AGENTS_STORAGE_KEY);
        const agenciesString = localStorage.getItem(AGENCIES_STORAGE_KEY);
        if (agentsString && agenciesString) {
            const agent = (JSON.parse(agentsString) as AgentProfile[]).find(a => a.id === quotationRequest.agentId);
            if (agent?.agencyId) {
                const agency = (JSON.parse(agenciesString) as Agency[]).find(ag => ag.id === agent.agencyId);
                if (agency?.preferredCurrency) {
                    paxCurrency = agency.preferredCurrency;
                } else if (quotationRequest.tripDetails.budgetCurrency) {
                  paxCurrency = quotationRequest.tripDetails.budgetCurrency;
                }
            } else if (quotationRequest.tripDetails.budgetCurrency) {
              paxCurrency = quotationRequest.tripDetails.budgetCurrency;
            }
        } else if (quotationRequest.tripDetails.budgetCurrency) {
           paxCurrency = quotationRequest.tripDetails.budgetCurrency;
        }
    } catch(e) { console.error("Error fetching agent/agency currency:", e); }
  } else if (quotationRequestId && !quotationRequest) {
    try {
        const requestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
        if (requestsString) {
            const allRequests: QuotationRequest[] = JSON.parse(requestsString);
            const foundQuote = allRequests.find(q => q.id === quotationRequestId);
            if (foundQuote?.agentId) {
                clientNameForTrip = getAgencyAndAgentNameFromLocalStorage(foundQuote.agentId);
                 const agentsString = localStorage.getItem(AGENTS_STORAGE_KEY);
                 const agenciesString = localStorage.getItem(AGENCIES_STORAGE_KEY);
                if (agentsString && agenciesString) {
                    const agent = (JSON.parse(agentsString) as AgentProfile[]).find(a => a.id === foundQuote.agentId);
                    if (agent?.agencyId) {
                        const agency = (JSON.parse(agenciesString) as Agency[]).find(ag => ag.id === agent.agencyId);
                        if (agency?.preferredCurrency) {
                            paxCurrency = agency.preferredCurrency;
                        } else if (foundQuote.tripDetails.budgetCurrency) {
                           paxCurrency = foundQuote.tripDetails.budgetCurrency;
                        }
                    } else if (foundQuote.tripDetails.budgetCurrency) {
                      paxCurrency = foundQuote.tripDetails.budgetCurrency;
                    }
                } else if (foundQuote.tripDetails.budgetCurrency) {
                  paxCurrency = foundQuote.tripDetails.budgetCurrency;
                }
            }
        }
    } catch (e) { console.error("Error fetching quote for client name/currency in createDefaultTripData:", e); }
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
    currency: paxCurrency
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
  const tripDataInternalRef = React.useRef<TripData | null>(null);
  const [currentItineraryId, setCurrentItineraryId] = React.useState<string | null>(null);
  const [pageStatus, setPageStatus] = React.useState<PageStatus>('loading');
  const [currentQuotationRequest, setCurrentQuotationRequest] = React.useState<QuotationRequest | null>(null);


  React.useEffect(() => {
    tripDataInternalRef.current = tripData;
  }, [tripData]);

  const itineraryIdFromUrl = searchParams.get('itineraryId');
  const quotationRequestIdFromUrl = searchParams.get('quotationRequestId');

  const saveNewItineraryToStorage = React.useCallback((itineraryToSave: TripData): TripData => {
    try {
        const now = new Date().toISOString();
        const dataWithTimestamps: TripData = {
            ...itineraryToSave,
            createdAt: itineraryToSave.createdAt || now,
            updatedAt: now,
        };
        localStorage.setItem(`${ITINERARY_DATA_PREFIX}${dataWithTimestamps.id}`, JSON.stringify(dataWithTimestamps));
        const indexString = localStorage.getItem(ITINERARY_INDEX_KEY);
        let index: ItineraryMetadata[] = indexString ? JSON.parse(indexString) : [];
        const existingEntryIndex = index.findIndex(entry => entry.id === dataWithTimestamps.id);
        const newEntry: ItineraryMetadata = {
            id: dataWithTimestamps.id,
            itineraryName: dataWithTimestamps.itineraryName,
            clientName: dataWithTimestamps.clientName,
            createdAt: dataWithTimestamps.createdAt,
            updatedAt: dataWithTimestamps.updatedAt,
        };
        if (existingEntryIndex > -1) {
            index[existingEntryIndex] = newEntry;
        } else {
            index.push(newEntry);
        }
        localStorage.setItem(ITINERARY_INDEX_KEY, JSON.stringify(index));
        return dataWithTimestamps;
    } catch (saveError) {
        console.error("Failed to save new itinerary to storage:", saveError);
        toast({ title: "Save Error", description: "Could not save new itinerary to local storage.", variant: "destructive" });
        return itineraryToSave; 
    }
  }, [toast]);


  React.useEffect(() => {
    if (typeof window === "undefined" || window.location.pathname !== '/planner') {
      return;
    }

    let allQuotationRequests: QuotationRequest[] = [];
    try {
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
          { agentId: AGENT_ID_JOHN_DOE_GTE, clientInfo: { adults: 2, children: 1, childAges: "3" }, tripDetails: { preferredCountryIds: [DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID], preferredProvinceNames: ["Kuala Lumpur", "Bangkok"], preferredStartDate: formatISO(addDays(now, 10), { representation: 'date' }), durationDays: 5, tripType: "Business", budgetRange: "Mid-Range/Comfort", budgetCurrency: "THB" }, accommodationPrefs: {hotelStarRating: "3 Stars", roomPreferences:"double", specificHotelRequests:"sukhumvit area"}, activityPrefs: { requestedActivities: "safari world"}, flightPrefs: { airportTransfersRequired: true, activityTransfersRequired: true}, mealPrefs: { mealPlan: "Breakfast Only" }, otherRequirements: "non veg" },
          { agentId: AGENT_ID_BOB_JOHNSON_LAI, clientInfo: { adults: 2, children: 2, childAges: "6,10" }, tripDetails: { preferredCountryIds: [DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID], preferredProvinceNames: ["Krabi", "Langkawi", "Kuala Lumpur"], preferredStartDate: formatISO(addDays(now, 60), { representation: 'date' }), durationDays: 10, tripType: "Family", budgetRange: "Specific Amount (see notes)", budgetAmount: 5000, budgetCurrency: "USD", }, accommodationPrefs: { hotelStarRating: "4 Stars", roomPreferences: "Family room or connecting rooms, kids club a plus" }, activityPrefs: { requestedActivities: "Island hopping in Krabi, Cable car in Langkawi, Petronas Towers in KL, Elephant sanctuary if ethical." }, flightPrefs: { airportTransfersRequired: true, activityTransfersRequired: true }, otherRequirements: "Need child-friendly activities. One child is a fussy eater." },
          { agentId: AGENT_ID_FATIMA_AHMED_BV, clientInfo: { adults: 1, children: 0, childAges: "" }, tripDetails: { preferredCountryIds: [DEFAULT_BANGLADESH_ID], preferredProvinceNames: ["Dhaka", "Sylhet"], preferredStartDate: formatISO(addDays(now, 45), { representation: 'date' }), durationDays: 5, tripType: "Cultural", budgetRange: "Economy/Budget", budgetCurrency: "BDT", }, accommodationPrefs: { hotelStarRating: "3 Stars", roomPreferences: "Clean and centrally located, good Wi-Fi." }, activityPrefs: { requestedActivities: "Explore Old Dhaka, visit tea gardens in Sylhet, historical sites." }, mealPrefs: {mealPlan: "Breakfast Only"}, otherRequirements: "Solo female traveler, safety is a priority. Interested in local markets." },
        ];
        const seededQuotations: QuotationRequest[] = demoQuotationData.map((q, index) => {
          const agent = demoAgents.find(a => a.id === q.agentId);
          let agencyIdToUse = agent?.agencyId;
          if (!agencyIdToUse) { if (q.agentId === AGENT_ID_JOHN_DOE_GTE) agencyIdToUse = AGENCY_ID_GLOBAL_TRAVEL; else if (q.agentId === AGENT_ID_BOB_JOHNSON_LAI) agencyIdToUse = AGENCY_ID_LOCAL_ADVENTURES; else if (q.agentId === AGENT_ID_FATIMA_AHMED_BV) agencyIdToUse = AGENCY_ID_BENGAL_VOYAGER; else agencyIdToUse = demoAgencies.length > 0 ? demoAgencies[0].id : AGENCY_ID_GLOBAL_TRAVEL; }
          return { ...q, id: generateFullQuotationId(agencyIdToUse), requestDate: subDays(now, (demoQuotationData.length - index) * 10).toISOString(), updatedAt: subDays(now, (demoQuotationData.length - index) * 10).toISOString(), status: "Pending" as QuotationRequestStatus, };
        });
        localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(seededQuotations));
        allQuotationRequests = seededQuotations;
      } else { allQuotationRequests = JSON.parse(storedQuotations); }
    } catch (e) { console.error("Error seeding/reading demo quotations:", e); }

    let targetItineraryIdFromLogic = itineraryIdFromUrl;
    let createFromQuotationIdLogic = quotationRequestIdFromUrl;
    let associatedQuotationRequestLogic: QuotationRequest | null = null;

    if (createFromQuotationIdLogic) {
      associatedQuotationRequestLogic = allQuotationRequests.find(q => q.id === createFromQuotationIdLogic) || null;
      if (associatedQuotationRequestLogic?.linkedItineraryId && !targetItineraryIdFromLogic) {
        targetItineraryIdFromLogic = associatedQuotationRequestLogic.linkedItineraryId;
      }
    }
    if (!targetItineraryIdFromLogic && !createFromQuotationIdLogic) {
      try { targetItineraryIdFromLogic = localStorage.getItem('lastActiveItineraryId'); } catch (e) { /* */ }
    }

    const currentTripIdInState = tripDataInternalRef.current?.id;

    const needsToLoadOrRecreate =
      !tripDataInternalRef.current ||
      (targetItineraryIdFromLogic && targetItineraryIdFromLogic !== currentItineraryId) ||
      (createFromQuotationIdLogic && 
        (createFromQuotationIdLogic !== tripDataInternalRef.current?.quotationRequestId || // New quote ID
         (targetItineraryIdFromLogic && targetItineraryIdFromLogic !== currentItineraryId) || // Or new specific itinerary for that quote
         (!targetItineraryIdFromLogic && associatedQuotationRequestLogic?.linkedItineraryId && associatedQuotationRequestLogic.linkedItineraryId !== currentItineraryId) // Or URL quote ID has a linked itinerary not currently loaded
        )
      );

    if (needsToLoadOrRecreate) {
      if (!tripDataInternalRef.current || (targetItineraryIdFromLogic && targetItineraryIdFromLogic !== currentItineraryId) || (createFromQuotationIdLogic && createFromQuotationIdLogic !== tripDataInternalRef.current?.quotationRequestId)) {
        setPageStatus('loading');
      }
      let newTripToSet: TripData | null = null;
      let newCurrentIdForState: string | null = null;

      if (targetItineraryIdFromLogic) {
        try {
          const savedDataString = localStorage.getItem(`${ITINERARY_DATA_PREFIX}${targetItineraryIdFromLogic}`);
          if (savedDataString) {
            const parsedData = JSON.parse(savedDataString) as Partial<TripData>;
            const defaultForContext = createDefaultTripData(parsedData.quotationRequestId || createFromQuotationIdLogic || undefined, associatedQuotationRequestLogic);
            
            let finalItineraryName;
            if (parsedData.itineraryName !== undefined && parsedData.itineraryName !== null) { // Check for undefined/null, allow empty string
              finalItineraryName = parsedData.itineraryName;
            } else if (associatedQuotationRequestLogic && associatedQuotationRequestLogic.id === (parsedData.quotationRequestId || createFromQuotationIdLogic)) {
              finalItineraryName = `Proposal for Quotation ${associatedQuotationRequestLogic.id.split('-').pop()}`;
            } else if (parsedData.quotationRequestId) {
              const linkedQuoteForParsedData = allQuotationRequests.find(q => q.id === parsedData.quotationRequestId);
              if (linkedQuoteForParsedData) {
                finalItineraryName = `Proposal for Quotation ${linkedQuoteForParsedData.id.split('-').pop()}`;
              } else {
                finalItineraryName = `New Itinerary ${targetItineraryIdFromLogic.split('-').pop()}`;
              }
            } else {
              finalItineraryName = `New Itinerary ${targetItineraryIdFromLogic.split('-').pop()}`;
            }
            
            let finalClientName = parsedData.clientName; // Prefer stored client name
            if (finalClientName === undefined || finalClientName === null || finalClientName.trim() === "") {
              finalClientName = defaultForContext.clientName;
            }
            
            const defaultSettingsBase = defaultForContext.settings;
            const defaultPaxBase = defaultForContext.pax;
            const defaultDaysBase = defaultForContext.days;

            newTripToSet = {
                id: targetItineraryIdFromLogic,
                itineraryName: finalItineraryName,
                clientName: finalClientName,
                createdAt: parsedData.createdAt || defaultForContext.createdAt,
                updatedAt: parsedData.updatedAt || defaultForContext.updatedAt,
                settings: { ...defaultSettingsBase, ...parsedData.settings },
                pax: { ...defaultPaxBase, ...parsedData.pax },
                travelers: parsedData.travelers && parsedData.travelers.length > 0 ? parsedData.travelers : createDefaultTravelers(parsedData.pax?.adults ?? defaultPaxBase.adults, parsedData.pax?.children ?? defaultPaxBase.children),
                days: parsedData.days && Object.keys(parsedData.days).length > 0 ? parsedData.days : defaultDaysBase,
                quotationRequestId: parsedData.quotationRequestId || createFromQuotationIdLogic || undefined,
                version: parsedData.version || 1,
                overallBookingStatus: parsedData.overallBookingStatus || "NotStarted",
            };
            newCurrentIdForState = targetItineraryIdFromLogic;
          } else {
            if (localStorage.getItem('lastActiveItineraryId') === targetItineraryIdFromLogic) localStorage.removeItem('lastActiveItineraryId');
            newTripToSet = createDefaultTripData(createFromQuotationIdLogic, associatedQuotationRequestLogic);
            newTripToSet.id = targetItineraryIdFromLogic; 
            newCurrentIdForState = targetItineraryIdFromLogic;
            newTripToSet = saveNewItineraryToStorage(newTripToSet); 
          }
        } catch (error) {
          console.error("Failed to load or create data for ID:", targetItineraryIdFromLogic, error);
          newTripToSet = createDefaultTripData(createFromQuotationIdLogic, associatedQuotationRequestLogic);
          if(targetItineraryIdFromLogic) newTripToSet.id = targetItineraryIdFromLogic;
          newCurrentIdForState = newTripToSet.id;
          newTripToSet = saveNewItineraryToStorage(newTripToSet);
        }
      } else { 
        if (createFromQuotationIdLogic && associatedQuotationRequestLogic) {
          newTripToSet = createDefaultTripData(createFromQuotationIdLogic, associatedQuotationRequestLogic);
          newCurrentIdForState = newTripToSet.id;
          newTripToSet = saveNewItineraryToStorage(newTripToSet);
          
          const reqIdx = allQuotationRequests.findIndex(q => q.id === createFromQuotationIdLogic);
          if (reqIdx > -1 && !allQuotationRequests[reqIdx].linkedItineraryId) {
             allQuotationRequests[reqIdx].linkedItineraryId = newCurrentIdForState;
             allQuotationRequests[reqIdx].status = "Quoted";
             allQuotationRequests[reqIdx].updatedAt = new Date().toISOString();
             localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allQuotationRequests));
          }
        } else { 
          if (tripDataInternalRef.current && !itineraryIdFromUrl && !quotationRequestIdFromUrl) {
            newTripToSet = tripDataInternalRef.current;
            newCurrentIdForState = newTripToSet.id;
          } else {
            newTripToSet = createDefaultTripData();
            newCurrentIdForState = newTripToSet.id;
            newTripToSet = saveNewItineraryToStorage(newTripToSet);
          }
        }
      }

      if (newTripToSet && newCurrentIdForState) {
        setTripData(newTripToSet);
        setCurrentItineraryId(newCurrentIdForState);
        setCurrentQuotationRequest(associatedQuotationRequestLogic);
        localStorage.setItem('lastActiveItineraryId', newCurrentIdForState);
        const finalUrl = `/planner?itineraryId=${newCurrentIdForState}${newTripToSet.quotationRequestId ? `&quotationRequestId=${newTripToSet.quotationRequestId}` : ''}`;
        if (window.location.pathname + window.location.search !== finalUrl) {
          router.replace(finalUrl, { shallow: true });
        }
        setPageStatus('planner');
      } else if (tripDataInternalRef.current) { 
          setPageStatus('planner');
      } else { 
          const fallbackTrip = createDefaultTripData();
          const savedFallback = saveNewItineraryToStorage(fallbackTrip);
          setTripData(savedFallback);
          setCurrentItineraryId(savedFallback.id);
          setCurrentQuotationRequest(null);
          localStorage.setItem('lastActiveItineraryId', savedFallback.id);
          router.replace(`/planner?itineraryId=${savedFallback.id}`, { shallow: true });
          setPageStatus('planner');
      }
    } else if (tripDataInternalRef.current && pageStatus !== 'planner') {
      // If no need to load/recreate, but page status is not 'planner' (e.g. after HMR), set it correctly.
      setPageStatus('planner');
      const currentTripAssociatedQuote = tripDataInternalRef.current.quotationRequestId
        ? allQuotationRequests.find(q => q.id === tripDataInternalRef.current!.quotationRequestId) || null
        : null;
      if (JSON.stringify(currentQuotationRequest) !== JSON.stringify(currentTripAssociatedQuote)) {
        setCurrentQuotationRequest(currentTripAssociatedQuote);
      }
    }
  }, [itineraryIdFromUrl, quotationRequestIdFromUrl, router, toast, saveNewItineraryToStorage]);


  const handleStartNewItinerary = React.useCallback(() => {
    const newDefaultTripData = createDefaultTripData();
    const savedTripData = saveNewItineraryToStorage(newDefaultTripData); 
    setTripData(savedTripData);
    setCurrentItineraryId(savedTripData.id);
    setCurrentQuotationRequest(null);
    localStorage.setItem('lastActiveItineraryId', savedTripData.id);
    router.replace(`/planner?itineraryId=${savedTripData.id}`, { shallow: true });
    toast({ title: "New Itinerary Started", description: "A fresh itinerary has been created." });
  }, [router, toast, saveNewItineraryToStorage]);

  const handleUpdateTripData = React.useCallback((update: Partial<TripData> | ((current: TripData | null) => Partial<TripData> | TripData)) => {
    setTripData(prevTripData => {
        let updatesToApply: Partial<TripData> | TripData;
        if (typeof update === 'function') {
            updatesToApply = update(prevTripData);
        } else {
            updatesToApply = update;
        }

        const base = prevTripData || createDefaultTripData(searchParams.get('quotationRequestId') || undefined, currentQuotationRequest || undefined);
        const newTripData = { ...base, ...updatesToApply } as TripData;

        if (!newTripData.id && currentItineraryId) { 
            newTripData.id = currentItineraryId;
        } else if (!newTripData.id && !currentItineraryId) {
            newTripData.id = generateItineraryId();
        }
        return newTripData;
    });
  }, [currentItineraryId, searchParams, currentQuotationRequest]);


  const handleUpdateSettings = React.useCallback((newSettingsPartial: Partial<TripSettings>) => {
    handleUpdateTripData(currentTripData => {
      if (!currentTripData) return {};
      const currentSettings = currentTripData.settings;
      let updatedSettings = { ...currentSettings, ...newSettingsPartial };
      const newDaysData = { ...currentTripData.days };
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
      return { settings: updatedSettings, days: newDaysData };
    });
  }, [handleUpdateTripData]);

  const handleUpdatePax = React.useCallback((newPaxPartial: Partial<PaxDetails>) => {
    handleUpdateTripData(currentTripData => {
      if (!currentTripData) return {};
      const updatedPax = { ...currentTripData.pax, ...newPaxPartial };
      let updatedTravelers = currentTripData.travelers;
      if (
        (newPaxPartial.adults !== undefined && newPaxPartial.adults !== currentTripData.pax.adults) ||
        (newPaxPartial.children !== undefined && newPaxPartial.children !== currentTripData.pax.children)
      ) {
        updatedTravelers = createDefaultTravelers(updatedPax.adults, updatedPax.children);
      }
      return { pax: updatedPax, travelers: updatedTravelers };
    });
  }, [handleUpdateTripData]);

  const handleManualSave = React.useCallback(() => {
    const currentTripDataForSave = tripDataInternalRef.current;
    const currentItineraryIdForSave = currentItineraryId; 
    if (!currentTripDataForSave || !currentItineraryIdForSave) {
      toast({ title: "Error", description: "No itinerary data to save.", variant: "destructive" });
      return;
    }
    try {
      const newVersion = (currentTripDataForSave.version || 1);
      const dataToSave: TripData = {
        ...currentTripDataForSave,
        id: currentItineraryIdForSave, 
        version: newVersion,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(`${ITINERARY_DATA_PREFIX}${currentItineraryIdForSave}`, JSON.stringify(dataToSave));
      const indexString = localStorage.getItem(ITINERARY_INDEX_KEY);
      let index: ItineraryMetadata[] = indexString ? JSON.parse(indexString) : [];
      const existingEntryIndex = index.findIndex(entry => entry.id === currentItineraryIdForSave);
      const newEntry: ItineraryMetadata = {
        id: currentItineraryIdForSave,
        itineraryName: dataToSave.itineraryName,
        clientName: dataToSave.clientName,
        createdAt: dataToSave.createdAt,
        updatedAt: dataToSave.updatedAt,
      };
      if (existingEntryIndex > -1) index[existingEntryIndex] = newEntry;
      else index.push(newEntry);
      localStorage.setItem(ITINERARY_INDEX_KEY, JSON.stringify(index));
      localStorage.setItem('lastActiveItineraryId', currentItineraryIdForSave);

      if (dataToSave.quotationRequestId) {
        const requestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
        if (requestsString) {
          let allRequests: QuotationRequest[] = JSON.parse(requestsString);
          const requestIndex = allRequests.findIndex(q => q.id === dataToSave.quotationRequestId);
          if (requestIndex > -1 && (allRequests[requestIndex].status === "Pending" || !allRequests[requestIndex].linkedItineraryId)) {
            allRequests[requestIndex].status = "Quoted";
            allRequests[requestIndex].linkedItineraryId = currentItineraryIdForSave;
            allRequests[requestIndex].updatedAt = new Date().toISOString();
            localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allRequests));
          } else if (requestIndex > -1 && allRequests[requestIndex].linkedItineraryId !== currentItineraryIdForSave ) {
            allRequests[requestIndex].linkedItineraryId = currentItineraryIdForSave;
             if (allRequests[requestIndex].status === "Pending") allRequests[requestIndex].status = "Quoted";
            allRequests[requestIndex].updatedAt = new Date().toISOString();
            localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allRequests));
          }
        }
      }
      setTripData(dataToSave);
      toast({ title: "Success", description: `Itinerary "${dataToSave.itineraryName}" (v${newVersion}) saved.` });
    } catch (e: any) {
      console.error("Error during manual save:", e);
      toast({ title: "Error", description: `Could not save itinerary: ${e.message}`, variant: "destructive" });
    }
  }, [currentItineraryId, toast]);

  return {
    tripData,
    currentItineraryId,
    pageStatus,
    currentQuotationRequest,
    handleStartNewItinerary,
    handleUpdateTripData,
    handleUpdateSettings,
    handleUpdatePax,
    handleManualSave,
  };
}

