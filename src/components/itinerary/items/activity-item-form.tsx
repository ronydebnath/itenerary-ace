
"use client";

import * as React from 'react';
import type { ActivityItem as ActivityItemType, Traveler, CurrencyCode, TripSettings, ServicePriceItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServicePrices } from '@/hooks/useServicePrices'; // Import the hook

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
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const [activityServices, setActivityServices] = React.useState<ServicePriceItem[]>([]);
  
  React.useEffect(() => {
    if (!isLoadingServices) {
      setActivityServices(getServicePrices('activity').filter(s => s.currency === currency));
    }
  }, [isLoadingServices, getServicePrices, currency]);

  const handleNumericInputChange = (field: keyof ActivityItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    // If user manually changes price, clear the selected service ID
    onUpdate({ ...item, [field]: numValue, selectedServicePriceId: undefined });
  };

  const handleEndDayChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    if (numValue !== undefined && (numValue < dayNumber || numValue > tripSettings.numDays)) {
      // Invalid input
    }
    onUpdate({ ...item, endDay: numValue });
  };

  const handlePredefinedServiceSelect = (selectedValue: string) => {
    if (selectedValue === "none") {
      onUpdate({
        ...item,
        selectedServicePriceId: undefined,
        adultPrice: item.adultPrice ?? 0, // Keep existing or default to 0
        childPrice: item.childPrice ?? 0, // Keep existing or default to 0
      });
    } else {
      const selectedService = getServicePriceById(selectedValue);
      if (selectedService) {
        onUpdate({
          ...item,
          name: item.name === `New activity` || !item.name || item.selectedServicePriceId ? selectedService.name : item.name,
          adultPrice: selectedService.price1,
          childPrice: selectedService.price2,
          selectedServicePriceId: selectedService.id,
        });
      }
    }
  };
  
  const calculatedEndDay = item.endDay || dayNumber;
  const duration = Math.max(1, calculatedEndDay - dayNumber + 1);

  const selectedServiceName = item.selectedServicePriceId ? getServicePriceById(item.selectedServicePriceId)?.name : null;

  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Activity">
      {activityServices.length > 0 && (
        <div className="pt-2">
          <FormField label="Select Predefined Activity (Optional)" id={`predefined-activity-${item.id}`}>
            <Select
              value={item.selectedServicePriceId || ""} // Shows placeholder if undefined/empty
              onValueChange={handlePredefinedServiceSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a predefined activity..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Custom Price)</SelectItem>
                {activityServices.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.unitDescription}) - {currency} {service.price1}
                    {service.price2 !== undefined ? ` / Ch: ${service.price2}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
           {selectedServiceName && <p className="text-xs text-muted-foreground pt-1">Using: {selectedServiceName}</p>}
        </div>
      )}

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
