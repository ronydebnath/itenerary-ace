
"use client";

import * as React from 'react';
import type { HotelItem as HotelItemType, HotelRoomConfiguration, Traveler, CurrencyCode, TripSettings } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle } from 'lucide-react';
import { HotelRoomCardForm } from './hotel-room-card-form';
import { generateGUID } from '@/lib/utils';

interface HotelItemFormProps {
  item: HotelItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  dayNumber: number;
  tripSettings: TripSettings;
  onUpdate: (item: HotelItemType) => void;
  onDelete: () => void;
}

export function HotelItemForm({ item, travelers, currency, dayNumber, tripSettings, onUpdate, onDelete }: HotelItemFormProps) {
  const handleNumericInputChange = (field: keyof HotelItemType, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    if (field === 'checkoutDay' && numValue !== undefined) {
      if (numValue <= dayNumber || numValue > tripSettings.numDays) {
        // Invalid checkout day, could show error or clamp.
        // For now, allow update and let calculations handle invalid nights.
      }
    }
    onUpdate({ ...item, [field]: numValue });
  };

  const handleChildrenSharingBedChange = (checked: boolean) => {
    onUpdate({ ...item, childrenSharingBed: checked });
  };

  const handleAddRoomConfig = () => {
    const newRoomConfig: HotelRoomConfiguration = {
      id: generateGUID(),
      category: 'Standard Room',
      roomType: 'Double sharing',
      adultsInRoom: 2,
      childrenInRoom: 0,
      extraBeds: 0,
      numRooms: 1,
      roomRate: 0,
      extraBedRate: 0,
      assignedTravelerIds: [],
    };
    onUpdate({ ...item, rooms: [...item.rooms, newRoomConfig] });
  };

  const handleUpdateRoomConfig = (updatedConfig: HotelRoomConfiguration) => {
    const newRooms = item.rooms.map(rc => rc.id === updatedConfig.id ? updatedConfig : rc);
    onUpdate({ ...item, rooms: newRooms });
  };

  const handleDeleteRoomConfig = (configId: string) => {
    const newRooms = item.rooms.filter(rc => rc.id !== configId);
    // Ensure at least one room config exists if there are rooms. If all deleted, add a default one back.
    if (newRooms.length === 0) {
        const defaultRoomConfig: HotelRoomConfiguration = {
            id: generateGUID(), category: 'Standard Room', roomType: 'Double sharing',
            adultsInRoom: 2, childrenInRoom: 0, extraBeds: 0, numRooms: 1,
            roomRate: 0, extraBedRate: 0, assignedTravelerIds: [],
        };
        onUpdate({ ...item, rooms: [defaultRoomConfig] });
    } else {
        onUpdate({ ...item, rooms: newRooms });
    }
  };
  
  // Ensure at least one room config exists when the component loads or item.rooms is empty
  React.useEffect(() => {
    if (!item.rooms || item.rooms.length === 0) {
      handleAddRoomConfig();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount if rooms are empty


  const calculatedNights = Math.max(0, (item.checkoutDay || dayNumber + 1) - dayNumber);

  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Hotel Stay">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <FormField label="Check-in Day" id={`checkinDay-${item.id}`}>
          <p className="font-code text-sm p-2.5 bg-muted rounded-md h-10 flex items-center">Day {dayNumber}</p>
        </FormField>
        <FormField label="Checkout Day" id={`checkoutDay-${item.id}`}>
          <Input
            type="number"
            id={`checkoutDay-${item.id}`}
            value={item.checkoutDay ?? ''}
            onChange={(e) => handleNumericInputChange('checkoutDay', e.target.value)}
            min={dayNumber + 1}
            max={tripSettings.numDays +1} // Allow checkout day after trip ends for multi-day stays starting on last day
            placeholder={`Day ${dayNumber + 1}`}
          />
        </FormField>
        <FormField label="Total Nights" id={`totalNights-${item.id}`}>
           <p className={`font-code text-sm p-2.5 rounded-md h-10 flex items-center ${calculatedNights <=0 && item.checkoutDay ? 'text-destructive bg-destructive/10 border border-destructive' : 'bg-muted'}`}>
            {calculatedNights > 0 ? calculatedNights : (item.checkoutDay ? "Invalid" : "0")}
          </p>
        </FormField>
      </div>
      
      <div className="pt-4">
        <Label className="text-md font-semibold">Room Configurations</Label>
        <div className="space-y-3 mt-2">
          {item.rooms.map((roomConfig) => (
            <HotelRoomCardForm
              key={roomConfig.id}
              roomConfig={roomConfig}
              travelers={travelers}
              currency={currency}
              onUpdateRoomConfig={handleUpdateRoomConfig}
              onDeleteRoomConfig={() => handleDeleteRoomConfig(roomConfig.id)}
              isOnlyRoom={item.rooms.length === 1}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleAddRoomConfig} className="mt-3 border-primary text-primary hover:bg-primary/10">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Room/Occupancy Type
        </Button>
      </div>

      <div className="flex items-center space-x-2 pt-4">
        <Checkbox
          id={`childrenSharing-${item.id}`}
          checked={item.childrenSharingBed}
          onCheckedChange={(checked) => handleChildrenSharingBedChange(!!checked)}
        />
        <Label htmlFor={`childrenSharing-${item.id}`} className="text-sm font-normal cursor-pointer">
          Children Share Existing Beds (if not assigned to a room with child capacity/extra bed)
        </Label>
      </div>
    </BaseItemForm>
  );
}
