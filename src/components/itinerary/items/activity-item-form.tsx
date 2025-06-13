
"use client";

import * as React from 'react';
import type { ActivityItem as ActivityItemType, Traveler, CurrencyCode, TripSettings, ServicePriceItem, ActivityPackageDefinition, CountryItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { CalendarDays, Info, Tag, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useServicePrices } from '@/hooks/useServicePrices';
import { useCountries } from '@/hooks/useCountries'; // Added

interface ActivityItemFormProps {
  item: ActivityItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  dayNumber: number;
  tripSettings: TripSettings;
  onUpdate: (item: ActivityItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
}

const WEEKDAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ActivityItemForm({ item, travelers, currency, dayNumber, tripSettings, onUpdate, onDelete }: ActivityItemFormProps) {
  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const { countries, getCountryById } = useCountries(); // Added
  const [activityServices, setActivityServices] = React.useState<ServicePriceItem[]>([]);

  const itemCountry = React.useMemo(() => item.countryId ? getCountryById(item.countryId) : undefined, [item.countryId, getCountryById]);

  const getServicePriceById = React.useCallback((id: string) => {
    return allServicePrices.find(sp => sp.id === id);
  }, [allServicePrices]);

  const selectedActivityService = React.useMemo(() => {
    if (item.selectedServicePriceId) {
      return getServicePriceById(item.selectedServicePriceId);
    }
    return undefined;
  }, [item.selectedServicePriceId, getServicePriceById]);

  const selectedPackage = React.useMemo(() => {
    if (selectedActivityService && item.selectedPackageId) {
      return selectedActivityService.activityPackages?.find(p => p.id === item.selectedPackageId);
    }
    return undefined;
  }, [selectedActivityService, item.selectedPackageId]);

  React.useEffect(() => {
    if (isLoadingServices) {
      setActivityServices([]);
      return;
    }
    let filteredServices = allServicePrices.filter(s => s.category === 'activity' && s.currency === currency);

    // Filter by item's specific country if set
    if (item.countryId) {
      filteredServices = filteredServices.filter(s => s.countryId === item.countryId || !s.countryId); // Allow generic services too
    } else if (tripSettings.selectedCountries.length > 0) { // Else, filter by global countries
      filteredServices = filteredServices.filter(s => !s.countryId || tripSettings.selectedCountries.includes(s.countryId));
    }

    // Then filter by item's specific province if set
    if (item.province) {
      filteredServices = filteredServices.filter(s => s.province === item.province || !s.province); // Allow generic services too
    } else if (tripSettings.selectedProvinces.length > 0) { // Else, filter by global provinces
        // Ensure global provinces are within selected countries if countries are also selected
        const relevantGlobalProvinces = (tripSettings.selectedCountries.length > 0)
            ? tripSettings.selectedProvinces.filter(provName => {
                const provObj = allServicePrices.find(sp => sp.province === provName); // This is a bit indirect; better to use useProvinces hook
                return provObj && provObj.countryId && tripSettings.selectedCountries.includes(provObj.countryId);
            })
            : tripSettings.selectedProvinces;
        if(relevantGlobalProvinces.length > 0) {
             filteredServices = filteredServices.filter(s => !s.province || relevantGlobalProvinces.includes(s.province));
        }
    }
    setActivityServices(filteredServices);
  }, [allServicePrices, currency, item.countryId, item.province, tripSettings.selectedCountries, tripSettings.selectedProvinces, isLoadingServices]);


  const handleNumericInputChange = (field: keyof ActivityItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onUpdate({
        ...item,
        [field]: numValue,
        selectedServicePriceId: field === 'adultPrice' || field === 'childPrice' ? undefined : item.selectedServicePriceId,
        selectedPackageId: field === 'adultPrice' || field === 'childPrice' ? undefined : item.selectedPackageId,
    });
  };

  const handleEndDayChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
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
        note: undefined,
      });
    } else {
      const service = getServicePriceById(selectedValue);
      if (service) {
        const defaultPackage = service.activityPackages && service.activityPackages.length > 0 ? service.activityPackages[0] : undefined;
        onUpdate({
          ...item,
          name: item.name === `New activity` || !item.name || !item.selectedServicePriceId ? service.name : item.name,
          selectedServicePriceId: service.id,
          selectedPackageId: defaultPackage?.id,
          adultPrice: defaultPackage?.price1 ?? service.price1 ?? 0,
          childPrice: defaultPackage?.price2 ?? service.price2 ?? undefined,
          note: defaultPackage?.notes || service.notes || undefined,
          province: service.province || item.province,
          countryId: service.countryId || item.countryId,
          countryName: service.countryId ? countries.find(c => c.id === service.countryId)?.name : item.countryName,
        });
      } else {
        onUpdate({
          ...item,
          selectedServicePriceId: selectedValue,
          selectedPackageId: undefined,
          adultPrice: 0,
          childPrice: undefined,
          note: undefined,
        });
      }
    }
  };

  const handlePackageSelect = (packageId: string) => {
    if (!selectedActivityService) return;

    if (packageId === "none" || !selectedActivityService.activityPackages) {
      onUpdate({
        ...item,
        selectedPackageId: undefined,
        adultPrice: selectedActivityService.price1 ?? 0,
        childPrice: selectedActivityService.price2 ?? undefined,
        note: selectedActivityService.notes || undefined,
      });
    } else {
      const pkg = selectedActivityService.activityPackages.find(p => p.id === packageId);
      if (pkg) {
        onUpdate({
          ...item,
          selectedPackageId: pkg.id,
          adultPrice: pkg.price1,
          childPrice: pkg.price2,
          note: pkg.notes || selectedActivityService.notes || undefined,
        });
      }
    }
  };

  const calculatedEndDay = item.endDay || dayNumber;
  const duration = Math.max(1, calculatedEndDay - dayNumber + 1);

  const isPriceReadOnly = !!(item.selectedPackageId && selectedActivityService?.activityPackages?.length && selectedPackage) ||
                         !!(item.selectedServicePriceId && selectedActivityService && (!selectedActivityService.activityPackages || selectedActivityService.activityPackages.length === 0));

  const serviceDefinitionNotFound = item.selectedServicePriceId && !selectedActivityService && !isLoadingServices;
  
  const locationDisplay = item.countryName ? (item.province ? `${item.province}, ${item.countryName}` : item.countryName)
                        : (item.province || (tripSettings.selectedProvinces.length > 0 ? tripSettings.selectedProvinces.join('/') : (tripSettings.selectedCountries.length > 0 ? (tripSettings.selectedCountries.map(cid => countries.find(c=>c.id === cid)?.name).filter(Boolean).join('/')) : 'Any Location')));


  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} tripSettings={tripSettings} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Activity" dayNumber={dayNumber}>
      {(activityServices.length > 0 || item.selectedServicePriceId || isLoadingServices) && (
        <div className="mt-4 pt-4 border-t">
          <FormField label={`Select Predefined Activity (${locationDisplay || 'Global'})`} id={`predefined-activity-${item.id}`}>
            {isLoadingServices ? (
                 <div className="flex items-center h-10 border rounded-md px-3 bg-muted/50">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading activities...</span>
                </div>
            ) : (
                <Select
                value={item.selectedServicePriceId || "none"}
                onValueChange={handlePredefinedServiceSelect}
                disabled={activityServices.length === 0 && !item.selectedServicePriceId}
                >
                <SelectTrigger>
                    <SelectValue placeholder={activityServices.length === 0 && !item.selectedServicePriceId ? "No activities match criteria" : "Choose an activity or set custom price..."} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None (Custom Price)</SelectItem>
                    {activityServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.province || (service.countryId ? countries.find(c=>c.id === service.countryId)?.name : 'Generic')})
                        {service.activityPackages && service.activityPackages.length > 0
                        ? ` - ${service.activityPackages.length} pkg(s)`
                        : service.price1 !== undefined ? ` - ${currency} ${service.price1}` : ''}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            )}
          </FormField>
          {selectedActivityService && <p className="text-xs text-muted-foreground pt-1">Using: {selectedActivityService.name}</p>}

          {selectedActivityService && selectedActivityService.activityPackages && selectedActivityService.activityPackages.length > 0 && (
            <div className="mt-3">
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
            </div>
          )}
        </div>
      )}

      {serviceDefinitionNotFound && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            The selected activity (ID: {item.selectedServicePriceId}) could not be found. Please choose another or set a custom price.
          </AlertDescription>
        </Alert>
      )}

      {selectedPackage && selectedActivityService && (
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

      <Separator className="my-4" />
      <div className="space-y-1 mb-2">
          <p className="text-sm font-medium text-muted-foreground">Configuration Details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 mt-3 p-3 bg-muted/30 rounded-md border">
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
