
"use client";

import * as React from 'react';
import type { ItineraryItem, Traveler, CurrencyCode, TripSettings, HotelDefinition } from '@/types/itinerary'; // Added HotelDefinition
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Hotel, Utensils, Car, Ticket, ShoppingBag, AlertTriangle } from 'lucide-react';
import { TransferItemForm } from './items/transfer-item-form';
import { ActivityItemForm } from './items/activity-item-form';
// HotelItemForm is currently incompatible with the new HotelDefinition structure.
// It will be updated in Phase 2. For now, we'll show a placeholder.
// import { HotelItemForm } from './items/hotel-item-form'; 
import { MealItemForm } from './items/meal-item-form';
import { MiscItemForm } from './items/misc-item-form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


interface DayViewProps {
  dayNumber: number;
  items: ItineraryItem[];
  travelers: Traveler[];
  currency: CurrencyCode;
  tripSettings: TripSettings;
  onAddItem: (day: number, itemType: ItineraryItem['type']) => void;
  onUpdateItem: (day: number, updatedItem: ItineraryItem) => void;
  onDeleteItem: (day: number, itemId: string) => void;
  allHotelDefinitions: HotelDefinition[]; // Added for future use by HotelItemForm
}

const ITEM_CONFIG = {
  transfer: { label: "Transfers", icon: Car, component: TransferItemForm },
  activity: { label: "Activities", icon: Ticket, component: ActivityItemForm },
  // hotel: { label: "Hotels", icon: Hotel, component: HotelItemForm }, // Disabled for Phase 1
  meal: { label: "Meals", icon: Utensils, component: MealItemForm },
  misc: { label: "Miscellaneous", icon: ShoppingBag, component: MiscItemForm },
};

// Create a separate config for hotel to handle its unique state in Phase 1
const HOTEL_ITEM_CONFIG_PHASE1 = {
  type: 'hotel' as 'hotel', // type assertion
  label: "Hotels",
  icon: Hotel,
};


export function DayView({ 
  dayNumber, items, travelers, currency, tripSettings, 
  onAddItem, onUpdateItem, onDeleteItem, allHotelDefinitions 
}: DayViewProps) {
  
  const renderItemForm = (item: ItineraryItem) => {
    if (item.type === 'hotel') {
      // Placeholder for Hotel items in Phase 1, as the form is not ready
      return (
        <Card key={item.id} className="mb-4 shadow-sm border border-amber-500/50 bg-amber-50/30">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center text-amber-700">
              <AlertTriangle className="mr-2 h-5 w-5" />
              <p className="font-semibold">Hotel Item: {item.name}</p>
            </div>
            <p className="text-xs text-amber-600">
              The form for managing detailed hotel room types and new seasonal pricing is under development (Phase 2).
              Currently, hotel cost calculations use the new data structure if hotel items are correctly pre-populated.
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => onDeleteItem(dayNumber, item.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Hotel Shell
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    const ConfigComponent = ITEM_CONFIG[item.type as keyof typeof ITEM_CONFIG]?.component;
    if (!ConfigComponent) return null;
    
    const specificItem = item as any; 

    return (
      <ConfigComponent
        key={item.id}
        item={specificItem}
        travelers={travelers}
        currency={currency}
        dayNumber={dayNumber}
        tripSettings={tripSettings}
        onUpdate={(updatedItem) => onUpdateItem(dayNumber, updatedItem)}
        onDelete={() => onDeleteItem(dayNumber, item.id)}
        // allHotelDefinitions={allHotelDefinitions} // Pass if needed by specific forms
      />
    );
  };

  return (
    <Card className="mb-6 shadow-md border-primary/20 max-w-4xl mx-auto">
      <CardHeader className="pb-2 pt-4 px-4 md:px-6">
      </CardHeader>
      <CardContent className="px-2 py-2 md:px-4 md:py-4">
        <Accordion type="multiple" defaultValue={[...Object.keys(ITEM_CONFIG), HOTEL_ITEM_CONFIG_PHASE1.type]} className="w-full">
          {/* Render non-hotel items */}
          {Object.entries(ITEM_CONFIG).map(([type, config]) => {
            const categoryItems = items.filter(item => item.type === type);
            const IconComponent = config.icon;
            return (
              <AccordionItem value={type} key={type} className="border-b-0 mb-2 rounded-lg overflow-hidden bg-card shadow-sm data-[state=open]:border data-[state=open]:border-primary/30">
                <AccordionTrigger className="px-4 py-3 text-lg font-semibold hover:bg-primary/5 hover:no-underline data-[state=open]:bg-primary/10 data-[state=open]:text-primary">
                  <div className="flex items-center">
                    <IconComponent className="mr-3 h-6 w-6 text-primary/80 data-[state=open]:text-primary" />
                    {config.label} ({categoryItems.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 border-t border-primary/20 bg-background/50">
                  <div className="space-y-4">
                    {categoryItems.map(item => renderItemForm(item))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4 border-primary text-primary hover:bg-primary/10"
                    onClick={() => onAddItem(dayNumber, type as ItineraryItem['type'])}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add {config.label.slice(0, -1)}
                  </Button>
                </AccordionContent>
              </AccordionItem>
            );
          })}
          
          {/* Render Hotel items separately for Phase 1 placeholder */}
           <AccordionItem value={HOTEL_ITEM_CONFIG_PHASE1.type} key={HOTEL_ITEM_CONFIG_PHASE1.type} className="border-b-0 mb-2 rounded-lg overflow-hidden bg-card shadow-sm data-[state=open]:border data-[state=open]:border-primary/30">
            <AccordionTrigger className="px-4 py-3 text-lg font-semibold hover:bg-primary/5 hover:no-underline data-[state=open]:bg-primary/10 data-[state=open]:text-primary">
              <div className="flex items-center">
                <HOTEL_ITEM_CONFIG_PHASE1.icon className="mr-3 h-6 w-6 text-primary/80 data-[state=open]:text-primary" />
                {HOTEL_ITEM_CONFIG_PHASE1.label} ({items.filter(it => it.type === 'hotel').length})
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-4 border-t border-primary/20 bg-background/50">
              <div className="space-y-4">
                {items.filter(it => it.type === 'hotel').map(item => renderItemForm(item))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 border-primary text-primary hover:bg-primary/10"
                onClick={() => onAddItem(dayNumber, HOTEL_ITEM_CONFIG_PHASE1.type)}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add {HOTEL_ITEM_CONFIG_PHASE1.label.slice(0, -1)} (Shell)
              </Button>
               <p className="text-xs text-amber-700 mt-2">Note: Adding hotels via UI is limited in Phase 1. Full hotel management form will be available in Phase 2.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
