
"use client";

import * as React from 'react';
import type { MiscItem as MiscItemType, Traveler, CurrencyCode, ServicePriceItem, TripSettings, CountryItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useServicePrices } from '@/hooks/useServicePrices';
import { useCountries } from '@/hooks/useCountries';

interface MiscItemFormProps {
  item: MiscItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  tripSettings: TripSettings;
  dayNumber: number;
  onUpdate: (item: MiscItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
}

export function MiscItemForm({ item, travelers, currency, tripSettings, dayNumber, onUpdate, onDelete }: MiscItemFormProps) {
  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const { countries, getCountryById } = useCountries();
  const [miscServices, setMiscServices] = React.useState<ServicePriceItem[]>([]);

  const itemCountry = React.useMemo(() => item.countryId ? getCountryById(item.countryId) : undefined, [item.countryId, getCountryById]);

  const getServicePriceById = React.useCallback((id: string) => {
    return allServicePrices.find(sp => sp.id === id);
  }, [allServicePrices]);

  const selectedService = React.useMemo(() => {
    if (item.selectedServicePriceId) {
      return getServicePriceById(item.selectedServicePriceId);
    }
    return undefined;
  }, [item.selectedServicePriceId, getServicePriceById]);

  React.useEffect(() => {
    if (isLoadingServices) {
      setMiscServices([]);
      return;
    }
    let filteredServices = allServicePrices.filter(s => s.category === 'misc' && s.currency === currency);

    if (item.countryId) {
      filteredServices = filteredServices.filter(s => s.countryId === item.countryId || !s.countryId);
    } else if (tripSettings.selectedCountries.length > 0) {
      filteredServices = filteredServices.filter(s => !s.countryId || tripSettings.selectedCountries.includes(s.countryId));
    }

    if (item.province) {
      filteredServices = filteredServices.filter(s => s.province === item.province || !s.province);
    } else if (tripSettings.selectedProvinces.length > 0) {
         const relevantGlobalProvinces = (tripSettings.selectedCountries.length > 0)
            ? tripSettings.selectedProvinces.filter(provName => {
                const provObj = allServicePrices.find(sp => sp.province === provName);
                return provObj && provObj.countryId && tripSettings.selectedCountries.includes(provObj.countryId);
            })
            : tripSettings.selectedProvinces;
        if(relevantGlobalProvinces.length > 0){
             filteredServices = filteredServices.filter(s => !s.province || relevantGlobalProvinces.includes(s.province));
        }
    }
    setMiscServices(filteredServices);
  }, [allServicePrices, currency, item.countryId, item.province, tripSettings.selectedCountries, tripSettings.selectedProvinces, isLoadingServices]);


  const handleInputChange = (field: keyof MiscItemType, value: any) => {
    onUpdate({
      ...item,
      [field]: value,
      selectedServicePriceId: (field === 'costAssignment' || field === 'quantity') ? item.selectedServicePriceId : undefined
    });
  };

  const handleNumericInputChange = (field: keyof MiscItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onUpdate({
      ...item,
      [field]: numValue,
      selectedServicePriceId: field === 'unitCost' ? undefined : item.selectedServicePriceId
    });
  };

  const handlePredefinedServiceSelect = (selectedValue: string) => {
    if (selectedValue === "none") {
      onUpdate({
        ...item,
        selectedServicePriceId: undefined,
        unitCost: 0,
        note: undefined,
      });
    } else {
      const service = getServicePriceById(selectedValue);
      if (service) {
        onUpdate({
          ...item,
          name: item.name === `New misc` || !item.name || !item.selectedServicePriceId ? service.name : item.name,
          unitCost: service.price1 ?? 0,
          selectedServicePriceId: service.id,
          note: service.notes || undefined,
          province: service.province || item.province,
          countryId: service.countryId || item.countryId,
          countryName: service.countryId ? countries.find(c => c.id === service.countryId)?.name : item.countryName,
        });
      } else {
        onUpdate({
          ...item,
          selectedServicePriceId: selectedValue,
          unitCost: 0,
          note: undefined,
        });
      }
    }
  };

  const serviceDefinitionNotFound = item.selectedServicePriceId && !selectedService && !isLoadingServices;
  const isPriceReadOnly = !!item.selectedServicePriceId && !!selectedService;
  const locationDisplay = item.countryName ? (item.province ? `${item.province}, ${item.countryName}` : item.countryName)
                        : (item.province || (tripSettings.selectedProvinces.length > 0 ? tripSettings.selectedProvinces.join('/') : (tripSettings.selectedCountries.length > 0 ? (tripSettings.selectedCountries.map(cid => countries.find(c=>c.id === cid)?.name).filter(Boolean).join('/')) : 'Any Location')));


  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} tripSettings={tripSettings} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Miscellaneous Item" dayNumber={dayNumber}>
       {(miscServices.length > 0 || item.selectedServicePriceId || isLoadingServices) && (
        <div className="mt-4 pt-4 border-t">
          <FormField label={`Select Predefined Item (${locationDisplay || 'Global'})`} id={`predefined-misc-${item.id}`}>
             {isLoadingServices ? (
                 <div className="flex items-center h-10 border rounded-md px-3 bg-muted/50">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading items...</span>
                </div>
            ) : (
                <Select
                value={item.selectedServicePriceId || "none"}
                onValueChange={handlePredefinedServiceSelect}
                disabled={miscServices.length === 0 && !item.selectedServicePriceId}
                >
                <SelectTrigger>
                    <SelectValue placeholder={miscServices.length === 0 && !item.selectedServicePriceId ? "No items match criteria" : "Choose a predefined item..."} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None (Custom Price)</SelectItem>
                    {miscServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.province || (service.countryId ? countries.find(c=>c.id === service.countryId)?.name : 'Generic')}) - {currency} {service.price1}
                        {service.subCategory ? ` (${service.subCategory})` : ''}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            )}
          </FormField>
          {selectedService && <p className="text-xs text-muted-foreground pt-1">Using: {selectedService.name}{selectedService.subCategory ? ` (${selectedService.subCategory})` : ''}</p>}
        </div>
      )}

      {serviceDefinitionNotFound && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            The selected miscellaneous item (ID: {item.selectedServicePriceId}) could not be found. Please choose another or set a custom price.
          </AlertDescription>
        </Alert>
      )}

      <Separator className="my-4" />
      <div className="space-y-1 mb-2">
          <p className="text-sm font-medium text-muted-foreground">Configuration Details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label={`Unit Cost (${currency})`} id={`unitCost-${item.id}`}>
          <Input
            type="number"
            id={`unitCost-${item.id}`}
            value={item.unitCost ?? ''}
            onChange={(e) => handleNumericInputChange('unitCost', e.target.value)}
            min="0"
            placeholder="0.00"
            readOnly={isPriceReadOnly}
            className={isPriceReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}
          />
        </FormField>
        <FormField label="Quantity" id={`quantity-${item.id}`}>
          <Input
            type="number"
            id={`quantity-${item.id}`}
            value={item.quantity ?? ''}
            onChange={(e) => handleNumericInputChange('quantity', e.target.value)}
            min="1"
            placeholder="1"
          />
        </FormField>
        <FormField label="Cost Assignment" id={`costAssignment-${item.id}`}>
          <Select
            value={item.costAssignment}
            onValueChange={(value: 'perPerson' | 'total') => handleInputChange('costAssignment', value)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="perPerson">Per Person</SelectItem>
              <SelectItem value="total">Total (Shared)</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </BaseItemForm>
  );
}


    