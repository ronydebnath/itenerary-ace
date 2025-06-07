
"use client";

import * as React from 'react';
import type { TransferItem as TransferItemType, Traveler, CurrencyCode, ServicePriceItem } from '@/types/itinerary';
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
      // Filter by category 'transfer', current currency, AND item.mode (via service.subCategory)
      const allTransfers = getServicePrices('transfer').filter(s => s.currency === currency);
      const modeSpecificTransfers = allTransfers.filter(s => {
        if (item.mode === 'ticket') return s.subCategory === 'ticket';
        if (item.mode === 'vehicle') return s.subCategory !== 'ticket'; // 'vehicle' or specific vehicle types like 'Sedan'
        return false;
      });
      setTransferServices(modeSpecificTransfers);
    }
  }, [isLoadingServices, getServicePrices, currency, item.mode]);

  const handleInputChange = (field: keyof TransferItemType, value: any) => {
    if (field === 'mode') {
        onUpdate({ ...item, [field]: value, selectedServicePriceId: undefined, adultTicketPrice: 0, childTicketPrice: 0, costPerVehicle: 0, vehicles: 1 });
    } else {
        // For other direct inputs, if they affect price, clear selectedServicePriceId
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
        adultTicketPrice: item.mode === 'ticket' ? (item.adultTicketPrice ?? 0) : undefined,
        childTicketPrice: item.mode === 'ticket' ? (item.childTicketPrice ?? 0) : undefined,
        costPerVehicle: item.mode === 'vehicle' ? (item.costPerVehicle ?? 0) : undefined,
        // vehicleType and vehicles are specific to this item instance, keep them unless service implies a type
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
        } else if (item.mode === 'vehicle') {
          updatedItemPartial.costPerVehicle = selectedService.price1;
          // If service subCategory is a specific vehicle type (not 'vehicle' itself), use it.
          if (selectedService.subCategory && selectedService.subCategory !== 'ticket' && selectedService.subCategory !== 'vehicle') {
            updatedItemPartial.vehicleType = selectedService.subCategory as TransferItemType['vehicleType'];
          } else if (!item.vehicleType) { // If item doesn't have a type and service subCat is 'vehicle', default it
            updatedItemPartial.vehicleType = 'Sedan';
          }
          // `vehicles` count kept as is, as it's specific to this item instance.
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
            <FormField label="Select Predefined Transfer (Optional)" id={`predefined-transfer-${item.id}`}>
                <Select
                value={item.selectedServicePriceId || ""} // Shows placeholder if undefined/empty
                onValueChange={handlePredefinedServiceSelect}
                >
                <SelectTrigger>
                    <SelectValue placeholder={`Choose ${item.mode} service...`} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None (Custom Price)</SelectItem>
                    {transferServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.subCategory !== 'ticket' && service.subCategory !== 'vehicle' ? service.subCategory : service.unitDescription}) - {currency} {service.price1}
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
              value={item.vehicleType || 'Sedan'} // Default to Sedan if not set
              onValueChange={(value: 'Sedan' | 'SUV' | 'Van' | 'Bus' | 'Other') => handleInputChange('vehicleType', value)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Sedan">Sedan</SelectItem>
                <SelectItem value="SUV">SUV</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="Bus">Bus</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
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
