
"use client";

import * as React from 'react';
import type { MiscItem as MiscItemType, Traveler, CurrencyCode, ServicePriceItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServicePrices } from '@/hooks/useServicePrices';

interface MiscItemFormProps {
  item: MiscItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  onUpdate: (item: MiscItemType) => void;
  onDelete: () => void;
}

export function MiscItemForm({ item, travelers, currency, onUpdate, onDelete }: MiscItemFormProps) {
  const { getServicePrices, getServicePriceById, isLoading: isLoadingServices } = useServicePrices();
  const [miscServices, setMiscServices] = React.useState<ServicePriceItem[]>([]);

  React.useEffect(() => {
    if (!isLoadingServices) {
      setMiscServices(getServicePrices('misc').filter(s => s.currency === currency));
    }
  }, [isLoadingServices, getServicePrices, currency]);

  const handleInputChange = (field: keyof MiscItemType, value: any) => {
    // If costAssignment is changed, it might not align with a predefined service, so clear it.
    onUpdate({ ...item, [field]: value, selectedServicePriceId: undefined });
  };

  const handleNumericInputChange = (field: keyof MiscItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    // If user manually changes price or quantity, clear the selected service ID
    onUpdate({ ...item, [field]: numValue, selectedServicePriceId: undefined });
  };

  const handlePredefinedServiceSelect = (selectedValue: string) => {
    if (selectedValue === "none") {
      onUpdate({
        ...item,
        selectedServicePriceId: undefined,
        unitCost: item.unitCost ?? 0,
        // quantity and costAssignment are specific to this item instance, keep them.
      });
    } else {
      const selectedService = getServicePriceById(selectedValue);
      if (selectedService) {
        onUpdate({
          ...item,
          name: item.name === `New misc` || !item.name || item.selectedServicePriceId ? selectedService.name : item.name,
          unitCost: selectedService.price1,
          // Quantity and costAssignment are specific to this item instance, not from service.
          selectedServicePriceId: selectedService.id,
        });
      }
    }
  };
  
  const selectedServiceName = item.selectedServicePriceId ? getServicePriceById(item.selectedServicePriceId)?.name : null;

  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Miscellaneous Item">
       {miscServices.length > 0 && (
        <div className="pt-2">
          <FormField label="Select Predefined Item (Optional)" id={`predefined-misc-${item.id}`}>
            <Select
              value={item.selectedServicePriceId || ""} // Shows placeholder if undefined/empty
              onValueChange={handlePredefinedServiceSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a predefined item..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Custom Price)</SelectItem>
                {miscServices.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.unitDescription}) - {currency} {service.price1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {selectedServiceName && <p className="text-xs text-muted-foreground pt-1">Using: {selectedServiceName}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <FormField label={`Unit Cost (${currency})`} id={`unitCost-${item.id}`}>
          <Input
            type="number"
            id={`unitCost-${item.id}`}
            value={item.unitCost ?? ''}
            onChange={(e) => handleNumericInputChange('unitCost', e.target.value)}
            min="0"
            placeholder="0.00"
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
