
"use client";

import * as React from 'react';
import type { TransferItem as TransferItemType, Traveler, CurrencyCode, ServicePriceItem, VehicleType } from '@/types/itinerary';
import { VEHICLE_TYPES } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface TransferItemFormProps {
  item: TransferItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  onUpdate: (item: TransferItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
}

export function TransferItemForm({ item, travelers, currency, onUpdate, onDelete, allServicePrices }: TransferItemFormProps) {
  const [transferServices, setTransferServices] = React.useState<ServicePriceItem[]>([]);

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
    const allCategoryServices = allServicePrices.filter(s => s.category === 'transfer' && s.currency === currency);
    let modeAndProvinceFilteredServices = allCategoryServices;

    modeAndProvinceFilteredServices = modeAndProvinceFilteredServices.filter(s => {
      if (item.mode === 'ticket') return s.subCategory === 'ticket';
      if (item.mode === 'vehicle') return s.transferMode === 'vehicle';
      return false;
    });
    
    if (item.province) {
      modeAndProvinceFilteredServices = modeAndProvinceFilteredServices.filter(s => s.province === item.province || !s.province);
    }
    setTransferServices(modeAndProvinceFilteredServices);
  }, [allServicePrices, currency, item.mode, item.province]);

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
        // Note: item.note is intentionally not cleared here
      });
    } else {
      const service = getServicePriceById(selectedValue);
      if (service) {
        const updatedItemPartial: Partial<TransferItemType> = {
          name: (item.name === `New transfer` || !item.name || !item.selectedServicePriceId) ? service.name : item.name,
          selectedServicePriceId: service.id,
          selectedVehicleOptionId: undefined, 
          note: service.notes || undefined,
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
            updatedItemPartial.costPerVehicle = undefined; 
            updatedItemPartial.vehicleType = undefined;   
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
          // Note: item.note is not changed if service not found
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
        // Note: item.note is not changed here, could inherit option.notes if desired
      });
    } else { 
      const baseCost = (selectedService.vehicleOptions && selectedService.vehicleOptions.length > 0) 
                       ? 0 
                       : selectedService.price1 ?? 0;
      const baseType = (selectedService.vehicleOptions && selectedService.vehicleOptions.length > 0)
                       ? VEHICLE_TYPES[0] 
                       : (selectedService.subCategory && VEHICLE_TYPES.includes(selectedService.subCategory as VehicleType)) 
                         ? selectedService.subCategory as VehicleType 
                         : VEHICLE_TYPES[0];
      onUpdate({
        ...item,
        selectedVehicleOptionId: undefined,
        costPerVehicle: baseCost,
        vehicleType: baseType,
      });
    }
  };
  
  const serviceDefinitionNotFound = item.selectedServicePriceId && !selectedService;

  let isVehicleCostTypeReadOnly = false;
  if (item.mode === 'vehicle' && selectedService) {
    if (selectedService.vehicleOptions && selectedService.vehicleOptions.length > 0) {
      isVehicleCostTypeReadOnly = !!item.selectedVehicleOptionId; 
    } else {
      isVehicleCostTypeReadOnly = true; 
    }
  }

  const displayedVehicleType = item.mode === 'vehicle' 
    ? (item.selectedVehicleOptionId && selectedService?.vehicleOptions?.find(vo => vo.id === item.selectedVehicleOptionId)?.vehicleType) || 
      (!item.selectedVehicleOptionId && selectedService && (!selectedService.vehicleOptions || selectedService.vehicleOptions.length === 0) && (VEHICLE_TYPES.includes(selectedService.subCategory as VehicleType) ? selectedService.subCategory as VehicleType : selectedService.vehicleType || item.vehicleType)) ||
      item.vehicleType || VEHICLE_TYPES[0]
    : undefined;

  const displayedCostPerVehicle = item.mode === 'vehicle'
    ? (item.selectedVehicleOptionId && selectedService?.vehicleOptions?.find(vo => vo.id === item.selectedVehicleOptionId)?.price) ??
      (!item.selectedVehicleOptionId && selectedService && (!selectedService.vehicleOptions || selectedService.vehicleOptions.length === 0) ? selectedService.price1 : item.costPerVehicle) ?? 0
    : undefined;


  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Transfer">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <FormField 
          label="Mode" 
          id={`transferMode-${item.id}`}
          className={(transferServices.length === 0 && (!selectedService || !selectedService.vehicleOptions || selectedService.vehicleOptions.length === 0)) ? "md:col-span-2" : ""}
        >
          <Select
            value={item.mode}
            onValueChange={(value: 'ticket' | 'vehicle') => handleInputChange('mode', value)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ticket">Ticket Basis</SelectItem>
              <SelectItem value="vehicle">Vehicle Basis</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        
        {transferServices.length > 0 && (
            <FormField label={`Select Predefined Service (${item.province || 'Any Province'})`} id={`predefined-transfer-${item.id}`}>
                <Select
                value={item.selectedServicePriceId || "none"}
                onValueChange={handlePredefinedServiceSelect}
                >
                <SelectTrigger>
                    <SelectValue placeholder={`Choose ${item.mode} service...`} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None (Custom Price/Options)</SelectItem>
                    {transferServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.province || 'Generic'})
                        {service.vehicleOptions && service.vehicleOptions.length > 0 ? ` - ${service.vehicleOptions.length} options` : (service.price1 !== undefined ? ` - ${currency} ${service.price1}`: '')}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </FormField>
        )}
      </div>
      {selectedService && <p className="text-xs text-muted-foreground pt-1 text-center md:text-left">Using: {selectedService.name}</p>}

      {serviceDefinitionNotFound && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            The selected transfer service (ID: {item.selectedServicePriceId}) could not be found. It might have been deleted. Please choose another or set a custom price.
          </AlertDescription>
        </Alert>
      )}

      {item.mode === 'ticket' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
          {selectedService && selectedService.vehicleOptions && selectedService.vehicleOptions.length > 0 && (
            <div className="pt-2">
              <FormField label="Select Vehicle Option" id={`vehicle-option-${item.id}`}>
                <Select
                  value={item.selectedVehicleOptionId || "none"}
                  onValueChange={handleVehicleOptionSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose vehicle option..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Use Custom or Service Base Price)</SelectItem>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
            <FormField label={`Cost Per Vehicle (${currency})`} id={`costPerVehicle-${item.id}`}>
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
            <div className="mt-2 p-2 border rounded-md bg-muted/30 text-xs">
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
    

