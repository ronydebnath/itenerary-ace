
"use client";

import * as React from 'react';
import type { HotelRoomConfiguration, Traveler } from '@/types/itinerary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { FormField } from './base-item-form'; // Re-using FormField for layout consistency
import { formatCurrency } from '@/lib/utils';
import { CurrencyCode } from '@/types/itinerary';

interface HotelRoomCardFormProps {
  roomConfig: HotelRoomConfiguration;
  travelers: Traveler[];
  currency: CurrencyCode;
  onUpdateRoomConfig: (updatedConfig: HotelRoomConfiguration) => void;
  onDeleteRoomConfig: () => void;
  isOnlyRoom: boolean;
}

export function HotelRoomCardForm({ roomConfig, travelers, currency, onUpdateRoomConfig, onDeleteRoomConfig, isOnlyRoom }: HotelRoomCardFormProps) {
  const [isTravelerAssignmentOpen, setIsTravelerAssignmentOpen] = React.useState(roomConfig.assignedTravelerIds.length > 0);

  const handleInputChange = (field: keyof HotelRoomConfiguration, value: any) => {
    onUpdateRoomConfig({ ...roomConfig, [field]: value });
  };

  const handleNumericInputChange = (field: keyof HotelRoomConfiguration, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value); // Default to 0 if empty for numeric fields
    onUpdateRoomConfig({ ...roomConfig, [field]: numValue });
  };
  
  const handleTravelerAssignmentChange = (travelerId: string, checked: boolean) => {
    let newAssignedTravelerIds;
    if (checked) {
      newAssignedTravelerIds = [...roomConfig.assignedTravelerIds, travelerId];
    } else {
      newAssignedTravelerIds = roomConfig.assignedTravelerIds.filter(id => id !== travelerId);
    }
    onUpdateRoomConfig({ ...roomConfig, assignedTravelerIds: newAssignedTravelerIds });
  };

  React.useEffect(() => {
    let updatedAdults = roomConfig.adultsInRoom;
    let updatedChildren = roomConfig.childrenInRoom;
    let updatedExtraBeds = roomConfig.extraBeds;
    let enableChildrenInput = false;
    let enableExtraBedsInput = false;

    switch (roomConfig.roomType) {
      case 'Single room':
        updatedAdults = 1;
        updatedChildren = 0;
        updatedExtraBeds = 0;
        break;
      case 'Double sharing':
        updatedAdults = Math.max(1, roomConfig.adultsInRoom || 2); // Default to 2 if not set
        updatedChildren = 0;
        updatedExtraBeds = 0;
        break;
      case 'Triple sharing':
        updatedAdults = Math.max(1, roomConfig.adultsInRoom || 2); // Default to 2 if not set
        enableExtraBedsInput = true;
        // updatedExtraBeds remains as is or default 0
        updatedChildren = 0;
        break;
      case 'Family with child':
        updatedAdults = Math.max(1, roomConfig.adultsInRoom || 1); // Default to 1 if not set
        enableChildrenInput = true;
        enableExtraBedsInput = true; // Often family rooms might allow extra beds
        // updatedChildren remains as is or default 0
        // updatedExtraBeds remains as is or default 0
        break;
    }
    
    // Only update if there's an actual change to avoid infinite loops
    if (updatedAdults !== roomConfig.adultsInRoom || 
        updatedChildren !== roomConfig.childrenInRoom || 
        updatedExtraBeds !== roomConfig.extraBeds ||
        (enableChildrenInput !== !((roomConfig.childrenInRoom || 0) > 0)) || // A bit complex logic to check if state needs update
        (enableExtraBedsInput !== !((roomConfig.extraBeds || 0) > 0))
        ) {
            // This effect should only adjust based on roomType, not create feedback loop with user input for those values
    }

  }, [roomConfig.roomType]); // Only re-run if roomType changes

  const isChildrenInputDisabled = roomConfig.roomType !== 'Family with child';
  const isExtraBedsInputDisabled = roomConfig.roomType !== 'Triple sharing' && roomConfig.roomType !== 'Family with child';


  return (
    <Card className="mb-4 bg-background/70 border border-primary/20 shadow-inner">
      <CardHeader className="py-3 px-4 bg-muted/40 rounded-t-md">
        <CardTitle className="text-base font-medium flex justify-between items-center">
          <span>Room Category: {roomConfig.category || "Not Set"}</span>
           {!isOnlyRoom && (
             <Button variant="ghost" size="icon" onClick={onDeleteRoomConfig} className="h-7 w-7 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
           )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Room Category Name" id={`roomCat-${roomConfig.id}`}>
            <Input 
              value={roomConfig.category} 
              onChange={e => handleInputChange('category', e.target.value)}
              placeholder="e.g., Deluxe King"
            />
          </FormField>
          <FormField label="Occupancy Type" id={`roomType-${roomConfig.id}`}>
            <Select value={roomConfig.roomType} onValueChange={value => handleInputChange('roomType', value as HotelRoomConfiguration['roomType'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Single room">Single</SelectItem>
                <SelectItem value="Double sharing">Double</SelectItem>
                <SelectItem value="Triple sharing">Triple</SelectItem>
                <SelectItem value="Family with child">Family</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField label="Adults/Room" id={`adultsInRoom-${roomConfig.id}`}>
            <Input type="number" min="1" value={roomConfig.adultsInRoom} onChange={e => handleNumericInputChange('adultsInRoom', e.target.value)} />
          </FormField>
          <FormField label="Children/Room" id={`childrenInRoom-${roomConfig.id}`}>
            <Input type="number" min="0" value={roomConfig.childrenInRoom} onChange={e => handleNumericInputChange('childrenInRoom', e.target.value)} disabled={isChildrenInputDisabled}/>
          </FormField>
          <FormField label="Extra Beds/Room" id={`extraBeds-${roomConfig.id}`}>
            <Input type="number" min="0" value={roomConfig.extraBeds} onChange={e => handleNumericInputChange('extraBeds', e.target.value)} disabled={isExtraBedsInputDisabled}/>
          </FormField>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField label="# Rooms" id={`numRooms-${roomConfig.id}`}>
            <Input type="number" min="1" value={roomConfig.numRooms} onChange={e => handleNumericInputChange('numRooms', e.target.value)} />
          </FormField>
          <FormField label={`Room Rate (Nightly, ${currency})`} id={`roomRate-${roomConfig.id}`}>
            <Input type="number" min="0" value={roomConfig.roomRate} onChange={e => handleNumericInputChange('roomRate', e.target.value)} placeholder="0.00" />
          </FormField>
          <FormField label={`Extra Bed Rate (Nightly, ${currency})`} id={`extraBedRate-${roomConfig.id}`}>
            <Input type="number" min="0" value={roomConfig.extraBedRate} onChange={e => handleNumericInputChange('extraBedRate', e.target.value)} placeholder="0.00" disabled={isExtraBedsInputDisabled} />
          </FormField>
        </div>

        <div>
          <button
            onClick={() => setIsTravelerAssignmentOpen(!isTravelerAssignmentOpen)}
            className="flex items-center justify-between w-full text-sm font-medium text-left text-foreground/80 hover:text-primary py-2 px-3 rounded-md hover:bg-muted/50 transition-colors mt-2 border-t pt-3"
          >
            <span className="flex items-center"><Users className="mr-2 h-4 w-4"/> Assign Travelers to this Room Type</span>
            {isTravelerAssignmentOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {isTravelerAssignmentOpen && (
            <div className="mt-2 p-3 border rounded-md bg-muted/30 max-h-40 overflow-y-auto">
              {travelers.length > 0 ? (
                travelers.map(traveler => (
                  <div key={traveler.id} className="flex items-center space-x-2 mb-1 py-1">
                    <Checkbox
                      id={`assign-${roomConfig.id}-${traveler.id}`}
                      checked={roomConfig.assignedTravelerIds.includes(traveler.id)}
                      onCheckedChange={(checked) => handleTravelerAssignmentChange(traveler.id, !!checked)}
                    />
                    <Label htmlFor={`assign-${roomConfig.id}-${traveler.id}`} className="text-sm font-normal cursor-pointer">
                      {traveler.label}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No travelers defined to assign.</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
