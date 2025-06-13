
"use client";

import * as React from 'react';
import type { ItineraryItem, Traveler, CurrencyCode, TripSettings, CountryItem, ProvinceItem } from '@/types/itinerary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProvinces } from '@/hooks/useProvinces';
import { useCountries } from '@/hooks/useCountries';
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
  dayNumber: number;
}

export function FormField({label, id, children, className}: {label: string, id: string, children: React.ReactNode, className?: string}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-xs sm:text-sm">{label}</Label>
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
  const { countries: allAvailableCountries, isLoading: isLoadingCountries, getCountryById } = useCountries();
  const { provinces: allAvailableProvincesForHook, isLoading: isLoadingProvinces, getProvincesByCountry } = useProvinces();

  const displayableCountriesForItem = React.useMemo(() => {
    if (isLoadingCountries) return [];
    const globallySelectedCountries = tripSettings.selectedCountries || [];
    if (globallySelectedCountries.length > 0) {
      return allAvailableCountries.filter(country => globallySelectedCountries.includes(country.id));
    }
    return allAvailableCountries;
  }, [isLoadingCountries, tripSettings.selectedCountries, allAvailableCountries]);

  const handleItemCountryChange = React.useCallback((countryIdValue?: string) => {
    const selectedCountry = allAvailableCountries.find(c => c.id === countryIdValue);
    const updatedItem: Partial<ItineraryItem> = {
      countryId: selectedCountry?.id,
      countryName: selectedCountry?.name,
      province: undefined,
      selectedServicePriceId: undefined,
      selectedPackageId: undefined,
      selectedVehicleOptionId: undefined,
      hotelDefinitionId: undefined,
      selectedRooms: (item.type === 'hotel' ? [] : undefined) as any,
    };
    onUpdate({ ...item, ...updatedItem as Partial<T> });
  }, [allAvailableCountries, item, onUpdate]);

  const handleItemProvinceChange = React.useCallback((provinceName?: string) => {
    const updatedItem: Partial<ItineraryItem> = {
      province: provinceName === "none" ? undefined : provinceName,
      selectedServicePriceId: undefined,
      selectedPackageId: undefined,
      selectedVehicleOptionId: undefined,
      hotelDefinitionId: undefined,
      selectedRooms: (item.type === 'hotel' ? [] : undefined) as any,
    };
    onUpdate({ ...item, ...updatedItem as Partial<T> });
  }, [item, onUpdate]);

  const displayProvincesForItem = React.useMemo(() => {
    if (isLoadingProvinces) return [];

    const globallySelectedCountries = tripSettings.selectedCountries || [];
    const globallySelectedProvinces = tripSettings.selectedProvinces || [];

    // Case 1: Item has a specific country selected.
    if (item.countryId) {
      let provincesWithinItemCountry = getProvincesByCountry(item.countryId);
      if (globallySelectedProvinces.length > 0) {
        // Further filter these by global province selection
        provincesWithinItemCountry = provincesWithinItemCountry.filter(p => 
          globallySelectedProvinces.includes(p.name)
        );
      }
      return provincesWithinItemCountry.sort((a,b) => a.name.localeCompare(b.name));
    }

    // Case 2: Item does NOT have a specific country selected (relies on global settings).
    // Filter by globally selected provinces first.
    if (globallySelectedProvinces.length > 0) {
      let provincesToDisplay = allAvailableProvincesForHook
        .filter(p => globallySelectedProvinces.includes(p.name));
      
      // If global countries are also selected, ensure these provinces belong to one of them.
      if (globallySelectedCountries.length > 0) {
        provincesToDisplay = provincesToDisplay.filter(p => 
          globallySelectedCountries.includes(p.countryId)
        );
      }
      return provincesToDisplay.sort((a,b) => a.name.localeCompare(b.name));
    }

    // Case 3: No global provinces selected, but global countries are selected.
    // Show all provinces from the globally selected countries.
    if (globallySelectedCountries.length > 0) {
      let provincesFromGlobalCountries: ProvinceItem[] = [];
      globallySelectedCountries.forEach(countryId => {
        provincesFromGlobalCountries = provincesFromGlobalCountries.concat(getProvincesByCountry(countryId));
      });
      return provincesFromGlobalCountries.sort((a,b) => a.name.localeCompare(b.name));
    }

    // Case 4: No item-specific country, no global provinces, no global countries. Show all.
    return allAvailableProvincesForHook.sort((a,b) => a.name.localeCompare(b.name));

  }, [
    item.countryId, 
    tripSettings.selectedProvinces, 
    tripSettings.selectedCountries, 
    allAvailableProvincesForHook, 
    isLoadingProvinces, 
    getProvincesByCountry
  ]);


  React.useEffect(() => {
    let provinceChangedByCountryResetLogic = false;
    const currentItemCountryIsValid = !item.countryId || displayableCountriesForItem.some(c => c.id === item.countryId);
    if (!currentItemCountryIsValid) {
      handleItemCountryChange(undefined);
      provinceChangedByCountryResetLogic = true; 
    }

    if (item.province && !displayProvincesForItem.some(p => p.name === item.province)) {
      if (!provinceChangedByCountryResetLogic) { 
        handleItemProvinceChange(undefined);
      }
    }
  }, [item.countryId, item.province, displayableCountriesForItem, displayableProvincesForItem, handleItemCountryChange, handleItemProvinceChange]);

  const handleInputChange = (field: keyof T, value: any) => {
    onUpdate({ ...item, [field]: value });
  };

  const handleOptOutChange = (travelerId: string, checked: boolean) => {
    const newExcludedTravelerIds = checked
      ? [...item.excludedTravelerIds, travelerId]
      : item.excludedTravelerIds.filter(id => id !== travelerId);
    onUpdate({ ...item, excludedTravelerIds: newExcludedTravelerIds });
  };
  
  const locationDisplay = React.useMemo(() => {
    const countryName = item.countryId ? allAvailableCountries.find(c => c.id === item.countryId)?.name : 
                       (tripSettings.selectedCountries.length === 1 ? allAvailableCountries.find(c => c.id === tripSettings.selectedCountries[0])?.name : 
                       (tripSettings.selectedCountries.length > 1 ? "Multiple Countries" : "Any Country"));
    const provinceName = item.province || 
                        (tripSettings.selectedProvinces.length === 1 ? tripSettings.selectedProvinces[0] :
                        (tripSettings.selectedProvinces.length > 1 ? "Multiple Provinces" : "Any Province"));

    if (item.province) return `${item.province}${item.countryId ? `, ${allAvailableCountries.find(c => c.id === item.countryId)?.name}` : ''}`;
    if (item.countryId) return allAvailableCountries.find(c => c.id === item.countryId)?.name || 'Selected Country';
    if (tripSettings.selectedProvinces.length > 0) return tripSettings.selectedProvinces.join('/');
    if (tripSettings.selectedCountries.length > 0) return tripSettings.selectedCountries.map(cid => allAvailableCountries.find(c=>c.id === cid)?.name).filter(Boolean).join('/');
    return 'Global';
  }, [item.countryId, item.province, tripSettings.selectedCountries, tripSettings.selectedProvinces, allAvailableCountries]);


  return (
    <Card className="mb-4 shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <FormField label={`${itemTypeLabel} Name`} id={`itemName-${item.id}`} className="md:col-span-1">
            <Input
              id={`itemName-${item.id}`}
              value={item.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={`e.g., ${itemTypeLabel} Details`}
              className="h-9 text-sm"
            />
          </FormField>
          <FormField label="Country for this item (Optional)" id={`itemCountry-${item.id}`} className="md:col-span-1">
            <Select
              value={item.countryId || "none"}
              onValueChange={(value) => handleItemCountryChange(value === "none" ? undefined : value)}
              disabled={isLoadingCountries || displayableCountriesForItem.length === 0 && tripSettings.selectedCountries.length > 0}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={
                  isLoadingCountries ? "Loading..." :
                  (tripSettings.selectedCountries.length > 0 && displayableCountriesForItem.length === 0 ? "No country matches global" :
                  (displayableCountriesForItem.length === 0 ? "No countries available" : "-- Use Global / Any --"))
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Use Global / Any --</SelectItem>
                {displayableCountriesForItem.map(c => (
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
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={
                  isLoadingProvinces ? "Loading..." :
                  (item.countryId && displayProvincesForItem.length === 0 && tripSettings.selectedProvinces && tripSettings.selectedProvinces.length > 0 ? "No provinces match global & item country" :
                  (displayProvincesForItem.length === 0 ? "No provinces match criteria" : "-- Any in selected scope --"))
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- Any in selected scope --</SelectItem>
                {displayProvincesForItem.map(p => (
                  <SelectItem key={p.id} value={p.name}>{p.name} ({allAvailableCountries.find(c => c.id === p.countryId)?.name || 'N/A'})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Note (Optional)" id={`itemNote-${item.id}`} className="sm:col-span-2 md:col-span-3">
            <Input
              id={`itemNote-${item.id}`}
              value={item.note || ''}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder="e.g., Specific details or reminders"
              className="h-9 text-sm"
            />
          </FormField>
        </div>

        {children}

        <div className="pt-1 sm:pt-2">
          <button
            onClick={() => setIsOptOutOpen(!isOptOutOpen)}
            className="flex items-center justify-between w-full text-xs sm:text-sm font-medium text-left text-foreground/80 hover:text-primary py-1.5 sm:py-2 px-2 sm:px-3 rounded-md hover:bg-muted/50 transition-colors"
          >
            <span>Exclude Specific Travelers</span>
            {isOptOutOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {isOptOutOpen && (
            <div className="mt-1.5 sm:mt-2 p-2 sm:p-3 border rounded-md bg-muted/30 max-h-32 sm:max-h-40 overflow-y-auto">
              {travelers.length > 0 ? (
                travelers.map(traveler => (
                  <div key={traveler.id} className="flex items-center space-x-2 mb-1 py-0.5 sm:py-1">
                    <Checkbox
                      id={`optout-${item.id}-${traveler.id}`}
                      checked={item.excludedTravelerIds.includes(traveler.id)}
                      onCheckedChange={(checked) => handleOptOutChange(traveler.id, !!checked)}
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    />
                    <Label htmlFor={`optout-${item.id}-${traveler.id}`} className="text-xs sm:text-sm font-normal cursor-pointer">
                      {traveler.label}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground">No travelers defined.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 sm:pt-3">
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:bg-destructive/10 hover:text-destructive text-xs sm:text-sm h-8 sm:h-9">
            <Trash2 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Delete {itemTypeLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

