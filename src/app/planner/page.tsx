
"use client";

import React from 'react';
import { ItineraryPlanner } from '@/components/itinerary/itinerary-planner';
import { useItineraryManager, PageStatus } from '@/hooks/useItineraryManager';
import { Cog, Image as ImageIconLucide, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PlannerPage() {
  const {
    tripData,
    pageStatus,
    handleStartNewItinerary,
    handleUpdateTripData,
    handleUpdateSettings,
    handleUpdatePax,
    handleManualSave,
  } = useItineraryManager();

  if (pageStatus === 'loading' || !tripData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Itinerary Ace Planner...</p>
        <p className="text-sm text-muted-foreground mt-1">Initializing your workspace.</p>
      </div>
    );
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

      {pageStatus === 'planner' && tripData && (
        <ItineraryPlanner
          tripData={tripData}
          onReset={handleStartNewItinerary}
          onUpdateTripData={handleUpdateTripData}
          onUpdateSettings={handleUpdateSettings}
          onUpdatePax={handleUpdatePax}
          onManualSave={handleManualSave}
        />
      )}
    </div>
  );
}

    