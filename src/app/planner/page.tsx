
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
      {/* Utility buttons moved to PlannerHeader component */}
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

    