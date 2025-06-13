/**
 * @fileoverview This component provides a specialized form for defining and editing
 * meal service prices. It allows users to select predefined meal services or enter
 * custom prices for adult and child meals, along with specifying the meal type.
 *
 * @bangla এই কম্পোনেন্টটি খাবার পরিষেবা মূল্যের সংজ্ঞা এবং সম্পাদনার জন্য একটি বিশেষায়িত
 * ফর্ম সরবরাহ করে। এটি ব্যবহারকারীদের পূর্বনির্ধারিত খাবার পরিষেবা নির্বাচন করতে বা প্রাপ্তবয়স্ক
 * এবং শিশুদের খাবারের জন্য কাস্টম মূল্য লিখতে এবং খাবারের ধরণ নির্দিষ্ট করার অনুমতি দেয়।
 */
"use client";

import * as React from 'react';
import { useFormContext } from "react-hook-form";
import {
  FormField as ShadcnFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServicePrices } from '@/hooks/useServicePrices';
import type { ServicePriceFormValues } from './ServicePriceFormRouter';
import { CURRENCIES } from '@/types/itinerary';

interface MealPriceFormProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
}

export function MealPriceForm({ form }: MealPriceFormProps) {
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const [availableMealServices, setAvailableMealServices] = React.useState<any[]>([]);

  const currency = form.watch('currency') || CURRENCIES[0];
  const province = form.watch('province');

  React.useEffect(() => {
    if (!isLoadingServices) {
      const allCategoryServices = getServicePrices('meal').filter(s => s.currency === currency);
      let filteredServices = allCategoryServices;
      if (province) {
        filteredServices = allCategoryServices.filter(s => s.province === province || !s.province);
      }
      setAvailableMealServices(filteredServices);
    }
  }, [isLoadingServices, getServicePrices, currency, province]);

  const handlePredefinedServiceSelect = (serviceId: string) => {
    if (serviceId === "none") {
      form.setValue('selectedServicePriceId', undefined);
      form.setValue('price1', 0, { shouldValidate: true });
      form.setValue('price2', undefined, { shouldValidate: true });
      form.setValue('subCategory', '', { shouldValidate: true });
    } else {
      const service = getServicePriceById(serviceId);
      if (service) {
        form.setValue('name', form.getValues('name') === "New meal" || !form.getValues('name') || !form.getValues('selectedServicePriceId') ? service.name : form.getValues('name'));
        form.setValue('selectedServicePriceId', service.id);
        form.setValue('price1', service.price1 || 0, { shouldValidate: true });
        form.setValue('price2', service.price2, { shouldValidate: true });
        form.setValue('subCategory', service.subCategory || '', { shouldValidate: true });
      }
    }
  };
  
  const selectedServicePriceId = form.watch('selectedServicePriceId');
  const selectedServiceName = selectedServicePriceId ? getServicePriceById(selectedServicePriceId)?.name : null;
  const isPriceReadOnly = !!selectedServicePriceId;

  return (
    <div className="space-y-6">
      {availableMealServices.length > 0 && (
        <div className="border border-border rounded-md p-4 relative">
          <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Predefined Meal Services</p>
          <ShadcnFormField
            control={form.control}
            name="selectedServicePriceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Predefined Meal ({province || 'Any Province'})</FormLabel>
                <Select
                  onValueChange={(value) => handlePredefinedServiceSelect(value)}
                  value={field.value || "none"}
                  disabled={isLoadingServices}
                >
                  <FormControl><SelectTrigger><SelectValue placeholder="Choose meal service..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">None (Custom Price)</SelectItem>
                    {availableMealServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.province || 'Generic'}) - {currency} {service.price1}
                        {service.price2 !== undefined ? `, Child: ${service.price2}` : ''}
                        {service.subCategory ? ` (${service.subCategory})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedServiceName && <p className="text-xs text-muted-foreground pt-1">Using: {selectedServiceName}</p>}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="border border-border rounded-md p-4 relative">
        <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Meal Pricing Details</p>
        <div className="space-y-4 pt-2">
          <ShadcnFormField
            control={form.control}
            name="subCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meal Type (e.g., Set Menu, Buffet, A La Carte Credit)</FormLabel>
                <FormControl><Input placeholder="Details..." {...field} value={field.value || ''} readOnly={isPriceReadOnly} className={isPriceReadOnly ? "bg-muted/50 cursor-not-allowed" : ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ShadcnFormField
              control={form.control}
              name="price1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adult Meal Price ({currency})</FormLabel>
                  <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} value={field.value ?? ''} readOnly={isPriceReadOnly} className={isPriceReadOnly ? "bg-muted/50 cursor-not-allowed" : ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ShadcnFormField
              control={form.control}
              name="price2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child Meal Price ({currency}) (Optional)</FormLabel>
                  <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} value={field.value ?? ''} readOnly={isPriceReadOnly} className={isPriceReadOnly ? "bg-muted/50 cursor-not-allowed" : ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
