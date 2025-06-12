
"use client";

import * as React from 'react';
import type { ItineraryItem, Traveler, CurrencyCode, TripSettings, HotelDefinition, ServicePriceItem } from '@/types/itinerary'; // Added HotelDefinition, ServicePriceItem
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Hotel, Utensils, Car, Ticket, ShoppingBag, AlertTriangle } from 'lucide-react';
import { TransferItemForm } from './items/transfer-item-form';
import { ActivityItemForm } from './items/activity-item-form';
import { HotelItemForm } from './items/hotel-item-form'; 
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
  allHotelDefinitions: HotelDefinition[]; 
  allServicePrices: ServicePriceItem[]; 
}

const ITEM_CONFIG = {
  transfer: { label: "Transfers", icon: Car, component: TransferItemForm },
  activity: { label: "Activities", icon: Ticket, component: ActivityItemForm },
  hotel: { label: "Hotels", icon: Hotel, component: HotelItemForm }, 
  meal: { label: "Meals", icon: Utensils, component: MealItemForm },
  misc: { label: "Miscellaneous", icon: ShoppingBag, component: MiscItemForm },
};


export function DayView({ 
  dayNumber, items, travelers, currency, tripSettings, 
  onAddItem, onUpdateItem, onDeleteItem, allHotelDefinitions, allServicePrices
}: DayViewProps) {
  
  const renderItemForm = (item: ItineraryItem) => {
    const ConfigComponent = ITEM_CONFIG[item.type as keyof typeof ITEM_CONFIG]?.component;
    if (!ConfigComponent) return null;
    
    const specificItem = item as any; 

    const commonProps = {
      key: item.id,
      item: specificItem,
      travelers: travelers,
      currency: currency,
      dayNumber: dayNumber,
      tripSettings: tripSettings,
      onUpdate: (updatedItem: ItineraryItem) => onUpdateItem(dayNumber, updatedItem),
      onDelete: () => onDeleteItem(dayNumber, item.id),
    };

    if (item.type === 'hotel') {
      return (
        <HotelItemForm
          {...commonProps}
          allHotelDefinitions={allHotelDefinitions} 
        />
      );
    }
    
    return <ConfigComponent {...commonProps} allServicePrices={allServicePrices} />;
  };

  return (
    <Card className="mb-6 shadow-md border-primary/20">
      <CardHeader className="pb-2 pt-4 px-4 md:px-6">
      </CardHeader>
      <CardContent className="px-2 py-2 md:px-4 md:py-4">
        <Accordion type="multiple" defaultValue={Object.keys(ITEM_CONFIG)} className="w-full">
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
        </Accordion>
      </CardContent>
    </Card>
  );
}

    
