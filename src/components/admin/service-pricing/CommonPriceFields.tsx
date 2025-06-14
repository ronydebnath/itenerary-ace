
/**
 * @fileoverview This component renders the common input fields shared across various
 * service price forms, such as country, province, category, name, currency, and notes.
 * It helps in centralizing the logic for these basic details to avoid repetition.
 *
 * @bangla এই কম্পোনেন্টটি বিভিন্ন পরিষেবা মূল্য ফর্ম জুড়ে ব্যবহৃত সাধারণ ইনপুট ক্ষেত্রগুলি
 * (যেমন দেশ, প্রদেশ, বিভাগ, নাম, মুদ্রা এবং নোট) রেন্ডার করে। এটি পুনরাবৃত্তি এড়াতে
 * এই মৌলিক বিবরণগুলির জন্য যুক্তিকে কেন্দ্রীভূত করতে সহায়তা করে।
 */
"use client";

import * as React from 'react';
import { useFormContext, useWatch } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProvinces } from '@/hooks/useProvinces';
import { useCountries } from '@/hooks/useCountries';
import { CURRENCIES, SERVICE_CATEGORIES, type CountryItem, type ProvinceItem, type CurrencyCode, ItineraryItemType } from '@/types/itinerary';
import type { ServicePriceFormValues } from './ServicePriceFormRouter';
import { Loader2 } from 'lucide-react';

interface CommonPriceFieldsProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
}

export function CommonPriceFields({ form }: CommonPriceFieldsProps) {
  const { countries, isLoading: isLoadingCountries, getCountryById } = useCountries();
  const { provinces, isLoading: isLoadingProvinces, getProvincesByCountry } = useProvinces();

  const selectedCountryId = useWatch({ control: form.control, name: "countryId" });
  const [filteredProvinces, setFilteredProvinces] = React.useState<ProvinceItem[]>([]);
  const selectedCategory = form.watch("category") as ItineraryItemType;

  React.useEffect(() => {
    if (selectedCountryId && !isLoadingProvinces) {
      setFilteredProvinces(getProvincesByCountry(selectedCountryId));
      const selectedCountryDetails = getCountryById(selectedCountryId);
      if (selectedCountryDetails?.defaultCurrency) {
        if (selectedCategory !== 'misc') {
            if (form.getValues('currency') !== selectedCountryDetails.defaultCurrency) {
              form.setValue('currency', selectedCountryDetails.defaultCurrency, { shouldValidate: true });
            }
        }
      }
    } else if (!selectedCountryId) {
      setFilteredProvinces([]);
    }

    const currentProvinceName = form.getValues('province');
    if (selectedCountryId && currentProvinceName) {
        const currentCountryProvinces = getProvincesByCountry(selectedCountryId);
        const currentProvinceIsListed = currentCountryProvinces.some(p => p.name === currentProvinceName);
        if(!currentProvinceIsListed) {
            form.setValue('province', undefined, { shouldValidate: true });
        }
    } else if (!selectedCountryId) {
         form.setValue('province', undefined, { shouldValidate: true });
    }

  }, [selectedCountryId, isLoadingProvinces, getProvincesByCountry, form, getCountryById, selectedCategory]);


  React.useEffect(() => {
    if (selectedCategory === 'hotel' && !form.getValues('countryId') && !isLoadingCountries && countries.length > 0) {
      const thailand = countries.find(c => c.name === "Thailand");
      if (thailand) {
        form.setValue('countryId', thailand.id, { shouldValidate: true });
        if (thailand.defaultCurrency && selectedCategory !== 'misc') { 
          form.setValue('currency', thailand.defaultCurrency, { shouldValidate: true });
        }
      }
    }
  }, [selectedCategory, form, countries, isLoadingCountries]);

  const isCurrencyAutoSet = !!getCountryById(selectedCountryId)?.defaultCurrency &&
                           (selectedCategory === 'hotel' ||
                            selectedCategory === 'activity' ||
                            selectedCategory === 'transfer' ||
                            selectedCategory === 'meal');

  return (
    <div className="border border-border rounded-lg p-3 sm:p-4 relative bg-card shadow-sm">
      <legend className="text-sm font-semibold -mt-5 sm:-mt-6 ml-2 px-1 bg-card inline-block absolute left-2 top-[-0.7rem] mb-3 sm:mb-4 text-primary">Basic Service Details</legend>
      <div className="space-y-3 sm:space-y-4 pt-2">
        <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
            <FormItem>
                <FormLabel className="text-xs sm:text-sm">Category</FormLabel>
                <Select
                onValueChange={(value) => {
                    field.onChange(value);
                    const country = getCountryById(form.getValues('countryId'));
                    if (country?.defaultCurrency && value !== 'misc') {
                    form.setValue('currency', country.defaultCurrency, { shouldValidate: true });
                    }
                }}
                value={field.value}
                >
                <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                <SelectContent>
                    {SERVICE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>)}
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <FormField
            control={form.control}
            name="countryId"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-xs sm:text-sm">Country {selectedCategory === 'hotel' ? '(Required)' : '(Optional)'}</FormLabel>
                <Select
                    onValueChange={(value) => {
                        const newCountryId = value === "none" ? undefined : value;
                        field.onChange(newCountryId);
                        form.setValue('province', undefined); 
                        const country = getCountryById(newCountryId);
                        if (country?.defaultCurrency && selectedCategory !== 'misc') {
                            form.setValue('currency', country.defaultCurrency, {shouldValidate: true});
                        }
                    }}
                    value={field.value || "none"}
                    disabled={isLoadingCountries}
                >
                    <FormControl>
                    <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder={isLoadingCountries ? "Loading..." : "Select country..."} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="none">— Select Country —</SelectItem>
                    {countries.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-xs sm:text-sm">Province / Location {selectedCategory === 'hotel' ? '(Required)' : '(Optional)'}</FormLabel>
                <Select
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                    value={field.value || "none"}
                    disabled={isLoadingProvinces || !selectedCountryId || filteredProvinces.length === 0}
                >
                    <FormControl>
                    <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder={
                        !selectedCountryId
                            ? "Select country first"
                            : (isLoadingProvinces ? "Loading..." : (filteredProvinces.length === 0 ? "No provinces for country" : "Select province..."))
                        } />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="none">— Select Province —</SelectItem>
                    {filteredProvinces.map(p => (
                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm">Service / Route / Hotel / Activity Name</FormLabel>
              <FormControl><Input placeholder="e.g., City Tour, Oceanview Resort" {...field} className="h-9 text-sm" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm">Currency</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isCurrencyAutoSet}>
                <FormControl>
                    <SelectTrigger className={`h-9 text-sm ${isCurrencyAutoSet ? "bg-muted/50 cursor-not-allowed" : ""}`}>
                        <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCIES.map(curr => <SelectItem key={curr} value={curr}>{curr}</SelectItem>)}
                </SelectContent>
              </Select>
              {isCurrencyAutoSet && <p className="text-xs text-muted-foreground mt-1">Currency auto-set by country. Editable for 'Miscellaneous' items.</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm">General Service Notes (Optional)</FormLabel>
              <FormControl><Textarea placeholder="Overall details about the service" {...field} value={field.value || ''} rows={2} className="text-sm min-h-[2.25rem]" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
