
/**
 * @fileoverview This component provides a form for adding or editing activity items
 * within an itinerary. It allows selection of predefined activity services, management
 * of activity packages (if applicable), and setting prices. It utilizes the
 * `BaseItemForm` for common structure and traveler exclusion logic.
 *
 * @bangla এই কম্পোনেন্টটি একটি ভ্রমণপথের মধ্যে কার্যকলাপ আইটেম যোগ বা সম্পাদনা করার
 * জন্য একটি ফর্ম সরবরাহ করে। এটি পূর্বনির্ধারিত কার্যকলাপ পরিষেবা নির্বাচন, কার্যকলাপ
 * প্যাকেজ পরিচালনা (যদি প্রযোজ্য হয়) এবং মূল্য নির্ধারণের অনুমতি দেয়। এটি সাধারণ
 * কাঠামো এবং ভ্রমণকারী বাদ দেওয়ার যুক্তির জন্য `BaseItemForm` ব্যবহার করে।
 */
"use client";

import * as React from 'react';
import type { ActivityItem as ActivityItemType, Traveler, CurrencyCode, TripSettings, ServicePriceItem, CountryItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { format as formatDateFns, parseISO, isValid } from 'date-fns';
import { CalendarDays, Info, Tag, AlertCircle, Loader2, Star } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useServicePrices } from '@/hooks/useServicePrices';
import { useCountries } from '@/hooks/useCountries';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { formatCurrency, cn } from '@/lib/utils';

interface ActivityItemFormProps {
  item: ActivityItemType;
  travelers: Traveler[];
  currency: CurrencyCode; // Billing Currency
  dayNumber: number;
  tripSettings: TripSettings;
  onUpdate: (item: ActivityItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
  itemSummaryLine: React.ReactNode;
  isCurrentlyExpanded: boolean;
  onToggleExpand: () => void;
}

const WEEKDAYS_MAP = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ActivityItemFormComponent({
  item,
  travelers,
  currency: billingCurrency, 
  dayNumber,
  tripSettings,
  onUpdate,
  onDelete,
  allServicePrices: passedInAllServicePrices,
  itemSummaryLine,
  isCurrentlyExpanded,
  onToggleExpand
}: ActivityItemFormProps) {
  const { allServicePrices: hookServicePrices, isLoading: isLoadingServicesHook } = useServicePrices();
  const currentAllServicePrices = passedInAllServicePrices || hookServicePrices;
  const { countries, getCountryById } = useCountries();
  const { getRate, isLoading: isLoadingExchangeRates } = useExchangeRates();
  const [activityServices, setActivityServices] = React.useState<ServicePriceItem[]>([]);
  
  const determineItemSourceCurrency = React.useCallback((): CurrencyCode => {
    const service = item.selectedServicePriceId ? currentAllServicePrices.find(sp => sp.id === item.selectedServicePriceId) : undefined;
    if (service) return service.currency;

    const itemCountryDef = item.countryId ? getCountryById(item.countryId) : 
                           (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0]) : undefined);
    if (itemCountryDef?.defaultCurrency) return itemCountryDef.defaultCurrency;
    
    return billingCurrency; 
  }, [item.selectedServicePriceId, item.countryId, currentAllServicePrices, getCountryById, tripSettings.selectedCountries, billingCurrency]);

  const [itemSourceCurrency, setItemSourceCurrency] = React.useState<CurrencyCode>(determineItemSourceCurrency());

  React.useEffect(() => {
    setItemSourceCurrency(determineItemSourceCurrency());
  }, [determineItemSourceCurrency]);


  const getServicePriceById = React.useCallback((id: string) => {
    return currentAllServicePrices.find(sp => sp.id === id);
  }, [currentAllServicePrices]);

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

  const isLoadingServices = passedInAllServicePrices ? false : isLoadingServicesHook;

  React.useEffect(() => {
    if (isLoadingServices) {
      setActivityServices([]);
      return;
    }
    let filteredServices = currentAllServicePrices.filter(s => s.category === 'activity');
    
    const currencyToFilterBy = itemSourceCurrency;
    filteredServices = filteredServices.filter(s => s.currency === currencyToFilterBy);

    const countryIdToFilterBy = item.countryId || (tripSettings.selectedCountries.length === 1 ? tripSettings.selectedCountries[0] : undefined);
    const provincesToFilterBy = item.province ? [item.province] : tripSettings.selectedProvinces;

    if (countryIdToFilterBy) {
      filteredServices = filteredServices.filter(s => s.countryId === countryIdToFilterBy || !s.countryId);
    } else if (tripSettings.selectedCountries.length > 0) {
      filteredServices = filteredServices.filter(s => !s.countryId || tripSettings.selectedCountries.includes(s.countryId));
    }

    if (provincesToFilterBy.length > 0) {
         filteredServices = filteredServices.filter(s => !s.province || provincesToFilterBy.includes(s.province));
    }
    setActivityServices(filteredServices.sort((a,b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
    }));
  }, [currentAllServicePrices, itemSourceCurrency, item.countryId, item.province, tripSettings.selectedCountries, tripSettings.selectedProvinces, isLoadingServices]);


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
      const newSourceCurrency = item.countryId ? getCountryById(item.countryId)?.defaultCurrency || billingCurrency : 
                               (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0])?.defaultCurrency || billingCurrency : billingCurrency);
      onUpdate({
        ...item,
        name: `New activity`,
        selectedServicePriceId: undefined,
        selectedPackageId: undefined,
        adultPrice: 0,
        childPrice: undefined,
        note: undefined,
        province: item.province,
        countryId: item.countryId,
        countryName: item.countryId ? countries.find(c => c.id === item.countryId)?.name : undefined,
      });
      setItemSourceCurrency(newSourceCurrency);
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
        setItemSourceCurrency(service.currency);
      } else {
        const fallbackSourceCurrency = item.countryId ? getCountryById(item.countryId)?.defaultCurrency || billingCurrency : 
                                     (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0])?.defaultCurrency || billingCurrency : billingCurrency);
        onUpdate({
          ...item,
          name: `New activity`,
          selectedServicePriceId: selectedValue, 
          selectedPackageId: undefined,
          adultPrice: 0,
          childPrice: undefined,
          note: undefined,
        });
        setItemSourceCurrency(fallbackSourceCurrency);
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

  const itemCountryName = item.countryId ? countries.find(c => c.id === item.countryId)?.name : undefined;
  const globalCountryNames = tripSettings.selectedCountries.map(id => countries.find(c => c.id === id)?.name).filter(Boolean) as string[];
  let locationContext = "Global";
  if (itemCountryName) {
    locationContext = item.province ? `${item.province}, ${itemCountryName}` : itemCountryName;
  } else if (globalCountryNames.length > 0) {
    locationContext = tripSettings.selectedProvinces.length > 0
      ? `${tripSettings.selectedProvinces.join('/')} (${globalCountryNames.join('/')})`
      : globalCountryNames.join('/');
  } else if (tripSettings.selectedProvinces.length > 0) {
    locationContext = tripSettings.selectedProvinces.join('/');
  }

  const conversionDetails = (itemSourceCurrency !== billingCurrency && getRate && !isLoadingExchangeRates) ? getRate(itemSourceCurrency, billingCurrency) : null;
  const adultPriceConverted = item.adultPrice !== undefined && conversionDetails ? item.adultPrice * conversionDetails.finalRate : null;
  const childPriceConverted = item.childPrice !== undefined && conversionDetails ? item.childPrice * conversionDetails.finalRate : null;


  return (
    <BaseItemForm
      item={item}
      travelers={travelers}
      currency={billingCurrency}
      tripSettings={tripSettings}
      onUpdate={onUpdate as any}
      onDelete={onDelete}
      itemTypeLabel="Activity"
      dayNumber={dayNumber}
      itemSummaryLine={itemSummaryLine}
      isCurrentlyExpanded={isCurrentlyExpanded}
      onToggleExpand={onToggleExpand}
    >
        {(activityServices.length > 0 || item.selectedServicePriceId || isLoadingServices) && (
            <div className="mb-4">
            <FormField label={`Select Predefined Activity (${locationContext} - ${itemSourceCurrency})`} id={`predefined-activity-${item.id}`}>
                {isLoadingServices && !passedInAllServicePrices ? (
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
                        <SelectValue placeholder={activityServices.length === 0 && !item.selectedServicePriceId ? "No activities match criteria" : "Choose an activity..."} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None (Custom Price)</SelectItem>
                        {activityServices.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                            {service.isFavorite && <Star className="inline-block h-3 w-3 mr-1.5 text-amber-400 fill-amber-400" />}
                            {service.name} ({service.province || (service.countryId ? countries.find(c=>c.id === service.countryId)?.name : 'Generic')})
                            {service.activityPackages && service.activityPackages.length > 0
                            ? ` - ${service.activityPackages.length} pkg(s)`
                            : service.price1 !== undefined ? ` - ${service.currency} ${service.price1}` : ''}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                )}
            </FormField>
            {selectedActivityService && <p className="text-xs text-muted-foreground pt-1">Using: {selectedActivityService.name} (Priced in {selectedActivityService.currency})</p>}
            </div>
        )}


        {selectedActivityService && selectedActivityService.activityPackages && selectedActivityService.activityPackages.length > 0 && (
        <div className="mb-4">
            <FormField label={`Select Package (from ${selectedActivityService.name})`} id={`activity-package-${item.id}`}>
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
                    {pkg.name} - {itemSourceCurrency} {pkg.price1}
                    {pkg.price2 !== undefined ? ` / Ch: ${pkg.price2}` : ''}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            </FormField>
        </div>
        )}

      {serviceDefinitionNotFound && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            The selected activity (ID: {item.selectedServicePriceId}) could not be found. Please choose another or set a custom price.
          </AlertDescription>
        </Alert>
      )}
      {itemSourceCurrency !== billingCurrency && (selectedActivityService || selectedPackage) && conversionDetails && !isLoadingExchangeRates && (
        <p className="text-xs text-blue-600 mb-2">Note: Prices shown in {itemSourceCurrency}. Totals converted to {billingCurrency} using rate ~{conversionDetails.finalRate.toFixed(4)}.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-3 sm:gap-4 mb-4">
        <FormField label="Activity Name / Description" id={`itemName-${item.id}`} className="md:col-span-1">
            <Input
            id={`itemName-${item.id}`}
            value={item.name}
            onChange={(e) => onUpdate({ ...item, name: e.target.value })}
            placeholder={`e.g., City Tour, Snorkeling Trip`}
            className="h-9 text-sm"
            />
        </FormField>
        <FormField label="Note (Optional)" id={`itemNote-${item.id}`} className="md:col-span-1">
            <Input
            id={`itemNote-${item.id}`}
            value={item.note || ''}
            onChange={(e) => onUpdate({ ...item, note: e.target.value })}
            placeholder={`e.g., Meet at lobby, bring swimwear`}
            className="h-9 text-sm"
            />
        </FormField>
      </div>

      {selectedPackage && selectedActivityService && (
        <div className="mb-4 p-3 border rounded-md bg-muted/30 space-y-2 text-sm">
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
                  <p>Valid: {formatDateFns(parseISO(selectedPackage.validityStartDate), 'dd MMM yyyy')} - {formatDateFns(parseISO(selectedPackage.validityEndDate), 'dd MMM yyyy')}</p>
                )}
                {selectedPackage.closedWeekdays && selectedPackage.closedWeekdays.length > 0 && (
                  <p>Closed on: {selectedPackage.closedWeekdays.map(d => WEEKDAYS_MAP[d]).join(', ')}</p>
                )}
                {selectedPackage.specificClosedDates && selectedPackage.specificClosedDates.length > 0 && (
                  <p>Specific Closures: {selectedPackage.specificClosedDates.map(d => isValid(parseISO(d)) ? formatDateFns(parseISO(d), 'dd MMM') : d).join(', ')}</p>
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
        <FormField label={`Adult Price (${itemSourceCurrency})`} id={`adultPrice-${item.id}`}>
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
           {conversionDetails && adultPriceConverted !== null && !isLoadingExchangeRates && (
            <p className="text-xs text-muted-foreground mt-1">Approx. {formatCurrency(adultPriceConverted, billingCurrency)}</p>
          )}
        </FormField>
        <FormField label={`Child Price (${itemSourceCurrency}) (Optional)`} id={`childPrice-${item.id}`}>
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
          {conversionDetails && childPriceConverted !== null && !isLoadingExchangeRates && (
            <p className="text-xs text-muted-foreground mt-1">Approx. {formatCurrency(childPriceConverted, billingCurrency)}</p>
          )}
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
export const ActivityItemForm = React.memo(ActivityItemFormComponent);
    
