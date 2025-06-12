
"use client";

import React from 'react';
import { SetupForm } from '@/components/itinerary/setup-form';
import { ItineraryPlanner } from '@/components/itinerary/itinerary-planner';
import { useItineraryManager, PageStatus } from '@/hooks/useItineraryManager';
import { Cog, Image as ImageIconLucide } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PlannerPage() {
  const {
    tripData,
    currentItineraryId,
    pageStatus,
    handleStartPlanning,
    handleUpdateTripData,
    handleManualSave,
    handleStartNewItinerary,
  } = useItineraryManager();

  if (pageStatus === 'loading') {
    return <div className="flex justify-center items-center min-h-screen bg-background"><p>Loading Itinerary Ace...</p></div>;
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex gap-2 no-print">
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
