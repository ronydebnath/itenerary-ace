
"use client";

import * as React from 'react';
import type { MealItem as MealItemType, Traveler, CurrencyCode, ServicePriceItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServicePrices } from '@/hooks/useServicePrices';

interface MealItemFormProps {
  item: MealItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  onUpdate: (item: MealItemType) => void;
  onDelete: () => void;
}

export function MealItemForm({ item, travelers, currency, onUpdate, onDelete }: MealItemFormProps) {
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const [mealServices, setMealServices] = React.useState<ServicePriceItem[]>([]);

  React.useEffect(() => {
    if (!isLoadingServices) {
      const allCategoryServices = getServicePrices('meal').filter(s => s.currency === currency);
      let filteredServices = allCategoryServices;
      if (item.province) {
        filteredServices = allCategoryServices.filter(s => s.province === item.province || !s.province);
      }
      setMealServices(filteredServices);
    }
  }, [isLoadingServices, getServicePrices, currency, item.province]);

  const handleNumericInputChange = (field: keyof MealItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onUpdate({ ...item, [field]: numValue, selectedServicePriceId: undefined });
  };

  const handlePredefinedServiceSelect = (selectedValue: string) => {
    if (selectedValue === "none") {
      onUpdate({
        ...item,
        selectedServicePriceId: undefined,
        adultMealPrice: 0,
        childMealPrice: undefined,
      });
    } else {
      const selectedService = getServicePriceById(selectedValue);
      if (selectedService) {
        onUpdate({
          ...item,
          name: item.name === `New meal` || !item.name || item.selectedServicePriceId ? selectedService.name : item.name,
          adultMealPrice: selectedService.price1,
          childMealPrice: selectedService.price2,
          selectedServicePriceId: selectedService.id,
          // Do not override item.province
        });
      }
    }
  };
  
  const selectedServiceName = item.selectedServicePriceId ? getServicePriceById(item.selectedServicePriceId)?.name : null;

  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Meal">
      {mealServices.length > 0 && (
        <div className="pt-2">
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
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {selectedServiceName && <p className="text-xs text-muted-foreground pt-1">Using: {selectedServiceName}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <FormField label={`Adult Meal Price (${currency})`} id={`adultMealPrice-${item.id}`}>
          <Input
            type="number"
            id={`adultMealPrice-${item.id}`}
            value={item.adultMealPrice ?? ''}
            onChange={(e) => handleNumericInputChange('adultMealPrice', e.target.value)}
            min="0"
            placeholder="0.00"
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
