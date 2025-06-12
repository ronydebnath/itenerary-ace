
"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SetupForm } from '@/components/itinerary/setup-form';
import { ItineraryPlanner } from '@/components/itinerary/itinerary-planner';
import type { TripSettings, PaxDetails, TripData, ItineraryMetadata } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { Cog, Image as ImageIconLucide, ListOrdered } from 'lucide-react';

const ITINERARY_INDEX_KEY = 'itineraryAce_index';
const ITINERARY_DATA_PREFIX = 'itineraryAce_data_';

const generateItineraryId = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  // Make suffix more unique and shorter
  const randomSuffix = String(Date.now()).slice(-5) + String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `ITN-${year}${month}${day}-${randomSuffix}`;
};

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tripData, setTripData] = React.useState<TripData | null>(null);
  const [currentItineraryId, setCurrentItineraryId] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const debouncedSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const itineraryIdFromUrl = searchParams.get('itineraryId');
    let idToLoad = itineraryIdFromUrl;

    if (!idToLoad) {
      try {
        const lastActiveId = localStorage.getItem('lastActiveItineraryId');
        if (lastActiveId) {
          idToLoad = lastActiveId;
        }
      } catch (e) { console.error("Error reading lastActiveItineraryId:", e); }
    }

    if (idToLoad) {
      try {
        const savedData = localStorage.getItem(`${ITINERARY_DATA_PREFIX}${idToLoad}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData) as Partial<TripData>; // Load as partial initially for migration

          // Ensure core fields and ID are present, migrate if necessary
          const dataToSet: TripData = {
            id: parsedData.id || idToLoad, // Crucial: Assign ID if missing
            itineraryName: parsedData.itineraryName || `Itinerary ${idToLoad.slice(-6)}`,
            clientName: parsedData.clientName || undefined,
            createdAt: parsedData.createdAt || new Date().toISOString(),
            updatedAt: parsedData.updatedAt || new Date().toISOString(),
            settings: parsedData.settings || { numDays: 1, startDate: new Date().toISOString().split('T')[0], selectedProvinces: [] },
            pax: parsedData.pax || { adults: 1, children: 0, currency: 'USD' },
            travelers: parsedData.travelers && parsedData.travelers.length > 0 ? parsedData.travelers : [{ id: generateGUID(), label: 'Adult 1', type: 'adult' }],
            days: parsedData.days || { 1: { items: [] } },
          };
          
          // Further ensure selectedProvinces is an array within settings
          dataToSet.settings.selectedProvinces = dataToSet.settings.selectedProvinces || [];


          setTripData(dataToSet);
          setCurrentItineraryId(dataToSet.id);
          if (!itineraryIdFromUrl && dataToSet.id) {
            router.replace(`/?itineraryId=${dataToSet.id}`, { shallow: true });
          }
        } else {
          console.warn(`No data found for itineraryId: ${idToLoad}. Clearing lastActive if it matches.`);
          if (localStorage.getItem('lastActiveItineraryId') === idToLoad) {
            localStorage.removeItem('lastActiveItineraryId');
          }
          setCurrentItineraryId(null);
          setTripData(null);
          if (itineraryIdFromUrl) router.replace('/', { shallow: true });
        }
      } catch (error) {
        console.error("Failed to load data from localStorage:", error);
        setCurrentItineraryId(null);
        setTripData(null);
        if (itineraryIdFromUrl) router.replace('/', { shallow: true });
      }
    } else {
      setTripData(null);
      setCurrentItineraryId(null);
    }
    setIsInitialized(true);
  }, [searchParams, router]);


  const handleStartPlanning = React.useCallback((settings: TripSettings, pax: PaxDetails, itineraryNameInput?: string, clientNameInput?: string) => {
    const newId = generateItineraryId();
    const now = new Date().toISOString();

    const newTravelers = [];
    for (let i = 1; i <= pax.adults; i++) {
      newTravelers.push({ id: `A${generateGUID()}`, label: `Adult ${i}`, type: 'adult' as const });
    }
    for (let i = 1; i <= pax.children; i++) {
      newTravelers.push({ id: `C${generateGUID()}`, label: `Child ${i}`, type: 'child' as const });
    }

    const initialDaysData: { [dayNumber: number]: { items: [] } } = {};
    for (let i = 1; i <= settings.numDays; i++) {
      initialDaysData[i] = { items: [] };
    }

    const newTripData: TripData = {
      id: newId,
      itineraryName: itineraryNameInput || `Itinerary ${newId.split('-').pop()}`,
      clientName: clientNameInput || undefined,
      settings: {
        ...settings,
        selectedProvinces: settings.selectedProvinces || [],
      },
      pax,
      travelers: newTravelers,
      days: initialDaysData,
      createdAt: now,
      updatedAt: now,
    };
    setCurrentItineraryId(newId); // Set currentItineraryId first or together
    setTripData(newTripData);
    router.replace(`/?itineraryId=${newId}`, { shallow: true });
  }, [router]);

  const handleUpdateTripData = React.useCallback((updatedTripDataFromPlanner: Partial<TripData>) => {
    setTripData(prevTripData => {
      if (!prevTripData && !currentItineraryId) { // Should not happen if planner is visible
          console.error("Attempted to update trip data without a current itinerary.");
          return null;
      }
      // Ensure the ID from currentItineraryId is preserved if not in updatedTripDataFromPlanner
      // And ensure other core fields from prevTripData are preserved if not in updatedTripDataFromPlanner
      const baseData = prevTripData || { id: currentItineraryId! } as TripData;

      const newDays = { ...(baseData.days || {}), ...(updatedTripDataFromPlanner.days || {}) };
      const newSettings = { ...(baseData.settings || {}), ...(updatedTripDataFromPlanner.settings || {}) };
      
      newSettings.selectedProvinces = updatedTripDataFromPlanner.settings?.selectedProvinces || baseData.settings?.selectedProvinces || [];

      const dataToSave: TripData = {
        ...baseData,
        ...updatedTripDataFromPlanner,
        id: baseData.id || currentItineraryId!, // Prioritize existing ID
        days: newDays,
        settings: newSettings,
        updatedAt: new Date().toISOString(), // Always update timestamp
      };
      return dataToSave;
    });
  }, [currentItineraryId]);


  React.useEffect(() => {
    if (debouncedSaveTimeoutRef.current) {
      clearTimeout(debouncedSaveTimeoutRef.current);
    }

    if (tripData && currentItineraryId && isInitialized && tripData.id === currentItineraryId) {
      debouncedSaveTimeoutRef.current = setTimeout(() => {
        try {
          const dataToSave: TripData = {
            ...tripData,
            updatedAt: new Date().toISOString(), // Ensure updatedAt is fresh
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

          if (existingEntryIndex > -1) {
            index[existingEntryIndex] = newEntry;
          } else {
            index.push(newEntry);
          }
          localStorage.setItem(ITINERARY_INDEX_KEY, JSON.stringify(index));
          localStorage.setItem('lastActiveItineraryId', currentItineraryId);

        } catch (e) {
          console.error("Error during debounced save:", e);
        }
      }, 1000); // 1-second debounce
    }
    return () => {
      if (debouncedSaveTimeoutRef.current) {
        clearTimeout(debouncedSaveTimeoutRef.current);
      }
    };
  }, [tripData, currentItineraryId, isInitialized]);

  const handleStartNewItinerary = React.useCallback(() => {
    // Current itinerary is auto-saved. Just clear state for new setup.
    setCurrentItineraryId(null);
    setTripData(null);
    localStorage.removeItem('lastActiveItineraryId');
    router.replace('/', { shallow: true });
  }, [router]);

  if (!isInitialized) {
    return <div className="flex justify-center items-center min-h-screen bg-background"><p>Loading Itinerary Ace...</p></div>;
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex gap-2">
        <Link href="/image-describer">
          <Button variant="outline" size="sm" className="bg-card hover:bg-muted shadow-md">
            <ImageIconLucide className="mr-2 h-4 w-4" />
            Describe Image
          </Button>
        </Link>
        <Link href="/admin">
          <Button variant="outline" size="sm" className="bg-card hover:bg-muted shadow-md">
            <Cog className="mr-2 h-4 w-4" />
            Admin
          </Button>
        </Link>
      </div>

      {tripData && currentItineraryId && tripData.id === currentItineraryId ? (
        <ItineraryPlanner 
          tripData={tripData} 
          onReset={handleStartNewItinerary} 
          onUpdateTripData={handleUpdateTripData} 
        />
      ) : (
        <SetupForm onStartPlanning={handleStartPlanning} />
      )}
    </div>
  );
}
