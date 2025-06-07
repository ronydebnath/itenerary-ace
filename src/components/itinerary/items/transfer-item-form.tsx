
"use client";

import * as React from 'react';
import type { TransferItem as TransferItemType, Traveler, CurrencyCode } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TransferItemFormProps {
  item: TransferItemType;
  travelers: Traveler[];
  currency: CurrencyCode;
  onUpdate: (item: TransferItemType) => void;
  onDelete: () => void;
}

export function TransferItemForm({ item, travelers, currency, onUpdate, onDelete }: TransferItemFormProps) {
  const handleInputChange = (field: keyof TransferItemType, value: any) => {
    onUpdate({ ...item, [field]: value });
  };
  
  const handleNumericInputChange = (field: keyof TransferItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onUpdate({ ...item, [field]: numValue });
  };


  return (
    <BaseItemForm item={item} travelers={travelers} currency={currency} onUpdate={onUpdate} onDelete={onDelete} itemTypeLabel="Transfer">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <FormField label="Mode" id={`transferMode-${item.id}`}>
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
      </div>

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
              value={item.vehicleType || 'Sedan'}
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
