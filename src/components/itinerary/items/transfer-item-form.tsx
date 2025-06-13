
"use client";

import * as React from 'react';
import type { TransferItem as TransferItemType, Traveler, CurrencyCode, ServicePriceItem, VehicleType, TripSettings, CountryItem } from '@/types/itinerary';
import { VEHICLE_TYPES } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useServicePrices } from '@/hooks/useServicePrices';
import { useCountries } from '@/hooks/useCountries';

interface TransferItemFormProps {
  item: TransferItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  tripSettings: TripSettings;
  dayNumber: number;
  onUpdate: (item: TransferItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
}

export function TransferItemForm({ item, travelers, currency, tripSettings, dayNumber, onUpdate, onDelete }: TransferItemFormProps) {
  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const { countries, getCountryById } = useCountries();
  const [transferServices, setTransferServices] = React.useState<ServicePriceItem[]>([]);

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
      setTransferServices([]);
      return;
    }
    let filteredServices = allServicePrices.filter(s => s.category === 'transfer' && s.currency === currency);

    filteredServices = filteredServices.filter(s => {
        if (item.mode === 'ticket') return s.subCategory === 'ticket' || s.transferMode === 'ticket';
        if (item.mode === 'vehicle') return s.transferMode === 'vehicle';
        return false;
    });

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

    setTransferServices(filteredServices);
  }, [allServicePrices, currency, item.mode, item.countryId, item.province, tripSettings.selectedCountries, tripSettings.selectedProvinces, isLoadingServices]);


  const handleInputChange = (field: keyof TransferItemType, value: any) => {
    if (field === 'mode') {
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
      onUpdate({
        ...item,
        selectedServicePriceId: undefined,
        selectedVehicleOptionId: undefined,
        adultTicketPrice: item.mode === 'ticket' ? 0 : undefined,
        childTicketPrice: undefined,
        costPerVehicle: item.mode === 'vehicle' ? 0 : undefined,
        vehicleType: item.mode === 'vehicle' ? (item.vehicleType || VEHICLE_TYPES[0]) : undefined,
        vehicles: item.mode === 'vehicle' ? (item.vehicles || 1) : undefined,
        note: undefined,
      });
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
            updatedItemPartial.note = firstOption.notes || service.notes || undefined;
          } else {
            updatedItemPartial.costPerVehicle = service.price1 ?? 0;
            updatedItemPartial.vehicleType = (service.subCategory && VEHICLE_TYPES.includes(service.subCategory as VehicleType))
                                             ? service.subCategory as VehicleType
                                             : VEHICLE_TYPES[0];
          }
          updatedItemPartial.vehicles = item.vehicles || 1;
        }
        onUpdate({ ...item, ...updatedItemPartial });
      } else {
         onUpdate({
          ...item,
          selectedServicePriceId: selectedValue,
          selectedVehicleOptionId: undefined,
          adultTicketPrice: item.mode === 'ticket' ? 0 : undefined,
          childTicketPrice: undefined,
          costPerVehicle: item.mode === 'vehicle' ? 0 : undefined,
          vehicleType: item.mode === 'vehicle' ? (item.vehicleType || VEHICLE_TYPES[0]) : undefined,
          vehicles: item.mode === 'vehicle' ? (item.vehicles || 1) : undefined,
          note: undefined,
        });
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
        note: option.notes || selectedService.notes || undefined,
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
        note: selectedService.notes || undefined,
      });
    }
  };

  const serviceDefinitionNotFound = item.selectedServicePriceId && !selectedService && !isLoadingServices;

  let isVehicleCostTypeReadOnly = false;
  if (item.mode === 'vehicle' && selectedService) {
    if (selectedService.vehicleOptions && selectedService.vehicleOptions.length > 0) {
      isVehicleCostTypeReadOnly = true; 
    } else {
      isVehicleCostTypeReadOnly = true; 
    }
  }
  const allowDirectVehicleEdit = item.mode === 'vehicle' && (!selectedService || (!selectedService.vehicleOptions || selectedService.vehicleOptions.length === 0) && !item.selectedVehicleOptionId);

  const displayedVehicleType = item.mode === 'vehicle'
    ? (item.selectedVehicleOptionId && selectedService?.vehicleOptions?.find(vo => vo.id === item.selectedVehicleOptionId)?.vehicleType) ||
      (!item.selectedVehicleOptionId && selectedService && (!selectedService.vehicleOptions || selectedService.vehicleOptions.length === 0) && (VEHICLE_TYPES.includes(selectedService.subCategory as VehicleType) ? selectedService.subCategory as VehicleType : (selectedService as any).vehicleType || item.vehicleType)) ||
      item.vehicleType || VEHICLE_TYPES[0]
    : undefined;

  const displayedCostPerVehicle = item.mode === 'vehicle'
    ? (item.selectedVehicleOptionId && selectedService?.vehicleOptions?.find(vo => vo.id === item.selectedVehicleOptionId)?.price) ??
      (!item.selectedVehicleOptionId && selectedService && (!selectedService.vehicleOptions || selectedService.vehicleOptions.length === 0) ? selectedService.price1 : item.costPerVehicle) ?? 0
    : undefined;

  const locationDisplay = item.countryName ? (item.province ? `${item.province}, ${item.countryName}` : item.countryName)
                        : (item.province || (tripSettings.selectedProvinces.length > 0 ? tripSettings.selectedProvinces.join('/') : (tripSettings.selectedCountries.length > 0 ? (tripSettings.selectedCountries.map(cid => countries.find(c=>c.id === cid)?.name).filter(Boolean).join('/')) : 'Any Location')));


  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} tripSettings={tripSettings} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Transfer" dayNumber={dayNumber}>
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

      {(transferServices.length > 0 || item.selectedServicePriceId || isLoadingServices) && (
        <div className="mt-4 pt-4 border-t">
          <FormField label={`Select Predefined Service (${locationDisplay || 'Global'})`} id={`predefined-transfer-${item.id}`}>
              {isLoadingServices ? (
                 <div className="flex items-center h-10 border rounded-md px-3 bg-muted/50">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading transfers...</span>
                </div>
              ) : (
                <Select
                    value={item.selectedServicePriceId || "none"}
                    onValueChange={handlePredefinedServiceSelect}
                    disabled={transferServices.length === 0 && !item.selectedServicePriceId}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={transferServices.length === 0 && !item.selectedServicePriceId ? "No transfers match criteria" : `Choose ${item.mode} service...`} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None (Custom Price/Options)</SelectItem>
                        {transferServices.map(service => (
                        <SelectItem key={service.id} value={service.id}>
                            {service.name} ({service.province || (service.countryId ? countries.find(c=>c.id === service.countryId)?.name : 'Generic')})
                            {service.vehicleOptions && service.vehicleOptions.length > 0 ? ` - ${service.vehicleOptions.length} options` : (service.price1 !== undefined ? ` - ${currency} ${service.price1}`: '')}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              )}
          </FormField>
          {selectedService && <p className="text-xs text-muted-foreground pt-1">Using: {selectedService.name}</p>}

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
                    <SelectItem value="none">None (Use Custom or Service Base Price if no options defined)</SelectItem>
                    {selectedService.vehicleOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.vehicleType} - {currency} {opt.price} (Max: {opt.maxPassengers} Pax)
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
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            The selected transfer service (ID: {item.selectedServicePriceId}) could not be found. Please choose another or set a custom price/options.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-3 sm:gap-4 mt-4">
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
          <p className="text-sm font-medium text-muted-foreground">Configuration Details</p>
      </div>

      {item.mode === 'ticket' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label={`Adult Ticket Price (${currency})`} id={`adultTicketPrice-${item.id}`}>
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
          </FormField>
          <FormField label={`Child Ticket Price (${currency}) (Optional)`} id={`childTicketPrice-${item.id}`}>
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
          </FormField>
        </div>
      )}

      {item.mode === 'vehicle' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Vehicle Type" id={`vehicleType-${item.id}`}>
              <Select
                value={displayedVehicleType}
                onValueChange={(value: VehicleType) => handleInputChange('vehicleType', value)}
                disabled={!allowDirectVehicleEdit}
              >
                <SelectTrigger className={!allowDirectVehicleEdit ? "bg-muted/50 cursor-not-allowed" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map(vType => (
                    <SelectItem key={vType} value={vType}>{vType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={`Cost Per Vehicle (${currency})`} id={`costPerVehicle-${item.id}`}>
              <Input
                type="number"
                id={`costPerVehicle-${item.id}`}
                value={displayedCostPerVehicle ?? ''}
                onChange={(e) => handleNumericInputChange('costPerVehicle', e.target.value)}
                min="0"
                placeholder="0.00"
                readOnly={!allowDirectVehicleEdit}
                className={!allowDirectVehicleEdit ? "bg-muted/50 cursor-not-allowed" : ""}
              />
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
                {selectedService.surchargePeriods.map(sp => (
                  <li key={sp.id}>{sp.name}: +{formatCurrency(sp.surchargeAmount, currency)} ({format(parseISO(sp.startDate), 'dd MMM')} - {format(parseISO(sp.endDate), 'dd MMM')})</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </BaseItemForm>
  );
}
