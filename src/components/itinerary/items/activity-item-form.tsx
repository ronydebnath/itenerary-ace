
"use client";

import * as React from 'react';
import type { ActivityItem as ActivityItemType, Traveler, CurrencyCode, TripSettings, ServicePriceItem, ActivityPackageDefinition } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServicePrices } from '@/hooks/useServicePrices'; 
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { CalendarDays, Info, Tag } from 'lucide-react';

interface ActivityItemFormProps {
  item: ActivityItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  dayNumber: number;
  tripSettings: TripSettings;
  onUpdate: (item: ActivityItemType) => void;
  onDelete: () => void;
}

const WEEKDAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ActivityItemForm({ item, travelers, currency, dayNumber, tripSettings, onUpdate, onDelete }: ActivityItemFormProps) {
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const [activityServices, setActivityServices] = React.useState<ServicePriceItem[]>([]);
  const [selectedActivityService, setSelectedActivityService] = React.useState<ServicePriceItem | undefined>(undefined);
  const [selectedPackage, setSelectedPackage] = React.useState<ActivityPackageDefinition | undefined>(undefined);
  
  React.useEffect(() => {
    if (!isLoadingServices) {
      const allCategoryServices = getServicePrices('activity').filter(s => s.currency === currency);
      let filteredServices = allCategoryServices;
      if (item.province) {
        filteredServices = allCategoryServices.filter(s => s.province === item.province || !s.province);
      }
      setActivityServices(filteredServices);
    }
  }, [isLoadingServices, getServicePrices, currency, item.province]);

  React.useEffect(() => {
    if (item.selectedServicePriceId) {
      const service = getServicePriceById(item.selectedServicePriceId);
      setSelectedActivityService(service);
      if (service && item.selectedPackageId) {
        const pkg = service.activityPackages?.find(p => p.id === item.selectedPackageId);
        setSelectedPackage(pkg);
      } else {
        setSelectedPackage(undefined);
      }
    } else {
      setSelectedActivityService(undefined);
      setSelectedPackage(undefined);
    }
  }, [item.selectedServicePriceId, item.selectedPackageId, getServicePriceById]);


  const handleNumericInputChange = (field: keyof ActivityItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    // If manual price input, clear selected package and service
    onUpdate({ 
        ...item, 
        [field]: numValue, 
        selectedServicePriceId: undefined, 
        selectedPackageId: undefined 
    });
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
        selectedPackageId: undefined,
        adultPrice: 0, 
        childPrice: undefined,
      });
    } else {
      const service = getServicePriceById(selectedValue);
      if (service) {
        const defaultPackage = service.activityPackages && service.activityPackages.length > 0 ? service.activityPackages[0] : undefined;
        onUpdate({
          ...item,
          name: item.name === `New activity` || !item.name || !item.selectedServicePriceId ? service.name : item.name,
          selectedServicePriceId: service.id,
          selectedPackageId: defaultPackage?.id, // Auto-select first package or none
          adultPrice: defaultPackage?.price1 ?? service.price1 ?? 0,
          childPrice: defaultPackage?.price2 ?? service.price2 ?? undefined,
        });
      }
    }
  };

  const handlePackageSelect = (packageId: string) => {
    if (packageId === "none" || !selectedActivityService?.activityPackages) {
      onUpdate({
        ...item,
        selectedPackageId: undefined,
        // If a service is selected but "None" package, use service's base price or revert to 0 if no base price
        adultPrice: selectedActivityService?.price1 ?? 0,
        childPrice: selectedActivityService?.price2 ?? undefined,
      });
    } else {
      const pkg = selectedActivityService.activityPackages.find(p => p.id === packageId);
      if (pkg) {
        onUpdate({
          ...item,
          selectedPackageId: pkg.id,
          adultPrice: pkg.price1,
          childPrice: pkg.price2,
        });
      }
    }
  };
  
  const calculatedEndDay = item.endDay || dayNumber;
  const duration = Math.max(1, calculatedEndDay - dayNumber + 1);

  const isPriceReadOnly = !!item.selectedPackageId && !!selectedActivityService?.activityPackages?.length;

  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Activity">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <FormField label={`Select Predefined Activity (${item.province || 'Any Province'})`} id={`predefined-activity-${item.id}`}>
          <Select
            value={item.selectedServicePriceId || "none"}
            onValueChange={handlePredefinedServiceSelect}
            disabled={isLoadingServices}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an activity or set custom price..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Custom Price)</SelectItem>
              {activityServices.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} ({service.province || 'Generic'})
                  {service.activityPackages && service.activityPackages.length > 0 
                    ? ` - ${service.activityPackages.length} pkg(s)` 
                    : service.price1 !== undefined ? ` - ${currency} ${service.price1}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {selectedActivityService && selectedActivityService.activityPackages && selectedActivityService.activityPackages.length > 0 && (
          <FormField label="Select Package" id={`activity-package-${item.id}`}>
            <Select
              value={item.selectedPackageId || "none"}
              onValueChange={handlePackageSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a package..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Use Activity Base Price or Custom)</SelectItem>
                {selectedActivityService.activityPackages.map(pkg => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name} - {currency} {pkg.price1}
                    {pkg.price2 !== undefined ? ` / Ch: ${pkg.price2}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </div>
      
      {selectedPackage && (
        <div className="mt-3 p-3 border rounded-md bg-muted/30 space-y-2 text-sm">
          <div className="flex items-center font-medium text-primary">
            <Tag className="h-4 w-4 mr-2"/> Package: {selectedPackage.name}
          </div>
          {selectedPackage.notes && (
            <div className="flex items-start">
              <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0"/>
              <p className="text-muted-foreground text-xs whitespace-pre-wrap">{selectedPackage.notes}</p>
            </div>
          )}
          {(selectedPackage.validityStartDate || selectedPackage.validityEndDate || selectedPackage.closedWeekdays?.length || selectedPackage.specificClosedDates?.length) && (
            <div className="flex items-start">
              <CalendarDays className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0"/>
              <div className="text-xs text-muted-foreground">
                {selectedPackage.validityStartDate && selectedPackage.validityEndDate && isValid(parseISO(selectedPackage.validityStartDate)) && isValid(parseISO(selectedPackage.validityEndDate)) && (
                  <p>Valid: {format(parseISO(selectedPackage.validityStartDate), 'dd MMM yyyy')} - {format(parseISO(selectedPackage.validityEndDate), 'dd MMM yyyy')}</p>
                )}
                {selectedPackage.closedWeekdays && selectedPackage.closedWeekdays.length > 0 && (
                  <p>Closed on: {selectedPackage.closedWeekdays.map(d => WEEKDAYS_MAP[d]).join(', ')}</p>
                )}
                {selectedPackage.specificClosedDates && selectedPackage.specificClosedDates.length > 0 && (
                  <p>Specific Closures: {selectedPackage.specificClosedDates.map(d => isValid(parseISO(d)) ? format(parseISO(d), 'dd MMM') : d).join(', ')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <FormField label={`Adult Price (${currency})`} id={`adultPrice-${item.id}`}>
          <Input
            type="number"
            id={`adultPrice-${item.id}`}
            value={item.adultPrice ?? ''}
            onChange={(e) => handleNumericInputChange('adultPrice', e.target.value)}
            min="0"
            placeholder="0.00"
            readOnly={isPriceReadOnly}
            className={isPriceReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}
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
            readOnly={isPriceReadOnly}
            className={isPriceReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}
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
      <p className="text-xs text-muted-foreground pt-2 text-center">Price is fixed for the activity/package, regardless of selected duration within itinerary.</p>
    </BaseItemForm>
  );
}

    