
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

type PageStatus = 'loading' | 'setup' | 'planner';

export default function PlannerPage() {
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
    
    if (idToLoad !== currentItineraryId || (idToLoad && !currentItineraryId) || (!idToLoad && pageStatus !== 'setup')) {
        setPageStatus('loading');
        if (idToLoad !== currentItineraryId) {
             setTripData(null);
        }
    }

    if (idToLoad) {
      try {
        const savedData = localStorage.getItem(`${ITINERARY_DATA_PREFIX}${idToLoad}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData) as Partial<TripData>;
          const dataToSet: TripData = {
            id: parsedData.id || idToLoad, // Ensure ID is set
            itineraryName: parsedData.itineraryName || `Itinerary ${idToLoad.slice(-6)}`,
            clientName: parsedData.clientName || undefined,
            createdAt: parsedData.createdAt || new Date().toISOString(),
            updatedAt: parsedData.updatedAt || new Date().toISOString(),
            settings: parsedData.settings || { numDays: 1, startDate: new Date().toISOString().split('T')[0], selectedProvinces: [] },
            pax: parsedData.pax || { adults: 1, children: 0, currency: 'USD' },
            travelers: parsedData.travelers && parsedData.travelers.length > 0 ? parsedData.travelers : [{ id: generateGUID(), label: 'Adult 1', type: 'adult' as const }],
            days: parsedData.days || { 1: { items: [] } },
          };
          dataToSet.settings.selectedProvinces = dataToSet.settings.selectedProvinces || [];

          setTripData(dataToSet);
          setCurrentItineraryId(dataToSet.id);
          setPageStatus('planner');
          localStorage.setItem('lastActiveItineraryId', dataToSet.id);

          if (itineraryIdFromUrl !== dataToSet.id) {
            router.replace(`/planner?itineraryId=${dataToSet.id}`, { shallow: true });
          }
        } else {
          console.warn(`No data found for itineraryId: ${idToLoad}. Clearing lastActive if it matches.`);
          if (localStorage.getItem('lastActiveItineraryId') === idToLoad) {
            localStorage.removeItem('lastActiveItineraryId');
          }
          setCurrentItineraryId(null);
          setTripData(null);
          setPageStatus('setup');
          if (itineraryIdFromUrl) router.replace('/planner', { shallow: true }); 
        }
      } catch (error) {
        console.error("Failed to load data from localStorage:", error);
        setCurrentItineraryId(null);
        setTripData(null);
        setPageStatus('setup');
        if (itineraryIdFromUrl) router.replace('/planner', { shallow: true });
      }
    } else {
      if (pageStatus !== 'setup') {
        setCurrentItineraryId(null);
        setTripData(null);
        setPageStatus('setup');
      }
    }
  }, [searchParams, router, currentItineraryId, pageStatus, tripData]);


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
    setTripData(newTripData);
    setCurrentItineraryId(newId);
    setPageStatus('planner'); 
    router.replace(`/planner?itineraryId=${newId}`, { shallow: true });
    localStorage.setItem('lastActiveItineraryId', newId);

  }, [router]);

  const handleUpdateTripData = React.useCallback((updatedTripDataFromPlanner: Partial<TripData>) => {
    setTripData(prevTripData => {
      if (!prevTripData && !currentItineraryId) {
          console.error("Attempted to update trip data without a current itinerary.");
          return null;
      }
      const baseData = prevTripData || { id: currentItineraryId! } as TripData;
      const dataToSet: TripData = {
        ...baseData,
        ...updatedTripDataFromPlanner,
        id: baseData.id || currentItineraryId!, 
      };
      return dataToSet;
    });
  }, [currentItineraryId]);

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
    } catch (e) {
      console.error("Error during manual save:", e);
      toast({ title: "Error", description: "Could not save itinerary.", variant: "destructive" });
    }
  }, [tripData, currentItineraryId, toast]);

  const handleStartNewItinerary = React.useCallback(() => {
    setCurrentItineraryId(null); 
    setTripData(null);
    localStorage.removeItem('lastActiveItineraryId');
    router.replace('/planner', { shallow: true }); 
  }, [router]);

  if (pageStatus === 'loading') {
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
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-card hover:bg-muted shadow-md">
            <Cog className="mr-2 h-4 w-4" />
            Admin Dashboard
          </Button>
        </Link>
      </div>

      {pageStatus === 'planner' && tripData && currentItineraryId ? (
        <ItineraryPlanner
          tripData={tripData}
          onReset={handleStartNewItinerary}
          onUpdateTripData={handleUpdateTripData}
          onManualSave={handleManualSave}
        />
      ) : (
        <SetupForm onStartPlanning={handleStartPlanning} />
      )}
    </div>
  );
}
