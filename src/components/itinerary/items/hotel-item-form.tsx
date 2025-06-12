
"use client";

import * as React from 'react';
import type { HotelItem as HotelItemType, SelectedHotelRoomConfiguration, Traveler, CurrencyCode, TripSettings, HotelDefinition, HotelRoomTypeDefinition } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Users, BedDouble, Info, AlertCircle } from 'lucide-react';
import { generateGUID } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface HotelItemFormProps {
  item: HotelItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  dayNumber: number;
  tripSettings: TripSettings;
  onUpdate: (item: HotelItemType) => void;
  onDelete: () => void;
  allHotelDefinitions: HotelDefinition[];
}

export function HotelItemForm({ item, travelers, currency, dayNumber, tripSettings, onUpdate, onDelete, allHotelDefinitions }: HotelItemFormProps) {
  const [availableHotels, setAvailableHotels] = React.useState<HotelDefinition[]>([]);
  const [selectedHotelDef, setSelectedHotelDef] = React.useState<HotelDefinition | undefined>(undefined);
  
  const [openTravelerAssignments, setOpenTravelerAssignments] = React.useState<{[key: string]: boolean}>({});

  React.useEffect(() => {
    let filteredHotels: HotelDefinition[];
    if (item.province) {
      // Show hotels matching the province OR generic hotels (no province set on the definition)
      filteredHotels = allHotelDefinitions.filter(hd => hd.province === item.province || !hd.province);
    } else {
      // If item has no province, show all hotels (including those with specific provinces and generic ones)
      filteredHotels = allHotelDefinitions;
    }
    setAvailableHotels(filteredHotels);
  }, [item.province, allHotelDefinitions]);

  React.useEffect(() => {
    if (item.hotelDefinitionId) {
      setSelectedHotelDef(allHotelDefinitions.find(hd => hd.id === item.hotelDefinitionId));
    } else {
      setSelectedHotelDef(undefined);
    }
  }, [item.hotelDefinitionId, allHotelDefinitions]);


  const handleHotelDefinitionChange = (hotelDefId: string) => {
    const newHotelDef = allHotelDefinitions.find(hd => hd.id === hotelDefId);
    if (newHotelDef) {
      onUpdate({ 
        ...item, 
        hotelDefinitionId: hotelDefId, 
        name: item.name === 'New hotel' || !item.name || !item.hotelDefinitionId ? newHotelDef.name : item.name,
        selectedRooms: [] // Reset rooms when hotel changes
      });
    } else { 
       onUpdate({ 
        ...item, 
        hotelDefinitionId: '', 
        name: 'New hotel', // Reset name if no hotel is selected
        selectedRooms: [] 
      });
    }
  };

  const handleCheckoutDayChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    if (numValue !== undefined && (numValue <= dayNumber || numValue > tripSettings.numDays + 1)) {
      // Invalid input, maybe show a toast or message, or clamp
    }
    onUpdate({ ...item, checkoutDay: numValue || (dayNumber + 1) });
  };

  const handleAddRoomBooking = () => {
    if (!selectedHotelDef || selectedHotelDef.roomTypes.length === 0) return; 
    
    const defaultRoomType = selectedHotelDef.roomTypes[0];
    const newRoomBooking: SelectedHotelRoomConfiguration = {
      id: generateGUID(),
      roomTypeDefinitionId: defaultRoomType.id,
      roomTypeNameCache: defaultRoomType.name, // Cache name
      numRooms: 1,
      assignedTravelerIds: [],
    };
    const currentSelectedRooms = item.selectedRooms || [];
    onUpdate({ ...item, selectedRooms: [...currentSelectedRooms, newRoomBooking] });
  };

  const handleUpdateRoomBooking = (updatedBooking: SelectedHotelRoomConfiguration) => {
    const currentSelectedRooms = item.selectedRooms || [];
    const newSelectedRooms = currentSelectedRooms.map(rb => rb.id === updatedBooking.id ? updatedBooking : rb);
    onUpdate({ ...item, selectedRooms: newSelectedRooms });
  };
  
  const handleRoomTypeChangeForBooking = (bookingId: string, roomTypeDefinitionId: string) => {
    const roomTypeDef = selectedHotelDef?.roomTypes.find(rt => rt.id === roomTypeDefinitionId);
    if (roomTypeDef) {
        const currentSelectedRooms = item.selectedRooms || [];
        const updatedBooking = currentSelectedRooms.find(rb => rb.id === bookingId);
        if (updatedBooking) {
            handleUpdateRoomBooking({ 
                ...updatedBooking, 
                roomTypeDefinitionId, 
                roomTypeNameCache: roomTypeDef.name // Update cached name
            });
        }
    }
  };

  const handleNumRoomsChangeForBooking = (bookingId: string, numRoomsStr: string) => {
      const numRooms = parseInt(numRoomsStr, 10) || 1;
      const currentSelectedRooms = item.selectedRooms || [];
      const updatedBooking = currentSelectedRooms.find(rb => rb.id === bookingId);
      if (updatedBooking) {
          handleUpdateRoomBooking({ ...updatedBooking, numRooms: Math.max(1, numRooms) });
      }
  };

  const handleDeleteRoomBooking = (bookingId: string) => {
    const currentSelectedRooms = item.selectedRooms || [];
    const newSelectedRooms = currentSelectedRooms.filter(rb => rb.id !== bookingId);
    onUpdate({ ...item, selectedRooms: newSelectedRooms });
  };
  
  const handleToggleTravelerAssignment = (bookingId: string) => {
    setOpenTravelerAssignments(prev => ({...prev, [bookingId]: !prev[bookingId]}));
  };

  const handleTravelerAssignmentChange = (bookingId: string, travelerId: string, checked: boolean) => {
    const currentSelectedRooms = item.selectedRooms || [];
    const roomBooking = currentSelectedRooms.find(rb => rb.id === bookingId);
    if (!roomBooking) return;

    let newAssignedTravelerIds;
    if (checked) {
      newAssignedTravelerIds = [...roomBooking.assignedTravelerIds, travelerId];
    } else {
      newAssignedTravelerIds = roomBooking.assignedTravelerIds.filter(id => id !== travelerId);
    }
    handleUpdateRoomBooking({ ...roomBooking, assignedTravelerIds: newAssignedTravelerIds });
  };

  const calculatedNights = Math.max(0, (item.checkoutDay || (dayNumber + 1)) - dayNumber);
  const currentSelectedRoomsForRender = item.selectedRooms || [];


  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Hotel Stay">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <FormField label="Select Hotel" id={`hotel-def-${item.id}`}>
          <Select
            value={item.hotelDefinitionId || "none"}
            onValueChange={handleHotelDefinitionChange}
            disabled={availableHotels.length === 0 && !item.province} // Disable if no province selected and no generic hotels
          >
            <SelectTrigger>
              <SelectValue placeholder={
                item.province 
                  ? (availableHotels.length > 0 ? "Choose a hotel..." : "No hotels for this province")
                  : (allHotelDefinitions.length > 0 ? "Choose a hotel or select province..." : "No hotels defined")
              } />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Clear Selection)</SelectItem>
              {availableHotels.map(hotelDef => (
                <SelectItem key={hotelDef.id} value={hotelDef.id}>
                  {hotelDef.name} ({hotelDef.province || 'Generic'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
         <div className="md:col-span-1"> {/* Placeholder for potential hotel details if selectedHotelDef */}
           {selectedHotelDef && (
             <Card className="text-xs bg-muted/30 p-2 border-dashed">
               <p><strong>Selected:</strong> {selectedHotelDef.name}</p>
               <p><strong>Province:</strong> {selectedHotelDef.province || "N/A"}</p>
             </Card>
           )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <FormField label="Check-in Day" id={`checkinDay-${item.id}`}>
          <p className="font-code text-sm p-2.5 bg-muted rounded-md h-10 flex items-center">Day {dayNumber}</p>
        </FormField>
        <FormField label="Checkout Day" id={`checkoutDay-${item.id}`}>
          <Input
            type="number"
            id={`checkoutDay-${item.id}`}
            value={item.checkoutDay ?? ''}
            onChange={(e) => handleCheckoutDayChange(e.target.value)}
            min={dayNumber + 1}
            max={tripSettings.numDays + 1} 
            placeholder={`Day ${dayNumber + 1}`}
          />
        </FormField>
        <FormField label="Total Nights" id={`totalNights-${item.id}`}>
           <p className={`font-code text-sm p-2.5 rounded-md h-10 flex items-center ${calculatedNights <=0 && item.checkoutDay ? 'text-destructive bg-destructive/10 border border-destructive' : 'bg-muted'}`}>
            {calculatedNights > 0 ? calculatedNights : (item.checkoutDay ? "Invalid" : "0")}
          </p>
        </FormField>
      </div>

      {!item.hotelDefinitionId && (
          <Alert variant="default" className="mt-4 bg-blue-50 border-blue-200">
             <Info className="h-4 w-4 text-blue-600" />
             <AlertTitle className="text-blue-700">Configure Hotel</AlertTitle>
             <AlertDescription className="text-blue-600">
               Please select a hotel from the dropdown above to configure room bookings. 
               If no hotels appear, ensure the correct province is selected for this item, or check Admin settings.
             </AlertDescription>
           </Alert>
      )}

      {item.hotelDefinitionId && !selectedHotelDef && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            The selected hotel definition (ID: {item.hotelDefinitionId}) could not be found. It might have been deleted or there's an issue with the hotel data. Please re-select a hotel.
          </AlertDescription>
        </Alert>
      )}

      {item.hotelDefinitionId && selectedHotelDef && (
        <div className="pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-md font-semibold">Selected Room Bookings for {selectedHotelDef.name}</Label>
            <Button variant="outline" size="sm" onClick={handleAddRoomBooking} className="border-primary text-primary hover:bg-primary/10">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Room Booking
            </Button>
          </div>
          
          {currentSelectedRoomsForRender.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No room types booked for this hotel yet. Click "Add Room Booking".</p>
          )}

          {currentSelectedRoomsForRender.map((roomBooking, index) => {
            const currentRoomTypeDef = selectedHotelDef.roomTypes.find(rt => rt.id === roomBooking.roomTypeDefinitionId);
            if (!currentRoomTypeDef) {
                 return (
                    <Alert key={roomBooking.id} variant="destructive" className="my-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Room Type Error</AlertTitle>
                        <AlertDescription>
                        Room type definition for booking {index + 1} (ID: {roomBooking.roomTypeDefinitionId}) is missing. Please re-select or delete this booking.
                        </AlertDescription>
                         <Button variant="ghost" size="sm" onClick={() => handleDeleteRoomBooking(roomBooking.id)} className="mt-2 text-destructive hover:bg-destructive/10">
                            <Trash2 className="mr-1 h-3 w-3" /> Delete This Booking
                        </Button>
                    </Alert>
                 );
            }
            return (
            <Card key={roomBooking.id} className="bg-background/70 border border-primary/20 shadow-inner">
              <CardHeader className="py-3 px-4 bg-muted/40 rounded-t-md flex flex-row justify-between items-center">
                <CardTitle className="text-base font-medium flex items-center">
                  <BedDouble className="mr-2 h-5 w-5 text-primary/80"/> Booking {index + 1}: {currentRoomTypeDef?.name || 'Select Room Type'}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteRoomBooking(roomBooking.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField label="Room Type" id={`room-type-${roomBooking.id}`}>
                    <Select
                      value={roomBooking.roomTypeDefinitionId}
                      onValueChange={(rtId) => handleRoomTypeChangeForBooking(roomBooking.id, rtId)}
                    >
                      <SelectTrigger><SelectValue placeholder="Select room type..." /></SelectTrigger>
                      <SelectContent>
                        {selectedHotelDef.roomTypes.map(rtDef => (
                          <SelectItem key={rtDef.id} value={rtDef.id}>{rtDef.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="# of these Rooms" id={`num-rooms-${roomBooking.id}`}>
                    <Input
                      type="number"
                      min="1"
                      value={roomBooking.numRooms}
                      onChange={(e) => handleNumRoomsChangeForBooking(roomBooking.id, e.target.value)}
                    />
                  </FormField>
                </div>

                {currentRoomTypeDef && (
                  <div className="mt-2 p-2 border rounded-md bg-muted/20 text-xs">
                    <p className="font-medium mb-1">About {currentRoomTypeDef.name}:</p>
                     {currentRoomTypeDef.notes && <p className="italic">"{currentRoomTypeDef.notes}"</p>}
                    <ul className="list-disc list-inside pl-2 space-y-0.5 mt-1">
                      {currentRoomTypeDef.characteristics.map(char => (
                        <li key={char.id}><strong>{char.key}:</strong> {char.value}</li>
                      ))}
                       <li><strong>Extra Bed:</strong> {currentRoomTypeDef.extraBedAllowed ? 'Allowed' : 'Not Allowed'}</li>
                    </ul>
                   
                  </div>
                )}
                
                <div>
                  <button
                    onClick={() => handleToggleTravelerAssignment(roomBooking.id)}
                    className="flex items-center justify-between w-full text-sm font-medium text-left text-foreground/80 hover:text-primary py-2 px-3 rounded-md hover:bg-muted/50 transition-colors mt-2 border-t pt-3"
                  >
                    <span className="flex items-center"><Users className="mr-2 h-4 w-4"/> Assign Travelers to this Booking ({roomBooking.assignedTravelerIds.length} assigned)</span>
                    {openTravelerAssignments[roomBooking.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {openTravelerAssignments[roomBooking.id] && (
                    <div className="mt-2 p-3 border rounded-md bg-muted/30 max-h-40 overflow-y-auto">
                      {travelers.length > 0 ? (
                        travelers.map(traveler => (
                          <div key={traveler.id} className="flex items-center space-x-2 mb-1 py-1">
                            <Checkbox
                              id={`assign-${roomBooking.id}-${traveler.id}`}
                              checked={roomBooking.assignedTravelerIds.includes(traveler.id)}
                              onCheckedChange={(checked) => handleTravelerAssignmentChange(roomBooking.id, traveler.id, !!checked)}
                            />
                            <Label htmlFor={`assign-${roomBooking.id}-${traveler.id}`} className="text-sm font-normal cursor-pointer">
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
          })}
           {currentSelectedRoomsForRender.length > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                    Hotel costs are calculated night-by-night based on selected room types and seasonal rates from the hotel's master data.
                </p>
           )}
        </div>
      )}
    </BaseItemForm>
  );
}
