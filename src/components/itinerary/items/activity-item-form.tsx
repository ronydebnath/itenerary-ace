
"use client";

import * as React from 'react';
import type { ActivityItem as ActivityItemType, Traveler, CurrencyCode, TripSettings } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ActivityItemFormProps {
  item: ActivityItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  dayNumber: number;
  tripSettings: TripSettings;
  onUpdate: (item: ActivityItemType) => void;
  onDelete: () => void;
}

export function ActivityItemForm({ item, travelers, currency, dayNumber, tripSettings, onUpdate, onDelete }: ActivityItemFormProps) {
  const handleNumericInputChange = (field: keyof ActivityItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onUpdate({ ...item, [field]: numValue });
  };

  const handleEndDayChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    if (numValue !== undefined && (numValue < dayNumber || numValue > tripSettings.numDays)) {
      // Invalid input, perhaps show an error or clamp value. For now, allow update and let validation handle.
    }
    onUpdate({ ...item, endDay: numValue });
  };
  
  const calculatedEndDay = item.endDay || dayNumber;
  const duration = Math.max(1, calculatedEndDay - dayNumber + 1);


  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Activity">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <FormField label={`Adult Price (${currency})`} id={`adultPrice-${item.id}`}>
          <Input
            type="number"
            id={`adultPrice-${item.id}`}
            value={item.adultPrice ?? ''}
            onChange={(e) => handleNumericInputChange('adultPrice', e.target.value)}
            min="0"
            placeholder="0.00"
          />
        </FormField>
        <FormField label={`Child Price (${currency}) (Optional)`} id={`childPrice-${item.id}`}>
          <Input
            type="number"
            id={`childPrice-${item.id}`}
            value={item.childPrice ?? ''}
            onChange={(e) => handleNumericInputChange('childPrice', e.target.value)}
            min="0"
            placeholder="Defaults to adult price"
          />
        </FormField>
        <FormField label="End Day (Optional)" id={`endDay-${item.id}`}>
          <Input
            type="number"
            id={`endDay-${item.id}`}
            value={item.endDay ?? ''}
            onChange={(e) => handleEndDayChange(e.target.value)}
            min={dayNumber}
            max={tripSettings.numDays}
            placeholder={`Day ${dayNumber}`}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 mt-2 p-3 bg-muted/30 rounded-md border">
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Starts:</Label>
            <p className="font-code text-sm">Day {dayNumber}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Ends:</Label>
            <p className="font-code text-sm">Day {calculatedEndDay}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Duration:</Label>
            <p className="font-code text-sm">{duration} day(s)</p>
          </div>
      </div>
      <p className="text-xs text-muted-foreground pt-2 text-center">Price is fixed for the activity, regardless of selected duration.</p>
    </BaseItemForm>
  );
}
