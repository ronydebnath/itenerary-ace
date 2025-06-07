
"use client";

import * as React from 'react';
import { SetupForm } from '@/components/itinerary/setup-form';
import { ItineraryPlanner } from '@/components/itinerary/itinerary-planner';
import type { TripSettings, PaxDetails, TripData } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

const LOCAL_STORAGE_KEY = 'itineraryAceData';

export default function HomePage() {
  const [tripData, setTripData] = React.useState<TripData | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData) as TripData;
        // Basic validation
        if (parsedData && parsedData.settings && parsedData.pax && parsedData.days) {
           setTripData(parsedData);
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
        }
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially corrupted data
    }
    setIsInitialized(true);
  }, []);

  const handleStartPlanning = (settings: TripSettings, pax: PaxDetails) => {
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
  };

  const handleReset = () => {
    setTripData(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove data from localStorage:", error);
    }
  };

  const handleUpdateTripData = (updatedTripData: TripData) => {
    setTripData(updatedTripData);
     try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTripData));
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
    }
  };

  if (!isInitialized) {
    // Optional: Show a loading spinner or placeholder
    return <div className="flex justify-center items-center min-h-screen"><p>Loading Itinerary Ace...</p></div>;
  }

  return (
    <main className="min-h-screen bg-background">
      {tripData ? (
        <ItineraryPlanner initialTripData={tripData} onReset={handleReset} onUpdateTripData={handleUpdateTripData} />
      ) : (
        <SetupForm onStartPlanning={handleStartPlanning} />
      )}
    </main>
  );
}
