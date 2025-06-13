
"use client";

import * as React from 'react';
import type { ItineraryItem, Traveler, CurrencyCode, TripSettings, CountryItem } from '@/types/itinerary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProvinces } from '@/hooks/useProvinces';
import { useCountries } from '@/hooks/useCountries'; // Added
import { cn } from '@/lib/utils';

export interface BaseItemFormProps<T extends ItineraryItem> {
  item: T;
  travelers: Traveler[];
  currency: CurrencyCode;
  tripSettings: TripSettings;
  onUpdate: (item: T) => void;
  onDelete: () => void;
  children: React.ReactNode;
  itemTypeLabel: string;
  dayNumber: number; // Added to pass to children if needed or for context
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
  tripSettings,
  onUpdate,
  onDelete,
  children,
  itemTypeLabel,
  dayNumber,
}: BaseItemFormProps<T>) {
  const [isOptOutOpen, setIsOptOutOpen] = React.useState(item.excludedTravelerIds.length > 0);
  const { countries: allAvailableCountries, isLoading: isLoadingCountries } = useCountries(); // Added
  const { provinces: allProvincesForHook, isLoading: isLoadingProvinces, getProvincesByCountry } = useProvinces();

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

  const handleItemCountryChange = (countryIdValue?: string) => {
    const selectedCountry = allAvailableCountries.find(c => c.id === countryIdValue);
    const updatedItem: Partial<ItineraryItem> = {
      countryId: selectedCountry?.id,
      countryName: selectedCountry?.name,
      province: undefined, // Reset province
      selectedServicePriceId: undefined, // Reset selected service/package
      // @ts-ignore
      selectedPackageId: undefined,
      // @ts-ignore
      selectedVehicleOptionId: undefined,
      // @ts-ignore
      hotelDefinitionId: undefined,
      // @ts-ignore
      selectedRooms: (item.type === 'hotel' ? [] : undefined),
    };
    onUpdate({ ...item, ...updatedItem as Partial<T> });
  };

  const handleItemProvinceChange = (provinceName?: string) => {
    const updatedItem: Partial<ItineraryItem> = {
      province: provinceName === "none" ? undefined : provinceName,
      selectedServicePriceId: undefined,
      // @ts-ignore
      selectedPackageId: undefined,
      // @ts-ignore
      selectedVehicleOptionId: undefined,
      // @ts-ignore
      hotelDefinitionId: undefined,
      // @ts-ignore
      selectedRooms: (item.type === 'hotel' ? [] : undefined),
    };
    onUpdate({ ...item, ...updatedItem as Partial<T> });
  };

  const displayProvincesForItem = React.useMemo(() => {
    if (isLoadingProvinces) return [];
    if (item.countryId) {
      return getProvincesByCountry(item.countryId);
    }
    if (tripSettings.selectedCountries.length > 0) {
      let provincesFromGlobalCountries: any[] = [];
      tripSettings.selectedCountries.forEach(countryId => {
        provincesFromGlobalCountries = provincesFromGlobalCountries.concat(getProvincesByCountry(countryId));
      });
      return provincesFromGlobalCountries.sort((a,b) => a.name.localeCompare(b.name));
    }
    return allProvincesForHook.sort((a,b) => a.name.localeCompare(b.name)); // Fallback to all provinces if no item or global country selected
  }, [item.countryId, tripSettings.selectedCountries, allProvincesForHook, isLoadingProvinces, getProvincesByCountry]);


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
          <FormField label="Country for this item (Optional)" id={`itemCountry-${item.id}`} className="md:col-span-1">
            <Select
              value={item.countryId || "none"}
              onValueChange={(value) => handleItemCountryChange(value === "none" ? undefined : value)}
              disabled={isLoadingCountries}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCountries ? "Loading..." : "Select country..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Global / Any --</SelectItem>
                {allAvailableCountries.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Province for this item (Optional)" id={`itemProvince-${item.id}`} className="md:col-span-1">
            <Select
              value={item.province || "none"}
              onValueChange={(value) => handleItemProvinceChange(value)}
              disabled={isLoadingProvinces || displayProvincesForItem.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  isLoadingProvinces ? "Loading..." : 
                  (item.countryId && displayProvincesForItem.length === 0 ? "No provinces in item's country" : 
                  (!item.countryId && tripSettings.selectedCountries.length > 0 && displayProvincesForItem.length === 0 ? "No provinces in global countries" : 
                  "Select province..."))
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Any in selected country --</SelectItem>
                {displayProvincesForItem.map(p => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Note (Optional)" id={`itemNote-${item.id}`} className="md:col-span-3">
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
