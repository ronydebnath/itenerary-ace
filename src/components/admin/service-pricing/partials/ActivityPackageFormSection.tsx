/**
 * @fileoverview This component renders a section for managing multiple activity packages
 * within the activity service price form. It allows users to add, edit, and remove
 * individual packages, each with its own name, pricing (adult/child), notes, and
 * scheduling details (validity, closures) via the `ActivityPackageScheduler`.
 *
 * @bangla এই কম্পোনেন্টটি কার্যকলাপ পরিষেবা মূল্য ফর্মের মধ্যে একাধিক কার্যকলাপ প্যাকেজ
 * পরিচালনার জন্য একটি বিভাগ রেন্ডার করে। এটি ব্যবহারকারীদের স্বতন্ত্র প্যাকেজ যোগ, সম্পাদনা
 * এবং অপসারণ করতে দেয়, যার প্রতিটির নিজস্ব নাম, মূল্য (প্রাপ্তবয়স্ক/শিশু), নোট এবং
 * সময়সূচী বিবরণ (`ActivityPackageScheduler` এর মাধ্যমে) থাকে।
 */
"use client";

import * as React from 'react';
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import type { ServicePriceFormValues } from '../ServicePriceFormRouter';
import type { ActivityPackageDefinition, CurrencyCode } from '@/types/itinerary';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormField as ShadcnFormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PlusCircle, XIcon, Package as PackageIcon } from 'lucide-react';
import { generateGUID } from '@/lib/utils';
import { ActivityPackageScheduler } from '@/components/itinerary/items/activity-package-scheduler'; // Assuming this path is correct

interface ActivityPackageFormSectionProps {
  currency: CurrencyCode;
  activityNameForLegend?: string;
}

export function ActivityPackageFormSection({ currency, activityNameForLegend }: ActivityPackageFormSectionProps) {
  const { control, formState: { errors } } = useFormContext<ServicePriceFormValues>();

  const { fields: activityPackageFields, append: appendActivityPackage, remove: removeActivityPackage } = useFieldArray({
    control,
    name: "activityPackages",
    keyName: "packageFieldId" // Keep ShadCN's default key name for arrays
  });

  React.useEffect(() => {
    if (activityPackageFields.length === 0) {
      appendActivityPackage({
        id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '',
        validityStartDate: new Date().toISOString().split('T')[0],
        validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        closedWeekdays: [], specificClosedDates: []
      }, { shouldFocus: false });
    }
  }, [activityPackageFields.length, appendActivityPackage]);

  return (
    <div className="border border-border rounded-md p-3 sm:p-4 mt-4 md:mt-6 relative">
      <p className="text-xs sm:text-sm font-semibold -mt-5 sm:-mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4 flex items-center">
        <PackageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-indigo-500" /> Activity Packages for: {activityNameForLegend || "New Activity"}
      </p>
      <div id="activityPackagesContainer" className="space-y-3 sm:space-y-4 pt-2">
        {activityPackageFields.map((packageField, packageIndex) => {
          const currentPackageValues = control.getValues(`activityPackages.${packageIndex}`);
          const packageLegend = currentPackageValues?.name || `Package ${packageIndex + 1}`;
          return (
            <div key={packageField.packageFieldId} className="border border-muted rounded-md p-3 sm:p-4 pt-5 sm:pt-6 relative bg-card shadow-sm">
              <p className="text-sm sm:text-base font-medium -mt-5 sm:-mt-6 ml-2 px-1 bg-card inline-block absolute left-2 top-[0.1rem] max-w-[calc(100%-2.5rem)] truncate"> {packageLegend} </p>
              <Button type="button" variant="ghost" size="icon" onClick={() => activityPackageFields.length > 1 ? removeActivityPackage(packageIndex) : null} disabled={activityPackageFields.length <= 1} className="absolute top-1 right-1 h-6 w-6 sm:h-7 sm:w-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs sm:text-sm hover:bg-destructive/80 disabled:opacity-50">
                <XIcon size={14} className="sm:h-4 sm:w-4" />
              </Button>
              <div className="space-y-2 sm:space-y-3 pt-2">
                <ShadcnFormField control={control} name={`activityPackages.${packageIndex}.name`} render={({ field }) => ( <FormItem><FormLabel className="text-xs sm:text-sm">Package Name</FormLabel><FormControl><Input placeholder="e.g., Sunset Cruise" {...field} className="h-9 text-sm" /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <ShadcnFormField control={control} name={`activityPackages.${packageIndex}.price1`} render={({ field }) => ( <FormItem><FormLabel className="text-xs sm:text-sm">Adult Price ({currency})</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-9 text-sm" /></FormControl><FormMessage /></FormItem> )} />
                  <ShadcnFormField control={control} name={`activityPackages.${packageIndex}.price2`} render={({ field }) => ( <FormItem><FormLabel className="text-xs sm:text-sm">Child Price ({currency}) (Opt)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} className="h-9 text-sm" /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <ShadcnFormField control={control} name={`activityPackages.${packageIndex}.notes`} render={({ field }) => ( <FormItem><FormLabel className="text-xs sm:text-sm">Package Notes/Details</FormLabel><FormControl><Textarea placeholder="Inclusions, duration, etc." {...field} value={field.value || ''} rows={2} className="text-sm min-h-[2.25rem]" /></FormControl><FormMessage /></FormItem> )} />
                <Controller
                  control={control}
                  name={`activityPackages.${packageIndex}`}
                  render={({ field: { onChange, value }}) => (
                    <ActivityPackageScheduler
                      packageId={packageField.id!} // Use the actual ID from the data
                      initialSchedulingData={{
                        validityStartDate: value.validityStartDate,
                        validityEndDate: value.validityEndDate,
                        closedWeekdays: value.closedWeekdays,
                        specificClosedDates: value.specificClosedDates,
                      }}
                      onSchedulingChange={(newSchedule) => { onChange({ ...value, ...newSchedule }); }}
                    />
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => appendActivityPackage({ id: generateGUID(), name: `Package ${activityPackageFields.length + 1}`, price1: 0, price2: undefined, notes: '', validityStartDate: new Date().toISOString().split('T')[0], validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }, { shouldFocus: false })} className="mt-3 sm:mt-4 border-accent text-accent hover:bg-accent/10 add-btn text-xs sm:text-sm h-8 sm:h-9">
        <PlusCircle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Package
      </Button>
      {(errors.activityPackages as any)?.message && ( <FormMessage className="mt-2 text-xs text-destructive">{(errors.activityPackages as any).message}</FormMessage> )}
      {errors.activityPackages?.root?.message && ( <FormMessage className="mt-2 text-xs text-destructive">{errors.activityPackages.root.message}</FormMessage> )}
    </div>
  );
}

