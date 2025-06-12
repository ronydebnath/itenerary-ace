
"use client";

import * as React from 'react';
import { useForm, useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import type { ServicePriceFormValues } from './ServicePriceFormRouter';

interface HotelPriceFormProps {
  form: ReturnType<typeof useForm<ServicePriceFormValues>>;
  isNewService: boolean;
}

export function HotelPriceForm({ form, isNewService }: HotelPriceFormProps) {
  const hotelNameForLegend = form.watch('name'); 
  const hotelProvinceForLegend = form.watch('province');
  const currency = form.watch('currency');

  if (isNewService) {
    // For new services, we display an informational message.
    // The actual default data structure (including IDs, default room type, default seasonal price with dates)
    // is programmatically created and set in ServicePriceFormRouter.tsx using form.setValue('hotelDetails', ...).
    // We don't need hidden inputs here as form.setValue directly manipulates react-hook-form's state
    // which Zod will then validate against.
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
              A basic hotel structure with one default room type ("Standard Room (Default)")
              and a default seasonal rate (initially {currency} 0.00 for a standard period)
              will be automatically prepared.
              <br />
              You can add more room types and detailed seasonal pricing after saving by <strong>editing</strong> this service.
              <br />
              <strong>Ensure you have selected a "Province" at the top of the form, as this is required for hotel services.</strong>
            </AlertDescription>
          </Alert>

          {/* Display top-level errors for hotelDetails if any */}
          {(form.formState.errors.hotelDetails?.root as any)?.message && (
            <FormMessage className="mt-2 text-sm text-destructive">
              Hotel Details Error: {(form.formState.errors.hotelDetails?.root as any).message}
            </FormMessage>
          )}
           {(form.formState.errors.hotelDetails?.province as any)?.message && (
             <FormMessage className="mt-2 text-sm text-destructive">
                Error with hotel province: {(form.formState.errors.hotelDetails?.province as any).message} (Please ensure the main "Province" field above is selected).
             </FormMessage>
           )}
            {/* Display other potential errors for hotelDetails if they occur */}
            {Object.keys(form.formState.errors.hotelDetails || {}).filter(key => key !== 'root' && key !== 'province').length > 0 && (
                <div className="mt-2 text-sm text-destructive">
                    <p>Other hotel detail errors:</p>
                    <pre className="text-xs">{JSON.stringify(
                        Object.fromEntries(Object.entries(form.formState.errors.hotelDetails || {}).filter(([key]) => key !== 'root' && key !== 'province')),
                         null, 2
                    )}</pre>
                </div>
            )}
        </div>
      </div>
    );
  }

  // UI for EDITING an existing hotel service would go here.
  // This part is more complex and would involve useFieldArray for roomTypes and seasonalPrices.
  // For now, keeping it minimal as the primary issue is with NEW hotel creation.
  return (
    <div className="border border-border rounded-md p-4 mt-6 relative">
      <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">
        Hotel Details (Edit Mode) for: {hotelNameForLegend || "Hotel"} {hotelProvinceForLegend && `(${hotelProvinceForLegend})`}
      </p>
      <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <Info className="h-5 w-5 text-yellow-700" />
          <AlertTitle className="text-yellow-800">Hotel Edit Mode</AlertTitle>
          <AlertDescription className="text-yellow-700 text-xs">
            You are editing an existing hotel. The full UI for managing multiple room types and detailed seasonal prices would be implemented here.
            (This detailed edit UI is not part of the current focus, which is fixing the 'Add New' hotel flow).
          </AlertDescription>
      </Alert>
      {/* 
        Placeholder for full edit UI:
        - Iterate over form.getValues('hotelDetails.roomTypes') using useFieldArray.
        - For each room type, allow editing its name, extraBedAllowed, notes, characteristics.
        - Nested useFieldArray for seasonalPrices within each room type.
        - DatePickers for seasonal start/end dates, inputs for rates.
        - Buttons to add/remove room types and seasonal prices.
      */}
    </div>
  );
}
