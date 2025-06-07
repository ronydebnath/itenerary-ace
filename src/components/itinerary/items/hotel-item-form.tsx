
"use client";

import * as React from 'react';
import type { HotelItem as HotelItemType, HotelRoomConfiguration, Traveler, CurrencyCode, TripSettings, ServicePriceItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle } from 'lucide-react';
import { HotelRoomCardForm } from './hotel-room-card-form';
import { generateGUID, formatCurrency } from '@/lib/utils';
import { useServicePrices } from '@/hooks/useServicePrices';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays, parseISO } from 'date-fns'; // For date calculations

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
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const [hotelServices, setHotelServices] = React.useState<ServicePriceItem[]>([]);

  React.useEffect(() => {
    if (!isLoadingServices) {
      setHotelServices(getServicePrices('hotel').filter(s => s.currency === currency));
    }
  }, [isLoadingServices, getServicePrices, currency]);

  const handleNumericInputChange = (field: keyof HotelItemType, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    if (field === 'checkoutDay' && numValue !== undefined) {
      if (numValue <= dayNumber || numValue > tripSettings.numDays + 1) { // Allow one day past trip end for checkout
        // Potentially show error or clamp, for now allow update
      }
    }
    onUpdate({ ...item, [field]: numValue });
  };

  const handleChildrenSharingBedChange = (checked: boolean) => {
    onUpdate({ ...item, childrenSharingBed: checked });
  };

  const handleAddRoomConfig = (prefillRates?: { roomRate: number; extraBedRate?: number, categoryName?: string }) => {
    const newRoomConfig: HotelRoomConfiguration = {
      id: generateGUID(),
      category: prefillRates?.categoryName || 'Standard Room',
      roomType: 'Double sharing',
      adultsInRoom: 2,
      childrenInRoom: 0,
      extraBeds: 0,
      numRooms: 1,
      roomRate: prefillRates?.roomRate || 0,
      extraBedRate: prefillRates?.extraBedRate || 0,
      assignedTravelerIds: [],
    };
    onUpdate({ ...item, rooms: [...item.rooms, newRoomConfig] });
  };
  
  const handlePredefinedServiceSelect = (serviceId: string) => {
    const selectedService = getServicePriceById(serviceId);
    if (!selectedService) {
      onUpdate({ ...item, selectedServicePriceId: undefined }); 
      return;
    }

    let applicableRoomRate = selectedService.price1; 
    let applicableExtraBedRate = selectedService.price2; 
    const defaultRoomCategoryName = selectedService.subCategory || 'Standard Room';

    const tripStartDate = parseISO(tripSettings.startDate); // startDate is now mandatory
    const checkInDate = addDays(tripStartDate, dayNumber - 1);

    if (selectedService.seasonalRates && selectedService.seasonalRates.length > 0) {
      for (const sr of selectedService.seasonalRates) {
        const seasonalStartDate = parseISO(sr.startDate);
        const seasonalEndDate = parseISO(sr.endDate);
        if (checkInDate >= seasonalStartDate && checkInDate <= seasonalEndDate) {
          applicableRoomRate = sr.roomRate;
          applicableExtraBedRate = sr.extraBedRate;
          break; 
        }
      }
    }
    
    const updatedRooms = [...item.rooms];
    if (updatedRooms.length > 0) {
      updatedRooms[0] = {
        ...updatedRooms[0],
        category: item.rooms[0].category === 'Standard Room' || item.selectedServicePriceId ? defaultRoomCategoryName : updatedRooms[0].category,
        roomRate: applicableRoomRate,
        extraBedRate: applicableExtraBedRate ?? 0, 
      };
    } else {
      const newRoomConfig: HotelRoomConfiguration = {
        id: generateGUID(),
        category: defaultRoomCategoryName,
        roomType: 'Double sharing',
        adultsInRoom: 2,
        childrenInRoom: 0,
        extraBeds: 0,
        numRooms: 1,
        roomRate: applicableRoomRate,
        extraBedRate: applicableExtraBedRate ?? 0,
        assignedTravelerIds: [],
      };
      updatedRooms.push(newRoomConfig);
    }

    onUpdate({
      ...item,
      name: item.name === `New hotel` || item.selectedServicePriceId ? selectedService.name : item.name,
      selectedServicePriceId: selectedService.id,
      rooms: updatedRooms,
    });
  };


  const handleUpdateRoomConfig = (updatedConfig: HotelRoomConfiguration) => {
    const newRooms = item.rooms.map(rc => rc.id === updatedConfig.id ? updatedConfig : rc);
    onUpdate({ ...item, rooms: newRooms });
  };

  const handleDeleteRoomConfig = (configId: string) => {
    const newRooms = item.rooms.filter(rc => rc.id !== configId);
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
  
  React.useEffect(() => {
    if ((!item.rooms || item.rooms.length === 0) && !item.selectedServicePriceId) {
      handleAddRoomConfig();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.rooms, item.selectedServicePriceId]);


  const calculatedNights = Math.max(0, (item.checkoutDay || dayNumber + 1) - dayNumber);
  const selectedServiceName = item.selectedServicePriceId ? getServicePriceById(item.selectedServicePriceId)?.name : null;

  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Hotel Stay">
      {hotelServices.length > 0 && (
        <div className="pt-2">
          <FormField label="Select Predefined Hotel Service (Optional)" id={`predefined-hotel-${item.id}`}>
            <Select
              value={item.selectedServicePriceId || ""}
              onValueChange={handlePredefinedServiceSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a predefined hotel service..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None (Custom Rates)</SelectItem>
                {hotelServices.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.subCategory || 'Hotel'}) - Default: {formatCurrency(service.price1, currency)}
                    {service.seasonalRates && service.seasonalRates.length > 0 ? ` (Seasonal Rates Apply)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {selectedServiceName && <p className="text-xs text-muted-foreground pt-1">Using: {selectedServiceName}. Rates for the first room below are based on this service and your check-in date.</p>}
        </div>
      )}
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
      
      <div className="pt-4">
        <Label className="text-md font-semibold">Room Configurations</Label>
        <p className="text-xs text-muted-foreground mb-2">
            {item.selectedServicePriceId ? "Rates for the first room type are based on the selected hotel service and check-in date. Add more room types or customize as needed." : "Define room types, occupancy, and rates below."}
        </p>
        <div className="space-y-3 mt-2">
          {item.rooms.map((roomConfig, index) => (
            <HotelRoomCardForm
              key={roomConfig.id}
              roomConfig={roomConfig}
              travelers={travelers}
              currency={currency}
              onUpdateRoomConfig={handleUpdateRoomConfig}
              onDeleteRoomConfig={() => handleDeleteRoomConfig(roomConfig.id)}
              isOnlyRoom={item.rooms.length === 1}
              isFirstRoom={index === 0}
              isLinkedToService={!!item.selectedServicePriceId}
            />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => handleAddRoomConfig()} className="mt-3 border-primary text-primary hover:bg-primary/10">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Another Room/Occupancy Type
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
