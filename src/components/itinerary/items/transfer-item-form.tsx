/**
 * @fileoverview This component provides a form for adding or editing transfer items
 * within an itinerary. It handles different transfer modes (ticket vs. vehicle),
 * allows selection of predefined transfer services, and manages vehicle-specific
 * options like type and cost. It uses the `BaseItemForm` for common structure
 * and traveler exclusion logic.
 *
 * @bangla এই কম্পোনেন্টটি একটি ভ্রমণপথের মধ্যে ট্রান্সফার আইটেম যোগ বা সম্পাদনা করার
 * জন্য একটি ফর্ম সরবরাহ করে। এটি বিভিন্ন ট্রান্সফার মোড (টিকিট বনাম যান) পরিচালনা করে,
 * পূর্বনির্ধারিত ট্রান্সফার পরিষেবা নির্বাচনের অনুমতি দেয় এবং গাড়ির নির্দিষ্ট বিকল্পগুলি
 * যেমন প্রকার এবং খরচ পরিচালনা করে। এটি সাধারণ কাঠামো এবং ভ্রমণকারী বাদ দেওয়ার যুক্তির
 * জন্য `BaseItemForm` ব্যবহার করে।
 */
"use client";

import * as React from 'react';
import type { TransferItem as TransferItemType, Traveler, CurrencyCode, ServicePriceItem, VehicleType, TripSettings, CountryItem } from '@/types/itinerary';
import { VEHICLE_TYPES } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format as formatDateFns, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useServicePrices } from '@/hooks/useServicePrices';
import { useCountries } from '@/hooks/useCountries';
import { useExchangeRates } from '@/hooks/useExchangeRates';

interface TransferItemFormProps {
  item: TransferItemType;
  travelers: Traveler[];
  currency: CurrencyCode; // Billing Currency
  tripSettings: TripSettings;
  dayNumber: number;
  onUpdate: (item: TransferItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
  itemSummaryLine: React.ReactNode;
  isCurrentlyExpanded: boolean;
  onToggleExpand: () => void;
}

function TransferItemFormComponent({
  item,
  travelers,
  currency: billingCurrency,
  tripSettings,
  dayNumber,
  onUpdate,
  onDelete,
  allServicePrices: passedInAllServicePrices,
  itemSummaryLine,
  isCurrentlyExpanded,
  onToggleExpand
}: TransferItemFormProps) {
  const { allServicePrices: hookServicePrices, isLoading: isLoadingServicesHook } = useServicePrices();
  const currentAllServicePrices = passedInAllServicePrices || hookServicePrices;
  const { countries, getCountryById } = useCountries();
  const { getRate, isLoading: isLoadingExchangeRates } = useExchangeRates();
  const [transferServices, setTransferServices] = React.useState<ServicePriceItem[]>([]);

  const determineItemSourceCurrency = React.useCallback((): CurrencyCode => {
    const service = item.selectedServicePriceId ? currentAllServicePrices.find(sp => sp.id === item.selectedServicePriceId) : undefined;
    if (service) return service.currency;

    const itemCountryDef = item.countryId ? getCountryById(item.countryId) :
                           (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0]) : undefined);
    if (itemCountryDef?.defaultCurrency) return itemCountryDef.defaultCurrency;

    return billingCurrency; 
  }, [item.selectedServicePriceId, item.countryId, currentAllServicePrices, getCountryById, tripSettings.selectedCountries, billingCurrency]);

  const [itemSourceCurrency, setItemSourceCurrency] = React.useState<CurrencyCode>(determineItemSourceCurrency());

  React.useEffect(() => {
    setItemSourceCurrency(determineItemSourceCurrency());
  }, [determineItemSourceCurrency]);


  const getServicePriceById = React.useCallback((id: string) => {
    return currentAllServicePrices.find(sp => sp.id === id);
  }, [currentAllServicePrices]);

  const selectedService = React.useMemo(() => {
    if (item.selectedServicePriceId) {
      return getServicePriceById(item.selectedServicePriceId);
    }
    return undefined;
  }, [item.selectedServicePriceId, getServicePriceById]);

  const isLoadingServices = passedInAllServicePrices ? false : isLoadingServicesHook;

  React.useEffect(() => {
    if (isLoadingServices) {
      setTransferServices([]);
      return;
    }
    let filteredServices = currentAllServicePrices.filter(s => s.category === 'transfer');

    const currencyToFilterBy = itemSourceCurrency;
    filteredServices = filteredServices.filter(s => s.currency === currencyToFilterBy);


    filteredServices = filteredServices.filter(s => {
        if (item.mode === 'ticket') return s.subCategory === 'ticket' || s.transferMode === 'ticket';
        if (item.mode === 'vehicle') return s.transferMode === 'vehicle';
        return false;
    });

    const countryIdToFilterBy = item.countryId || (tripSettings.selectedCountries.length === 1 ? tripSettings.selectedCountries[0] : undefined);
    const provincesToFilterBy = item.province ? [item.province] : tripSettings.selectedProvinces;

    if (countryIdToFilterBy) {
      filteredServices = filteredServices.filter(s => s.countryId === countryIdToFilterBy || !s.countryId);
    } else if (tripSettings.selectedCountries.length > 0) {
      filteredServices = filteredServices.filter(s => !s.countryId || tripSettings.selectedCountries.includes(s.countryId));
    }

    if (provincesToFilterBy.length > 0) {
      filteredServices = filteredServices.filter(s => !s.province || provincesToFilterBy.includes(s.province));
    }

    setTransferServices(filteredServices.sort((a,b) => a.name.localeCompare(b.name)));
  }, [currentAllServicePrices, itemSourceCurrency, item.mode, item.countryId, item.province, tripSettings.selectedCountries, tripSettings.selectedProvinces, isLoadingServices]);


  const handleInputChange = (field: keyof TransferItemType, value: any) => {
    if (field === 'mode') {
        const newSourceCurrency = item.countryId ? getCountryById(item.countryId)?.defaultCurrency || billingCurrency :
                               (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0])?.defaultCurrency || billingCurrency : billingCurrency);
        onUpdate({
            ...item,
            [field]: value,
            selectedServicePriceId: undefined,
            adultTicketPrice: value === 'ticket' ? (item.adultTicketPrice ?? 0) : undefined,
            childTicketPrice: value === 'ticket' ? item.childTicketPrice : undefined,
            costPerVehicle: value === 'vehicle' ? (item.costPerVehicle ?? 0) : undefined,
            vehicles: value === 'vehicle' ? (item.vehicles || 1) : undefined,
            vehicleType: value === 'vehicle' ? (item.vehicleType || VEHICLE_TYPES[0]) : undefined,
            selectedVehicleOptionId: undefined,
            note: undefined,
        });
        setItemSourceCurrency(newSourceCurrency); 
    } else {
        onUpdate({
          ...item,
          [field]: value,
          selectedServicePriceId: (field === 'vehicleType') ? undefined : item.selectedServicePriceId,
          selectedVehicleOptionId: (field === 'vehicleType') ? undefined : item.selectedVehicleOptionId,
        });
    }
  };

  const handleNumericInputChange = (field: keyof TransferItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onUpdate({
      ...item,
      [field]: numValue,
      selectedServicePriceId: undefined,
      selectedVehicleOptionId: undefined
    });
  };

  const handlePredefinedServiceSelect = (selectedValue: string) => {
    if (selectedValue === "none") {
      const newSourceCurrency = item.countryId ? getCountryById(item.countryId)?.defaultCurrency || billingCurrency :
                               (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0])?.defaultCurrency || billingCurrency : billingCurrency);
      onUpdate({
        ...item,
        name: `New transfer`,
        selectedServicePriceId: undefined,
        selectedVehicleOptionId: undefined,
        adultTicketPrice: item.mode === 'ticket' ? 0 : undefined,
        childTicketPrice: undefined,
        costPerVehicle: item.mode === 'vehicle' ? 0 : undefined,
        vehicleType: item.mode === 'vehicle' ? (item.vehicleType || VEHICLE_TYPES[0]) : undefined,
        vehicles: item.mode === 'vehicle' ? (item.vehicles || 1) : undefined,
        note: undefined,
        province: item.province,
        countryId: item.countryId,
        countryName: item.countryId ? countries.find(c => c.id === item.countryId)?.name : undefined,
      });
      setItemSourceCurrency(newSourceCurrency);
    } else {
      const service = getServicePriceById(selectedValue);
      if (service) {
        const updatedItemPartial: Partial<TransferItemType> = {
          name: (item.name === `New transfer` || !item.name || !item.selectedServicePriceId) ? service.name : item.name,
          selectedServicePriceId: service.id,
          selectedVehicleOptionId: undefined,
          note: service.notes || undefined,
          province: service.province || item.province,
          countryId: service.countryId || item.countryId,
          countryName: service.countryId ? countries.find(c => c.id === service.countryId)?.name : item.countryName,
        };
        if (item.mode === 'ticket') {
          updatedItemPartial.adultTicketPrice = service.price1 ?? 0;
          updatedItemPartial.childTicketPrice = service.price2 ?? undefined;
          updatedItemPartial.vehicleType = undefined;
          updatedItemPartial.costPerVehicle = undefined;
          updatedItemPartial.vehicles = undefined;
        } else if (item.mode === 'vehicle') {
          updatedItemPartial.adultTicketPrice = undefined;
          updatedItemPartial.childTicketPrice = undefined;
          if (service.vehicleOptions && service.vehicleOptions.length > 0) {
            const firstOption = service.vehicleOptions[0];
            updatedItemPartial.selectedVehicleOptionId = firstOption.id;
            updatedItemPartial.costPerVehicle = firstOption.price;
            updatedItemPartial.vehicleType = firstOption.vehicleType;
            updatedItemPartial.note = firstOption.notes || service.notes || item.note || undefined;
          } else {
            updatedItemPartial.costPerVehicle = service.price1 ?? 0;
            updatedItemPartial.vehicleType = (service.subCategory && VEHICLE_TYPES.includes(service.subCategory as VehicleType))
                                             ? service.subCategory as VehicleType
                                             : VEHICLE_TYPES[0];
          }
          updatedItemPartial.vehicles = item.vehicles || 1;
        }
        onUpdate({ ...item, ...updatedItemPartial });
        setItemSourceCurrency(service.currency);
      } else {
         const fallbackSourceCurrency = item.countryId ? getCountryById(item.countryId)?.defaultCurrency || billingCurrency :
                                     (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0])?.defaultCurrency || billingCurrency : billingCurrency);
        onUpdate({
          ...item,
          name: `New transfer`,
          selectedServicePriceId: selectedValue,
          selectedVehicleOptionId: undefined,
          adultTicketPrice: item.mode === 'ticket' ? 0 : undefined,
          childTicketPrice: undefined,
          costPerVehicle: item.mode === 'vehicle' ? 0 : undefined,
          vehicleType: item.mode === 'vehicle' ? (item.vehicleType || VEHICLE_TYPES[0]) : undefined,
          vehicles: item.mode === 'vehicle' ? (item.vehicles || 1) : undefined,
          note: undefined,
        });
        setItemSourceCurrency(fallbackSourceCurrency);
      }
    }
  };

  const handleVehicleOptionSelect = (optionId: string) => {
    if (!selectedService || !selectedService.vehicleOptions) return;
    const option = selectedService.vehicleOptions.find(vo => vo.id === optionId);
    if (option) {
      onUpdate({
        ...item,
        selectedVehicleOptionId: option.id,
        costPerVehicle: option.price,
        vehicleType: option.vehicleType,
        note: option.notes || selectedService.notes || item.note || undefined,
      });
    } else { 
      const baseCost = (selectedService.vehicleOptions && selectedService.vehicleOptions.length > 0)
                       ? undefined 
                       : selectedService.price1 ?? 0;
      const baseType = (selectedService.vehicleOptions && selectedService.vehicleOptions.length > 0)
                       ? undefined
                       : (selectedService.subCategory && VEHICLE_TYPES.includes(selectedService.subCategory as VehicleType))
                         ? selectedService.subCategory as VehicleType
                         : VEHICLE_TYPES[0];
      onUpdate({
        ...item,
        selectedVehicleOptionId: undefined,
        costPerVehicle: baseCost,
        vehicleType: baseType,
        note: selectedService.notes || item.note || undefined,
      });
    }
  };

  const serviceDefinitionNotFound = item.selectedServicePriceId && !selectedService && !isLoadingServices;

  let isVehicleCostTypeReadOnly = false;
  if (item.mode === 'vehicle') {
    if (selectedService && item.selectedVehicleOptionId && selectedService.vehicleOptions?.find(vo => vo.id === item.selectedVehicleOptionId)) {
      isVehicleCostTypeReadOnly = true;
    } else if (selectedService && (!selectedService.vehicleOptions || selectedService.vehicleOptions.length === 0)) {
      isVehicleCostTypeReadOnly = true;
    }
  }

  const displayedVehicleType = item.mode === 'vehicle'
    ? (item.selectedVehicleOptionId && selectedService?.vehicleOptions?.find(vo => vo.id === item.selectedVehicleOptionId)?.vehicleType) ||
      (!item.selectedVehicleOptionId && selectedService && (!selectedService.vehicleOptions || selectedService.vehicleOptions.length === 0) && (VEHICLE_TYPES.includes(selectedService.subCategory as VehicleType) ? selectedService.subCategory as VehicleType : (selectedService as any).vehicleType || item.vehicleType)) ||
      item.vehicleType || VEHICLE_TYPES[0]
    : undefined;

  const displayedCostPerVehicle = item.mode === 'vehicle'
    ? (item.selectedVehicleOptionId && selectedService?.vehicleOptions?.find(vo => vo.id === item.selectedVehicleOptionId)?.price) ??
      (!item.selectedVehicleOptionId && selectedService && (!selectedService.vehicleOptions || selectedService.vehicleOptions.length === 0) ? selectedService.price1 : item.costPerVehicle) ?? 0
    : undefined;

  const itemCountryName = item.countryId ? countries.find(c => c.id === item.countryId)?.name : undefined;
  const globalCountryNames = tripSettings.selectedCountries.map(id => countries.find(c => c.id === id)?.name).filter(Boolean) as string[];
  let locationContext = "Global";
  if (itemCountryName) {
    locationContext = item.province ? `${item.province}, ${itemCountryName}` : itemCountryName;
  } else if (globalCountryNames.length > 0) {
    locationContext = tripSettings.selectedProvinces.length > 0
      ? `${tripSettings.selectedProvinces.join('/')} (${globalCountryNames.join('/')})`
      : globalCountryNames.join('/');
  } else if (tripSettings.selectedProvinces.length > 0) {
    locationContext = tripSettings.selectedProvinces.join('/');
  }

  const conversionDetails = (itemSourceCurrency !== billingCurrency && getRate && !isLoadingExchangeRates) ? getRate(itemSourceCurrency, billingCurrency) : null;
  const adultTicketPriceConverted = item.adultTicketPrice !== undefined && conversionDetails ? item.adultTicketPrice * conversionDetails.finalRate : null;
  const childTicketPriceConverted = item.childTicketPrice !== undefined && conversionDetails ? item.childTicketPrice * conversionDetails.finalRate : null;
  const costPerVehicleConverted = displayedCostPerVehicle !== undefined && conversionDetails ? displayedCostPerVehicle * conversionDetails.finalRate : null;


  return (
    <BaseItemForm
      item={item}
      travelers={travelers}
      currency={billingCurrency}
      tripSettings={tripSettings}
      onUpdate={onUpdate as any}
      onDelete={onDelete}
      itemTypeLabel="Transfer"
      dayNumber={dayNumber}
      itemSummaryLine={itemSummaryLine}
      isCurrentlyExpanded={isCurrentlyExpanded}
      onToggleExpand={onToggleExpand}
    >
      <div className="pt-2">
        <FormField label="Mode" id={`transferMode-${item.id}`}>
          <Select value={item.mode} onValueChange={(value: 'ticket' | 'vehicle') => handleInputChange('mode', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ticket">Ticket Basis</SelectItem>
              <SelectItem value="vehicle">Vehicle Basis</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      {item.mode && (
        <div className="mt-4">
          <FormField label={`Select Predefined Route (${locationContext} - ${itemSourceCurrency})`} id={`predefined-transfer-${item.id}`}>
              {isLoadingServices && !passedInAllServicePrices && (!item.selectedServicePriceId && transferServices.length === 0) ? (
                 <div className="flex items-center h-10 border rounded-md px-3 bg-muted/50">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading routes...</span>
                </div>
              ) : (
                <Select
                    value={item.selectedServicePriceId || "none"}
                    onValueChange={handlePredefinedServiceSelect}
                    disabled={!item.selectedServicePriceId && transferServices.length === 0 && !isLoadingServices}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={
                            isLoadingServices && transferServices.length === 0 ? "Loading routes..." :
                            (transferServices.length === 0 && !item.selectedServicePriceId ? "No routes match criteria" : `Choose ${item.mode} service...`)} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None (Custom Price/Options)</SelectItem>
                        {transferServices.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                            {service.name} ({service.province || (service.countryId ? countries.find(c => c.id === service.countryId)?.name : 'Generic')})
                            {service.vehicleOptions && service.vehicleOptions.length > 0 ? ` - ${service.vehicleOptions.length} options` : (service.price1 !== undefined ? ` - ${service.currency} ${service.price1}`: '')}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              )}
          </FormField>
          {selectedService && <p className="text-xs text-muted-foreground pt-1">Using: {selectedService.name} (Priced in {selectedService.currency})</p>}

          {item.mode === 'vehicle' && selectedService && selectedService.vehicleOptions && selectedService.vehicleOptions.length > 0 && (
            <div className="mt-3">
              <FormField label="Select Vehicle Option" id={`vehicle-option-${item.id}`}>
                <Select
                  value={item.selectedVehicleOptionId || "none"}
                  onValueChange={handleVehicleOptionSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose vehicle option..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Use Service Base or Custom)</SelectItem>
                    {selectedService.vehicleOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.vehicleType} - {itemSourceCurrency} {opt.price} (Max: {opt.maxPassengers} Pax)
                        {opt.notes ? ` - ${opt.notes}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          )}
        </div>
      )}

      {serviceDefinitionNotFound && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            The selected transfer service (ID: {item.selectedServicePriceId}) could not be found. Please choose another or set a custom price/options.
          </AlertDescription>
        </Alert>
      )}
       {itemSourceCurrency !== billingCurrency && selectedService && conversionDetails && !isLoadingExchangeRates && (
        <p className="text-xs text-blue-600 mb-2">Note: Prices shown in {itemSourceCurrency}. Totals converted to {billingCurrency} using rate ~{conversionDetails.finalRate.toFixed(4)}.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-4">
        <FormField label="Transfer Name / Route Description" id={`itemName-${item.id}`} className="md:col-span-1">
            <Input
            id={`itemName-${item.id}`}
            value={item.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={`e.g., Airport to Hotel`}
            className="h-9 text-sm"
            />
        </FormField>
        <FormField label="Note (Optional)" id={`itemNote-${item.id}`} className="md:col-span-1">
            <Input
            id={`itemNote-${item.id}`}
            value={item.note || ''}
            onChange={(e) => handleInputChange('note', e.target.value)}
            placeholder={`e.g., Flight details, specific instructions`}
            className="h-9 text-sm"
            />
        </FormField>
      </div>

      <Separator className="my-4" />
      <div className="space-y-1 mb-2">
          <Label className="text-sm font-medium text-muted-foreground">Configuration Details</Label>
      </div>

      {item.mode === 'ticket' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={`Adult Ticket Price (${itemSourceCurrency})`} id={`adultTicketPrice-${item.id}`}>
            <Input
              type="number"
              id={`adultTicketPrice-${item.id}`}
              value={item.adultTicketPrice ?? ''}
              onChange={(e) => handleNumericInputChange('adultTicketPrice', e.target.value)}
              min="0"
              placeholder="0.00"
              readOnly={!!selectedService}
              className={!!selectedService ? "bg-muted/50 cursor-not-allowed" : ""}
            />
            {conversionDetails && adultTicketPriceConverted !== null && !isLoadingExchangeRates && (
               <p className="text-xs text-muted-foreground mt-1">Approx. {formatCurrency(adultTicketPriceConverted, billingCurrency)}</p>
            )}
          </FormField>
          <FormField label={`Child Ticket Price (${itemSourceCurrency}) (Optional)`} id={`childTicketPrice-${item.id}`}>
            <Input
              type="number"
              id={`childTicketPrice-${item.id}`}
              value={item.childTicketPrice ?? ''}
              onChange={(e) => handleNumericInputChange('childTicketPrice', e.target.value)}
              min="0"
              placeholder="Defaults to adult price"
              readOnly={!!selectedService}
              className={!!selectedService ? "bg-muted/50 cursor-not-allowed" : ""}
            />
            {conversionDetails && childTicketPriceConverted !== null && !isLoadingExchangeRates && (
                <p className="text-xs text-muted-foreground mt-1">Approx. {formatCurrency(childTicketPriceConverted, billingCurrency)}</p>
            )}
          </FormField>
        </div>
      )}

      {item.mode === 'vehicle' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Vehicle Type" id={`vehicleType-${item.id}`}>
              <Select
                value={displayedVehicleType}
                onValueChange={(value: VehicleType) => handleInputChange('vehicleType', value)}
                disabled={isVehicleCostTypeReadOnly}
              >
                <SelectTrigger className={isVehicleCostTypeReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map(vType => (
                    <SelectItem key={vType} value={vType}>{vType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={`Cost Per Vehicle (${itemSourceCurrency})`} id={`costPerVehicle-${item.id}`}>
              <Input
                type="number"
                id={`costPerVehicle-${item.id}`}
                value={displayedCostPerVehicle ?? ''}
                onChange={(e) => handleNumericInputChange('costPerVehicle', e.target.value)}
                min="0"
                placeholder="0.00"
                readOnly={isVehicleCostTypeReadOnly}
                className={isVehicleCostTypeReadOnly ? "bg-muted/50 cursor-not-allowed" : ""}
              />
              {conversionDetails && costPerVehicleConverted !== null && !isLoadingExchangeRates && (
                <p className="text-xs text-muted-foreground mt-1">Approx. {formatCurrency(costPerVehicleConverted, billingCurrency)}</p>
              )}
            </FormField>
            <FormField label="# of Vehicles" id={`numVehicles-${item.id}`}>
              <Input
                type="number"
                id={`numVehicles-${item.id}`}
                value={item.vehicles ?? ''}
                onChange={(e) => handleInputChange('vehicles', parseInt(e.target.value,10) || 1)}
                min="1"
                placeholder="1"
              />
            </FormField>
          </div>
          {selectedService && selectedService.surchargePeriods && selectedService.surchargePeriods.length > 0 && (
            <div className="mt-3 p-2 border rounded-md bg-muted/30 text-xs">
              <p className="font-medium">Note: This route has potential surcharges that will be applied automatically based on date:</p>
              <ul className="list-disc list-inside pl-2">
                {selectedService.surchargePeriods.map(sp => {
                  try {
                    return (
                      <li key={sp.id}>
                        {sp.name}: +{formatCurrency(sp.surchargeAmount, itemSourceCurrency)}
                        ({formatDateFns(parseISO(sp.startDate), 'dd MMM')} - {formatDateFns(parseISO(sp.endDate), 'dd MMM')})
                      </li>
                    );
                  } catch (e) {
                    return <li key={sp.id} className="text-destructive">Error parsing surcharge date for {sp.name}</li>
                  }
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </BaseItemForm>
  );
}
export const TransferItemForm = React.memo(TransferItemFormComponent);
