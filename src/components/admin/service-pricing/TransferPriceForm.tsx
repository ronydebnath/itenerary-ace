
"use client";

import * as React from 'react';
import { useFormContext } from "react-hook-form";
import {
  FormField as ShadcnFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useServicePrices } from '@/hooks/useServicePrices';
import type { ServicePriceFormValues } from './ServicePriceFormRouter';
import { CURRENCIES, VEHICLE_TYPES, VehicleType } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useCountries } from '@/hooks/useCountries';
import { VehicleOptionsSection } from './partials/VehicleOptionsSection';
import { SurchargePeriodsSection } from './partials/SurchargePeriodsSection';
import { Loader2 } from 'lucide-react';

interface TransferPriceFormProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
}

export function TransferPriceForm({ form }: TransferPriceFormProps) {
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const { countries } = useCountries();
  const [availableTransferServices, setAvailableTransferServices] = React.useState<any[]>([]);

  const currency = form.watch('currency') || CURRENCIES[0];
  const province = form.watch('province');
  const countryId = form.watch('countryId');
  const transferMode = form.watch('transferMode');
  const routeName = form.watch('name');

  React.useEffect(() => {
    if (!isLoadingServices && transferMode) {
      let filtered = getServicePrices({ category: 'transfer', currency });

      if (transferMode === 'ticket') filtered = filtered.filter(s => s.subCategory === 'ticket' || s.transferMode === 'ticket');
      if (transferMode === 'vehicle') filtered = filtered.filter(s => s.transferMode === 'vehicle');

      if (countryId) {
          filtered = filtered.filter(s => s.countryId === countryId || !s.countryId)
      }
      if (province) {
        filtered = filtered.filter(s => s.province === province || !s.province);
      }
      setAvailableTransferServices(filtered);
    } else {
      setAvailableTransferServices([]);
    }
  }, [isLoadingServices, getServicePrices, currency, province, countryId, transferMode]);

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
          form.setValue('vehicleOptions', service.vehicleOptions?.length ? service.vehicleOptions.map(vo=>({...vo, id: vo.id || generateGUID()})) : [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: '' }], { shouldValidate: true });
          form.setValue('surchargePeriods', service.surchargePeriods?.map(sp => ({...sp, id: sp.id || generateGUID(), startDate: new Date(sp.startDate), endDate: new Date(sp.endDate) })) || [], { shouldValidate: true });
        }
      }
    }
  };

  const selectedServicePriceId = form.watch('selectedServicePriceId');
  const selectedServiceName = selectedServicePriceId ? getServicePriceById(selectedServicePriceId)?.name : null;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="border border-border rounded-md p-3 sm:p-4 relative mt-4 md:mt-6">
        <p className="text-xs sm:text-sm font-semibold -mt-5 sm:-mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Transfer Mode</p>
        <ShadcnFormField
          control={form.control}
          name="transferMode"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select transfer mode" /></SelectTrigger></FormControl>
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
          <div className="border border-border rounded-md p-3 sm:p-4 relative">
             <p className="text-xs sm:text-sm font-semibold -mt-5 sm:-mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Predefined Services</p>
            <ShadcnFormField
              control={form.control}
              name="selectedServicePriceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Select Predefined Transfer ({province || (countryId ? countries.find(c=>c.id===countryId)?.name : 'Any')})</FormLabel>
                  <Select
                    onValueChange={(value) => handlePredefinedServiceSelect(value)}
                    value={field.value || "none"}
                    disabled={isLoadingServices}
                  >
                    <FormControl><SelectTrigger className="h-9 text-sm"><SelectValue placeholder={`Choose ${transferMode} service...`} /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None (Custom Price)</SelectItem>
                      {availableTransferServices.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.province || (service.countryId ? countries.find(c=>c.id === service.countryId)?.name : 'Generic')}) - {service.price1 !== undefined ? `${currency} ${service.price1}` : (service.vehicleOptions?.length ? `${service.vehicleOptions.length} options` : 'Options')}
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
        <div className="border border-border rounded-md p-3 sm:p-4 relative">
           <p className="text-xs sm:text-sm font-semibold -mt-5 sm:-mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Ticket Pricing</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-2">
            <ShadcnFormField
              control={form.control}
              name="price1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Adult Ticket Price ({currency})</FormLabel>
                  <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} value={field.value ?? ''} className="h-9 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ShadcnFormField
              control={form.control}
              name="price2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Child Ticket Price ({currency}) (Optional)</FormLabel>
                  <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} value={field.value ?? ''} className="h-9 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {transferMode === 'vehicle' && (
        <>
          <VehicleOptionsSection currency={currency} routeName={routeName} />
          <SurchargePeriodsSection currency={currency} routeName={routeName} />
        </>
      )}
    </div>
  );
}
