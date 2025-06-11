
"use client";

import * as React from 'react';
import { useFormContext } from "react-hook-form";
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
import { CURRENCIES, SERVICE_CATEGORIES } from '@/types/itinerary';
import type { ServicePriceFormValues } from './ServicePriceFormRouter'; // Assuming this type is exported

interface CommonPriceFieldsProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
}

export function CommonPriceFields({ form }: CommonPriceFieldsProps) {
  const { provinces, isLoading: isLoadingProvinces } = useProvinces();

  return (
    <div className="border border-border rounded-md p-4 relative">
      <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Basic Service Details</p>
      <div className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="province"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province / Location (Optional)</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                value={field.value || "none"}
                disabled={isLoadingProvinces}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">— Select —</SelectItem>
                  {provinces.map(p => (
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
              <Select onValueChange={field.onChange} value={field.value}>
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                <SelectContent>
                  {CURRENCIES.map(curr => <SelectItem key={curr} value={curr}>{curr}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Unit Description Field Removed
        <FormField
          control={form.control}
          name="unitDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Description</FormLabel>
              <FormControl><Input
                placeholder="e.g., per person, per night"
                {...field}
                value={field.value || ''}
              /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        */}
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
