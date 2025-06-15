
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
  if (quotationRequest?.agentId) {
    clientNameForTrip = getAgencyAndAgentNameFromLocalStorage(quotationRequest.agentId);
  } else if (quotationRequestId && !quotationRequest) {
    try {
        const requestsString = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
        if (requestsString) {
            const allRequests: QuotationRequest[] = JSON.parse(requestsString);
            const foundQuote = allRequests.find(q => q.id === quotationRequestId);
            if (foundQuote?.agentId) {
                clientNameForTrip = getAgencyAndAgentNameFromLocalStorage(foundQuote.agentId);
            }
        }
    } catch (e) { console.error("Error fetching quote for client name in createDefaultTripData:", e); }
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
  const tripDataInternalRef = React.useRef<TripData | null>(null);
  const [currentItineraryId, setCurrentItineraryId] = React.useState<string | null>(null);
  const [pageStatus, setPageStatus] = React.useState<PageStatus>('loading');
  const [currentQuotationRequest, setCurrentQuotationRequest] = React.useState<QuotationRequest | null>(null);


  React.useEffect(() => {
    tripDataInternalRef.current = tripData;
  }, [tripData]);

  // Memoize extracted params for stable dependency array
  const itineraryIdFromUrl = searchParams.get('itineraryId');
  const quotationRequestIdFromUrl = searchParams.get('quotationRequestId');

  React.useEffect(() => {
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
          {
            agentId: AGENT_ID_JOHN_DOE_GTE,
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
            accommodationPrefs: { hotelStarRating: "4 Stars", roomPreferences: "King Bed, Sea View if possible", specificHotelRequests: "Centara Grand at CentralWorld or similar" },
            activityPrefs: { requestedActivities: "Grand Palace Tour, Phi Phi Island Trip, Floating Market visit" },
            flightPrefs: { airportTransfersRequired: true, activityTransfersRequired: false },
            mealPrefs: {mealPlan: "Breakfast Only"},
            otherRequirements: "Would prefer a hotel with a good pool. Interested in evening shows."
          },
          {
            agentId: AGENT_ID_BOB_JOHNSON_LAI,
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
            accommodationPrefs: { hotelStarRating: "4 Stars", roomPreferences: "Family room or connecting rooms, kids club a plus" },
            activityPrefs: { requestedActivities: "Island hopping in Krabi, Cable car in Langkawi, Petronas Towers in KL, Elephant sanctuary if ethical." },
            flightPrefs: { airportTransfersRequired: true, activityTransfersRequired: true },
            otherRequirements: "Need child-friendly activities. One child is a fussy eater."
          },
           {
            agentId: AGENT_ID_FATIMA_AHMED_BV,
            clientInfo: { adults: 1, children: 0, childAges: "" },
            tripDetails: {
              preferredCountryIds: [DEFAULT_BANGLADESH_ID],
              preferredProvinceNames: ["Dhaka", "Sylhet"],
              preferredStartDate: formatISO(addDays(now, 45), { representation: 'date' }),
              durationDays: 5,
              tripType: "Cultural",
              budgetRange: "Economy/Budget",
              budgetCurrency: "BDT",
            },
            accommodationPrefs: { hotelStarRating: "3 Stars", roomPreferences: "Clean and centrally located, good Wi-Fi." },
            activityPrefs: { requestedActivities: "Explore Old Dhaka, visit tea gardens in Sylhet, historical sites." },
            mealPrefs: {mealPlan: "Breakfast Only"},
            otherRequirements: "Solo female traveler, safety is a priority. Interested in local markets."
          },
        ];

        const seededQuotations: QuotationRequest[] = demoQuotationData.map((q, index) => {
          const agent = demoAgents.find(a => a.id === q.agentId);
          let agencyIdToUse = agent?.agencyId;
          if (!agencyIdToUse) {
              if (q.agentId === AGENT_ID_JOHN_DOE_GTE) agencyIdToUse = AGENCY_ID_GLOBAL_TRAVEL;
              else if (q.agentId === AGENT_ID_BOB_JOHNSON_LAI) agencyIdToUse = AGENCY_ID_LOCAL_ADVENTURES;
              else if (q.agentId === AGENT_ID_FATIMA_AHMED_BV) agencyIdToUse = AGENCY_ID_BENGAL_VOYAGER;
              else agencyIdToUse = demoAgencies.length > 0 ? demoAgencies[0].id : AGENCY_ID_GLOBAL_TRAVEL;
          }
          return {
            ...q,
            id: generateFullQuotationId(agencyIdToUse),
            requestDate: subDays(now, (demoQuotationData.length - index) * 10).toISOString(),
            updatedAt: subDays(now, (demoQuotationData.length - index) * 10).toISOString(),
            status: "Pending" as QuotationRequestStatus,
          };
        });
        localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(seededQuotations));
        allQuotationRequests = seededQuotations;
      } else {
        allQuotationRequests = JSON.parse(storedQuotations);
      }
    } catch (e) { console.error("Error seeding/reading demo quotations:", e); }

    if (typeof window !== "undefined" && window.location.pathname === '/planner') {
      let targetItineraryIdFromLogic = itineraryIdFromUrl;
      let createFromQuotationIdLogic = quotationRequestIdFromUrl;
      let associatedQuotationRequestLogic: QuotationRequest | null = null;

      if (createFromQuotationIdLogic) {
        if (allQuotationRequests.length === 0) {
            const storedQuotations = localStorage.getItem(AGENT_QUOTATION_REQUESTS_KEY);
            if (storedQuotations) allQuotationRequests = JSON.parse(storedQuotations);
        }
        associatedQuotationRequestLogic = allQuotationRequests.find(q => q.id === createFromQuotationIdLogic) || null;
        // Don't set currentQuotationRequest state here yet, do it when tripData is confirmed
        if (associatedQuotationRequestLogic?.linkedItineraryId && !targetItineraryIdFromLogic) {
            targetItineraryIdFromLogic = associatedQuotationRequestLogic.linkedItineraryId;
        }
      }

      if (!targetItineraryIdFromLogic && !createFromQuotationIdLogic) {
        try { targetItineraryIdFromLogic = localStorage.getItem('lastActiveItineraryId'); } catch (e) { /* */ }
      }

      // Conditional loading status
      const needsNewDataLoad = !tripDataInternalRef.current ||
                               (targetItineraryIdFromLogic && targetItineraryIdFromLogic !== currentItineraryId) ||
                               (createFromQuotationIdLogic && tripDataInternalRef.current?.quotationRequestId !== createFromQuotationIdLogic);

      if (needsNewDataLoad) {
        setPageStatus('loading');
      }


      let newTripToSet: TripData | null = null;
      let newCurrentIdForState: string | null = null;
      let isNewItineraryFromQuote = false;

      if (targetItineraryIdFromLogic) {
            try {
                const savedDataString = localStorage.getItem(`${ITINERARY_DATA_PREFIX}${targetItineraryIdFromLogic}`);
                if (savedDataString) {
                    const parsedData = JSON.parse(savedDataString) as Partial<TripData>;
                    // Ensure associatedQuotationRequestLogic is set if quote ID matches
                    if (parsedData.quotationRequestId && !associatedQuotationRequestLogic) {
                        associatedQuotationRequestLogic = allQuotationRequests.find(q => q.id === parsedData.quotationRequestId) || null;
                    } else if (createFromQuotationIdLogic && !parsedData.quotationRequestId) {
                        // Itinerary loaded by ID, but URL also has a quote ID. Prioritize quote from URL if not on data.
                        associatedQuotationRequestLogic = allQuotationRequests.find(q => q.id === createFromQuotationIdLogic) || null;
                    }


                    const defaultForContext = createDefaultTripData(parsedData.quotationRequestId || createFromQuotationIdLogic || undefined, associatedQuotationRequestLogic);
                    let finalClientName = parsedData.clientName;
                    if (!finalClientName && (parsedData.quotationRequestId || createFromQuotationIdLogic)) {
                        const qIdForClientName = parsedData.quotationRequestId || createFromQuotationIdLogic;
                        if (allQuotationRequests.length === 0 && qIdForClientName) { /* already loaded */ }
                        const agentIdForClientName = allQuotationRequests.find(q => q.id === qIdForClientName)?.agentId;
                        if (agentIdForClientName) finalClientName = getAgencyAndAgentNameFromLocalStorage(agentIdForClientName);
                    }

                    newTripToSet = {
                        id: parsedData.id || targetItineraryIdFromLogic,
                        itineraryName: parsedData.itineraryName || (associatedQuotationRequestLogic ? `Proposal for Quotation ${associatedQuotationRequestLogic.id.split('-').pop()}` : defaultForContext.itineraryName),
                        clientName: finalClientName || defaultForContext.clientName,
                        createdAt: parsedData.createdAt || new Date().toISOString(),
                        updatedAt: parsedData.updatedAt || new Date().toISOString(),
                        settings: { ...defaultForContext.settings, ...parsedData.settings },
                        pax: { ...defaultForContext.pax, ...parsedData.pax },
                        travelers: parsedData.travelers && parsedData.travelers.length > 0 ? parsedData.travelers : createDefaultTravelers(parsedData.pax?.adults ?? defaultForContext.pax.adults, parsedData.pax?.children ?? defaultForContext.pax.children),
                        days: parsedData.days || defaultForContext.days,
                        quotationRequestId: parsedData.quotationRequestId || createFromQuotationIdLogic || undefined,
                        version: parsedData.version || 1,
                        overallBookingStatus: parsedData.overallBookingStatus || "NotStarted",
                    };
                    newCurrentIdForState = targetItineraryIdFromLogic;
                } else { // No saved data for targetItineraryIdFromLogic
                    if (localStorage.getItem('lastActiveItineraryId') === targetItineraryIdFromLogic) localStorage.removeItem('lastActiveItineraryId');
                    if (createFromQuotationIdLogic && associatedQuotationRequestLogic) {
                        newTripToSet = createDefaultTripData(createFromQuotationIdLogic, associatedQuotationRequestLogic);
                        isNewItineraryFromQuote = true;
                    } else {
                        newTripToSet = createDefaultTripData();
                    }
                    newCurrentIdForState = newTripToSet.id;
                }
            } catch (error) {
                console.error("Failed to load data for ID:", targetItineraryIdFromLogic, error);
                newTripToSet = createDefaultTripData(createFromQuotationIdLogic, associatedQuotationRequestLogic);
                newCurrentIdForState = newTripToSet.id;
                if (createFromQuotationIdLogic) isNewItineraryFromQuote = true;
            }
      } else if (createFromQuotationIdLogic && associatedQuotationRequestLogic) {
        newTripToSet = createDefaultTripData(createFromQuotationIdLogic, associatedQuotationRequestLogic);
        newCurrentIdForState = newTripToSet.id;
        isNewItineraryFromQuote = true;
      } else if (tripDataInternalRef.current && !needsNewDataLoad) { // No ID in URL, no quote, but we have existing data and don't need a new load
        newTripToSet = tripDataInternalRef.current;
        newCurrentIdForState = tripDataInternalRef.current.id;
        associatedQuotationRequestLogic = tripDataInternalRef.current.quotationRequestId
            ? allQuotationRequests.find(q => q.id === tripDataInternalRef.current!.quotationRequestId) || null
            : null;
      } else { // No ID in URL, no quote, and no existing data, or needsNewDataLoad was true but resolved to no target
        newTripToSet = createDefaultTripData();
        newCurrentIdForState = newTripToSet.id;
      }

      if (isNewItineraryFromQuote && newTripToSet && newCurrentIdForState && createFromQuotationIdLogic && associatedQuotationRequestLogic) {
        if (!associatedQuotationRequestLogic.linkedItineraryId) {
            try {
               const reqIdx = allQuotationRequests.findIndex(q => q.id === createFromQuotationIdLogic);
               if (reqIdx > -1) {
                   allQuotationRequests[reqIdx].linkedItineraryId = newCurrentIdForState;
                   allQuotationRequests[reqIdx].status = "Quoted";
                   allQuotationRequests[reqIdx].updatedAt = new Date().toISOString();
                   localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allQuotationRequests));
               }
            } catch(e) { console.error("Failed to link quote to new itinerary:", e); }
        }
      }

      if (newTripToSet && newCurrentIdForState) {
        if (JSON.stringify(tripDataInternalRef.current) !== JSON.stringify(newTripToSet)) {
          setTripData(newTripToSet);
        }
        if (currentItineraryId !== newCurrentIdForState) {
          setCurrentItineraryId(newCurrentIdForState);
        }
        if (JSON.stringify(currentQuotationRequest) !== JSON.stringify(associatedQuotationRequestLogic)) {
            setCurrentQuotationRequest(associatedQuotationRequestLogic);
        }

        try { localStorage.setItem('lastActiveItineraryId', newCurrentIdForState); } catch(e) {/* */}

        const finalUrl = `/planner?itineraryId=${newCurrentIdForState}${newTripToSet.quotationRequestId ? `&quotationRequestId=${newTripToSet.quotationRequestId}`: ''}`;
        if (window.location.pathname + window.location.search !== finalUrl) {
            router.replace(finalUrl, { shallow: true });
        }
        setPageStatus('planner');
      } else if (pageStatus !== 'planner' && !tripDataInternalRef.current) {
          // Fallback if truly no data could be loaded or derived and we're stuck in loading
          console.warn("useItineraryManager: Could not establish trip data. Initializing with a new default itinerary.");
          const fallbackTrip = createDefaultTripData();
          setTripData(fallbackTrip);
          setCurrentItineraryId(fallbackTrip.id);
          setCurrentQuotationRequest(null);
          setPageStatus('planner');
          localStorage.setItem('lastActiveItineraryId', fallbackTrip.id);
          router.replace(`/planner?itineraryId=${fallbackTrip.id}`, { shallow: true });
      } else if (pageStatus === 'loading' && tripDataInternalRef.current) {
          // If we were 'loading' but already had data and didn't need a new load, switch back to planner
          setPageStatus('planner');
      }
    }
  }, [itineraryIdFromUrl, quotationRequestIdFromUrl, router, toast, currentItineraryId, pageStatus]);


  const handleStartNewItinerary = React.useCallback(() => {
    const newDefaultTripData = createDefaultTripData();
    setTripData(newDefaultTripData);
    setCurrentItineraryId(newDefaultTripData.id);
    setCurrentQuotationRequest(null);
    localStorage.setItem('lastActiveItineraryId', newDefaultTripData.id);
    router.replace(`/planner?itineraryId=${newDefaultTripData.id}`, { shallow: true });
    toast({ title: "New Itinerary Started", description: "A fresh itinerary has been created." });
  }, [router, toast]);

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
    if (!currentTripDataForSave || !currentItineraryId) {
      toast({ title: "Error", description: "No itinerary data to save.", variant: "destructive" });
      return;
    }
    try {
      const newVersion = (currentTripDataForSave.version || 1);
      const dataToSave: TripData = {
        ...currentTripDataForSave,
        version: newVersion,
        updatedAt: new Date().toISOString(),
      };

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
          if (requestIndex > -1 && (allRequests[requestIndex].status === "Pending" || !allRequests[requestIndex].linkedItineraryId)) {
            allRequests[requestIndex].status = "Quoted";
            allRequests[requestIndex].linkedItineraryId = currentItineraryId;
            allRequests[requestIndex].updatedAt = new Date().toISOString();
            localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allRequests));
          } else if (requestIndex > -1 && allRequests[requestIndex].linkedItineraryId !== currentItineraryId ) {
            allRequests[requestIndex].linkedItineraryId = currentItineraryId;
             if (allRequests[requestIndex].status === "Pending") allRequests[requestIndex].status = "Quoted";
            allRequests[requestIndex].updatedAt = new Date().toISOString();
            localStorage.setItem(AGENT_QUOTATION_REQUESTS_KEY, JSON.stringify(allRequests));
          }
        }
      }
      setTripData(dataToSave); // Ensure the local state has the version and updatedAt too
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

