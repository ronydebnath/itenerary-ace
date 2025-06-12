
"use client";

import * as React from 'react';
import { useForm, useFieldArray, Controller, useFormContext, useWatch } from "react-hook-form";
import {
  FormField as ShadcnFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useServicePrices } from '@/hooks/useServicePrices';
import type { ServicePriceFormValues } from './ServicePriceFormRouter';
import { CURRENCIES, VEHICLE_TYPES, VehicleType } from '@/types/itinerary';
import { PlusCircle, Trash2, XIcon, Car, AlertTriangle } from 'lucide-react';
import { generateGUID } from '@/lib/utils';

interface TransferPriceFormProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
}

export function TransferPriceForm({ form }: TransferPriceFormProps) {
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const [availableTransferServices, setAvailableTransferServices] = React.useState<any[]>([]);

  const currency = form.watch('currency') || CURRENCIES[0];
  const province = form.watch('province');
  const transferMode = form.watch('transferMode');
  const routeName = form.watch('name');

  React.useEffect(() => {
    if (!isLoadingServices && transferMode) {
      const allCategoryServices = getServicePrices('transfer').filter(s => s.currency === currency);
      let modeFiltered = allCategoryServices.filter(s => {
        if (transferMode === 'ticket') return s.subCategory === 'ticket';
        if (transferMode === 'vehicle') return s.transferMode === 'vehicle'; // or s.subCategory !== 'ticket' based on data
        return false;
      });
      if (province) {
        modeFiltered = modeFiltered.filter(s => s.province === province || !s.province);
      }
      setAvailableTransferServices(modeFiltered);
    } else {
      setAvailableTransferServices([]);
    }
  }, [isLoadingServices, getServicePrices, currency, province, transferMode]);

  const handlePredefinedServiceSelect = (serviceId: string) => {
    if (serviceId === "none") {
      form.setValue('selectedServicePriceId', undefined);
      if (transferMode === 'ticket') {
        form.setValue('price1', 0, { shouldValidate: true });
        form.setValue('price2', undefined, { shouldValidate: true });
      } else {
        form.setValue('vehicleOptions', [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: '' }], { shouldValidate: true });
        form.setValue('surchargePeriods', [], { shouldValidate: true });
      }
    } else {
      const service = getServicePriceById(serviceId);
      if (service) {
        form.setValue('name', form.getValues('name') === "New transfer" || !form.getValues('name') || !form.getValues('selectedServicePriceId') ? service.name : form.getValues('name'));
        form.setValue('selectedServicePriceId', service.id);
        if (transferMode === 'ticket') {
          form.setValue('price1', service.price1 || 0, { shouldValidate: true });
          form.setValue('price2', service.price2, { shouldValidate: true });
        } else if (transferMode === 'vehicle') {
          form.setValue('vehicleOptions', service.vehicleOptions?.length ? service.vehicleOptions : [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: '' }], { shouldValidate: true });
          form.setValue('surchargePeriods', service.surchargePeriods?.map(sp => ({...sp, startDate: new Date(sp.startDate), endDate: new Date(sp.endDate) })) || [], { shouldValidate: true });
        }
      }
    }
  };
  
  const selectedServicePriceId = form.watch('selectedServicePriceId');
  const selectedServiceName = selectedServicePriceId ? getServicePriceById(selectedServicePriceId)?.name : null;


  const { fields: vehicleOptionFields, append: appendVehicleOption, remove: removeVehicleOption } = useFieldArray({
    control: form.control, name: "vehicleOptions", keyName: "vehicleOptionFieldId"
  });
  const { fields: surchargePeriodFields, append: appendSurchargePeriod, remove: removeSurchargePeriod } = useFieldArray({
    control: form.control, name: "surchargePeriods", keyName: "surchargeFieldId"
  });

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-md p-4 relative mt-6">
        <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Transfer Mode</p>
        <ShadcnFormField
          control={form.control}
          name="transferMode"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select transfer mode" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="ticket">Ticket Basis</SelectItem>
                  <SelectItem value="vehicle">Vehicle Basis</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {availableTransferServices.length > 0 && transferMode && (
          <div className="border border-border rounded-md p-4 relative">
             <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Predefined Services</p>
            <ShadcnFormField
              control={form.control}
              name="selectedServicePriceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Predefined Transfer ({province || 'Any Province'})</FormLabel>
                  <Select
                    onValueChange={(value) => handlePredefinedServiceSelect(value)}
                    value={field.value || "none"}
                    disabled={isLoadingServices}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder={`Choose ${transferMode} service...`} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (Custom Price)</SelectItem>
                      {availableTransferServices.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.province || 'Generic'}) - {service.price1 !== undefined ? `${currency} ${service.price1}` : 'Options'}
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

      {transferMode === 'ticket' && (
        <div className="border border-border rounded-md p-4 relative">
           <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Ticket Pricing</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <ShadcnFormField
              control={form.control}
              name="price1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adult Ticket Price ({currency})</FormLabel>
                  <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ShadcnFormField
              control={form.control}
              name="price2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child Ticket Price ({currency}) (Optional)</FormLabel>
                  <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {transferMode === 'vehicle' && (
        <>
          <div className="border border-border rounded-md p-4 mt-6 relative">
            <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4 flex items-center">
              <Car className="h-4 w-4 mr-1 text-blue-500" /> Vehicle Options for Route: {routeName || "New Route"}
            </p>
            <div id="vehicleOptionsContainer" className="space-y-4 pt-2">
              {vehicleOptionFields.map((vehicleField, vehicleIndex) => (
                <div key={vehicleField.vehicleOptionFieldId} className="border border-muted rounded-md p-3 bg-card shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <FormLabel className="text-sm font-medium">Vehicle Option {vehicleIndex + 1}</FormLabel>
                    <Button type="button" variant="ghost" size="icon" onClick={() => vehicleOptionFields.length > 1 ? removeVehicleOption(vehicleIndex) : null} disabled={vehicleOptionFields.length <= 1} className="h-6 w-6 text-destructive hover:bg-destructive/10">
                      <XIcon size={16} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <ShadcnFormField control={form.control} name={`vehicleOptions.${vehicleIndex}.vehicleType`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger></FormControl><SelectContent>{VEHICLE_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select><FormMessage className="text-xs" /></FormItem> )} />
                    <ShadcnFormField control={form.control} name={`vehicleOptions.${vehicleIndex}.price`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Price ({currency})</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-9 text-sm" /></FormControl><FormMessage className="text-xs" /></FormItem> )} />
                    <ShadcnFormField control={form.control} name={`vehicleOptions.${vehicleIndex}.maxPassengers`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Max Pax</FormLabel><FormControl><Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} className="h-9 text-sm" min="1"/></FormControl><FormMessage className="text-xs" /></FormItem> )} />
                  </div>
                  <ShadcnFormField control={form.control} name={`vehicleOptions.${vehicleIndex}.notes`} render={({ field }) => (<FormItem className="mt-2"><FormLabel className="text-xs">Option Notes</FormLabel><FormControl><Input placeholder="Specific notes..." {...field} value={field.value || ''} className="h-9 text-sm min-h-[2.25rem]"/></FormControl><FormMessage className="text-xs" /></FormItem>)} />
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendVehicleOption({ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: ''}, { shouldFocus: false })} className="mt-4 border-blue-500 text-blue-600 hover:bg-blue-500/10 add-btn">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle Option
            </Button>
            {(form.formState.errors.vehicleOptions as any)?.message && (<FormMessage className="mt-2 text-sm text-destructive">{(form.formState.errors.vehicleOptions as any).message}</FormMessage>)}
          </div>

          <div className="border border-border rounded-md p-4 mt-6 relative">
            <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" /> Route Surcharges for: {routeName || "New Route"}
            </p>
            <div id="surchargePeriodsContainer" className="space-y-4 pt-2">
              {surchargePeriodFields.map((surchargeField, surchargeIndex) => (
                <div key={surchargeField.surchargeFieldId} className="border border-muted rounded-md p-3 bg-card shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <FormLabel className="text-sm font-medium">Surcharge Period {surchargeIndex + 1}</FormLabel>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSurchargePeriod(surchargeIndex)} className="h-6 w-6 text-destructive hover:bg-destructive/10" ><XIcon size={16} /></Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <ShadcnFormField control={form.control} name={`surchargePeriods.${surchargeIndex}.name`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Name</FormLabel><FormControl><Input placeholder="e.g., New Year Peak" {...field} className="h-9 text-sm" /></FormControl><FormMessage className="text-xs" /></FormItem> )} />
                    <Controller control={form.control} name={`surchargePeriods.${surchargeIndex}.startDate`} render={({ field: { onChange, value }, fieldState: { error } }) => ( <FormItem><FormLabel className="text-xs">Start Date</FormLabel><FormControl><DatePicker date={value} onDateChange={onChange} placeholder="dd-MM-yy" /></FormControl>{error && <FormMessage className="text-xs">{error.message}</FormMessage>}</FormItem> )} />
                    <Controller control={form.control} name={`surchargePeriods.${surchargeIndex}.endDate`} render={({ field: { onChange, value }, fieldState: { error } }) => ( <FormItem><FormLabel className="text-xs">End Date</FormLabel><FormControl><DatePicker date={value} onDateChange={onChange} minDate={form.getValues(`surchargePeriods.${surchargeIndex}.startDate`)} placeholder="dd-MM-yy" /></FormControl>{error && <FormMessage className="text-xs">{error.message}</FormMessage>}</FormItem> )} />
                    <ShadcnFormField control={form.control} name={`surchargePeriods.${surchargeIndex}.surchargeAmount`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Amount ({currency})</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-9 text-sm" /></FormControl><FormMessage className="text-xs" /></FormItem> )} />
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => appendSurchargePeriod({ id: generateGUID(), name: '', startDate: new Date(), endDate: new Date(), surchargeAmount: 0 }, { shouldFocus: false })} className="mt-4 border-orange-500 text-orange-600 hover:bg-orange-500/10 add-btn" >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Surcharge Period
            </Button>
            {(form.formState.errors.surchargePeriods as any)?.message && ( <FormMessage className="mt-2 text-sm text-destructive">{(form.formState.errors.surchargePeriods as any).message}</FormMessage> )}
          </div>
        </>
      )}
    </div>
  );
}

    