
/**
 * @fileoverview This file defines the main page for the Itinerary Planner.
 * It utilizes the `useItineraryManager` hook to manage the state and logic
 * of the itinerary. Depending on the page status (loading or planner), it either
 * shows a loading indicator or renders the `ItineraryPlanner` component.
 *
 * @bangla এই ফাইলটি ইটিনেরারি প্ল্যানারের প্রধান পৃষ্ঠা নির্ধারণ করে।
 * এটি ইটিনেরারির অবস্থা এবং যুক্তি পরিচালনা করার জন্য `useItineraryManager` হুক ব্যবহার করে।
 * পৃষ্ঠার অবস্থার (লোডিং বা প্ল্যানার) উপর নির্ভর করে, এটি হয় একটি লোডিং সূচক দেখায়
 * অথবা `ItineraryPlanner` কম্পোনেন্ট রেন্ডার করে।
 */
"use client";

import React from 'react';
import { ItineraryPlanner } from '@/components/itinerary/itinerary-planner';
import { useItineraryManager, PageStatus } from '@/hooks/useItineraryManager';
import { Loader2 } from 'lucide-react';

export default function PlannerPage() {
  const {
    tripData,
    pageStatus,
    currentQuotationRequest, // Get the quotation request details
    handleStartNewItinerary,
    handleUpdateTripData,
    handleUpdateSettings,
    handleUpdatePax,
    handleManualSave,
    handleSendQuotationToAgent,
  } = useItineraryManager();

  if (pageStatus === 'loading' || !tripData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4" />
        <p className="text-md sm:text-lg text-muted-foreground">Loading Itinerary Ace Planner...</p>
        <p className="text-sm text-muted-foreground mt-1">Initializing your workspace.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {pageStatus === 'planner' && tripData && (
        <ItineraryPlanner
          tripData={tripData}
          onReset={handleStartNewItinerary}
          onUpdateTripData={handleUpdateTripData}
          onUpdateSettings={handleUpdateSettings}
          onUpdatePax={handleUpdatePax}
          onManualSave={handleManualSave}
          quotationRequestDetails={currentQuotationRequest} // Pass it to the planner
        />
      )}
    </div>
  );
}

