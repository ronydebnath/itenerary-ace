
"use client";

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { TripData, ItineraryMetadata, TripSettings, PaxDetails, Traveler } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

const ITINERARY_INDEX_KEY = 'itineraryAce_index';
const ITINERARY_DATA_PREFIX = 'itineraryAce_data_';

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

const createDefaultTripData = (): TripData => {
  const newId = generateItineraryId();
  const now = new Date().toISOString();
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const settings: TripSettings = {
    numDays: 1,
    startDate: startDate.toISOString().split('T')[0],
    selectedCountries: [], // Initialize selectedCountries
    selectedProvinces: [],
    budget: undefined,
  };
  const pax: PaxDetails = { adults: 2, children: 0, currency: 'THB' };
  const travelers = createDefaultTravelers(pax.adults, pax.children);
  const days: { [dayNumber: number]: { items: [] } } = { 1: { items: [] } };

  return {
    id: newId,
    itineraryName: `New Itinerary ${newId.split('-').pop()}`,
    clientName: undefined,
    settings,
    pax,
    travelers,
    days,
    createdAt: now,
    updatedAt: now,
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
    let idToLoad = itineraryIdFromUrl;

    if (!idToLoad) {
      try {
        const lastActiveIdFromStorage = localStorage.getItem('lastActiveItineraryId');
        if (lastActiveIdFromStorage) {
          idToLoad = lastActiveIdFromStorage;
        }
      } catch (e) { console.error("Error reading lastActiveItineraryId:", e); }
    }

    if (idToLoad && currentItineraryId === idToLoad && pageStatus === 'planner' && tripData) {
      if (itineraryIdFromUrl !== currentItineraryId) {
        router.replace(`/planner?itineraryId=${currentItineraryId}`, { shallow: true });
      }
      return;
    }

    setPageStatus('loading');

    if (idToLoad) {
      try {
        const savedData = localStorage.getItem(`${ITINERARY_DATA_PREFIX}${idToLoad}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData) as Partial<TripData>;
          const defaultSettings = createDefaultTripData().settings;
          const dataToSet: TripData = {
            id: parsedData.id || idToLoad,
            itineraryName: parsedData.itineraryName || `Itinerary ${idToLoad.slice(-6)}`,
            clientName: parsedData.clientName || undefined,
            createdAt: parsedData.createdAt || new Date().toISOString(),
            updatedAt: parsedData.updatedAt || new Date().toISOString(),
            settings: {
              ...defaultSettings,
              ...parsedData.settings,
              selectedCountries: parsedData.settings?.selectedCountries || [],
              selectedProvinces: parsedData.settings?.selectedProvinces || [],
            },
            pax: parsedData.pax || { adults: 1, children: 0, currency: 'THB' },
            travelers: parsedData.travelers && parsedData.travelers.length > 0 ? parsedData.travelers : createDefaultTravelers(parsedData.pax?.adults || 1, parsedData.pax?.children || 0),
            days: parsedData.days || { 1: { items: [] } },
          };

          setTripData(dataToSet);
          setCurrentItineraryId(dataToSet.id);
          setPageStatus('planner');
          localStorage.setItem('lastActiveItineraryId', dataToSet.id);

          if (itineraryIdFromUrl !== dataToSet.id) {
            router.replace(`/planner?itineraryId=${dataToSet.id}`, { shallow: true });
          }
        } else {
          console.warn(`No data found for itineraryId: ${idToLoad}. Starting new one.`);
          if (localStorage.getItem('lastActiveItineraryId') === idToLoad) {
            localStorage.removeItem('lastActiveItineraryId');
          }
          const newDefaultTripData = createDefaultTripData();
          setTripData(newDefaultTripData);
          setCurrentItineraryId(newDefaultTripData.id);
          setPageStatus('planner');
          localStorage.setItem('lastActiveItineraryId', newDefaultTripData.id);
          router.replace(`/planner?itineraryId=${newDefaultTripData.id}`, { shallow: true });
        }
      } catch (error) {
        console.error("Failed to load data from localStorage:", error);
        const newDefaultTripData = createDefaultTripData();
        setTripData(newDefaultTripData);
        setCurrentItineraryId(newDefaultTripData.id);
        setPageStatus('planner');
        localStorage.setItem('lastActiveItineraryId', newDefaultTripData.id);
        router.replace(`/planner?itineraryId=${newDefaultTripData.id}`, { shallow: true });
      }
    } else {
        const newDefaultTripData = createDefaultTripData();
        setTripData(newDefaultTripData);
        setCurrentItineraryId(newDefaultTripData.id);
        setPageStatus('planner');
        localStorage.setItem('lastActiveItineraryId', newDefaultTripData.id);
        router.replace(`/planner?itineraryId=${newDefaultTripData.id}`, { shallow: true });
    }
  }, [searchParams, currentItineraryId, pageStatus, router, tripData]);

  const handleStartNewItinerary = React.useCallback(() => {
    setPageStatus('loading');
    const newDefaultTripData = createDefaultTripData();
    setTripData(newDefaultTripData);
    setCurrentItineraryId(newDefaultTripData.id);
    localStorage.setItem('lastActiveItineraryId', newDefaultTripData.id);
    router.replace(`/planner?itineraryId=${newDefaultTripData.id}`, { shallow: true });
    toast({ title: "New Itinerary Started", description: "A fresh itinerary has been created with default settings." });
  }, [router, toast]);

  const handleUpdateTripData = React.useCallback((updatedTripDataFromPlanner: Partial<TripData>) => {
    setTripData(prevTripData => {
      if (!prevTripData && !currentItineraryId) {
          console.error("Attempted to update trip data without a current itinerary.");
          toast({ title: "Error", description: "No active itinerary to update.", variant: "destructive" });
          return null;
      }
      const baseData = prevTripData || createDefaultTripData();
      const dataToSet: TripData = {
        ...baseData,
        ...updatedTripDataFromPlanner,
        id: baseData.id || currentItineraryId!,
      };
      return dataToSet;
    });
  }, [currentItineraryId, toast]);

  const handleUpdateSettings = React.useCallback((newSettingsPartial: Partial<TripSettings>) => {
    setTripData(prevTripData => {
      if (!prevTripData) return null;
      
      let updatedSelectedProvinces = prevTripData.settings.selectedProvinces;
      // If selectedCountries change, reset selectedProvinces
      if (newSettingsPartial.selectedCountries && 
          JSON.stringify(newSettingsPartial.selectedCountries) !== JSON.stringify(prevTripData.settings.selectedCountries)) {
        updatedSelectedProvinces = [];
      }
      
      const updatedSettings = { 
        ...prevTripData.settings, 
        ...newSettingsPartial,
        selectedProvinces: updatedSelectedProvinces // Apply potentially reset provinces
      };
      
      const newDaysData = { ...prevTripData.days };

      if (newSettingsPartial.numDays !== undefined && newSettingsPartial.numDays !== prevTripData.settings.numDays) {
        const oldNumDays = prevTripData.settings.numDays;
        const newNumDays = updatedSettings.numDays;

        if (newNumDays > oldNumDays) {
          for (let i = oldNumDays + 1; i <= newNumDays; i++) {
            if (!newDaysData[i]) {
              newDaysData[i] = { items: [] };
            }
          }
        } else if (newNumDays < oldNumDays) {
          for (let i = newNumDays + 1; i <= oldNumDays; i++) {
            delete newDaysData[i];
          }
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

      if (newPaxPartial.adults !== undefined || newPaxPartial.children !== undefined) {
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
      const dataToSave: TripData = {
        ...tripData,
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

      if (existingEntryIndex > -1) {
        index[existingEntryIndex] = newEntry;
      } else {
        index.push(newEntry);
      }
      localStorage.setItem(ITINERARY_INDEX_KEY, JSON.stringify(index));
      localStorage.setItem('lastActiveItineraryId', currentItineraryId);

      toast({ title: "Success", description: `Itinerary "${dataToSave.itineraryName}" saved.` });
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
