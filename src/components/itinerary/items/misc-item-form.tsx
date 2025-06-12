
"use client";

import * as React from 'react';
import type { MiscItem as MiscItemType, Traveler, CurrencyCode, ServicePriceItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MiscItemFormProps {
  item: MiscItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  onUpdate: (item: MiscItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
}

export function MiscItemForm({ item, travelers, currency, onUpdate, onDelete, allServicePrices }: MiscItemFormProps) {
  const [miscServices, setMiscServices] = React.useState<ServicePriceItem[]>([]);

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
    const allCategoryServices = allServicePrices.filter(s => s.category === 'misc' && s.currency === currency);
    let filteredServices = allCategoryServices;
    if (item.province) {
      filteredServices = allCategoryServices.filter(s => s.province === item.province || !s.province);
    }
    setMiscServices(filteredServices);
  }, [allServicePrices, currency, item.province]);

  const handleInputChange = (field: keyof MiscItemType, value: any) => {
    onUpdate({ 
      ...item, 
      [field]: value, 
      // Cost assignment and quantity can be changed independently of predefined service price
      selectedServicePriceId: (field === 'costAssignment' || field === 'quantity') ? item.selectedServicePriceId : undefined 
    });
  };

  const handleNumericInputChange = (field: keyof MiscItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    // If user manually changes unitCost, assume custom pricing
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
        // Keep existing unitCost when deselecting
      });
    } else {
      const service = getServicePriceById(selectedValue);
      if (service) {
        onUpdate({
          ...item,
          name: item.name === `New misc` || !item.name || !item.selectedServicePriceId ? service.name : item.name,
          unitCost: service.price1 ?? 0,
          selectedServicePriceId: service.id,
          // Potentially set subCategory from service.subCategory if desired, but it's often more for display
          // subCategory: service.subCategory || item.subCategory 
        });
      } else {
        onUpdate({
          ...item,
          selectedServicePriceId: selectedValue, // Keep ID for error display
          unitCost: 0, // Default if service not found
        });
      }
    }
  };
  
  const serviceDefinitionNotFound = item.selectedServicePriceId && !selectedService;
  const isPriceReadOnly = !!item.selectedServicePriceId && !!selectedService;

  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Miscellaneous Item">
       {miscServices.length > 0 && (
        <div className="pt-2">
          <FormField label={`Select Predefined Item (${item.province || 'Any Province'})`} id={`predefined-misc-${item.id}`}>
            <Select
              value={item.selectedServicePriceId || "none"}
              onValueChange={handlePredefinedServiceSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a predefined item..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Custom Price)</SelectItem>
                {miscServices.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.province || 'Generic'}) - {currency} {service.price1}
                    {service.subCategory ? ` (${service.subCategory})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {selectedService && <p className="text-xs text-muted-foreground pt-1">Using: {selectedService.name}{selectedService.subCategory ? ` (${selectedService.subCategory})` : ''}</p>}
        </div>
      )}

      {serviceDefinitionNotFound && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            The selected miscellaneous item (ID: {item.selectedServicePriceId}) could not be found. It might have been deleted. Please choose another or set a custom price.
          </AlertDescription>
        </Alert>
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
