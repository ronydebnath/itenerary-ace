
"use client";

import * as React from 'react';
import type { ItineraryItem, Traveler, CurrencyCode, TripSettings } from '@/types/itinerary';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ChevronDown, ChevronUp, Hotel, Car, Ticket, Utensils, ShoppingBag, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  children: React.ReactNode; // For predefined service selector and item-specific fields
  itemTypeLabel: string;
  dayNumber: number;
  itemSummaryLine: React.ReactNode;
  isCurrentlyExpanded: boolean;
  onToggleExpand: () => void;
}

export function FormField({label, id, children, className}: {label: string, id: string, children: React.ReactNode, className?: string}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-xs sm:text-sm">{label}</Label>
      {children}
    </div>
  );
}

const ITEM_TYPE_ICONS: { [key in ItineraryItem['type']]: React.ElementType } = {
  transfer: Car,
  hotel: Hotel,
  activity: Ticket,
  meal: Utensils,
  misc: ShoppingBag,
};

export function BaseItemForm<T extends ItineraryItem>({
  item,
  travelers,
  tripSettings,
  onUpdate,
  onDelete,
  children,
  itemTypeLabel,
  itemSummaryLine,
  isCurrentlyExpanded,
  onToggleExpand,
}: BaseItemFormProps<T>) {
  const [isOptOutOpen, setIsOptOutOpen] = React.useState(item.excludedTravelerIds.length > 0);
  const { countries: allAvailableCountriesHook, isLoading: isLoadingCountries, getCountryById } = useCountries();
  const { provinces: allAvailableProvincesForHook, isLoading: isLoadingProvinces, getProvincesByCountry } = useProvinces();

  const displayableCountriesForItem = React.useMemo(() => {
    if (isLoadingCountries) return [];
    const globallySelectedCountries = tripSettings.selectedCountries || [];
    if (globallySelectedCountries.length > 0) {
      return allAvailableCountriesHook.filter(country => globallySelectedCountries.includes(country.id));
    }
    return allAvailableCountriesHook.sort((a,b) => a.name.localeCompare(b.name));
  }, [isLoadingCountries, tripSettings.selectedCountries, allAvailableCountriesHook]);

  const displayableProvincesForItem = React.useMemo(() => {
    if (isLoadingProvinces) return [];
    const globallySelectedCountries = tripSettings.selectedCountries || [];
    const globallySelectedProvincesFromSettings = tripSettings.selectedProvinces || [];

    if (item.countryId) {
      let provincesWithinItemCountry = getProvincesByCountry(item.countryId);
      if (globallySelectedProvincesFromSettings.length > 0) {
        provincesWithinItemCountry = provincesWithinItemCountry.filter(p =>
          globallySelectedProvincesFromSettings.includes(p.name)
        );
      }
      return provincesWithinItemCountry.sort((a,b) => a.name.localeCompare(b.name));
    }

    let provincesToDisplay = [];
    if (globallySelectedProvincesFromSettings.length > 0) {
      provincesToDisplay = allAvailableProvincesForHook.filter(p =>
        globallySelectedProvincesFromSettings.includes(p.name)
      );
      if (globallySelectedCountries.length > 0) {
        provincesToDisplay = provincesToDisplay.filter(p =>
          globallySelectedCountries.includes(p.countryId)
        );
      }
    } else if (globallySelectedCountries.length > 0) {
      globallySelectedCountries.forEach(countryId => {
        provincesToDisplay.push(...getProvincesByCountry(countryId));
      });
      provincesToDisplay = provincesToDisplay.filter((province, index, self) =>
        index === self.findIndex((p) => p.id === province.id)
      );
    } else {
      provincesToDisplay = [...allAvailableProvincesForHook];
    }
    return provincesToDisplay.sort((a,b) => a.name.localeCompare(b.name));
  }, [
    isLoadingProvinces,
    item.countryId,
    tripSettings.selectedCountries,
    tripSettings.selectedProvinces,
    allAvailableProvincesForHook,
    getProvincesByCountry
  ]);

  const handleItemCountryChange = React.useCallback((countryIdValue?: string) => {
    const selectedCountry = allAvailableCountriesHook.find(c => c.id === countryIdValue);
    const updatedItemPartial: Partial<ItineraryItem> = {
      countryId: selectedCountry?.id,
      countryName: selectedCountry?.name,
      province: undefined,
      selectedServicePriceId: undefined,
      selectedPackageId: undefined,
      selectedVehicleOptionId: undefined,
      hotelDefinitionId: undefined,
      selectedRooms: (item.type === 'hotel' ? [] : undefined) as any,
    };
    onUpdate({ ...item, ...updatedItemPartial as Partial<T> });
  }, [allAvailableCountriesHook, item, onUpdate]);

  const handleItemProvinceChange = React.useCallback((provinceName?: string) => {
    const updatedItemPartial: Partial<ItineraryItem> = {
      province: provinceName === "none" || provinceName === undefined ? undefined : provinceName,
      selectedServicePriceId: undefined,
      selectedPackageId: undefined,
      selectedVehicleOptionId: undefined,
      hotelDefinitionId: undefined,
      selectedRooms: (item.type === 'hotel' ? [] : undefined) as any,
    };
    onUpdate({ ...item, ...updatedItemPartial as Partial<T> });
  }, [item, onUpdate]);

  React.useEffect(() => {
    let countryReset = false;
    const currentItemCountryIsValid = !item.countryId || displayableCountriesForItem.some(c => c.id === item.countryId);
    if (!currentItemCountryIsValid && item.countryId) {
      handleItemCountryChange(undefined);
      countryReset = true;
    }

    const provincesList = Array.isArray(displayableProvincesForItem) ? displayableProvincesForItem : [];
    const currentItemProvinceIsValid = !item.province || provincesList.some(p => p.name === item.province);
    if (!isLoadingProvinces && !countryReset && !currentItemProvinceIsValid && item.province) {
      handleItemProvinceChange(undefined);
    }
  }, [
    item.countryId,
    item.province,
    displayableCountriesForItem,
    displayableProvincesForItem,
    isLoadingProvinces,
    tripSettings.selectedProvinces,
    tripSettings.selectedCountries,
    allAvailableProvincesForHook,
    getProvincesByCountry,
    handleItemCountryChange,
    handleItemProvinceChange
  ]);


  const handleOptOutToggle = (travelerId: string, checked: boolean) => {
    const newExcludedTravelerIds = checked
      ? [...item.excludedTravelerIds, travelerId]
      : item.excludedTravelerIds.filter(id => id !== travelerId);
    onUpdate({ ...item, excludedTravelerIds: newExcludedTravelerIds });
  };

  const IconComponent = ITEM_TYPE_ICONS[item.type] || AlertCircle;
  const itemNameDisplay = item.name || `New ${itemTypeLabel}`;

  return (
    <Card className="mb-4 shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
      <CardHeader
        className={cn(
          "flex flex-row justify-between items-center p-2 sm:p-3 rounded-t-md border-b transition-colors",
          isCurrentlyExpanded ? "bg-muted/50" : "bg-muted/20 hover:bg-muted/40 cursor-pointer"
        )}
      >
        <div
          onClick={onToggleExpand}
          className="flex-grow flex items-center cursor-pointer min-w-0 mr-2"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleExpand(); }}
          aria-expanded={isCurrentlyExpanded}
          aria-controls={`item-content-${item.id}`}
        >
          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0 text-primary" />
          <div className="flex-grow min-w-0">
            <CardTitle className="text-sm sm:text-base font-medium text-primary truncate" title={`${itemTypeLabel}: ${itemNameDisplay}`}>
              {itemTypeLabel}: {itemNameDisplay}
            </CardTitle>
            {itemSummaryLine && (
              <div className={cn("text-xs text-muted-foreground truncate", isCurrentlyExpanded && "hidden sm:block")}>
                {itemSummaryLine}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:bg-primary/10"
            aria-label={isCurrentlyExpanded ? "Collapse" : "Expand"}
            aria-expanded={isCurrentlyExpanded}
            aria-controls={`item-content-${item.id}`}
          >
            {isCurrentlyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {isCurrentlyExpanded && (
        <CardContent id={`item-content-${item.id}`} className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
            <FormField label="Country for this item (Optional)" id={`itemCountry-${item.id}`} className="md:col-span-1">
              <Select
                value={item.countryId || "none"}
                onValueChange={(value) => handleItemCountryChange(value === "none" ? undefined : value)}
                disabled={isLoadingCountries || (displayableCountriesForItem.length === 0 && tripSettings.selectedCountries.length > 0)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={
                    isLoadingCountries ? "Loading..." :
                    ((tripSettings.selectedCountries.length > 0 && displayableCountriesForItem.length === 0) ? "No country matches global" :
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
                disabled={isLoadingProvinces || displayableProvincesForItem.length === 0}
              >
                <SelectTrigger className="h-9 text-sm">
                   <SelectValue placeholder={
                    isLoadingProvinces ? "Loading..." :
                    (displayableProvincesForItem.length === 0 ? "No provinces match criteria" : "-- Any in selected scope --")
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Any in selected scope --</SelectItem>
                  {displayableProvincesForItem.map(p => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name} ({allAvailableCountriesHook.find(c => c.id === p.countryId)?.name || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {children}

          <div className="pt-1 sm:pt-2">
            <button
              onClick={() => setIsOptOutOpen(!isOptOutOpen)}
              className="flex items-center justify-between w-full text-xs sm:text-sm font-medium text-left text-foreground/80 hover:text-primary py-1.5 sm:py-2 px-2 sm:px-3 rounded-md hover:bg-muted/50 transition-colors"
              aria-expanded={isOptOutOpen}
              aria-controls={`optout-content-${item.id}`}
            >
              <span>Exclude Specific Travelers</span>
              {isOptOutOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {isOptOutOpen && (
              <div id={`optout-content-${item.id}`} className="mt-1.5 sm:mt-2 p-2 sm:p-3 border rounded-md bg-muted/30 max-h-32 sm:max-h-40 overflow-y-auto">
                {travelers.length > 0 ? (
                  travelers.map(traveler => (
                    <div key={traveler.id} className="flex items-center space-x-2 mb-1 py-0.5 sm:py-1">
                      <Checkbox
                        id={`optout-${item.id}-${traveler.id}`}
                        checked={item.excludedTravelerIds.includes(traveler.id)}
                        onCheckedChange={(checked) => handleOptOutToggle(traveler.id, !!checked)}
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
        </CardContent>
      )}
    </Card>
  );
}
