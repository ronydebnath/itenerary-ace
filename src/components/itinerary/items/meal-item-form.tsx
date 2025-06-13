
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

interface MealItemFormProps {
  item: MealItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  tripSettings: TripSettings;
  dayNumber: number;
  onUpdate: (item: MealItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
}

export function MealItemForm({ item, travelers, currency, tripSettings, dayNumber, onUpdate, onDelete }: MealItemFormProps) {
  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const { countries, getCountryById } = useCountries();
  const [mealServices, setMealServices] = React.useState<ServicePriceItem[]>([]);

  const itemCountry = React.useMemo(() => item.countryId ? getCountryById(item.countryId) : undefined, [item.countryId, getCountryById]);

  const getServicePriceById = React.useCallback((id: string) => {
    return allServicePrices.find(sp => sp.id === id);
  }, [allServicePrices]);

  const selectedService = React.useMemo(() => {
    if (item.selectedServicePriceId) {
      return getServicePriceById(item.selectedServicePriceId);
    }
    return undefined;
  }, [item.selectedServicePriceId, getServicePriceById]);

  React.useEffect(() => {
    if (isLoadingServices) {
      setMealServices([]);
      return;
    }
    let filteredServices = allServicePrices.filter(s => s.category === 'meal' && s.currency === currency);

    if (item.countryId) {
      filteredServices = filteredServices.filter(s => s.countryId === item.countryId || !s.countryId);
    } else if (tripSettings.selectedCountries.length > 0) {
      filteredServices = filteredServices.filter(s => !s.countryId || tripSettings.selectedCountries.includes(s.countryId));
    }

    if (item.province) {
      filteredServices = filteredServices.filter(s => s.province === item.province || !s.province);
    } else if (tripSettings.selectedProvinces.length > 0) {
         const relevantGlobalProvinces = (tripSettings.selectedCountries.length > 0)
            ? tripSettings.selectedProvinces.filter(provName => {
                const provObj = allServicePrices.find(sp => sp.province === provName);
                return provObj && provObj.countryId && tripSettings.selectedCountries.includes(provObj.countryId);
            })
            : tripSettings.selectedProvinces;
        if(relevantGlobalProvinces.length > 0){
             filteredServices = filteredServices.filter(s => !s.province || relevantGlobalProvinces.includes(s.province));
        }
    }
    setMealServices(filteredServices);
  }, [allServicePrices, currency, item.countryId, item.province, tripSettings.selectedCountries, tripSettings.selectedProvinces, isLoadingServices]);


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
      onUpdate({
        ...item,
        selectedServicePriceId: undefined,
        adultMealPrice: 0,
        childMealPrice: undefined,
        note: undefined,
      });
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
      } else {
         onUpdate({
          ...item,
          selectedServicePriceId: selectedValue,
          adultMealPrice: 0,
          childMealPrice: undefined,
          note: undefined,
        });
      }
    }
  };

  const serviceDefinitionNotFound = item.selectedServicePriceId && !selectedService && !isLoadingServices;
  const isPriceReadOnly = !!item.selectedServicePriceId && !!selectedService;
  const locationDisplay = item.countryName ? (item.province ? `${item.province}, ${item.countryName}` : item.countryName)
                        : (item.province || (tripSettings.selectedProvinces.length > 0 ? tripSettings.selectedProvinces.join('/') : (tripSettings.selectedCountries.length > 0 ? (tripSettings.selectedCountries.map(cid => countries.find(c=>c.id === cid)?.name).filter(Boolean).join('/')) : 'Any Location')));


  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} tripSettings={tripSettings} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Meal" dayNumber={dayNumber}>
      {(mealServices.length > 0 || item.selectedServicePriceId || isLoadingServices) && (
        <div className="mb-4">
          <FormField label={`Select Predefined Meal (${locationDisplay || 'Global'})`} id={`predefined-meal-${item.id}`}>
            {isLoadingServices ? (
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
                        {service.name} ({service.province || (service.countryId ? countries.find(c=>c.id === service.countryId)?.name : 'Generic')}) - {currency} {service.price1}
                        {service.price2 !== undefined ? ` / Ch: ${service.price2}` : ''}
                        {service.subCategory ? ` (${service.subCategory})` : ''}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            )}
          </FormField>
          {selectedService && <p className="text-xs text-muted-foreground pt-1">Using: {selectedService.name}{selectedService.subCategory ? ` (${selectedService.subCategory})` : ''}</p>}
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
        <FormField label={`Adult Meal Price (${currency})`} id={`adultMealPrice-${item.id}`}>
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
        </FormField>
        <FormField label={`Child Meal Price (${currency}) (Optional)`} id={`childMealPrice-${item.id}`}>
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
