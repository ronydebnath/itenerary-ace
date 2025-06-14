
"use client";

import * as React from 'react';
import type { TransferItem as TransferItemType, Traveler, CurrencyCode, ServicePriceItem, VehicleType } from '@/types/itinerary';
import { VEHICLE_TYPES } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServicePrices } from '@/hooks/useServicePrices';

interface TransferItemFormProps {
  item: TransferItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  onUpdate: (item: TransferItemType) => void;
  onDelete: () => void;
}

export function TransferItemForm({ item, travelers, currency, onUpdate, onDelete }: TransferItemFormProps) {
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const [transferServices, setTransferServices] = React.useState<ServicePriceItem[]>([]);

  React.useEffect(() => {
    if (!isLoadingServices) {
      const allCategoryServices = getServicePrices('transfer').filter(s => s.currency === currency);
      let modeAndProvinceFilteredServices = allCategoryServices;

      modeAndProvinceFilteredServices = modeAndProvinceFilteredServices.filter(s => {
        if (item.mode === 'ticket') return s.subCategory === 'ticket';
        if (item.mode === 'vehicle') return s.subCategory !== 'ticket'; 
        return false;
      });
      
      if (item.province) {
        modeAndProvinceFilteredServices = modeAndProvinceFilteredServices.filter(s => s.province === item.province || !s.province);
      }
      setTransferServices(modeAndProvinceFilteredServices);
    }
  }, [isLoadingServices, getServicePrices, currency, item.mode, item.province]);

  const handleInputChange = (field: keyof TransferItemType, value: any) => {
    if (field === 'mode') {
        onUpdate({ ...item, [field]: value, selectedServicePriceId: undefined, adultTicketPrice: 0, childTicketPrice: undefined, costPerVehicle: 0, vehicles: 1, vehicleType: value === 'vehicle' ? VEHICLE_TYPES[0] : undefined });
    } else {
        onUpdate({ ...item, [field]: value, selectedServicePriceId: undefined });
    }
  };
  
  const handleNumericInputChange = (field: keyof TransferItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onUpdate({ ...item, [field]: numValue, selectedServicePriceId: undefined });
  };

  const handlePredefinedServiceSelect = (selectedValue: string) => {
    if (selectedValue === "none") {
      onUpdate({
        ...item,
        selectedServicePriceId: undefined,
        adultTicketPrice: item.mode === 'ticket' ? 0 : undefined,
        childTicketPrice: item.mode === 'ticket' ? undefined : undefined,
        costPerVehicle: item.mode === 'vehicle' ? 0 : undefined,
        vehicleType: item.mode === 'vehicle' ? item.vehicleType || VEHICLE_TYPES[0] : undefined,
      });
    } else {
      const selectedService = getServicePriceById(selectedValue);
      if (selectedService) {
        const updatedItemPartial: Partial<TransferItemType> = {
          name: (item.name === `New transfer` || !item.name || item.selectedServicePriceId) ? selectedService.name : item.name,
          selectedServicePriceId: selectedService.id,
        };
        if (item.mode === 'ticket') {
          updatedItemPartial.adultTicketPrice = selectedService.price1;
          updatedItemPartial.childTicketPrice = selectedService.price2;
          updatedItemPartial.vehicleType = undefined;
        } else if (item.mode === 'vehicle') {
          updatedItemPartial.costPerVehicle = selectedService.price1;
          if (selectedService.subCategory && VEHICLE_TYPES.includes(selectedService.subCategory as VehicleType)) {
            updatedItemPartial.vehicleType = selectedService.subCategory as VehicleType;
          } else {
            updatedItemPartial.vehicleType = item.vehicleType || VEHICLE_TYPES[0];
          }
          updatedItemPartial.adultTicketPrice = undefined;
          updatedItemPartial.childTicketPrice = undefined;
        }
        onUpdate({ ...item, ...updatedItemPartial });
      }
    }
  };

  const selectedServiceName = item.selectedServicePriceId ? getServicePriceById(item.selectedServicePriceId)?.name : null;

  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Transfer">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <FormField 
          label="Mode" 
          id={`transferMode-${item.id}`}
          className={transferServices.length === 0 ? "md:col-span-2" : ""}
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
            <FormField label={`Select Predefined Transfer (${item.province || 'Any Province'})`} id={`predefined-transfer-${item.id}`}>
                <Select
                value={item.selectedServicePriceId || "none"}
                onValueChange={handlePredefinedServiceSelect}
                >
                <SelectTrigger>
                    <SelectValue placeholder={`Choose ${item.mode} service...`} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None (Custom Price)</SelectItem>
                    {transferServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.province || 'Generic'} - {service.subCategory && service.subCategory !== 'ticket' && service.subCategory !== 'vehicle' ? service.subCategory : service.unitDescription}) - {currency} {service.price1}
                        {item.mode === 'ticket' && service.price2 !== undefined ? ` / Ch: ${service.price2}` : ''}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </FormField>
        )}
      </div>
      {selectedServiceName && <p className="text-xs text-muted-foreground pt-1 text-center md:text-left">Using: {selectedServiceName}</p>}


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
            />
          </FormField>
        </div>
      )}

      {item.mode === 'vehicle' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <FormField label="Vehicle Type" id={`vehicleType-${item.id}`}>
            <Select
              value={item.vehicleType || VEHICLE_TYPES[0]} 
              onValueChange={(value: VehicleType) => handleInputChange('vehicleType', value)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              value={item.costPerVehicle ?? ''}
              onChange={(e) => handleNumericInputChange('costPerVehicle', e.target.value)}
              min="0"
              placeholder="0.00"
            />
          </FormField>
          <FormField label="# of Vehicles" id={`numVehicles-${item.id}`}>
            <Input
              type="number"
              id={`numVehicles-${item.id}`}
              value={item.vehicles ?? ''}
              onChange={(e) => handleNumericInputChange('vehicles', e.target.value)}
              min="1"
              placeholder="1"
            />
          </FormField>
        </div>
      )}
    </BaseItemForm>
  );
}
