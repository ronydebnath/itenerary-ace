
"use client";

import * as React from 'react';
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CurrencyCode, HotelRoomTypeDefinition, RoomTypeSeasonalPrice } from '@/types/itinerary'; // Removed ServicePriceItem, HotelDefinition
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';

// Re-import useForm type if needed for props, or use a more generic form type
type ServicePriceFormValues = ReturnType<typeof useForm<any>>['control']['_defaultValues'];

interface HotelPriceFormProps {
  form: ReturnType<typeof useForm<ServicePriceFormValues>>;
}

export function HotelPriceForm({ form }: HotelPriceFormProps) {
  const hotelNameForLegend = form.watch('name');
  const hotelProvinceForLegend = form.watch('province');

  // This component will now be much simpler for the "reset"
  // It will not manage dynamic room types or seasonal prices directly in the UI for *new* items.
  // It will rely on the default structure created by ServicePriceFormRouter.

  const hotelDetails = form.watch('hotelDetails');
  const defaultRoomTypeName = hotelDetails?.roomTypes?.[0]?.name || "Default Room";
  const defaultRate = hotelDetails?.roomTypes?.[0]?.seasonalPrices?.[0]?.rate;
  const currency = form.watch('currency');

  return (
    <div className="border border-border rounded-md p-4 mt-6 relative">
      <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">
        Hotel Details for: {hotelNameForLegend || "Hotel"} {hotelProvinceForLegend && `(${hotelProvinceForLegend})`}
      </p>
      <div className="pt-2 space-y-3">
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-700">Simplified Hotel Setup</AlertTitle>
          <AlertDescription className="text-blue-600 text-xs">
            For new hotel services, a single default room type ('{defaultRoomTypeName}') with a default seasonal rate
            (approx. {currency} {defaultRate !== undefined ? defaultRate.toFixed(2) : '0.00'}) will be created.
            <br />
            You can add more room types and detailed seasonal pricing after saving by editing this service.
          </AlertDescription>
        </Alert>

        {/* Display basic info from the default structure if needed, but no editing UI here */}
        <FormField
            control={form.control}
            name="hotelDetails.name"
            render={({ field }) => (
                <FormItem className="hidden"> {/* Hidden, managed by top-level form name */}
                <FormLabel>Internal Hotel Name</FormLabel>
                <FormControl><Input {...field} readOnly /></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="hotelDetails.province"
            render={({ field }) => (
                <FormItem className="hidden"> {/* Hidden, managed by top-level form province */}
                <FormLabel>Internal Hotel Province</FormLabel>
                <FormControl><Input {...field} readOnly /></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="hotelDetails.roomTypes.0.name"
            render={({ field }) => (
                <FormItem className="hidden">
                <FormLabel>Default Room Type Name (Auto)</FormLabel>
                <FormControl><Input {...field} readOnly /></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="hotelDetails.roomTypes.0.seasonalPrices.0.rate"
            render={({ field }) => (
                <FormItem className="hidden">
                <FormLabel>Default Room Rate (Auto)</FormLabel>
                <FormControl><Input type="number" {...field} readOnly /></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />


        {/* Error display for the hotelDetails object itself, if Zod has issues with it */}
        {(form.formState.errors.hotelDetails as any)?.message && (
          <FormMessage className="mt-2 text-sm text-destructive">
            Hotel Details Error: {(form.formState.errors.hotelDetails as any).message}
          </FormMessage>
        )}
        {(form.formState.errors.hotelDetails?.root as any)?.message && (
          <FormMessage className="mt-2 text-sm text-destructive">
            Hotel Details Root Error: {(form.formState.errors.hotelDetails?.root as any).message}
          </FormMessage>
        )}
         {(form.formState.errors.hotelDetails?.province as any)?.message && (
          <FormMessage className="mt-2 text-sm text-destructive">
            Hotel Province (within details) Error: {(form.formState.errors.hotelDetails?.province as any).message}
          </FormMessage>
        )}

      </div>
    </div>
  );
}
