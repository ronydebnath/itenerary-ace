
"use client";

import * as React from 'react';
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import type { ServicePriceFormValues } from '../ServicePriceFormRouter';
import type { CurrencyCode } from '@/types/itinerary';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField as ShadcnFormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PlusCircle, XIcon, AlertTriangle } from 'lucide-react';
import { generateGUID } from '@/lib/utils';

interface SurchargePeriodsSectionProps {
  currency: CurrencyCode;
  routeName?: string;
}

export function SurchargePeriodsSection({ currency, routeName }: SurchargePeriodsSectionProps) {
  const { control, getValues, formState: { errors } } = useFormContext<ServicePriceFormValues>();

  const { fields: surchargePeriodFields, append: appendSurchargePeriod, remove: removeSurchargePeriod } = useFieldArray({
    control,
    name: "surchargePeriods",
    keyName: "surchargeFieldId"
  });

  return (
    <div className="border border-border rounded-md p-3 sm:p-4 mt-4 md:mt-6 relative">
      <p className="text-xs sm:text-sm font-semibold -mt-5 sm:-mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4 flex items-center">
        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-orange-500" /> Route Surcharges for: {routeName || "New Route"}
      </p>
      <div id="surchargePeriodsContainer" className="space-y-3 sm:space-y-4 pt-2">
        {surchargePeriodFields.map((surchargeField, surchargeIndex) => (
          <div key={surchargeField.surchargeFieldId} className="border border-muted rounded-md p-2 sm:p-3 bg-card shadow-sm">
            <div className="flex justify-between items-center mb-1.5 sm:mb-2">
              <FormLabel className="text-xs sm:text-sm font-medium">Surcharge Period {surchargeIndex + 1}</FormLabel>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeSurchargePeriod(surchargeIndex)} className="h-5 w-5 sm:h-6 sm:w-6 text-destructive hover:bg-destructive/10" ><XIcon size={14} className="sm:h-4 sm:w-4" /></Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
              <ShadcnFormField control={control} name={`surchargePeriods.${surchargeIndex}.name`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Name</FormLabel><FormControl><Input placeholder="e.g., New Year Peak" {...field} className="h-8 sm:h-9 text-xs sm:text-sm" /></FormControl><FormMessage className="text-xs" /></FormItem> )} />
              <ShadcnFormField control={control} name={`surchargePeriods.${surchargeIndex}.surchargeAmount`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Amount ({currency})</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-8 sm:h-9 text-xs sm:text-sm" /></FormControl><FormMessage className="text-xs" /></FormItem> )} />
              <Controller control={control} name={`surchargePeriods.${surchargeIndex}.startDate`} render={({ field: { onChange, value }, fieldState: { error } }) => ( <FormItem><FormLabel className="text-xs">Start Date</FormLabel><FormControl><DatePicker date={value} onDateChange={onChange} placeholder="dd-MM-yy" /></FormControl>{error && <FormMessage className="text-xs">{error.message}</FormMessage>}</FormItem> )} />
              <Controller control={control} name={`surchargePeriods.${surchargeIndex}.endDate`} render={({ field: { onChange, value }, fieldState: { error } }) => ( <FormItem><FormLabel className="text-xs">End Date</FormLabel><FormControl><DatePicker date={value} onDateChange={onChange} minDate={getValues(`surchargePeriods.${surchargeIndex}.startDate`)} placeholder="dd-MM-yy" /></FormControl>{error && <FormMessage className="text-xs">{error.message}</FormMessage>}</FormItem> )} />
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => appendSurchargePeriod({ id: generateGUID(), name: '', startDate: new Date(), endDate: new Date(), surchargeAmount: 0 }, { shouldFocus: false })} className="mt-3 sm:mt-4 border-orange-500 text-orange-600 hover:bg-orange-500/10 add-btn text-xs sm:text-sm h-8 sm:h-9" >
        <PlusCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Surcharge Period
      </Button>
      {(errors.surchargePeriods as any)?.message && ( <FormMessage className="mt-2 text-xs text-destructive">{(errors.surchargePeriods as any).message}</FormMessage> )}
      {errors.surchargePeriods?.root?.message && ( <FormMessage className="mt-2 text-xs text-destructive">{errors.surchargePeriods.root.message}</FormMessage> )}
    </div>
  );
}
