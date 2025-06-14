/**
 * @fileoverview This component renders a section for managing multiple vehicle options
 * within the transfer service price form, specifically for 'vehicle' mode transfers.
 * It allows users to add, edit, and remove individual vehicle options, each with its own
 * type (e.g., Sedan, Van), price, maximum passenger capacity, and optional notes.
 *
 * @bangla এই কম্পোনেন্টটি ট্রান্সফার পরিষেবা মূল্য ফর্মের মধ্যে একাধিক যান বিকল্প পরিচালনার
 * জন্য একটি বিভাগ রেন্ডার করে, বিশেষত 'যান' মোড ট্রান্সফারের জন্য। এটি ব্যবহারকারীদের
 * স্বতন্ত্র যান বিকল্প যোগ, সম্পাদনা এবং অপসারণ করতে দেয়, যার প্রতিটির নিজস্ব প্রকার
 * (যেমন, সেডান, ভ্যান), মূল্য, সর্বোচ্চ যাত্রী ধারণক্ষমতা এবং ঐচ্ছিক নোট থাকে।
 */
"use client";

import * as React from 'react';
import { useFormContext, useFieldArray } from "react-hook-form";
import type { ServicePriceFormValues } from '../ServicePriceFormRouter';
import type { CurrencyCode, VehicleType } from '@/types/itinerary';
import { VEHICLE_TYPES } from '@/types/itinerary';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField as ShadcnFormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PlusCircle, XIcon, Car } from 'lucide-react';
import { generateGUID } from '@/lib/utils';

interface VehicleOptionsSectionProps {
  currency: CurrencyCode;
  routeName?: string;
}

export function VehicleOptionsSection({ currency, routeName }: VehicleOptionsSectionProps) {
  const { control, formState: { errors } } = useFormContext<ServicePriceFormValues>();

  const { fields: vehicleOptionFields, append: appendVehicleOption, remove: removeVehicleOption } = useFieldArray({
    control,
    name: "vehicleOptions",
    keyName: "vehicleOptionFieldId"
  });

  React.useEffect(() => {
    if (vehicleOptionFields.length === 0) {
      appendVehicleOption({ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: '' }, { shouldFocus: false });
    }
  }, [vehicleOptionFields.length, appendVehicleOption]);

  return (
    <div className="border border-border rounded-md p-3 sm:p-4 mt-4 md:mt-6 relative">
      <p className="text-xs sm:text-sm font-semibold -mt-5 sm:-mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4 flex items-center">
        <Car className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-blue-500" /> Vehicle Options for: {routeName || "New Route"}
      </p>
      <div id="vehicleOptionsContainer" className="space-y-3 sm:space-y-4 pt-2">
        {vehicleOptionFields.map((vehicleField, vehicleIndex) => (
          <div key={vehicleField.vehicleOptionFieldId} className="border border-muted rounded-md p-2 sm:p-3 bg-card shadow-sm">
            <div className="flex justify-between items-center mb-1.5 sm:mb-2">
              <FormLabel className="text-xs sm:text-sm font-medium">Vehicle Option {vehicleIndex + 1}</FormLabel>
              <Button type="button" variant="ghost" size="icon" onClick={() => vehicleOptionFields.length > 1 ? removeVehicleOption(vehicleIndex) : null} disabled={vehicleOptionFields.length <= 1} className="h-5 w-5 sm:h-6 sm:w-6 text-destructive hover:bg-destructive/10">
                <XIcon size={14} className="sm:h-4 sm:w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <ShadcnFormField control={control} name={`vehicleOptions.${vehicleIndex}.vehicleType`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger></FormControl><SelectContent>{VEHICLE_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs" /></FormItem> )} />
              <ShadcnFormField control={control} name={`vehicleOptions.${vehicleIndex}.price`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Price ({currency})</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-8 sm:h-9 text-xs sm:text-sm" /></FormControl><FormMessage className="text-xs" /></FormItem> )} />
              <ShadcnFormField control={control} name={`vehicleOptions.${vehicleIndex}.maxPassengers`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Max Pax</FormLabel><FormControl><Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} className="h-8 sm:h-9 text-xs sm:text-sm" min="1"/></FormControl><FormMessage className="text-xs" /></FormItem> )} />
            </div>
            <ShadcnFormField control={control} name={`vehicleOptions.${vehicleIndex}.notes`} render={({ field }) => (<FormItem className="mt-1.5 sm:mt-2"><FormLabel className="text-xs">Option Notes</FormLabel><FormControl><Input placeholder="Specific notes..." {...field} value={field.value || ''} className="h-8 sm:h-9 text-xs sm:text-sm min-h-[2rem] sm:min-h-[2.25rem]"/></FormControl><FormMessage className="text-xs" /></FormItem>)} />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => appendVehicleOption({ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: ''}, { shouldFocus: false })} className="mt-3 sm:mt-4 border-blue-500 text-blue-600 hover:bg-blue-500/10 add-btn text-xs sm:text-sm h-8 sm:h-9">
        <PlusCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Vehicle Option
      </Button>
      {(errors.vehicleOptions as any)?.message && (<FormMessage className="mt-2 text-xs text-destructive">{(errors.vehicleOptions as any).message}</FormMessage>)}
      {errors.vehicleOptions?.root?.message && (<FormMessage className="mt-2 text-xs text-destructive">{errors.vehicleOptions.root.message}</FormMessage>)}
    </div>
  );
}

