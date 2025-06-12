
"use client";

import * as React from 'react';
import { useForm, useFormContext } from "react-hook-form"; // useFormContext for potential access
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import type { ServicePriceFormValues } from './ServicePriceFormRouter'; // Assuming this type is exported

interface HotelPriceFormProps {
  form: ReturnType<typeof useForm<ServicePriceFormValues>>; // Use the specific form type
  isNewService: boolean;
}

export function HotelPriceForm({ form, isNewService }: HotelPriceFormProps) {
  const hotelNameForLegend = form.watch('name'); // Watch top-level name
  const hotelProvinceForLegend = form.watch('province'); // Watch top-level province

  // Access nested values carefully, as they might not exist if form state is not fully initialized
  const hotelDetailsId = form.watch('hotelDetails.id');
  const defaultRoomTypeName = form.watch('hotelDetails.roomTypes.0.name');
  const defaultRate = form.watch('hotelDetails.roomTypes.0.seasonalPrices.0.rate');
  const currency = form.watch('currency');

  if (isNewService) {
    return (
      <div className="border border-border rounded-md p-4 mt-6 relative">
        <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">
          Hotel Setup for: {hotelNameForLegend || "New Hotel"} {hotelProvinceForLegend && `(${hotelProvinceForLegend})`}
        </p>
        <div className="pt-2 space-y-3">
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-700">Simplified Hotel Setup (New Service)</AlertTitle>
            <AlertDescription className="text-blue-600 text-xs">
              A basic hotel structure with one default room type ('{defaultRoomTypeName || "Standard Room"}')
              and a default seasonal rate (approx. {currency} {defaultRate !== undefined ? defaultRate.toFixed(2) : '0.00'})
              will be automatically created.
              <br />
              You can add more room types and detailed seasonal pricing after saving by <strong>editing</strong> this service.
              <br />
              <strong>Ensure you have selected a "Province" at the top of the form.</strong>
            </AlertDescription>
          </Alert>

          {/* Hidden fields to ensure default structure is part of the form for Zod validation */}
          {/* These are managed by ServicePriceFormRouter's useEffect for new items */}
          <FormField
            control={form.control}
            name="hotelDetails.id"
            render={({ field }) => <FormItem className="hidden"><FormControl><Input {...field} type="hidden" /></FormControl></FormItem>}
          />
          <FormField
            control={form.control}
            name="hotelDetails.name"
            render={({ field }) => <FormItem className="hidden"><FormControl><Input {...field} type="hidden" /></FormControl></FormItem>}
          />
          <FormField
            control={form.control}
            name="hotelDetails.province"
            render={({ field }) => <FormItem className="hidden"><FormControl><Input {...field} type="hidden" /></FormControl><FormMessage /></FormItem>}
          />
          <FormField
            control={form.control}
            name="hotelDetails.roomTypes.0.id"
            render={({ field }) => <FormItem className="hidden"><FormControl><Input {...field} type="hidden" /></FormControl></FormItem>}
          />
          <FormField
            control={form.control}
            name="hotelDetails.roomTypes.0.name"
            render={({ field }) => <FormItem className="hidden"><FormControl><Input {...field} type="hidden" /></FormControl></FormItem>}
          />
          <FormField
            control={form.control}
            name="hotelDetails.roomTypes.0.seasonalPrices.0.id"
            render={({ field }) => <FormItem className="hidden"><FormControl><Input {...field} type="hidden" /></FormControl></FormItem>}
          />
           <FormField
            control={form.control}
            name="hotelDetails.roomTypes.0.seasonalPrices.0.rate"
            render={({ field }) => <FormItem className="hidden"><FormControl><Input type="number" {...field} /></FormControl></FormItem>}
          />
          <FormField
            control={form.control}
            name="hotelDetails.roomTypes.0.seasonalPrices.0.startDate"
            render={({ field }) => <FormItem className="hidden"><FormControl><Input type="date" value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''} onChange={field.onChange} /></FormControl></FormItem>}
          />
           <FormField
            control={form.control}
            name="hotelDetails.roomTypes.0.seasonalPrices.0.endDate"
            render={({ field }) => <FormItem className="hidden"><FormControl><Input type="date" value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''} onChange={field.onChange} /></FormControl></FormItem>}
          />


          {/* Display top-level errors for hotelDetails if any */}
          {(form.formState.errors.hotelDetails?.root as any)?.message && (
            <FormMessage className="mt-2 text-sm text-destructive">
              Hotel Details Error: {(form.formState.errors.hotelDetails?.root as any).message}
            </FormMessage>
          )}
           {(form.formState.errors.hotelDetails?.province as any)?.message && (
             <FormMessage className="mt-2 text-sm text-destructive">
                {(form.formState.errors.hotelDetails?.province as any).message} (Check top-level "Province" field)
             </FormMessage>
           )}
        </div>
      </div>
    );
  }

  // Placeholder for the full edit UI (which would be built out for existing items)
  // For now, to ensure the NEW flow is the focus.
  return (
    <div className="border border-border rounded-md p-4 mt-6 relative">
      <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">
        Hotel Details (Edit Mode) for: {hotelNameForLegend || "Hotel"} {hotelProvinceForLegend && `(${hotelProvinceForLegend})`}
      </p>
      <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <Info className="h-5 w-5 text-yellow-700" />
          <AlertTitle className="text-yellow-800">Hotel Edit Mode</AlertTitle>
          <AlertDescription className="text-yellow-700 text-xs">
            You are editing an existing hotel. Full UI for managing multiple room types and seasonal prices would be available here.
            (This detailed edit UI is not part of the current simplified 'Add New' hotel flow focus).
          </AlertDescription>
      </Alert>
      {/* Full UI for managing room types, seasonal prices, etc., would go here when isNewService is false.
          This would typically involve using useFieldArray for roomTypes and nested useFieldArray for seasonalPrices.
          For this "reset" of the *new* hotel flow, we are keeping this part minimal.
      */}
    </div>
  );
}
