
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
import { CURRENCIES, SERVICE_CATEGORIES, type CountryItem, type ProvinceItem, type CurrencyCode } from '@/types/itinerary';
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
  const selectedCategory = form.watch("category");

  React.useEffect(() => {
    if (selectedCountryId && !isLoadingProvinces) {
      setFilteredProvinces(getProvincesByCountry(selectedCountryId));
      const selectedCountryDetails = getCountryById(selectedCountryId);
      if (selectedCountryDetails && selectedCountryDetails.defaultCurrency) {
        form.setValue('currency', selectedCountryDetails.defaultCurrency, { shouldValidate: true });
      }
    } else if (!selectedCountryId) {
      setFilteredProvinces([]); // Clear provinces if no country selected
      // Optionally, reset currency to a global default or leave as is
      // form.setValue('currency', CURRENCIES[0] as CurrencyCode, { shouldValidate: true });
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

  }, [selectedCountryId, isLoadingProvinces, getProvincesByCountry, form, getCountryById]);


  React.useEffect(() => {
    // Auto-select Thailand and its currency if category is hotel and no country is selected yet
    if (selectedCategory === 'hotel' && !form.getValues('countryId')) {
      const thailand = countries.find(c => c.name === "Thailand");
      if (thailand) {
        form.setValue('countryId', thailand.id, { shouldValidate: true });
        if (thailand.defaultCurrency) {
          form.setValue('currency', thailand.defaultCurrency, { shouldValidate: true });
        }
      }
    }
  }, [selectedCategory, form, countries]);

  return (
    <div className="border border-border rounded-md p-4 relative">
      <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Basic Service Details</p>
      <div className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="countryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country {selectedCategory === 'hotel' ? '(Required for Hotels)' : '(Optional for others)'}</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value === "none" ? undefined : value);
                  form.setValue('province', undefined); 
                }}
                value={field.value || "none"}
                disabled={isLoadingCountries}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCountries ? "Loading countries..." : "Select country..."} />
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
              <FormLabel>Province / Location (Optional)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                value={field.value || "none"}
                disabled={isLoadingProvinces || !selectedCountryId || filteredProvinces.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedCountryId 
                        ? "Select a country first" 
                        : (isLoadingProvinces ? "Loading..." : (filteredProvinces.length === 0 ? "No provinces for country" : "Select province..."))
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">— Select Province (Optional) —</SelectItem>
                  {filteredProvinces.map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
              >
                <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                <SelectContent>
                  {SERVICE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service / Route / Hotel / Activity Name</FormLabel>
              <FormControl><Input placeholder="e.g., City Tour, Oceanview Resort, BKK Airport to City" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!!getCountryById(selectedCountryId)?.defaultCurrency && selectedCategory !== 'misc'}>
                <FormControl>
                    <SelectTrigger className={!!getCountryById(selectedCountryId)?.defaultCurrency && selectedCategory !== 'misc' ? "bg-muted/50 cursor-not-allowed" : ""}>
                        <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCIES.map(curr => <SelectItem key={curr} value={curr}>{curr}</SelectItem>)}
                </SelectContent>
              </Select>
              {!!getCountryById(selectedCountryId)?.defaultCurrency && selectedCategory !== 'misc' && <p className="text-xs text-muted-foreground mt-1">Currency auto-set based on selected country. For 'Miscellaneous' items, you can override this.</p>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>General Service Notes (Optional)</FormLabel>
              <FormControl><Textarea placeholder="Overall details about the service" {...field} value={field.value || ''} rows={2} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
