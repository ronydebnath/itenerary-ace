/**
 * @fileoverview This component renders the view for a single day in the itinerary.
 * It displays all the itinerary items (transfers, activities, hotels, etc.) planned
 * for that specific day and provides controls to add new items or modify existing ones.
 * It utilizes various specific item form components to handle the details of each service type.
 *
 * @bangla এই কম্পোনেন্টটি ভ্রমণপথের একটি নির্দিষ্ট দিনের ভিউ রেন্ডার করে।
 * এটি সেই নির্দিষ্ট দিনের জন্য পরিকল্পিত সমস্ত ভ্রমণপথের আইটেমগুলি (ট্রান্সফার, কার্যকলাপ,
 * হোটেল ইত্যাদি) প্রদর্শন করে এবং নতুন আইটেম যুক্ত করতে বা বিদ্যমান আইটেমগুলি সংশোধন
 * করার জন্য নিয়ন্ত্রণ সরবরাহ করে। এটি প্রতিটি পরিষেবা প্রকারের বিবরণ পরিচালনা করার
 * জন্য বিভিন্ন নির্দিষ্ট আইটেম ফর্ম কম্পোনেন্ট ব্যবহার করে।
 */
"use client";

import * as React from 'react';
import type { ItineraryItem, Traveler, CurrencyCode, TripSettings, HotelDefinition, ServicePriceItem, TransferItem, HotelItem, ActivityItem, MealItem, MiscItem } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Hotel, Utensils, Car, Ticket, ShoppingBag, PackagePlus } from 'lucide-react';
import { TransferItemForm } from './items/transfer-item-form';
import { ActivityItemForm } from './items/activity-item-form';
import { HotelItemForm } from './items/hotel-item-form';
import { MealItemForm } from './items/meal-item-form';
import { MiscItemForm } from './items/misc-item-form';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { addDays, format, parseISO } from 'date-fns';

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

const SERVICE_TYPES_CONFIG: Array<{ type: ItineraryItem['type'], label: string, icon: React.ElementType }> = [
  { type: 'transfer', label: "Transfer", icon: Car },
  { type: 'hotel', label: "Hotel", icon: Hotel },
  { type: 'activity', label: "Activity", icon: Ticket },
  { type: 'meal', label: "Meal", icon: Utensils },
  { type: 'misc', label: "Miscellaneous", icon: ShoppingBag },
];

function DayViewComponent({
  dayNumber, items, travelers, currency, tripSettings,
  onAddItem, onUpdateItem, onDeleteItem, allHotelDefinitions, allServicePrices
}: DayViewProps) {

  const [expandedItemId, setExpandedItemId] = React.useState<string | null>(null);
  const prevItemsRef = React.useRef<ItineraryItem[]>(items);

  React.useEffect(() => {
    if (items.length > prevItemsRef.current.length) {
      const newItem = items.find(item => !prevItemsRef.current.some(prevItem => prevItem.id === item.id));
      if (newItem) {
        setExpandedItemId(newItem.id);
      }
    }
    prevItemsRef.current = items;
  }, [items]);

  const handleToggleExpand = (itemId: string) => {
    setExpandedItemId(prevId => (prevId === itemId ? null : itemId));
  };

  const getItemSummaryLine = (item: ItineraryItem): React.ReactNode => {
    switch (item.type) {
      case 'transfer':
        const transfer = item as TransferItem;
        if (transfer.mode === 'ticket') {
          return `Ticket Based`;
        } else {
          return `Vehicle: ${transfer.vehicleType || 'N/A'}`;
        }
      case 'hotel':
        const hotel = item as HotelItem;
        const nights = Math.max(0, (hotel.checkoutDay || (dayNumber + 1)) - dayNumber);
        return `${nights} night(s)${hotel.selectedRooms && hotel.selectedRooms.length > 0 ? `, ${hotel.selectedRooms.length} room block(s)` : ''}`;
      case 'activity':
        const activity = item as ActivityItem;
        const duration = Math.max(1, (activity.endDay || dayNumber) - dayNumber + 1);
        return `Activity for ${duration > 1 ? `${duration} days` : 'the day'}`;
      case 'meal':
        const meal = item as MealItem;
        return `${meal.totalMeals} meal(s) planned`;
      case 'misc':
        const misc = item as MiscItem;
        return `${misc.quantity} unit(s), assignment: ${misc.costAssignment}`;
      default:
        return null;
    }
  };


  const renderItemForm = (item: ItineraryItem) => {
    const itemKey = item.id;
    const specificItem = item as any;

    const commonProps = {
      item: specificItem,
      travelers: travelers,
      currency: currency,
      dayNumber: dayNumber,
      tripSettings: tripSettings,
      onUpdate: (updatedItem: ItineraryItem) => onUpdateItem(dayNumber, updatedItem),
      onDelete: () => onDeleteItem(dayNumber, item.id),
      allServicePrices: allServicePrices,
      itemSummaryLine: getItemSummaryLine(item),
      isCurrentlyExpanded: item.id === expandedItemId,
      onToggleExpand: () => handleToggleExpand(item.id),
    };

    switch (item.type) {
      case 'transfer':
        return <TransferItemForm key={itemKey} {...commonProps} />;
      case 'activity':
        return <ActivityItemForm key={itemKey} {...commonProps} />;
      case 'hotel':
        return <HotelItemForm key={itemKey} {...commonProps} allHotelDefinitions={allHotelDefinitions} />;
      case 'meal':
        return <MealItemForm key={itemKey} {...commonProps} />;
      case 'misc':
        return <MiscItemForm key={itemKey} {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <Card className="mb-6 shadow-md border-primary/20 w-full">
      <CardContent className="px-1 sm:px-2 md:px-4 py-2 md:py-4">
        <div className="space-y-4">
          {items.length > 0 ? (
            items.map(item => renderItemForm(item))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <PackagePlus className="mx-auto h-12 w-12 mb-2 text-gray-400" />
              <p>No services planned for this day.</p>
              <p className="text-sm">Add services using the buttons below.</p>
            </div>
          )}
        </div>

        <Separator className="my-4 md:my-6" />

        <div>
          <h3 className="text-base font-semibold mb-2 text-center text-primary uppercase tracking-wider">Add Service to Day {dayNumber}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            {SERVICE_TYPES_CONFIG.map(serviceConfig => {
              const IconComponent = serviceConfig.icon;
              return (
                <Button
                  key={serviceConfig.type}
                  variant="outline"
                  className="flex-col h-auto px-2 py-3 sm:px-3 sm:py-4 border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary group transition-all duration-150 ease-in-out"
                  onClick={() => onAddItem(dayNumber, serviceConfig.type)}
                >
                  <IconComponent className="h-6 w-6 sm:h-5 sm:w-5 mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs sm:text-sm font-medium">{serviceConfig.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export const DayView = React.memo(DayViewComponent);

