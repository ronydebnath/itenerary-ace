/**
 * @fileoverview This component provides a form for adding or editing meal items
 * within an itinerary. It allows selection of predefined meal services and setting
 * prices for adult and child meals, along with the total number of meals.
 * It uses the `BaseItemForm` for common structure and traveler exclusion.
 *
 * @bangla এই কম্পোনেন্টটি একটি ভ্রমণপথের মধ্যে খাবার আইটেম যোগ বা সম্পাদনা করার জন্য
 * একটি ফর্ম সরবরাহ করে। এটি পূর্বনির্ধারিত খাবার পরিষেবা নির্বাচন এবং প্রাপ্তবয়স্ক ও
 * শিশুদের খাবারের জন্য মূল্য নির্ধারণের পাশাপাশি মোট খাবারের সংখ্যা নির্দিষ্ট করার অনুমতি দেয়।
 * এটি সাধারণ কাঠামো এবং ভ্রমণকারী বাদ দেওয়ার জন্য `BaseItemForm` ব্যবহার করে।
 */
"use client";

import * as React from 'react';
import type { MealItem as MealItemType, Traveler, CurrencyCode, ServicePriceItem, TripSettings, CountryItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useServicePrices } from '@/hooks/useServicePrices';
import { useCountries } from '@/hooks/useCountries';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { formatCurrency } from '@/lib/utils';

interface MealItemFormProps {
  item: MealItemType;
  travelers: Traveler[];
  currency: CurrencyCode; // Billing Currency
  tripSettings: TripSettings;
  dayNumber: number;
  onUpdate: (item: MealItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
  itemSummaryLine: React.ReactNode;
  isCurrentlyExpanded: boolean;
  onToggleExpand: () => void;
}

function MealItemFormComponent({
  item,
  travelers,
  currency: billingCurrency, 
  tripSettings,
  dayNumber,
  onUpdate,
  onDelete,
  allServicePrices: passedInAllServicePrices,
  itemSummaryLine,
  isCurrentlyExpanded,
  onToggleExpand
}: MealItemFormProps) {
  const { allServicePrices: hookServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const currentAllServicePrices = passedInAllServicePrices || hookServicePrices;
  const { countries, getCountryById } = useCountries();
  const { getRate } = useExchangeRates();
  const [mealServices, setMealServices] = React.useState<ServicePriceItem[]>([]);

  const determineItemSourceCurrency = React.useCallback(() => {
    const service = item.selectedServicePriceId ? currentAllServicePrices.find(sp => sp.id === item.selectedServicePriceId) : undefined;
    if (service) return service.currency;

    const itemCountryDef = item.countryId ? getCountryById(item.countryId) : 
                           (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0]) : undefined);
    if (itemCountryDef?.defaultCurrency) return itemCountryDef.defaultCurrency;
    
    return billingCurrency; // Fallback
  }, [item.selectedServicePriceId, item.countryId, currentAllServicePrices, getCountryById, tripSettings.selectedCountries, billingCurrency]);

  const [itemSourceCurrency, setItemSourceCurrency] = React.useState<CurrencyCode>(determineItemSourceCurrency());

  React.useEffect(() => {
    setItemSourceCurrency(determineItemSourceCurrency());
  }, [determineItemSourceCurrency]);

  const getServicePriceById = React.useCallback((id: string) => {
    return currentAllServicePrices.find(sp => sp.id === id);
  }, [currentAllServicePrices]);

  const selectedService = React.useMemo(() => {
    if (item.selectedServicePriceId) {
      return getServicePriceById(item.selectedServicePriceId);
    }
    return undefined;
  }, [item.selectedServicePriceId, getServicePriceById]);
  

  React.useEffect(() => {
    if (isLoadingServices && !passedInAllServicePrices) {
      setMealServices([]);
      return;
    }
    let filteredServices = currentAllServicePrices.filter(s => s.category === 'meal');
    
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
    setMealServices(filteredServices.sort((a,b) => a.name.localeCompare(b.name)));
  }, [currentAllServicePrices, itemSourceCurrency, item.countryId, item.province, tripSettings.selectedCountries, tripSettings.selectedProvinces, isLoadingServices, passedInAllServicePrices]);


  const handleNumericInputChange = (field: keyof MealItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onUpdate({
      ...item,
      [field]: numValue,
      selectedServicePriceId: (field === 'adultMealPrice' || field === 'childMealPrice') ? undefined : item.selectedServicePriceId,
    });
  };

  const handlePredefinedServiceSelect = (selectedValue: string) => {
    if (selectedValue === "none") {
      const newSourceCurrency = item.countryId ? getCountryById(item.countryId)?.defaultCurrency || billingCurrency : 
                               (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0])?.defaultCurrency || billingCurrency : billingCurrency);
      onUpdate({
        ...item,
        name: `New meal`,
        selectedServicePriceId: undefined,
        adultMealPrice: 0,
        childMealPrice: undefined,
        note: undefined,
        province: item.province,
        countryId: item.countryId,
        countryName: item.countryId ? countries.find(c => c.id === item.countryId)?.name : undefined,
      });
      setItemSourceCurrency(newSourceCurrency);
    } else {
      const service = getServicePriceById(selectedValue);
      if (service) {
        onUpdate({
          ...item,
          name: item.name === `New meal` || !item.name || !item.selectedServicePriceId ? service.name : item.name,
          adultMealPrice: service.price1 ?? 0,
          childMealPrice: service.price2 ?? undefined,
          selectedServicePriceId: service.id,
          note: service.notes || undefined,
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
          name: `New meal`,
          selectedServicePriceId: selectedValue,
          adultMealPrice: 0,
          childMealPrice: undefined,
          note: undefined,
        });
        setItemSourceCurrency(fallbackSourceCurrency);
      }
    }
  };

  const actualLoadingState = passedInAllServicePrices ? false : isLoadingServices;
  const serviceDefinitionNotFound = item.selectedServicePriceId && !selectedService && !actualLoadingState;
  const isPriceReadOnly = !!item.selectedServicePriceId && !!selectedService;

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

  const conversionDetails = (itemSourceCurrency !== billingCurrency && getRate) ? getRate(itemSourceCurrency, billingCurrency) : null;
  const adultPriceConverted = item.adultMealPrice !== undefined && conversionDetails ? item.adultMealPrice * conversionDetails.finalRate : null;
  const childPriceConverted = item.childMealPrice !== undefined && conversionDetails ? item.childMealPrice * conversionDetails.finalRate : null;

  return (
    <BaseItemForm
      item={item}
      travelers={travelers}
      currency={billingCurrency}
      tripSettings={tripSettings}
      onUpdate={onUpdate as any}
      onDelete={onDelete}
      itemTypeLabel="Meal"
      dayNumber={dayNumber}
      itemSummaryLine={itemSummaryLine}
      isCurrentlyExpanded={isCurrentlyExpanded}
      onToggleExpand={onToggleExpand}
    >
      {(mealServices.length > 0 || item.selectedServicePriceId || actualLoadingState) && (
        <div className="mb-4">
          <FormField label={`Select Predefined Meal (${locationContext} - ${itemSourceCurrency})`} id={`predefined-meal-${item.id}`}>
            {actualLoadingState ? (
                 <div className="flex items-center h-10 border rounded-md px-3 bg-muted/50">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading meals...</span>
                </div>
            ) : (
                <Select
                value={item.selectedServicePriceId || "none"}
                onValueChange={handlePredefinedServiceSelect}
                disabled={mealServices.length === 0 && !item.selectedServicePriceId}
                >
                <SelectTrigger>
                    <SelectValue placeholder={mealServices.length === 0 && !item.selectedServicePriceId ? "No meals match criteria" : "Choose a predefined meal..."} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None (Custom Price)</SelectItem>
                    {mealServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.province || (service.countryId ? countries.find(c=>c.id === service.countryId)?.name : 'Generic')}) - {service.currency} {service.price1}
                        {service.price2 !== undefined ? ` / Ch: ${service.price2}` : ''}
                        {service.subCategory ? ` (${service.subCategory})` : ''}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            )}
          </FormField>
          {selectedService && <p className="text-xs text-muted-foreground pt-1">Using: {selectedService.name}{selectedService.subCategory ? ` (${selectedService.subCategory})` : ''} (Priced in {selectedService.currency})</p>}
        </div>
      )}

      {serviceDefinitionNotFound && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            The selected meal service (ID: {item.selectedServicePriceId}) could not be found. Please choose another or set a custom price.
          </AlertDescription>
        </Alert>
      )}
       {itemSourceCurrency !== billingCurrency && selectedService && (
        <p className="text-xs text-blue-600 mb-2">Note: Prices shown in {itemSourceCurrency}. Final cost will be converted to {billingCurrency}.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-3 sm:gap-4 mb-4">
        <FormField label="Meal Name / Restaurant" id={`itemName-${item.id}`} className="md:col-span-1">
            <Input
            id={`itemName-${item.id}`}
            value={item.name}
            onChange={(e) => onUpdate({ ...item, name: e.target.value })}
            placeholder={`e.g., Hotel Breakfast, Seafood Dinner`}
            className="h-9 text-sm"
            />
        </FormField>
        <FormField label="Note (Optional)" id={`itemNote-${item.id}`} className="md:col-span-1">
            <Input
            id={`itemNote-${item.id}`}
            value={item.note || ''}
            onChange={(e) => onUpdate({ ...item, note: e.target.value })}
            placeholder={`e.g., Vegetarian option, specific time`}
            className="h-9 text-sm"
            />
        </FormField>
      </div>

      <Separator className="my-4" />
      <div className="space-y-1 mb-2">
          <p className="text-sm font-medium text-muted-foreground">Configuration Details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label={`Adult Meal Price (${itemSourceCurrency})`} id={`adultMealPrice-${item.id}`}>
          <Input
            type="number"
            id={`adultMealPrice-${item.id}`}
            value={item.adultMealPrice ?? ''}
            onChange={(e) => handleNumericInputChange('adultMealPrice', e.target.value)}
            min="0"
            placeholder="0.00"
            readOnly={isPriceReadOnly}
            className={isPriceReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}
          />
          {conversionDetails && adultPriceConverted !== null && !isPriceReadOnly && (
            <p className="text-xs text-muted-foreground mt-1">Approx. {formatCurrency(adultPriceConverted, billingCurrency)}</p>
          )}
        </FormField>
        <FormField label={`Child Meal Price (${itemSourceCurrency}) (Optional)`} id={`childMealPrice-${item.id}`}>
          <Input
            type="number"
            id={`childMealPrice-${item.id}`}
            value={item.childMealPrice ?? ''}
            onChange={(e) => handleNumericInputChange('childMealPrice', e.target.value)}
            min="0"
            placeholder="Defaults to adult price"
            readOnly={isPriceReadOnly}
            className={isPriceReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}
          />
           {conversionDetails && childPriceConverted !== null && !isPriceReadOnly && (
            <p className="text-xs text-muted-foreground mt-1">Approx. {formatCurrency(childPriceConverted, billingCurrency)}</p>
          )}
        </FormField>
        <FormField label="# of Meals (Units)" id={`totalMeals-${item.id}`}>
          <Input
            type="number"
            id={`totalMeals-${item.id}`}
            value={item.totalMeals ?? ''}
            onChange={(e) => handleNumericInputChange('totalMeals', e.target.value)}
            min="1"
            placeholder="1"
          />
        </FormField>
      </div>
    </BaseItemForm>
  );
}

export const MealItemForm = React.memo(MealItemFormComponent);
    
