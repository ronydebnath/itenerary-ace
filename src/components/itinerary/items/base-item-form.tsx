
"use client";

import * as React from 'react';
import type { ItineraryItem, Traveler, CurrencyCode } from '@/types/itinerary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProvinces } from '@/hooks/useProvinces'; // Import useProvinces
import { cn } from '@/lib/utils';

export interface BaseItemFormProps<T extends ItineraryItem> {
  item: T;
  travelers: Traveler[];
  currency: CurrencyCode; // Though not directly used in Base, specific forms might
  onUpdate: (item: T) => void;
  onDelete: () => void;
  children: React.ReactNode; // For specific fields of the item type
  itemTypeLabel: string;
}

export function FormField({label, id, children, className}: {label: string, id: string, children: React.ReactNode, className?: string}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function BaseItemForm<T extends ItineraryItem>({
  item,
  travelers,
  onUpdate,
  onDelete,
  children,
  itemTypeLabel,
}: BaseItemFormProps<T>) {
  const [isOptOutOpen, setIsOptOutOpen] = React.useState(item.excludedTravelerIds.length > 0);
  const { provinces, isLoading: isLoadingProvinces } = useProvinces();

  const handleInputChange = (field: keyof T, value: any) => {
    onUpdate({ ...item, [field]: value });
  };

  const handleOptOutChange = (travelerId: string, checked: boolean) => {
    let newExcludedIds;
    if (checked) {
      newExcludedIds = [...item.excludedTravelerIds, travelerId];
    } else {
      newExcludedIds = item.excludedTravelerIds.filter(id => id !== travelerId);
    }
    onUpdate({ ...item, excludedTravelerIds: newExcludedIds });
  };
  
  const handleProvinceChange = (value: string) => {
    const provinceValue = value === "none" ? undefined : value;
    onUpdate({ ...item, province: provinceValue, selectedServicePriceId: undefined }); // Reset selected service if province changes
  };

  return (
    <Card className="mb-4 shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label={`${itemTypeLabel} Name`} id={`itemName-${item.id}`} className="md:col-span-1">
            <Input
              id={`itemName-${item.id}`}
              value={item.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={`e.g., ${itemTypeLabel} Details`}
            />
          </FormField>
          <FormField label="Province (Optional)" id={`itemProvince-${item.id}`} className="md:col-span-1">
            <Select
              value={item.province || "none"}
              onValueChange={handleProvinceChange}
              disabled={isLoadingProvinces}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select province..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None / Generic</SelectItem>
                {provinces.map(p => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Note (Optional)" id={`itemNote-${item.id}`} className="md:col-span-1">
            <Input
              id={`itemNote-${item.id}`}
              value={item.note || ''}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder="e.g., Specific details or reminders"
            />
          </FormField>
        </div>

        {children}

        <div className="pt-2">
          <button
            onClick={() => setIsOptOutOpen(!isOptOutOpen)}
            className="flex items-center justify-between w-full text-sm font-medium text-left text-foreground/80 hover:text-primary py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
          >
            <span>Exclude Specific Travelers</span>
            {isOptOutOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {isOptOutOpen && (
            <div className="mt-2 p-3 border rounded-md bg-muted/30 max-h-48 overflow-y-auto">
              {travelers.length > 0 ? (
                travelers.map(traveler => (
                  <div key={traveler.id} className="flex items-center space-x-2 mb-1 py-1">
                    <Checkbox
                      id={`optout-${item.id}-${traveler.id}`}
                      checked={item.excludedTravelerIds.includes(traveler.id)}
                      onCheckedChange={(checked) => handleOptOutChange(traveler.id, !!checked)}
                    />
                    <Label htmlFor={`optout-${item.id}-${traveler.id}`} className="text-sm font-normal cursor-pointer">
                      {traveler.label}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No travelers defined.</p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-3">
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete {itemTypeLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
