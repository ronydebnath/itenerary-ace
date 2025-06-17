
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
const LAST_ACTIVE_ITINERARY_ID_KEY = 'lastActiveItineraryId';


// --- Helper functions for localStorage ---
const loadDataFromStorage = <T>(key: string): T | null => {
  try {
    const storedData = localStorage.getItem(key);
    if (storedData) {
      return JSON.parse(storedData) as T;
    }
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
    localStorage.removeItem(key);
  }
  return null;
};

const saveDataToStorage = <T>(key: string, dataToSave: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(dataToSave));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e);
  }
};
// --- End helper functions ---


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
    const allAgents = loadDataFromStorage<AgentProfile[]>(AGENTS_STORAGE_KEY);
    const allAgencies = loadDataFromStorage<Agency[]>(AGENCIES_STORAGE_KEY);

    if (allAgents && allAgencies) {
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
  let paxCurrency: CurrencyCode = 'THB'; 

  if (quotationRequest?.agentId) {
    clientNameForTrip = getAgencyAndAgentNameFromLocalStorage(quotationRequest.agentId);
    try {
        const allAgents = loadDataFromStorage<AgentProfile[]>(AGENTS_STORAGE_KEY);
        const allAgencies = loadDataFromStorage<Agency[]>(AGENCIES_STORAGE_KEY);
        if (allAgents && allAgencies) {
            const agent = allAgents.find(a => a.id === quotationRequest.agentId);
            if (agent?.agencyId) {
                const agency = allAgencies.find(ag => ag.id === agent.agencyId);
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
        const allRequests = loadDataFromStorage<QuotationRequest[]>(AGENT_QUOTATION_REQUESTS_KEY);
        if (allRequests) {
            const foundQuote = allRequests.find(q => q.id === quotationRequestId);
            if (foundQuote?.agentId) {
                clientNameForTrip = getAgencyAndAgentNameFromLocalStorage(foundQuote.agentId);
                const allAgents = loadDataFromStorage<AgentProfile[]>(AGENTS_STORAGE_KEY);
                const allAgencies = loadDataFromStorage<Agency[]>(AGENCIES_STORAGE_KEY);
                if (allAgents && allAgencies) {
                    const agent = allAgents.find(a => a.id === foundQuote.agentId);
                    if (agent?.agencyId) {
                        const agency = allAgencies.find(ag => ag.id === agent.agencyId);
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
    version: 0,
    overallBookingStatus: "NotStarted",
    adminRevisionNotes: quotationRequest?.adminRevisionNotes || undefined,
    tags: [], // Initialize tags
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
        saveDataToStorage<TripData>(`${ITINERARY_DATA_PREFIX}${dataWithTimestamps.id}`, dataWithTimestamps);
        
        let index = loadDataFromStorage<ItineraryMetadata[]>(ITINERARY_INDEX_KEY) || [];
        const existingEntryIndex = index.findIndex(entry => entry.id === dataWithTimestamps.id);
        const newEntry: ItineraryMetadata = {
            id: dataWithTimestamps.id,
            itineraryName: dataWithTimestamps.itineraryName,
            clientName: dataWithTimestamps.clientName,
            createdAt: dataWithTimestamps.createdAt,
            updatedAt: dataWithTimestamps.updatedAt,
            tags: dataWithTimestamps.tags || [], // Ensure tags are saved to metadata
        };
        if (existingEntryIndex > -1) {
            index[existingEntryIndex] = newEntry;
        } else {
            index.push(newEntry);
        }
        saveDataToStorage<ItineraryMetadata[]>(ITINERARY_INDEX_KEY, index);
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

    let allQuotationRequests = loadDataFromStorage<QuotationRequest[]>(AGENT_QUOTATION_REQUESTS_KEY) || [];
    if (allQuotationRequests.length === 0) {
      // Minimal seeding if quotations are empty, assuming agents/agencies might be needed for defaults.
      const demoAgents = loadDataFromStorage<AgentProfile[]>(AGENTS_STORAGE_KEY) || [];
      const demoAgencies = loadDataFromStorage<Agency[]>(AGENCIES_STORAGE_KEY) || [];

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
      const demoQuotationData: Omit<QuotationRequest, 'id' | 'requestDate' | 'updatedAt' | 'status' | 'version'>[] = [
        { agentId: AGENT_ID_JOHN_DOE_GTE, clientInfo: { adults: 2, children: 1, childAges: "3" }, tripDetails: { preferredCountryIds: [DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID], preferredProvinceNames: ["Kuala Lumpur", "Bangkok"], preferredStartDate: formatISO(addDays(now, 10), { representation: 'date' }), durationDays: 5, tripType: "Business", budgetRange: "Mid-Range/Comfort", budgetCurrency: "THB" }, accommodationPrefs: {hotelStarRating: "3 Stars", roomPreferences:"double", specificHotelRequests:"sukhumvit area"}, activityPrefs: { requestedActivities: "safari world"}, flightPrefs: { airportTransfersRequired: true, activityTransfersRequired: true}, mealPrefs: { mealPlan: "Breakfast Only" }, otherRequirements: "non veg" },
        { agentId: AGENT_ID_BOB_JOHNSON_LAI, clientInfo: { adults: 2, children: 2, childAges: "6,10" }, tripDetails: { preferredCountryIds: [DEFAULT_THAILAND_ID, DEFAULT_MALAYSIA_ID], preferredProvinceNames: ["Krabi", "Langkawi", "Kuala Lumpur"], preferredStartDate: formatISO(addDays(now, 60), { representation: 'date' }), durationDays: 10, tripType: "Family", budgetRange: "Specific Amount (see notes)", budgetAmount: 5000, budgetCurrency: "USD", }, accommodationPrefs: { hotelStarRating: "4 Stars", roomPreferences: "Family room or connecting rooms, kids club a plus" }, activityPrefs: { requestedActivities: "Island hopping in Krabi, Cable car in Langkawi, Petronas Towers in KL, Elephant sanctuary if ethical." }, flightPrefs: { airportTransfersRequired: true, activityTransfersRequired: true }, otherRequirements: "Need child-friendly activities. One child is a fussy eater." },
        { agentId: AGENT_ID_FATIMA_AHMED_BV, clientInfo: { adults: 1, children: 0, childAges: "" }, tripDetails: { preferredCountryIds: [DEFAULT_BANGLADESH_ID], preferredProvinceNames: ["Dhaka", "Sylhet"], preferredStartDate: formatISO(addDays(now, 45), { representation: 'date' }), durationDays: 5, tripType: "Cultural", budgetRange: "Economy/Budget", budgetCurrency: "BDT", }, accommodationPrefs: { hotelStarRating: "3 Stars", roomPreferences: "Clean and centrally located, good Wi-Fi." }, activityPrefs: { requestedActivities: "Explore Old Dhaka, visit tea gardens in Sylhet, historical sites." }, mealPrefs: {mealPlan: "Breakfast Only"}, otherRequirements: "Solo female traveler, safety is a priority. Interested in local markets." },
      ];
      const seededQuotations: QuotationRequest[] = demoQuotationData.map((q, index) => {
        const agent = demoAgents.find(a => a.id === q.agentId);
        let agencyIdToUse = agent?.agencyId;
        if (!agencyIdToUse) { if (q.agentId === AGENT_ID_JOHN_DOE_GTE) agencyIdToUse = AGENCY_ID_GLOBAL_TRAVEL; else if (q.agentId === AGENT_ID_BOB_JOHNSON_LAI) agencyIdToUse = AGENCY_ID_LOCAL_ADVENTURES; else if (q.agentId === AGENT_ID_FATIMA_AHMED_BV) agencyIdToUse = AGENCY_ID_BENGAL_VOYAGER; else agencyIdToUse = demoAgencies.length > 0 ? demoAgencies[0].id : AGENCY_ID_GLOBAL_TRAVEL; }
        return { ...q, id: generateFullQuotationId(agencyIdToUse), requestDate: subDays(now, (demoQuotationData.length - index) * 10).toISOString(), updatedAt: subDays(now, (demoQuotationData.length - index) * 10).toISOString(), status: "New Request Submitted" as QuotationRequestStatus, version: 0 };
      });
      saveDataToStorage<QuotationRequest[]>(AGENT_QUOTATION_REQUESTS_KEY, seededQuotations);
      allQuotationRequests = seededQuotations;
    }


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
      targetItineraryIdFromLogic = loadDataFromStorage<string | null>(LAST_ACTIVE_ITINERARY_ID_KEY);
    }

    const currentTripIdInState = tripDataInternalRef.current?.id;

    const needsToLoadOrRecreate =
      !tripDataInternalRef.current ||
      (targetItineraryIdFromLogic && targetItineraryIdFromLogic !== currentTripIdInState) ||
      (createFromQuotationIdLogic &&
        (createFromQuotationIdLogic !== tripDataInternalRef.current?.quotationRequestId ||
         (targetItineraryIdFromLogic && targetItineraryIdFromLogic !== currentTripIdInState) ||
         (!targetItineraryIdFromLogic && associatedQuotationRequestLogic?.linkedItineraryId && associatedQuotationRequestLogic.linkedItineraryId !== currentTripIdInState)
        )
      );

    if (needsToLoadOrRecreate) {
        setPageStatus('loading');
      let newTripToSet: TripData | null = null;
      let newCurrentIdForState: string | null = null;

      if (targetItineraryIdFromLogic) {
        try {
          const savedData = loadDataFromStorage<Partial<TripData>>(`${ITINERARY_DATA_PREFIX}${targetItineraryIdFromLogic}`);
          if (savedData) {
            const defaultForContext = createDefaultTripData(savedData.quotationRequestId || createFromQuotationIdLogic || undefined, associatedQuotationRequestLogic);
            let finalItineraryName;
            if (savedData.itineraryName !== undefined && savedData.itineraryName !== null) { finalItineraryName = savedData.itineraryName;
            } else if (associatedQuotationRequestLogic && associatedQuotationRequestLogic.id === (savedData.quotationRequestId || createFromQuotationIdLogic)) { finalItineraryName = `Proposal for Quotation ${associatedQuotationRequestLogic.id.split('-').pop()}`;
            } else if (savedData.quotationRequestId) { const linkedQuoteForParsedData = allQuotationRequests.find(q => q.id === savedData.quotationRequestId); if (linkedQuoteForParsedData) { finalItineraryName = `Proposal for Quotation ${linkedQuoteForParsedData.id.split('-').pop()}`; } else { finalItineraryName = `New Itinerary ${targetItineraryIdFromLogic.split('-').pop()}`; }
            } else { finalItineraryName = `New Itinerary ${targetItineraryIdFromLogic.split('-').pop()}`; }

            let finalClientName = savedData.clientName;
            if (finalClientName === undefined || finalClientName === null || finalClientName.trim() === "") { finalClientName = defaultForContext.clientName; }

            const adminNotesToUse = associatedQuotationRequestLogic?.id === (savedData.quotationRequestId || createFromQuotationIdLogic) ? associatedQuotationRequestLogic?.adminRevisionNotes : savedData.adminRevisionNotes;

            newTripToSet = {
                id: targetItineraryIdFromLogic, itineraryName: finalItineraryName, clientName: finalClientName,
                createdAt: savedData.createdAt || defaultForContext.createdAt, updatedAt: savedData.updatedAt || defaultForContext.updatedAt,
                settings: { ...defaultForContext.settings, ...savedData.settings }, pax: { ...defaultForContext.pax, ...savedData.pax },
                travelers: savedData.travelers && savedData.travelers.length > 0 ? savedData.travelers : createDefaultTravelers(savedData.pax?.adults ?? defaultForContext.pax.adults, savedData.pax?.children ?? defaultForContext.pax.children),
                days: savedData.days && Object.keys(savedData.days).length > 0 ? savedData.days : defaultForContext.days,
                quotationRequestId: savedData.quotationRequestId || createFromQuotationIdLogic || undefined,
                version: savedData.version || 0, overallBookingStatus: savedData.overallBookingStatus || "NotStarted",
                adminRevisionNotes: adminNotesToUse || undefined,
                tags: savedData.tags || [], // Load tags or default to empty array
            };
            newCurrentIdForState = targetItineraryIdFromLogic;
          } else {
            if (loadDataFromStorage<string | null>(LAST_ACTIVE_ITINERARY_ID_KEY) === targetItineraryIdFromLogic) saveDataToStorage<string | null>(LAST_ACTIVE_ITINERARY_ID_KEY, null);
            newTripToSet = createDefaultTripData(createFromQuotationIdLogic, associatedQuotationRequestLogic);
            newTripToSet.id = targetItineraryIdFromLogic; 
            newCurrentIdForState = targetItineraryIdFromLogic;
            newTripToSet = saveNewItineraryToStorage(newTripToSet);
          }
        } catch (error) {
          console.error("Failed to load or create data for ID:", targetItineraryIdFromLogic, error);
          newTripToSet = createDefaultTripData(createFromQuotationIdLogic, associatedQuotationRequestLogic);
          if(targetItineraryIdFromLogic) newTripToSet.id = targetItineraryIdFromLogic;
          else newTripToSet.id = generateItineraryId(); 
          newCurrentIdForState = newTripToSet.id;
          newTripToSet = saveNewItineraryToStorage(newTripToSet);
        }
      } else {
        if (createFromQuotationIdLogic && associatedQuotationRequestLogic) {
          newTripToSet = createDefaultTripData(createFromQuotationIdLogic, associatedQuotationRequestLogic);
          newCurrentIdForState = newTripToSet.id;
          newTripToSet = saveNewItineraryToStorage(newTripToSet);

          const reqIdx = allQuotationRequests.findIndex(q => q.id === createFromQuotationIdLogic);
          if (reqIdx > -1 && allQuotationRequests[reqIdx].status === "New Request Submitted") {
             allQuotationRequests[reqIdx].linkedItineraryId = newCurrentIdForState;
             allQuotationRequests[reqIdx].status = "Quoted: Revision In Progress";
             allQuotationRequests[reqIdx].updatedAt = new Date().toISOString();
             allQuotationRequests[reqIdx].version = (allQuotationRequests[reqIdx].version || 0);
             saveDataToStorage<QuotationRequest[]>(AGENT_QUOTATION_REQUESTS_KEY, allQuotationRequests);
             associatedQuotationRequestLogic = allQuotationRequests[reqIdx];
          }
        } else {
          if (tripDataInternalRef.current && !itineraryIdFromUrl && !quotationRequestIdFromUrl) {
            newTripToSet = tripDataInternalRef.current; newCurrentIdForState = newTripToSet.id;
          } else {
            newTripToSet = createDefaultTripData(); newCurrentIdForState = newTripToSet.id;
            newTripToSet = saveNewItineraryToStorage(newTripToSet);
          }
        }
      }

      if (newTripToSet && newCurrentIdForState) {
        if (associatedQuotationRequestLogic?.adminRevisionNotes && !newTripToSet.adminRevisionNotes) { newTripToSet.adminRevisionNotes = associatedQuotationRequestLogic.adminRevisionNotes; }
        if (associatedQuotationRequestLogic?.agentRevisionNotes && !(newTripToSet as any).agentRevisionNotesDisplay) { (newTripToSet as any).agentRevisionNotesDisplay = associatedQuotationRequestLogic.agentRevisionNotes; }

        setTripData(newTripToSet); setCurrentItineraryId(newCurrentIdForState); setCurrentQuotationRequest(associatedQuotationRequestLogic);
        saveDataToStorage<string | null>(LAST_ACTIVE_ITINERARY_ID_KEY, newCurrentIdForState);
        const finalUrl = `/planner?itineraryId=${newCurrentIdForState}${newTripToSet.quotationRequestId ? `&quotationRequestId=${newTripToSet.quotationRequestId}` : ''}`;
        if (window.location.pathname + window.location.search !== finalUrl) { router.replace(finalUrl, { shallow: true }); }
        setPageStatus('planner');
      } else if (tripDataInternalRef.current) {
          setPageStatus('planner');
          const currentTripAssociatedQuote = tripDataInternalRef.current.quotationRequestId ? allQuotationRequests.find(q => q.id === tripDataInternalRef.current!.quotationRequestId) || null : null;
          if (JSON.stringify(currentQuotationRequest) !== JSON.stringify(currentTripAssociatedQuote)) { setCurrentQuotationRequest(currentTripAssociatedQuote); }
      } else {
          const fallbackTrip = createDefaultTripData(); const savedFallback = saveNewItineraryToStorage(fallbackTrip);
          setTripData(savedFallback); setCurrentItineraryId(savedFallback.id); setCurrentQuotationRequest(null);
          saveDataToStorage<string | null>(LAST_ACTIVE_ITINERARY_ID_KEY, savedFallback.id);
          router.replace(`/planner?itineraryId=${savedFallback.id}`, { shallow: true });
          setPageStatus('planner');
      }
    } else if (tripDataInternalRef.current && pageStatus !== 'planner') {
      setPageStatus('planner');
      const currentTripAssociatedQuote = tripDataInternalRef.current.quotationRequestId ? allQuotationRequests.find(q => q.id === tripDataInternalRef.current!.quotationRequestId) || null : null;
      if (JSON.stringify(currentQuotationRequest) !== JSON.stringify(currentTripAssociatedQuote)) { setCurrentQuotationRequest(currentTripAssociatedQuote); }
    }
  }, [itineraryIdFromUrl, quotationRequestIdFromUrl, router, saveNewItineraryToStorage, toast]);


  const handleStartNewItinerary = React.useCallback(() => {
    const newDefaultTripData = createDefaultTripData();
    const savedTripData = saveNewItineraryToStorage(newDefaultTripData);
    setTripData(savedTripData);
    setCurrentItineraryId(savedTripData.id);
    setCurrentQuotationRequest(null);
    saveDataToStorage<string | null>(LAST_ACTIVE_ITINERARY_ID_KEY, savedTripData.id);
    router.replace(`/planner?itineraryId=${savedTripData.id}`, { shallow: true });
    toast({ title: "New Itinerary Started", description: "A fresh itinerary has been created." });
  }, [router, toast, saveNewItineraryToStorage]);

  const handleUpdateTripData = React.useCallback((update: Partial<TripData> | ((current: TripData | null) => Partial<TripData> | TripData)) => {
    setTripData(prevTripData => {
        let updatesToApply: Partial<TripData> | TripData;
        if (typeof update === 'function') { updatesToApply = update(prevTripData); } 
        else { updatesToApply = update; }

        const base = prevTripData || createDefaultTripData(searchParams.get('quotationRequestId') || undefined, currentQuotationRequest || undefined);
        const newTripData = { ...base, ...updatesToApply } as TripData;

        if (!newTripData.id && currentItineraryId) { newTripData.id = currentItineraryId; } 
        else if (!newTripData.id && !currentItineraryId) { newTripData.id = generateItineraryId(); }
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
        if (newNumDays > oldNumDays) { for (let i = oldNumDays + 1; i <= newNumDays; i++) { if (!newDaysData[i]) newDaysData[i] = { items: [] }; }
        } else if (newNumDays < oldNumDays) { for (let i = newNumDays + 1; i <= oldNumDays; i++) delete newDaysData[i]; }
      }
      return { settings: updatedSettings, days: newDaysData };
    });
  }, [handleUpdateTripData]);

  const handleUpdatePax = React.useCallback((newPaxPartial: Partial<PaxDetails>) => {
    handleUpdateTripData(currentTripData => {
      if (!currentTripData) return {};
      const updatedPax = { ...currentTripData.pax, ...newPaxPartial };
      let updatedTravelers = currentTripData.travelers;
      if ( (newPaxPartial.adults !== undefined && newPaxPartial.adults !== currentTripData.pax.adults) || (newPaxPartial.children !== undefined && newPaxPartial.children !== currentTripData.pax.children) ) {
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
      let currentVersion = currentTripDataForSave.version || 0;
      if (currentTripDataForSave.quotationRequestId) {
        const allRequests = loadDataFromStorage<QuotationRequest[]>(AGENT_QUOTATION_REQUESTS_KEY) || [];
        const linkedQuote = allRequests.find(q => q.id === currentTripDataForSave.quotationRequestId);
        if (linkedQuote && linkedQuote.version) { currentVersion = linkedQuote.version; }
      }

      const dataToSave: TripData = { ...currentTripDataForSave, id: currentItineraryIdForSave, version: currentVersion, updatedAt: new Date().toISOString() };
      saveNewItineraryToStorage(dataToSave); // This function now handles both data and index updates.
      saveDataToStorage<string | null>(LAST_ACTIVE_ITINERARY_ID_KEY, currentItineraryIdForSave);

      if (dataToSave.quotationRequestId) {
        let allRequests = loadDataFromStorage<QuotationRequest[]>(AGENT_QUOTATION_REQUESTS_KEY) || [];
        const requestIndex = allRequests.findIndex(q => q.id === dataToSave.quotationRequestId);
        if (requestIndex > -1) {
          const currentStatus = allRequests[requestIndex].status;
          if (currentStatus === "New Request Submitted") { allRequests[requestIndex].status = "Quoted: Revision In Progress"; }
          allRequests[requestIndex].linkedItineraryId = currentItineraryIdForSave;
          allRequests[requestIndex].updatedAt = new Date().toISOString();
          allRequests[requestIndex].version = currentVersion;
          saveDataToStorage<QuotationRequest[]>(AGENT_QUOTATION_REQUESTS_KEY, allRequests);
          setCurrentQuotationRequest(prev => prev && prev.id === allRequests[requestIndex].id ? allRequests[requestIndex] : prev);
        }
      }
      setTripData(dataToSave);
      toast({ title: "Success", description: `Itinerary "${dataToSave.itineraryName}" (v${dataToSave.version?.toFixed(1) || '0.0'}) saved.` });
    } catch (e: any) {
      console.error("Error during manual save:", e);
      toast({ title: "Error", description: `Could not save itinerary: ${e.message}`, variant: "destructive" });
    }
  }, [currentItineraryId, toast, saveNewItineraryToStorage]);


  const handleSendQuotationToAgent = React.useCallback(() => {
    handleManualSave(); 
    const currentTripForFinalize = tripDataInternalRef.current; 

    if (!currentTripForFinalize || !currentTripForFinalize.quotationRequestId) {
      toast({ title: "Error", description: "This itinerary is not linked to a quotation request.", variant: "destructive" });
      return false;
    }

    const now = new Date().toISOString();
    let newVersion: number;
    let allRequests = loadDataFromStorage<QuotationRequest[]>(AGENT_QUOTATION_REQUESTS_KEY) || [];
    const requestIndex = allRequests.findIndex(q => q.id === currentTripForFinalize.quotationRequestId);
    let newStatus: QuotationRequestStatus;
    let previousQuoteVersion = 0;

    if (requestIndex > -1) {
      const currentRequest = allRequests[requestIndex];
      previousQuoteVersion = currentRequest.version || 0;

      if (currentRequest.status === "New Request Submitted" || currentRequest.status === "Quoted: Revision In Progress") {
        newVersion = Math.max(1.0, previousQuoteVersion); newStatus = "Quoted: Waiting for TA Feedback";
      } else if (currentRequest.status === "Quoted: Revision Requested") {
        newVersion = parseFloat((previousQuoteVersion + 0.1).toFixed(1)); newStatus = "Quoted: Re-quoted";
      } else { 
        newVersion = parseFloat(((previousQuoteVersion || currentTripForFinalize.version || 0) + 0.1).toFixed(1));
        newStatus = "Quoted: Re-quoted";
      }

      currentRequest.status = newStatus; currentRequest.linkedItineraryId = currentTripForFinalize.id;
      currentRequest.adminRevisionNotes = currentTripForFinalize.adminRevisionNotes || undefined;
      currentRequest.version = newVersion; currentRequest.updatedAt = now;
      currentRequest.agentRevisionNotes = undefined; 

      allRequests[requestIndex] = currentRequest;
      saveDataToStorage<QuotationRequest[]>(AGENT_QUOTATION_REQUESTS_KEY, allRequests);
      setCurrentQuotationRequest(currentRequest);

      const updatedTripWithVersion: TripData = { ...currentTripForFinalize, updatedAt: now, version: newVersion };
      saveNewItineraryToStorage(updatedTripWithVersion); 
      setTripData(updatedTripWithVersion);

      toast({ title: "Quotation Sent to Agent", description: `Quotation ${currentTripForFinalize.quotationRequestId.split('-').pop()} (v${newVersion.toFixed(1)}) is now '${newStatus}'.` });
      return true;
    } else {
      toast({ title: "Error", description: "Associated quotation request not found.", variant: "destructive" });
      return false;
    }
  }, [toast, handleManualSave, saveNewItineraryToStorage]);


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
    handleSendQuotationToAgent,
  };
}

