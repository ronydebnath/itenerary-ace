/**
 * @fileoverview This component provides a form for adding or editing hotel stay items
 * within an itinerary. It allows selection of predefined hotel definitions,
 * configuration of multiple room bookings (each with its own type, number of rooms,
 * and traveler assignments), and setting check-in/checkout days. It uses the
 * `BaseItemForm` for common structure and traveler exclusion logic.
 *
 * @bangla এই কম্পোনেন্টটি একটি ভ্রমণপথের মধ্যে হোটেল থাকার আইটেম যোগ বা সম্পাদনা করার
 * জন্য একটি ফর্ম সরবরাহ করে। এটি পূর্বনির্ধারিত হোটেল সংজ্ঞা নির্বাচন, একাধিক রুম বুকিং
 * (প্রতিটির নিজস্ব প্রকার, রুমের সংখ্যা এবং ভ্রমণকারী বরাদ্দ সহ) কনফিগারেশন এবং
 * চেক-ইন/চেকআউট দিন নির্ধারণের অনুমতি দেয়। এটি সাধারণ কাঠামো এবং ভ্রমণকারী বাদ
 * দেওয়ার যুক্তির জন্য `BaseItemForm` ব্যবহার করে।
 */
"use client";

import * as React from 'react';
import type { HotelItem as HotelItemType, SelectedHotelRoomConfiguration, Traveler, CurrencyCode, TripSettings, HotelDefinition, HotelRoomTypeDefinition, ServicePriceItem, CountryItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Users, BedDouble, Info, AlertCircle, Loader2, Star, DollarSign } from 'lucide-react';
import { generateGUID, formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useHotelDefinitions } from '@/hooks/useHotelDefinitions';
import { useCountries } from '@/hooks/useCountries';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { addDays, format, parseISO, isValid, startOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface HotelItemFormProps {
  item: HotelItemType;
  travelers: Traveler[];
  currency: CurrencyCode; // This is the Billing Currency for the itinerary
  dayNumber: number;
  tripSettings: TripSettings;
  onUpdate: (item: HotelItemType) => void;
  onDelete: () => void;
  allHotelDefinitions: HotelDefinition[];
  allServicePrices: ServicePriceItem[];
  itemSummaryLine: React.ReactNode;
  isCurrentlyExpanded: boolean;
  onToggleExpand: () => void;
}

function HotelItemFormComponent({
  item,
  travelers,
  currency: billingCurrency, 
  dayNumber,
  tripSettings,
  onUpdate,
  onDelete,
  allHotelDefinitions: passedInHotelDefinitions,
  allServicePrices,
  itemSummaryLine,
  isCurrentlyExpanded,
  onToggleExpand
}: HotelItemFormProps) {
  const { allHotelDefinitions: hookHotelDefinitions, isLoading: isLoadingHookHotelDefs } = useHotelDefinitions();
  const currentAllHotelDefinitions = passedInHotelDefinitions || hookHotelDefinitions;
  const isLoadingHotelDefs = passedInHotelDefinitions ? false : isLoadingHookHotelDefs;

  const { countries, getCountryById } = useCountries();
  const { getRate, isLoading: isLoadingExchangeRates } = useExchangeRates();
  const [availableHotels, setAvailableHotels] = React.useState<HotelDefinition[]>([]);
  const [selectedHotelDef, setSelectedHotelDef] = React.useState<HotelDefinition | undefined>(undefined);
  const [itemSourceCurrency, setItemSourceCurrency] = React.useState<CurrencyCode>(billingCurrency);
  const [starFilter, setStarFilter] = React.useState<string>("all");
  const [openTravelerAssignments, setOpenTravelerAssignments] = React.useState<{[key: string]: boolean}>({});

  React.useEffect(() => {
    if (isLoadingHotelDefs) {
      setAvailableHotels([]);
      return;
    }
    let filteredDefs = currentAllHotelDefinitions;
    const countryIdToFilterBy = item.countryId || (tripSettings.selectedCountries.length === 1 ? tripSettings.selectedCountries[0] : undefined);
    if (countryIdToFilterBy) {
      filteredDefs = filteredDefs.filter(hd => hd.countryId === countryIdToFilterBy);
    } else if (tripSettings.selectedCountries.length > 0) {
      filteredDefs = filteredDefs.filter(hd => tripSettings.selectedCountries.includes(hd.countryId));
    }

    const provinceToFilterBy = item.province || (tripSettings.selectedProvinces.length === 1 ? tripSettings.selectedProvinces[0] : undefined);
    if (provinceToFilterBy) {
         filteredDefs = filteredDefs.filter(hd => hd.province === provinceToFilterBy);
    } else if (tripSettings.selectedProvinces.length > 0 && (!countryIdToFilterBy && tripSettings.selectedCountries.length === 0)) {
        filteredDefs = filteredDefs.filter(hd => tripSettings.selectedProvinces.includes(hd.province));
    }
    if (starFilter !== "all") {
      const numericStarFilter = parseInt(starFilter, 10);
      filteredDefs = filteredDefs.filter(hd => hd.starRating === numericStarFilter);
    }
    setAvailableHotels(filteredDefs.sort((a,b) => a.name.localeCompare(b.name)));
  }, [item.countryId, item.province, currentAllHotelDefinitions, isLoadingHotelDefs, tripSettings.selectedCountries, tripSettings.selectedProvinces, starFilter]);

  React.useEffect(() => {
    let determinedSourceCurrency = billingCurrency; 
    if (item.hotelDefinitionId) {
      const hotelDef = currentAllHotelDefinitions.find(hd => hd.id === item.hotelDefinitionId);
      setSelectedHotelDef(hotelDef);
      if (hotelDef) {
        const servicePriceForHotel = allServicePrices.find(
          (sp) => sp.category === 'hotel' && sp.hotelDetails?.id === item.hotelDefinitionId
        );
        if (servicePriceForHotel) {
          determinedSourceCurrency = servicePriceForHotel.currency;
        } else {
            const hotelCountry = countries.find(c => c.id === hotelDef.countryId);
            if(hotelCountry?.defaultCurrency) determinedSourceCurrency = hotelCountry.defaultCurrency;
        }
      }
    } else {
      setSelectedHotelDef(undefined);
       const itemCountryDef = item.countryId ? countries.find(c => c.id === item.countryId) : 
                           (tripSettings.selectedCountries.length === 1 ? countries.find(c => c.id === tripSettings.selectedCountries[0]) : undefined);
      if (itemCountryDef?.defaultCurrency) determinedSourceCurrency = itemCountryDef.defaultCurrency;
    }
    setItemSourceCurrency(determinedSourceCurrency);
  }, [item.hotelDefinitionId, item.countryId, currentAllHotelDefinitions, allServicePrices, billingCurrency, countries, tripSettings.selectedCountries]);

  const handleHotelDefinitionChange = (hotelDefId: string) => {
    const newHotelDef = currentAllHotelDefinitions.find(hd => hd.id === hotelDefId);
    if (newHotelDef) {
      onUpdate({
        ...item,
        hotelDefinitionId: hotelDefId,
        name: item.name === 'New hotel' || !item.name || !item.hotelDefinitionId ? newHotelDef.name : item.name,
        selectedRooms: [],
        note: undefined,
        province: newHotelDef.province || item.province,
        countryId: newHotelDef.countryId || item.countryId,
        countryName: newHotelDef.countryId ? countries.find(c => c.id === newHotelDef.countryId)?.name : item.countryName,
      });
    } else {
       onUpdate({ ...item, hotelDefinitionId: '', name: 'New hotel', selectedRooms: [], note: undefined });
    }
  };

  const handleCheckoutDayChange = (value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    onUpdate({ ...item, checkoutDay: numValue || (dayNumber + 1) });
  };

  const handleAddRoomBooking = () => {
    if (!selectedHotelDef || selectedHotelDef.roomTypes.length === 0) return;
    const defaultRoomType = selectedHotelDef.roomTypes[0];
    const newRoomBooking: SelectedHotelRoomConfiguration = {
      id: generateGUID(),
      roomTypeDefinitionId: defaultRoomType.id,
      roomTypeNameCache: defaultRoomType.name,
      numRooms: 1,
      assignedTravelerIds: [],
      addExtraBed: false,
    };
    const currentSelectedRooms = item.selectedRooms || [];
    onUpdate({ ...item, selectedRooms: [...currentSelectedRooms, newRoomBooking] });
  };

  const handleUpdateRoomBooking = (updatedBooking: SelectedHotelRoomConfiguration) => {
    const currentSelectedRooms = item.selectedRooms || [];
    const newSelectedRooms = currentSelectedRooms.map(rb => rb.id === updatedBooking.id ? updatedBooking : rb);
    onUpdate({ ...item, selectedRooms: newSelectedRooms });
  };

  const handleRoomTypeChangeForBooking = (bookingId: string, roomTypeDefinitionId: string) => {
    const roomTypeDef = selectedHotelDef?.roomTypes.find(rt => rt.id === roomTypeDefinitionId);
    if (roomTypeDef) {
        const currentSelectedRooms = item.selectedRooms || [];
        const updatedBooking = currentSelectedRooms.find(rb => rb.id === bookingId);
        if (updatedBooking) {
            handleUpdateRoomBooking({ ...updatedBooking, roomTypeDefinitionId, roomTypeNameCache: roomTypeDef.name, addExtraBed: false });
        }
    }
  };

  const handleNumRoomsChangeForBooking = (bookingId: string, numRoomsStr: string) => {
      const numRooms = parseInt(numRoomsStr, 10) || 1;
      const currentSelectedRooms = item.selectedRooms || [];
      const updatedBooking = currentSelectedRooms.find(rb => rb.id === bookingId);
      if (updatedBooking) {
          handleUpdateRoomBooking({ ...updatedBooking, numRooms: Math.max(1, numRooms) });
      }
  };

  const handleDeleteRoomBooking = (bookingId: string) => {
    const currentSelectedRooms = item.selectedRooms || [];
    const newSelectedRooms = currentSelectedRooms.filter(rb => rb.id !== bookingId);
    onUpdate({ ...item, selectedRooms: newSelectedRooms });
  };

  const handleToggleTravelerAssignment = (bookingId: string) => {
    setOpenTravelerAssignments(prev => ({...prev, [bookingId]: !prev[bookingId]}));
  };

  const handleTravelerAssignmentChange = (bookingId: string, travelerId: string, checked: boolean) => {
    const currentSelectedRooms = item.selectedRooms || [];
    const roomBooking = currentSelectedRooms.find(rb => rb.id === bookingId);
    if (!roomBooking) return;
    let newAssignedTravelerIds = checked ? [...roomBooking.assignedTravelerIds, travelerId] : roomBooking.assignedTravelerIds.filter(id => id !== travelerId);
    handleUpdateRoomBooking({ ...roomBooking, assignedTravelerIds: newAssignedTravelerIds });
  };

  const handleToggleExtraBed = (bookingId: string, checked: boolean) => {
    const currentSelectedRooms = item.selectedRooms || [];
    const roomBooking = currentSelectedRooms.find(rb => rb.id === bookingId);
    if (!roomBooking) return;
    handleUpdateRoomBooking({ ...roomBooking, addExtraBed: checked });
  };

  const calculatedNights = Math.max(0, (item.checkoutDay || (dayNumber + 1)) - dayNumber);
  const currentSelectedRoomsForRender = item.selectedRooms || [];
  const hotelDefinitionNotFound = item.hotelDefinitionId && !selectedHotelDef && !isLoadingHotelDefs;
  const locationDisplay = item.countryName ? (item.province ? `${item.province}, ${item.countryName}` : item.countryName)
                        : (item.province || (tripSettings.selectedProvinces.length > 0 ? tripSettings.selectedProvinces.join('/') : (tripSettings.selectedCountries.length > 0 ? (tripSettings.selectedCountries.map(cid => countries.find(c=>c.id === cid)?.name).filter(Boolean).join('/')) : 'Any Location')));

  const getFormattedDate = (dayNumForDate: number) => {
    if (!tripSettings.startDate) return `Day ${dayNumForDate}`;
    try {
      const date = addDays(parseISO(tripSettings.startDate), dayNumForDate - 1);
      return format(date, "MMM d, yyyy");
    } catch (e) {
      return `Day ${dayNumForDate}`;
    }
  };

  const checkInDateDisplay = getFormattedDate(dayNumber);
  const checkOutDateDisplay = item.checkoutDay ? getFormattedDate(item.checkoutDay) : getFormattedDate(dayNumber + 1);


  return (
    <BaseItemForm item={item} travelers={travelers} currency={billingCurrency} tripSettings={tripSettings} onUpdate={onUpdate as any} onDelete={onDelete} itemTypeLabel="Hotel Stay" dayNumber={dayNumber} itemSummaryLine={itemSummaryLine} isCurrentlyExpanded={isCurrentlyExpanded} onToggleExpand={onToggleExpand}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <FormField label="Filter by Star Rating" id={`star-filter-${item.id}`}>
          <Select value={starFilter} onValueChange={setStarFilter}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Filter by stars..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stars</SelectItem>
              {[5, 4, 3, 2, 1].map(star => (<SelectItem key={`star-${star}`} value={String(star)}><div className="flex items-center">{Array(star).fill(0).map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-0.5" />)}{Array(5-star).fill(0).map((_,i) => <Star key={`empty-${i}`} className="h-3 w-3 text-muted-foreground/50 mr-0.5" />)}<span className="ml-1.5">({star} Star{star > 1 ? 's' : ''})</span></div></SelectItem>))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={`Select Hotel (${locationDisplay || 'Global'})`} id={`hotel-def-${item.id}`}>
          {isLoadingHotelDefs && availableHotels.length === 0 ? (<div className="flex items-center h-9 border rounded-md px-3 bg-muted/50"><Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" /><span className="text-xs text-muted-foreground">Loading hotels...</span></div>) : (
            <Select value={item.hotelDefinitionId || "none"} onValueChange={handleHotelDefinitionChange} disabled={availableHotels.length === 0 && !item.hotelDefinitionId && !isLoadingHotelDefs}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={availableHotels.length === 0 && !item.hotelDefinitionId ? "No hotels match criteria" : "Choose a hotel..."} /></SelectTrigger>
              <SelectContent><SelectItem value="none">None (Clear Selection)</SelectItem>{availableHotels.map(hotelDef => (<SelectItem key={hotelDef.id} value={hotelDef.id}>{hotelDef.name} ({hotelDef.province || (hotelDef.countryId ? countries.find(c => c.id === hotelDef.countryId)?.name : 'Generic')}){hotelDef.starRating && <span className="text-xs ml-1 opacity-70">({hotelDef.starRating}*)</span>}</SelectItem>))}</SelectContent>
            </Select>
          )}
        </FormField>
      </div>
      {selectedHotelDef && (<Card className="text-xs bg-muted/30 p-2 mb-4 border-dashed"><p><strong>Selected Hotel:</strong> {selectedHotelDef.name}</p><p><strong>Location:</strong> {selectedHotelDef.province || "N/A"}, {countries.find(c => c.id === selectedHotelDef.countryId)?.name || "N/A"}{selectedHotelDef.starRating && <span className="ml-1">({selectedHotelDef.starRating} <Star className="inline-block h-3 w-3 -mt-0.5 fill-yellow-400 text-yellow-500" />)</span>} <span className="font-semibold">(Rates in {itemSourceCurrency})</span></p></Card>)}
      {itemSourceCurrency !== billingCurrency && selectedHotelDef && getRate && !isLoadingExchangeRates && (
        <p className="text-xs text-blue-600 mb-2">Note: Hotel prices are in {itemSourceCurrency}. Final cost will be converted to {billingCurrency} (Rate approx. {getRate(itemSourceCurrency, billingCurrency)?.finalRate.toFixed(4) || 'N/A'}).</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-3 sm:gap-4 mb-4">
        <FormField label="Hotel Stay Name / Reference" id={`itemName-${item.id}`} className="md:col-span-1">
            <Input id={`itemName-${item.id}`} value={item.name} onChange={(e) => onUpdate({ ...item, name: e.target.value })} placeholder={`e.g., City Center Stay, Beach Resort`} className="h-9 text-sm"/>
        </FormField>
        <FormField label="Note (Optional)" id={`itemNote-${item.id}`} className="md:col-span-1">
            <Input id={`itemNote-${item.id}`} value={item.note || ''} onChange={(e) => onUpdate({ ...item, note: e.target.value })} placeholder={`e.g., Late check-in, specific room request`} className="h-9 text-sm"/>
        </FormField>
      </div>
      {item.hotelDefinitionId && selectedHotelDef && item.note && (<div className="mb-4 p-2 border rounded-md bg-blue-50 border-blue-200 text-xs text-blue-700"><strong>Booking Note for {selectedHotelDef.name}:</strong> {item.note}</div>)}
      <Separator className="my-4" /><div className="space-y-1 mb-2"><p className="text-sm font-medium text-muted-foreground">Stay Details</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Check-in Date" id={`checkinDateDisplay-${item.id}`}>
          <p className="font-code text-sm p-2.5 bg-muted rounded-md h-10 flex items-center">{checkInDateDisplay}</p>
        </FormField>
        <FormField label="Checkout Day (Day Number)" id={`checkoutDay-${item.id}`}>
          <Input type="number" id={`checkoutDay-${item.id}`} value={item.checkoutDay ?? ''} onChange={(e) => handleCheckoutDayChange(e.target.value)} min={dayNumber + 1} max={tripSettings.numDays} placeholder={`Day ${dayNumber + 1}`} className="h-9 text-sm"/>
        </FormField>
        <FormField label="Total Nights" id={`totalNights-${item.id}`}>
            <div className={`font-code text-sm p-2.5 rounded-md h-10 flex flex-col justify-center ${calculatedNights <=0 && item.checkoutDay ? 'text-destructive bg-destructive/10 border border-destructive' : 'bg-muted'}`}>
                <span>{calculatedNights > 0 ? calculatedNights : (item.checkoutDay ? "Invalid" : "0")}</span>
                {item.checkoutDay && <span className="text-xs text-muted-foreground/80 -mt-0.5">({checkOutDateDisplay})</span>}
            </div>
        </FormField>
      </div>
      {!item.hotelDefinitionId && (<Alert variant="default" className="mt-4 bg-blue-50 border-blue-200"><Info className="h-4 w-4 text-blue-600" /><AlertTitle className="text-blue-700">Configure Hotel</AlertTitle><AlertDescription className="text-blue-600 text-xs">Please select a hotel from the dropdown above to configure room bookings.</AlertDescription></Alert>)}
      {hotelDefinitionNotFound && (<Alert variant="destructive" className="mt-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Hotel Definition Error</AlertTitle><AlertDescription className="text-xs">The selected hotel definition (ID: {item.hotelDefinitionId}) could not be found. Please re-select a hotel.</AlertDescription></Alert>)}
      {item.hotelDefinitionId && selectedHotelDef && (<>
        <Separator className="my-4" />
        <div className="space-y-4">
          <div className="flex justify-between items-center"><Label className="text-lg font-semibold">Room Bookings for {selectedHotelDef.name}</Label><Button variant="outline" size="sm" onClick={handleAddRoomBooking} className="border-primary text-primary hover:bg-primary/10 h-8 text-xs"><PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Room Booking</Button></div>
          {currentSelectedRoomsForRender.length === 0 && (<p className="text-sm text-muted-foreground text-center py-4">No room types booked for this hotel yet. Click "Add Room Booking".</p>)}
          {currentSelectedRoomsForRender.map((roomBooking, index) => {
            const currentRoomTypeDef = selectedHotelDef.roomTypes.find(rt => rt.id === roomBooking.roomTypeDefinitionId);
            if (!currentRoomTypeDef) { return (<Alert key={roomBooking.id} variant="destructive" className="my-2"><AlertCircle className="h-4 w-4" /><AlertTitle className="text-sm">Room Type Error</AlertTitle><AlertDescription className="text-xs">Room type definition for booking {index + 1} (ID: {roomBooking.roomTypeDefinitionId}) is missing for {selectedHotelDef.name}. Delete this booking and re-add.</AlertDescription><Button variant="ghost" size="sm" onClick={() => handleDeleteRoomBooking(roomBooking.id)} className="mt-2 text-destructive hover:bg-destructive/10 h-7 text-xs"><Trash2 className="mr-1 h-3 w-3" /> Delete This Booking</Button></Alert>); }
            
            let effectiveRateDisplay = null;
            if (currentRoomTypeDef && tripSettings.startDate && isValid(parseISO(tripSettings.startDate))) {
              try {
                const checkInDateOfStay = startOfDay(addDays(parseISO(tripSettings.startDate as string), item.day - 1));
                let foundRate: number | undefined = undefined;
                let foundExtraBedRate: number | undefined = undefined;
                let seasonName: string | undefined = undefined;

                for (const seasonalPrice of currentRoomTypeDef.seasonalPrices) {
                   if (seasonalPrice.startDate && seasonalPrice.endDate && typeof seasonalPrice.startDate === 'string' && typeof seasonalPrice.endDate === 'string') {
                    const seasonStartDate = startOfDay(parseISO(seasonalPrice.startDate));
                    const seasonEndDate = startOfDay(parseISO(seasonalPrice.endDate));
                    if (isValid(seasonStartDate) && isValid(seasonEndDate) && isWithinInterval(checkInDateOfStay, { start: seasonStartDate, end: seasonEndDate })) {
                      foundRate = seasonalPrice.rate;
                      if (currentRoomTypeDef.extraBedAllowed && seasonalPrice.extraBedRate !== undefined) {
                        foundExtraBedRate = seasonalPrice.extraBedRate;
                      }
                      seasonName = seasonalPrice.seasonName;
                      break;
                    }
                  }
                }
                if (foundRate !== undefined) {
                    let rateDisplay = formatCurrency(foundRate, itemSourceCurrency);
                    let extraBedRateDisplay = foundExtraBedRate !== undefined ? formatCurrency(foundExtraBedRate, itemSourceCurrency) : null;
                    let conversionNote = "";

                    if (itemSourceCurrency !== billingCurrency && getRate && !isLoadingExchangeRates) {
                        const convDetails = getRate(itemSourceCurrency, billingCurrency);
                        if (convDetails) {
                            const convertedRate = foundRate * convDetails.finalRate;
                            rateDisplay += ` (≈ ${formatCurrency(convertedRate, billingCurrency)})`;
                            if (foundExtraBedRate !== undefined) {
                                const convertedExtraBedRate = foundExtraBedRate * convDetails.finalRate;
                                extraBedRateDisplay = `${extraBedRateDisplay} (≈ ${formatCurrency(convertedExtraBedRate, billingCurrency)})`;
                            }
                            conversionNote = ` (Converted from ${itemSourceCurrency})`;
                        }
                    }

                    effectiveRateDisplay = (<div className="mt-2 text-xs text-muted-foreground bg-green-50 border border-green-200 p-2 rounded-md space-y-0.5"><p className="flex items-center"><DollarSign className="h-3 w-3 mr-1 text-green-600"/>Effective Nightly Rate ({seasonName || 'Current'}): <strong className="ml-1 text-green-700">{rateDisplay}</strong></p>{currentRoomTypeDef.extraBedAllowed && foundExtraBedRate !== undefined && (<p className="flex items-center"><DollarSign className="h-3 w-3 mr-1 text-green-600"/>Effective Extra Bed: <strong className="ml-1 text-green-700">{extraBedRateDisplay}</strong></p>)}{conversionNote && <p className="italic text-xs">{conversionNote}</p>}{currentRoomTypeDef.extraBedAllowed && foundExtraBedRate === undefined && (<p className="italic text-orange-600">Extra bed allowed, but no specific rate for this season.</p>)}</div>);
                } else {
                  effectiveRateDisplay = (<div className="mt-2 text-xs text-orange-600 bg-orange-50 border border-orange-200 p-2 rounded-md">Rate not available for check-in date ({format(checkInDateOfStay, 'dd-MMM-yy')}). Check hotel's seasonal pricing.</div>);
                }
              } catch (e) { console.error("Error calculating effective rate for display:", e); effectiveRateDisplay = <div className="mt-2 text-xs text-red-500">Error displaying rate.</div>; }
            }

            return (
            <Card key={roomBooking.id} className="bg-background/70 border border-primary/20 shadow-inner">
              <CardHeader className="py-2 px-3 bg-muted/40 rounded-t-md flex flex-row justify-between items-center">
                <CardTitle className="text-sm font-medium flex items-center"><BedDouble className="mr-1.5 h-4 w-4 text-primary/80"/> Booking {index + 1}: {currentRoomTypeDef?.name || 'Select Room Type'}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteRoomBooking(roomBooking.id)} className="h-6 w-6 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
              </CardHeader>
              <CardContent className="p-2 sm:p-2.5 md:p-3 space-y-2.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <FormField label="Room Type" id={`room-type-${roomBooking.id}`}><Select value={roomBooking.roomTypeDefinitionId} onValueChange={(rtId) => handleRoomTypeChangeForBooking(roomBooking.id, rtId)}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select room type..." /></SelectTrigger><SelectContent>{selectedHotelDef.roomTypes.map(rtDef => (<SelectItem key={rtDef.id} value={rtDef.id}>{rtDef.name}</SelectItem>))}</SelectContent></Select></FormField>
                  <FormField label="# of these Rooms" id={`num-rooms-${roomBooking.id}`}><Input type="number" min="1" value={roomBooking.numRooms} onChange={(e) => handleNumRoomsChangeForBooking(roomBooking.id, e.target.value)} className="h-9 text-sm"/></FormField>
                </div>
                {currentRoomTypeDef && (<div className="mt-1.5 p-1.5 border rounded-md bg-muted/20 text-xs"><p className="font-medium mb-0.5">About {currentRoomTypeDef.name}:</p>{currentRoomTypeDef.notes && <p className="italic">"{currentRoomTypeDef.notes}"</p>}<ul className="list-disc list-inside pl-1 space-y-0 mt-0.5">{currentRoomTypeDef.characteristics && currentRoomTypeDef.characteristics.map(char => (<li key={char.id}><strong>{char.key}:</strong> {char.value}</li>))}<li><strong>Extra Bed:</strong> {currentRoomTypeDef.extraBedAllowed ? 'Allowed' : 'Not Allowed'}</li></ul></div>)}
                {effectiveRateDisplay}
                {currentRoomTypeDef?.extraBedAllowed && (
                    <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                        id={`extra-bed-${roomBooking.id}`}
                        checked={!!roomBooking.addExtraBed}
                        onCheckedChange={(checked) => handleToggleExtraBed(roomBooking.id, !!checked)}
                        />
                        <Label htmlFor={`extra-bed-${roomBooking.id}`} className="text-xs font-normal cursor-pointer">
                        Add Extra Bed to this room block
                        </Label>
                    </div>
                )}
                <div>
                  <button onClick={() => handleToggleTravelerAssignment(roomBooking.id)} className="flex items-center justify-between w-full text-xs font-medium text-left text-foreground/80 hover:text-primary py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors mt-1.5 border-t pt-2" aria-expanded={openTravelerAssignments[roomBooking.id]}>
                    <span className="flex items-center"><Users className="mr-1.5 h-3.5 w-3.5"/> Assign Travelers ({roomBooking.assignedTravelerIds.length} assigned)</span>
                    {openTravelerAssignments[roomBooking.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {openTravelerAssignments[roomBooking.id] && (<div className="mt-1.5 p-2 border rounded-md bg-muted/30 max-h-32 overflow-y-auto">{travelers.length > 0 ? (travelers.map(traveler => (<div key={traveler.id} className="flex items-center space-x-1.5 mb-0.5 py-0.5"><Checkbox id={`assign-${roomBooking.id}-${traveler.id}`} checked={roomBooking.assignedTravelerIds.includes(traveler.id)} onCheckedChange={(checked) => handleTravelerAssignmentChange(roomBooking.id, traveler.id, !!checked)} className="h-3 w-3"/><Label htmlFor={`assign-${roomBooking.id}-${traveler.id}`} className="text-xs font-normal cursor-pointer">{traveler.label}</Label></div>))) : (<p className="text-xs text-muted-foreground">No travelers defined to assign.</p>)}</div>)}
                </div>
              </CardContent>
            </Card>
            );
          })}
           {currentSelectedRoomsForRender.length > 0 && (<p className="text-xs text-muted-foreground text-center pt-2">Hotel costs are calculated night-by-night based on room types and seasonal rates from the hotel's master data (defined in {itemSourceCurrency}). Final sum is converted to {billingCurrency}.</p>)}
        </div>
        </>
      )}
    </BaseItemForm>
  );
}
export const HotelItemForm = React.memo(HotelItemFormComponent);
    
