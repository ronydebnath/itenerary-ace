
/**
 * @fileoverview This component provides a specialized form for defining and editing
 * activity service prices. It allows users to select predefined activity services,
 * manage multiple activity packages (each with its own pricing and scheduling), and
 * utilize an AI-powered parser to prefill package data from unstructured text.
 *
 * @bangla এই কম্পোনেন্টটি কার্যকলাপ পরিষেবা মূল্যের সংজ্ঞা এবং সম্পাদনার জন্য একটি বিশেষায়িত
 * ফর্ম সরবরাহ করে। এটি ব্যবহারকারীদের পূর্বনির্ধারিত কার্যকলাপ পরিষেবা নির্বাচন করতে,
 * একাধিক কার্যকলাপ প্যাকেজ (প্রতিটির নিজস্ব মূল্য এবং সময়সূচী সহ) পরিচালনা করতে এবং
 * অসংগঠিত টেক্সট থেকে প্যাকেজ ডেটা প্রিফিল করার জন্য একটি এআই-চালিত পার্সার ব্যবহার
 * করার অনুমতি দেয়।
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServicePrices } from '@/hooks/useServicePrices';
import type { ServicePriceFormValues } from './ServicePriceFormRouter';
import type { ActivityPackageDefinition, CurrencyCode } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useCountries } from '@/hooks/useCountries';
import { ActivityAIParser } from './partials/ActivityAIParser';
import { ActivityPackageFormSection } from './partials/ActivityPackageFormSection';
import type { ParseActivityTextOutput } from '@/types/ai-contract-schemas';


interface ActivityPriceFormProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
}

export function ActivityPriceForm({ form }: ActivityPriceFormProps) {
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const { countries } = useCountries();
  const [availableActivityServices, setAvailableActivityServices] = React.useState<any[]>([]);

  const currency = form.watch('currency') as CurrencyCode || 'THB';
  const province = form.watch('province');
  const countryId = form.watch('countryId');
  const activityNameForLegend = form.watch('name');

  React.useEffect(() => {
    if (!isLoadingServices) {
      let filtered = getServicePrices({ category: 'activity', currency });
      if (countryId) {
          filtered = filtered.filter(s => s.countryId === countryId || !s.countryId);
      }
      if (province) {
        filtered = filtered.filter(s => s.province === province || !s.province);
      }
      setAvailableActivityServices(filtered);
    }
  }, [isLoadingServices, getServicePrices, currency, province, countryId, form]);

  const handlePrefillFromAI = (parsedData: ParseActivityTextOutput, parsedCurrency?: string) => {
    const currentName = form.getValues('name');
    if (parsedData.activityName && (currentName === "New activity" || !currentName || !form.getValues('selectedServicePriceId'))) {
      form.setValue('name', parsedData.activityName, { shouldValidate: true });
    }
    if (parsedData.province && !form.getValues('province')) {
      form.setValue('province', parsedData.province, { shouldValidate: true });
    }

    const aiPackages = parsedData.parsedPackages || [];
    if (aiPackages.length > 0) {
      const newFormPackages: ActivityPackageDefinition[] = aiPackages.map((p, index) => ({
        id: generateGUID(),
        name: p.packageName || `Parsed Package ${index + 1}`,
        price1: p.adultPrice ?? 0,
        price2: p.childPrice,
        notes: p.notes || '',
        validityStartDate: new Date().toISOString().split('T')[0],
        validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        closedWeekdays: [],
        specificClosedDates: [],
      }));
      form.setValue('activityPackages', newFormPackages, { shouldValidate: true });
      if (parsedCurrency && parsedCurrency !== form.getValues('currency')) {
          form.setValue('currency', parsedCurrency as CurrencyCode, { shouldValidate: true });
      }
    }
    form.setValue('selectedServicePriceId', undefined, { shouldValidate: true }); // Clear predefined selection
  };

  const handlePredefinedServiceSelect = (serviceId: string) => {
    if (serviceId === "none") {
      form.setValue('selectedServicePriceId', undefined);
      if (!form.getValues('activityPackages') || form.getValues('activityPackages').length === 0) {
        form.setValue('activityPackages', [{
          id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '',
          validityStartDate: new Date().toISOString().split('T')[0],
          validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          closedWeekdays: [], specificClosedDates: []
        }]);
      }
    } else {
      const service = getServicePriceById(serviceId);
      if (service) {
        form.setValue('name', form.getValues('name') === "New activity" || !form.getValues('name') || !form.getValues('selectedServicePriceId') ? service.name : form.getValues('name'));
        form.setValue('selectedServicePriceId', service.id);
        if (service.activityPackages && service.activityPackages.length > 0) {
          form.setValue('activityPackages', service.activityPackages.map(pkg => ({...pkg, id: pkg.id || generateGUID()})), { shouldValidate: true });
        } else {
           form.setValue('activityPackages', [{
            id: generateGUID(), name: 'Standard Package', price1: service.price1 || 0, price2: service.price2, notes: service.notes || '',
            validityStartDate: new Date().toISOString().split('T')[0],
            validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            closedWeekdays: [], specificClosedDates: []
          }], { shouldValidate: true });
        }
      }
    }
  };

  const selectedServicePriceId = form.watch('selectedServicePriceId');
  const selectedServiceName = selectedServicePriceId ? getServicePriceById(selectedServicePriceId)?.name : null;

  return (
    <div className="space-y-4 md:space-y-6">
       {availableActivityServices.length > 0 && (
        <div className="border border-border rounded-md p-3 sm:p-4 relative">
          <p className="text-xs sm:text-sm font-semibold -mt-5 sm:-mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Predefined Services</p>
          <ShadcnFormField
            control={form.control}
            name="selectedServicePriceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm">Select Predefined Activity ({province || (countryId ? countries.find(c=>c.id===countryId)?.name : 'Any')})</FormLabel>
                <Select
                  onValueChange={(value) => handlePredefinedServiceSelect(value)}
                  value={field.value || "none"}
                  disabled={isLoadingServices}
                >
                  <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose activity..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">None (Custom Package/Price)</SelectItem>
                    {availableActivityServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.province || (service.countryId ? countries.find(c=>c.id === service.countryId)?.name : 'Generic')}) - {service.activityPackages?.length ? `${service.activityPackages.length} pkg(s)` : `${currency} ${service.price1 || 0}`}
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

      <ActivityPackageFormSection currency={currency} activityNameForLegend={activityNameForLegend} />
      
       {(form.formState.errors.price1 as any)?.message && (
        <div className="border border-destructive/50 bg-destructive/10 p-2 sm:p-3 rounded-md mt-2">
          <FormMessage className="text-xs text-destructive">
            If no packages are defined, ensure a "Default Adult Price" is provided. Error: {(form.formState.errors.price1 as any).message}
          </FormMessage>
        </div>
      )}
      <ActivityAIParser onPrefillData={handlePrefillFromAI} />
    </div>
  );
}
