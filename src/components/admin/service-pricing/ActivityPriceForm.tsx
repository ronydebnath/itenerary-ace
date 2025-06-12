
"use client";

import * as React from 'react';
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import {
  FormField as ShadcnFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServicePrices } from '@/hooks/useServicePrices';
import type { ServicePriceFormValues } from './ServicePriceFormRouter';
import type { ActivityPackageDefinition, CurrencyCode } from '@/types/itinerary';
import { PlusCircle, Trash2, XIcon, Package as PackageIcon } from 'lucide-react';
import { generateGUID } from '@/lib/utils';
import { ActivityPackageScheduler } from '@/components/itinerary/items/activity-package-scheduler';

interface ActivityPriceFormProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
}

export function ActivityPriceForm({ form }: ActivityPriceFormProps) {
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const [availableActivityServices, setAvailableActivityServices] = React.useState<any[]>([]);
  
  const currency = form.watch('currency') as CurrencyCode || 'THB';
  const province = form.watch('province');
  const activityNameForLegend = form.watch('name');

  const { fields: activityPackageFields, append: appendActivityPackage, remove: removeActivityPackage } = useFieldArray({
    control: form.control, name: "activityPackages", keyName: "packageFieldId"
  });

  React.useEffect(() => {
    if (!isLoadingServices) {
      const allCategoryServices = getServicePrices('activity').filter(s => s.currency === currency);
      let filteredServices = allCategoryServices;
      if (province) {
        filteredServices = allCategoryServices.filter(s => s.province === province || !s.province);
      }
      setAvailableActivityServices(filteredServices);
    }
  }, [isLoadingServices, getServicePrices, currency, province]);

  const handlePredefinedServiceSelect = (serviceId: string) => {
    if (serviceId === "none") {
      form.setValue('selectedServicePriceId', undefined);
      form.setValue('activityPackages', [{
        id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '',
        validityStartDate: new Date().toISOString().split('T')[0],
        validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        closedWeekdays: [], specificClosedDates: []
      }], { shouldValidate: true });
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
    <div className="space-y-6">
       {availableActivityServices.length > 0 && (
        <div className="border border-border rounded-md p-4 relative">
          <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Predefined Services</p>
          <ShadcnFormField
            control={form.control}
            name="selectedServicePriceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Predefined Activity ({province || 'Any Province'})</FormLabel>
                <Select
                  onValueChange={(value) => handlePredefinedServiceSelect(value)}
                  value={field.value || "none"}
                  disabled={isLoadingServices}
                >
                  <FormControl><SelectTrigger><SelectValue placeholder="Choose activity..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">None (Custom Package/Price)</SelectItem>
                    {availableActivityServices.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.province || 'Generic'}) - {service.activityPackages?.length ? `${service.activityPackages.length} pkg(s)` : `${currency} ${service.price1 || 0}`}
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
      <div className="border border-border rounded-md p-4 mt-6 relative">
        <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4 flex items-center">
          <PackageIcon className="h-4 w-4 mr-1 text-indigo-500" /> Activity Packages for: {activityNameForLegend || "New Activity"}
        </p>
        <div id="activityPackagesContainer" className="space-y-4 pt-2">
          {activityPackageFields.map((packageField, packageIndex) => {
            const currentPackageValues = form.watch(`activityPackages.${packageIndex}`);
            const packageLegend = currentPackageValues?.name || `Package ${packageIndex + 1}`;
            return (
              <div key={packageField.id} className="border border-muted rounded-md p-4 pt-6 relative bg-card shadow-sm">
                <p className="text-base font-medium -mt-6 ml-2 px-1 bg-card inline-block absolute left-2 top-[0.1rem] max-w-[calc(100%-3rem)] truncate"> {packageLegend} </p>
                <Button type="button" variant="ghost" size="icon" onClick={() => activityPackageFields.length > 1 ? removeActivityPackage(packageIndex) : null} disabled={activityPackageFields.length <= 1} className="absolute top-1 right-1 h-7 w-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-sm hover:bg-destructive/80 disabled:opacity-50">
                  <XIcon size={16} />
                </Button>
                <div className="space-y-3 pt-2">
                  <ShadcnFormField control={form.control} name={`activityPackages.${packageIndex}.name`} render={({ field }) => ( <FormItem><FormLabel className="text-sm">Package Name</FormLabel><FormControl><Input placeholder="e.g., Sunset Cruise, Full Day Tour" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ShadcnFormField control={form.control} name={`activityPackages.${packageIndex}.price1`} render={({ field }) => ( <FormItem><FormLabel className="text-sm">Adult Price ({currency})</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                    <ShadcnFormField control={form.control} name={`activityPackages.${packageIndex}.price2`} render={({ field }) => ( <FormItem><FormLabel className="text-sm">Child Price ({currency}) (Optional)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                  <ShadcnFormField control={form.control} name={`activityPackages.${packageIndex}.notes`} render={({ field }) => ( <FormItem><FormLabel className="text-sm">Package Notes/Details</FormLabel><FormControl><Textarea placeholder="Inclusions, duration, what to bring, etc." {...field} value={field.value || ''} rows={2} /></FormControl><FormMessage /></FormItem> )} />
                  <Controller 
                    control={form.control} 
                    name={`activityPackages.${packageIndex}`} 
                    render={({ field: { onChange, value }}) => ( 
                      <ActivityPackageScheduler 
                        packageId={packageField.id} 
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
        <Button type="button" variant="outline" onClick={() => appendActivityPackage({ id: generateGUID(), name: `Package ${activityPackageFields.length + 1}`, price1: 0, price2: undefined, notes: '', validityStartDate: new Date().toISOString().split('T')[0], validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }, { shouldFocus: false })} className="mt-4 border-accent text-accent hover:bg-accent/10 add-btn">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Package
        </Button>
        {(form.formState.errors.activityPackages as any)?.message && ( <FormMessage className="mt-2 text-sm text-destructive">{(form.formState.errors.activityPackages as any).message}</FormMessage> )}
        {form.formState.errors.activityPackages?.root?.message && ( <FormMessage className="mt-2 text-sm text-destructive">{form.formState.errors.activityPackages.root.message}</FormMessage> )}
      </div>
       {(form.formState.errors.price1 as any)?.message && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 rounded-md mt-2">
          <FormMessage className="text-destructive">
            If no packages are defined, ensure a "Default Adult Price" is provided (this is handled by Zod validation logic if `activityPackages` is empty).
            Error: {(form.formState.errors.price1 as any).message}
          </FormMessage>
        </div>
      )}
    </div>
  );
}

    