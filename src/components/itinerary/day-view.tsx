
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
          return `Ticket: ${formatCurrency(transfer.adultTicketPrice || 0, currency)}`;
        } else {
          return `Vehicle: ${transfer.vehicleType || 'N/A'}, Cost: ${formatCurrency(transfer.costPerVehicle || 0, currency)}`;
        }
      case 'hotel':
        const hotel = item as HotelItem;
        const nights = Math.max(0, (hotel.checkoutDay || (dayNumber + 1)) - dayNumber);
        return `${nights} night(s)${hotel.selectedRooms && hotel.selectedRooms.length > 0 ? `, ${hotel.selectedRooms.length} room block(s)` : ''}`;
      case 'activity':
        const activity = item as ActivityItem;
        const duration = Math.max(1, (activity.endDay || dayNumber) - dayNumber + 1);
        return `Price: ${formatCurrency(activity.adultPrice || 0, currency)}${duration > 1 ? `, ${duration} days` : ''}`;
      case 'meal':
        const meal = item as MealItem;
        return `Price: ${formatCurrency(meal.adultMealPrice || 0, currency)}, ${meal.totalMeals} meal(s)`;
      case 'misc':
        const misc = item as MiscItem;
        return `Cost: ${formatCurrency(misc.unitCost || 0, currency)} x ${misc.quantity}`;
      default:
        return null;
    }
  };


  const renderItemForm = (item: ItineraryItem) => {
    const itemKey = item.id;
    const specificItem = item as any;

    const propsToSpread = {
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
        return <TransferItemForm key={itemKey} {...propsToSpread} />;
      case 'activity':
        return <ActivityItemForm key={itemKey} {...propsToSpread} />;
      case 'hotel':
        return <HotelItemForm key={itemKey} {...propsToSpread} allHotelDefinitions={allHotelDefinitions} />;
      case 'meal':
        return <MealItemForm key={itemKey} {...propsToSpread} />;
      case 'misc':
        return <MiscItemForm key={itemKey} {...propsToSpread} />;
      default:
        return null;
    }
  };

  return (
    <Card className="mb-6 shadow-md border-primary/20 w-full">
      <CardContent className="px-2 py-2 md:px-4 md:py-4">
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
          <h3 className="text-sm font-semibold mb-2 text-center text-primary uppercase tracking-wider">Add Service to Day {dayNumber}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            {SERVICE_TYPES_CONFIG.map(serviceConfig => {
              const IconComponent = serviceConfig.icon;
              return (
                <Button
                  key={serviceConfig.type}
                  variant="outline"
                  className="flex-col h-auto py-3 sm:py-4 border-dashed hover:border-solid hover:bg-primary/5 hover:text-primary group transition-all duration-150 ease-in-out"
                  onClick={() => onAddItem(dayNumber, serviceConfig.type)}
                >
                  <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 mb-1 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs sm:text-sm">{serviceConfig.label}</span>
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
