
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
    selectedCountries: [],
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

  // This useEffect is responsible for loading an itinerary based on the URL or localStorage, or initializing a new one.
  React.useEffect(() => {
    const itineraryIdFromUrl = searchParams.get('itineraryId');

    // If current state matches URL, and we are in planner mode, do nothing.
    // This prevents re-loading if only other searchParams (not 'itineraryId') change.
    if (itineraryIdFromUrl && currentItineraryId === itineraryIdFromUrl && pageStatus === 'planner') {
      return;
    }

    // If URL is blank, but we have an active itinerary in planner mode, update URL and do nothing else.
    if (!itineraryIdFromUrl && currentItineraryId && pageStatus === 'planner') {
      router.replace(`/planner?itineraryId=${currentItineraryId}`, { shallow: true });
      return;
    }
    
    // Indicate loading when this effect runs to change/load itinerary.
    // Only set to loading if not already loading to prevent potential flicker if effect runs multiple times quickly.
    if (pageStatus !== 'loading') {
      setPageStatus('loading');
    }

    let idToLoad = itineraryIdFromUrl;
    if (!idToLoad) { // No ID in URL, try last active
      try {
        idToLoad = localStorage.getItem('lastActiveItineraryId');
      } catch (e) { console.error("Error reading lastActiveItineraryId:", e); }
    }

    let loadedTripData: TripData | null = null;

    if (idToLoad) {
      try {
        const savedDataString = localStorage.getItem(`${ITINERARY_DATA_PREFIX}${idToLoad}`);
        if (savedDataString) {
          const parsedData = JSON.parse(savedDataString) as Partial<TripData>;
          const defaultSettings = createDefaultTripData().settings;
          const hydratedData: TripData = {
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
          loadedTripData = hydratedData;
        } else { // ID was found (from URL or storage) but no data for it
          if (localStorage.getItem('lastActiveItineraryId') === idToLoad) {
            localStorage.removeItem('lastActiveItineraryId');
          }
          idToLoad = null; // Will force new itinerary creation below
        }
      } catch (error) {
        console.error("Failed to load data for ID:", idToLoad, error);
        idToLoad = null; // Force new itinerary creation on error
      }
    }

    if (!loadedTripData) { // Create new if no idToLoad or loading failed
      loadedTripData = createDefaultTripData();
      idToLoad = loadedTripData.id; // Get the ID of the newly created trip
    }

    // Update state only if necessary
    if (currentItineraryId !== idToLoad || pageStatus !== 'planner' || JSON.stringify(tripData) !== JSON.stringify(loadedTripData)) {
        setTripData(loadedTripData);
        setCurrentItineraryId(idToLoad!);
        localStorage.setItem('lastActiveItineraryId', idToLoad!);
        if (itineraryIdFromUrl !== idToLoad) { // Sync URL if needed
            router.replace(`/planner?itineraryId=${idToLoad}`, { shallow: true });
        }
        setPageStatus('planner');
    } else if (pageStatus === 'loading') { // If data was same but we were loading, switch to planner
        setPageStatus('planner');
    }

  // Dependencies: Only re-run if the URL search parameter changes, or if the router instance changes (rare).
  // Internal states like currentItineraryId, pageStatus, tripData are set *by* this effect and should not be dependencies.
  }, [searchParams, router]); // Minimal dependencies to avoid loops.

  const handleStartNewItinerary = React.useCallback(() => {
    // setPageStatus('loading'); // Let the main useEffect handle status change on URL update
    const newDefaultTripData = createDefaultTripData();
    // These will trigger the main useEffect because searchParams will change via router.replace
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
      const baseData = prevTripData || createDefaultTripData(); // Should ideally not hit createDefault here if currentItineraryId is set
      const dataToSet: TripData = {
        ...baseData,
        ...updatedTripDataFromPlanner,
        id: baseData.id || currentItineraryId!, // Ensure ID is maintained
      };
      return dataToSet;
    });
  }, [currentItineraryId, toast]);

  const handleUpdateSettings = React.useCallback((newSettingsPartial: Partial<TripSettings>) => {
    setTripData(prevTripData => {
      if (!prevTripData) return null;

      const currentSettings = prevTripData.settings;
      let updatedSettings = { ...currentSettings }; // Start with a copy

      // Handle selectedCountries
      const prevSelectedCountries = currentSettings.selectedCountries || [];
      let countriesChanged = false;
      if (newSettingsPartial.selectedCountries !== undefined) {
        if (JSON.stringify(newSettingsPartial.selectedCountries) !== JSON.stringify(prevSelectedCountries)) {
          updatedSettings.selectedCountries = newSettingsPartial.selectedCountries;
          countriesChanged = true;
        } else {
          updatedSettings.selectedCountries = prevSelectedCountries; // Keep old reference
        }
      }

      // Handle selectedProvinces
      const prevSelectedProvinces = currentSettings.selectedProvinces || [];
      if (countriesChanged) {
        updatedSettings.selectedProvinces = []; // Reset provinces if countries changed
      } else if (newSettingsPartial.selectedProvinces !== undefined) {
        if (JSON.stringify(newSettingsPartial.selectedProvinces) !== JSON.stringify(prevSelectedProvinces)) {
          updatedSettings.selectedProvinces = newSettingsPartial.selectedProvinces;
        } else {
          updatedSettings.selectedProvinces = prevSelectedProvinces; // Keep old reference
        }
      }
      
      // Apply other settings changes
      for (const key in newSettingsPartial) {
        if (key !== 'selectedCountries' && key !== 'selectedProvinces') {
          (updatedSettings as any)[key] = (newSettingsPartial as any)[key];
        }
      }
      
      const newDaysData = { ...prevTripData.days };
      if (updatedSettings.numDays !== undefined && updatedSettings.numDays !== currentSettings.numDays) {
        const oldNumDays = currentSettings.numDays;
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

      // Only regenerate travelers if adults or children count actually changes
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
      const dataToSave: TripData = {
        ...tripData,
        updatedAt: new Date().toISOString(),
      };
      // Optimistically update state so UI reflects saved time, though main data is already current
      setTripData(prev => prev ? {...prev, updatedAt: dataToSave.updatedAt} : null);


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

