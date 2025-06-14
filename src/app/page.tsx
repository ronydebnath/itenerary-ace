
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SetupForm } from '@/components/itinerary/setup-form';
import { ItineraryPlanner } from '@/components/itinerary/itinerary-planner';
import type { TripSettings, PaxDetails, TripData } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { Cog, Image as ImageIconLucide } from 'lucide-react'; // Added ImageIconLucide

const LOCAL_STORAGE_KEY = 'itineraryAceData';

export default function HomePage() {
  const [tripData, setTripData] = React.useState<TripData | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData) as TripData;
        if (parsedData && parsedData.settings && parsedData.pax && parsedData.days) {
           if (parsedData.settings.startDate && typeof parsedData.settings.startDate === 'string' && parsedData.settings.startDate.trim() !== '') {
             setTripData(parsedData);
           } else {
             console.warn("Loaded trip data has invalid or missing startDate. Clearing data to re-initialize.");
             localStorage.removeItem(LOCAL_STORAGE_KEY); 
             setTripData(null); 
           }
        } else {
          console.warn("Loaded trip data is structurally invalid. Clearing data.");
          localStorage.removeItem(LOCAL_STORAGE_KEY); 
          setTripData(null);
        }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY); 
      setTripData(null);
    }
    setIsInitialized(true);
  }, []);

  const handleStartPlanning = React.useCallback((settings: TripSettings, pax: PaxDetails) => {
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
      settings,
      pax,
      travelers: newTravelers,
      days: initialDaysData,
    };
    setTripData(newTripData);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTripData));
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
    }
  }, []);

  const handleReset = React.useCallback(() => {
    setTripData(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove data from localStorage:", error);
    }
  }, []);

  const handleUpdateTripData = React.useCallback((updatedTripData: TripData) => {
    setTripData(updatedTripData);
     try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTripData));
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
    }
  }, []);

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
            Admin Settings
          </Button>
        </Link>
      </div>
      
      {tripData ? (
        <ItineraryPlanner tripData={tripData} onReset={handleReset} onUpdateTripData={handleUpdateTripData} />
      ) : (
        <SetupForm onStartPlanning={handleStartPlanning} />
      )}
    </div>
  );
}
