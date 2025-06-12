
"use client";

import * as React from 'react';
import type { MealItem as MealItemType, Traveler, CurrencyCode, ServicePriceItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator'; // Added Separator

interface MealItemFormProps {
  item: MealItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  onUpdate: (item: MealItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
}

export function MealItemForm({ item, travelers, currency, onUpdate, onDelete, allServicePrices }: MealItemFormProps) {
  const [mealServices, setMealServices] = React.useState<ServicePriceItem[]>([]);

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
    const allCategoryServices = allServicePrices.filter(s => s.category === 'meal' && s.currency === currency);
    let filteredServices = allCategoryServices;
    if (item.province) {
      filteredServices = allCategoryServices.filter(s => s.province === item.province || !s.province);
    }
    setMealServices(filteredServices);
  }, [allServicePrices, currency, item.province]);

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
  
  const serviceDefinitionNotFound = item.selectedServicePriceId && !selectedService;
  const isPriceReadOnly = !!item.selectedServicePriceId && !!selectedService;


  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Meal">
      {(mealServices.length > 0 || item.selectedServicePriceId) && (
        <div className="mt-4 pt-4 border-t">
          <FormField label={`Select Predefined Meal (${item.province || 'Any Province'})`} id={`predefined-meal-${item.id}`}>
            <Select
              value={item.selectedServicePriceId || "none"}
              onValueChange={handlePredefinedServiceSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a predefined meal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Custom Price)</SelectItem>
                {mealServices.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.province || 'Generic'}) - {currency} {service.price1}
                    {service.price2 !== undefined ? ` / Ch: ${service.price2}` : ''}
                    {service.subCategory ? ` (${service.subCategory})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {selectedService && <p className="text-xs text-muted-foreground pt-1">Using: {selectedService.name}{selectedService.subCategory ? ` (${selectedService.subCategory})` : ''}</p>}
        </div>
      )}

      {serviceDefinitionNotFound && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            The selected meal service (ID: {item.selectedServicePriceId}) could not be found. Please choose another or set a custom price.
          </AlertDescription>
        </Alert>
      )}

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

