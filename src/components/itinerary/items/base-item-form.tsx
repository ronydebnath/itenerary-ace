
/**
 * @fileoverview This component serves as a foundational building block for all specific
 * itinerary item forms (e.g., Transfer, Activity, Hotel). It provides a common structure
 * including a collapsible header with item type, name, and action buttons (expand/collapse, delete).
 * It also includes a section for excluding specific travelers and handles the rendering of
 * item-specific fields passed as children.
 *
 * @bangla এই কম্পোনেন্টটি সমস্ত নির্দিষ্ট ভ্রমণপথের আইটেম ফর্মগুলির (যেমন, ট্রান্সফার,
 * কার্যকলাপ, হোটেল) জন্য একটি ভিত্তি হিসেবে কাজ করে। এটি একটি সাধারণ কাঠামো সরবরাহ করে,
 * যার মধ্যে আইটেমের প্রকার, নাম এবং অ্যাকশন বোতাম (প্রসারণ/সংকোচন, মুছে ফেলা) সহ একটি
 * সংকোচনযোগ্য হেডার রয়েছে। এটি নির্দিষ্ট ভ্রমণকারীদের বাদ দেওয়ার জন্য একটি বিভাগও অন্তর্ভুক্ত
 * করে এবং চিলড্রেন হিসেবে পাস করা আইটেম-নির্দিষ্ট ক্ষেত্রগুলির রেন্ডারিং পরিচালনা করে।
 */
"use client";

import * as React from 'react';
import type { ItineraryItem, Traveler, CurrencyCode, TripSettings, BookingStatus, ActivityItem, TransferItem, HotelItem } from '@/types/itinerary';
import { BOOKING_STATUSES } from '@/types/itinerary';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Trash2, ChevronDown, ChevronUp, Hotel, Car, Ticket, Utensils, ShoppingBag, AlertCircle, Loader2, BadgeCheck, Clock, Ban, HelpCircle, FileQuestion } from 'lucide-react';
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
      <Label htmlFor={id} className="text-sm">{label}</Label>
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

const BOOKING_STATUS_ICONS: { [key in BookingStatus]: React.ElementType } = {
  Pending: FileQuestion,
  Requested: Clock,
  Confirmed: BadgeCheck,
  Unavailable: Ban,
  Cancelled: HelpCircle,
};

function BaseItemFormComponent<T extends ItineraryItem>({
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

  const { countryId: itemCountryIdFromProp, province: itemProvinceFromProp, type: itemTypeFromProp } = item;

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

    if (itemCountryIdFromProp) {
      let provincesWithinItemCountry = getProvincesByCountry(itemCountryIdFromProp);
      if (globallySelectedProvincesFromSettings.length > 0 && globallySelectedCountries.includes(itemCountryIdFromProp)) {
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
    itemCountryIdFromProp,
    tripSettings.selectedCountries,
    tripSettings.selectedProvinces,
    allAvailableProvincesForHook,
    getProvincesByCountry
  ]);

  React.useEffect(() => {
    const currentItemCountryId = item.countryId;
    const currentItemProvince = item.province;
    const currentItemType = item.type;

    const updatedFields: Partial<T> = {};
    let needsResetForInvalidLocation = false;

    const isCountryValid = !currentItemCountryId || displayableCountriesForItem.some(c => c.id === currentItemCountryId);
    if (currentItemCountryId && !isCountryValid) {
      updatedFields.countryId = undefined;
      updatedFields.countryName = undefined;
      updatedFields.province = undefined;
      needsResetForInvalidLocation = true;
    }

    let provincesToCheckAgainst = displayableProvincesForItem;
    const effectiveCountryId = updatedFields.countryId === undefined ? currentItemCountryId : updatedFields.countryId;
    if (effectiveCountryId) {
        provincesToCheckAgainst = getProvincesByCountry(effectiveCountryId);
    }
    
    const isProvinceStillValid = !currentItemProvince || (updatedFields.province === undefined && provincesToCheckAgainst.some(p => p.name === currentItemProvince));
    if (currentItemProvince && !isProvinceStillValid && updatedFields.province === undefined) {
      updatedFields.province = undefined;
      needsResetForInvalidLocation = true;
    }

    if (needsResetForInvalidLocation) {
        updatedFields.selectedServicePriceId = undefined;
        if (currentItemType === 'activity') (updatedFields as Partial<ActivityItem>).selectedPackageId = undefined;
        if (currentItemType === 'transfer') (updatedFields as Partial<TransferItem>).selectedVehicleOptionId = undefined;
        if (currentItemType === 'hotel') {
            (updatedFields as Partial<HotelItem>).hotelDefinitionId = '';
            (updatedFields as Partial<HotelItem>).selectedRooms = [];
        }
    }
    
    let hasMeaningfulChange = false;
    if (Object.keys(updatedFields).length > 0) {
        if (updatedFields.hasOwnProperty('countryId') && item.countryId !== updatedFields.countryId) hasMeaningfulChange = true;
        if (updatedFields.hasOwnProperty('province') && item.province !== updatedFields.province) hasMeaningfulChange = true;
        if (updatedFields.hasOwnProperty('selectedServicePriceId') && item.selectedServicePriceId !== updatedFields.selectedServicePriceId) hasMeaningfulChange = true;
        
        if (item.type === 'activity' && updatedFields.hasOwnProperty('selectedPackageId') && (item as ActivityItem).selectedPackageId !== (updatedFields as Partial<ActivityItem>).selectedPackageId) hasMeaningfulChange = true;
        if (item.type === 'transfer' && updatedFields.hasOwnProperty('selectedVehicleOptionId') && (item as TransferItem).selectedVehicleOptionId !== (updatedFields as Partial<TransferItem>).selectedVehicleOptionId) hasMeaningfulChange = true;
        if (item.type === 'hotel') {
            if (updatedFields.hasOwnProperty('hotelDefinitionId') && (item as HotelItem).hotelDefinitionId !== (updatedFields as Partial<HotelItem>).hotelDefinitionId) hasMeaningfulChange = true;
            if (updatedFields.hasOwnProperty('selectedRooms')) { // Basic check for selectedRooms, could be deeper if necessary
                 const currentSelectedRooms = (item as HotelItem).selectedRooms || [];
                 const newSelectedRooms = (updatedFields as Partial<HotelItem>).selectedRooms || [];
                 if (currentSelectedRooms.length !== newSelectedRooms.length || 
                     !currentSelectedRooms.every((room, index) => newSelectedRooms[index] && room.id === newSelectedRooms[index].id)) { // Simple comparison
                     hasMeaningfulChange = true;
                 }
            }
        }
    }

    if (hasMeaningfulChange) {
      onUpdate({ ...item, ...updatedFields });
    }
  }, [
    item.countryId, // Now specific
    item.province,  // Now specific
    item.type,      // Now specific
    displayableCountriesForItem,
    displayableProvincesForItem,
    getProvincesByCountry,
    onUpdate,
    item.selectedServicePriceId, // Add other fields that might be reset by this effect if they influence it
    (item as ActivityItem).selectedPackageId,
    (item as TransferItem).selectedVehicleOptionId,
    (item as HotelItem).hotelDefinitionId,
    (item as HotelItem).selectedRooms,
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


  const handleOptOutToggle = (travelerId: string, checked: boolean) => {
    const newExcludedTravelerIds = checked
      ? [...item.excludedTravelerIds, travelerId]
      : item.excludedTravelerIds.filter(id => id !== travelerId);
    onUpdate({ ...item, excludedTravelerIds: newExcludedTravelerIds });
  };

  const handleBookingStatusChange = (newStatus: BookingStatus) => {
    onUpdate({ ...item, bookingStatus: newStatus });
  };

  const handleConfirmationRefChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...item, confirmationRef: event.target.value || undefined });
  };

  const IconComponent = ITEM_TYPE_ICONS[item.type] || AlertCircle;
  const BookingStatusIcon = item.bookingStatus ? BOOKING_STATUS_ICONS[item.bookingStatus] : FileQuestion;
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
          <IconComponent className="h-5 w-5 mr-2 flex-shrink-0 text-primary" />
          <div className="flex-grow min-w-0">
            <CardTitle className="text-base font-semibold text-primary truncate" title={`${itemTypeLabel}: ${itemNameDisplay}`}>
              <BookingStatusIcon className="h-4 w-4 mr-1.5 inline-block relative -top-px text-muted-foreground" />
              {itemTypeLabel}: {itemNameDisplay}
            </CardTitle>
            {itemSummaryLine && (
              <div className={cn("text-sm text-muted-foreground truncate", isCurrentlyExpanded && "hidden sm:block")}>
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
            className="h-8 w-8 sm:h-7 sm:w-7 text-muted-foreground hover:bg-primary/10"
            aria-label={isCurrentlyExpanded ? "Collapse" : "Expand"}
            aria-expanded={isCurrentlyExpanded}
            aria-controls={`item-content-${item.id}`}
          >
            {isCurrentlyExpanded ? <ChevronUp className="h-5 w-5 sm:h-4 sm:w-4" /> : <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 sm:h-7 sm:w-7 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>

      {isCurrentlyExpanded && (
        <CardContent id={`item-content-${item.id}`} className="p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 border-t mt-3">
            <FormField label="Booking Status" id={`bookingStatus-${item.id}`}>
              <Select
                value={item.bookingStatus || "Pending"}
                onValueChange={(value) => handleBookingStatusChange(value as BookingStatus)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Set booking status" />
                </SelectTrigger>
                <SelectContent>
                  {BOOKING_STATUSES.map(status => (
                    <SelectItem key={status} value={status} className="text-sm">
                      <div className="flex items-center">
                        <BookingStatusIcon className="h-4 w-4 mr-2" />
                        {status}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Confirmation Ref (Optional)" id={`confirmationRef-${item.id}`}>
              <Input
                id={`confirmationRef-${item.id}`}
                value={item.confirmationRef || ""}
                onChange={handleConfirmationRefChange}
                placeholder="e.g., Booking ID, PNR"
                className="h-9 text-sm"
              />
            </FormField>
          </div>


          <div className="pt-1 sm:pt-2">
            <button
              onClick={() => setIsOptOutOpen(!isOptOutOpen)}
              className="flex items-center justify-between w-full text-sm font-medium text-left text-foreground/80 hover:text-primary py-1.5 sm:py-2 px-2 sm:px-3 rounded-md hover:bg-muted/50 transition-colors"
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
                        className="h-4 w-4 sm:h-5 sm:w-5"
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
        </CardContent>
      )}
    </Card>
  );
}

export const BaseItemForm = React.memo(BaseItemFormComponent) as typeof BaseItemFormComponent;
