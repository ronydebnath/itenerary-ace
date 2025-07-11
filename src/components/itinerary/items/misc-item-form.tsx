
/**
 * @fileoverview This component provides a form for adding or editing miscellaneous items
 * within an itinerary, such as visa fees, souvenirs, or guide fees. It allows selection
 * of predefined miscellaneous services, setting a unit cost and quantity, and defining
 * how the cost should be assigned (per person or total). It utilizes the `BaseItemForm`
 * for common structure and traveler exclusion capabilities.
 *
 * @bangla এই কম্পোনেন্টটি একটি ভ্রমণপথের মধ্যে বিবিধ আইটেম (যেমন ভিসা ফি, স্যুভেনিয়ার,
 * বা গাইড ফি) যোগ বা সম্পাদনা করার জন্য একটি ফর্ম সরবরাহ করে। এটি পূর্বনির্ধারিত বিবিধ
 * পরিষেবা নির্বাচন, ইউনিট খরচ এবং পরিমাণ নির্ধারণ এবং খরচ কীভাবে বরাদ্দ করা হবে (প্রতি
 * ব্যক্তি বা মোট) তা নির্ধারণের অনুমতি দেয়। এটি সাধারণ কাঠামো এবং ভ্রমণকারী বাদ
 * দেওয়ার ক্ষমতার জন্য `BaseItemForm` ব্যবহার করে।
 */
"use client";

import * as React from 'react';
import type { MiscItem as MiscItemType, Traveler, CurrencyCode, ServicePriceItem, TripSettings, CountryItem } from '@/types/itinerary';
import { BaseItemForm, FormField } from './base-item-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, Star } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useServicePrices } from '@/hooks/useServicePrices';
import { useCountries } from '@/hooks/useCountries';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { formatCurrency, cn } from '@/lib/utils';

interface MiscItemFormProps {
  item: MiscItemType;
  travelers: Traveler[];
  currency: CurrencyCode; // Billing Currency
  tripSettings: TripSettings;
  dayNumber: number;
  onUpdate: (item: MiscItemType) => void;
  onDelete: () => void;
  allServicePrices: ServicePriceItem[];
  itemSummaryLine: React.ReactNode;
  isCurrentlyExpanded: boolean;
  onToggleExpand: () => void;
}

function MiscItemFormComponent({
  item,
  travelers,
  currency: billingCurrency, 
  tripSettings,
  dayNumber,
  onUpdate,
  onDelete,
  allServicePrices: passedInAllServicePrices,
  itemSummaryLine,
  isCurrentlyExpanded,
  onToggleExpand
}: MiscItemFormProps) {
  const { allServicePrices: hookServicePrices, isLoading: isLoadingServicesHook } = useServicePrices();
  const currentAllServicePrices = passedInAllServicePrices || hookServicePrices;
  const { countries, getCountryById } = useCountries();
  const { getRate, isLoading: isLoadingExchangeRates } = useExchangeRates();
  const [miscServices, setMiscServices] = React.useState<ServicePriceItem[]>([]);
  
  const determineItemSourceCurrency = React.useCallback((): CurrencyCode => {
    const service = item.selectedServicePriceId ? currentAllServicePrices.find(sp => sp.id === item.selectedServicePriceId) : undefined;
    if (service) return service.currency;

    const itemCountryDef = item.countryId ? getCountryById(item.countryId) : 
                           (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0]) : undefined);
    if (itemCountryDef?.defaultCurrency) return itemCountryDef.defaultCurrency;
    
    return billingCurrency; 
  }, [item.selectedServicePriceId, item.countryId, currentAllServicePrices, getCountryById, tripSettings.selectedCountries, billingCurrency]);

  const [itemSourceCurrency, setItemSourceCurrency] = React.useState<CurrencyCode>(determineItemSourceCurrency());

  React.useEffect(() => {
    setItemSourceCurrency(determineItemSourceCurrency());
  }, [determineItemSourceCurrency]);

  const getServicePriceById = React.useCallback((id: string) => {
    return currentAllServicePrices.find(sp => sp.id === id);
  }, [currentAllServicePrices]);

  const selectedService = React.useMemo(() => {
    if (item.selectedServicePriceId) {
      return getServicePriceById(item.selectedServicePriceId);
    }
    return undefined;
  }, [item.selectedServicePriceId, getServicePriceById]);

  const isLoadingServices = passedInAllServicePrices ? false : isLoadingServicesHook;

  React.useEffect(() => {
    if (isLoadingServices) {
      setMiscServices([]);
      return;
    }
    let filteredServices = currentAllServicePrices.filter(s => s.category === 'misc');
    
    const currencyToFilterBy = itemSourceCurrency;
    filteredServices = filteredServices.filter(s => s.currency === currencyToFilterBy);

    const countryIdToFilterBy = item.countryId || (tripSettings.selectedCountries.length === 1 ? tripSettings.selectedCountries[0] : undefined);
    const provincesToFilterBy = item.province ? [item.province] : tripSettings.selectedProvinces;

    if (countryIdToFilterBy) {
      filteredServices = filteredServices.filter(s => s.countryId === countryIdToFilterBy || !s.countryId);
    } else if (tripSettings.selectedCountries.length > 0) {
      filteredServices = filteredServices.filter(s => !s.countryId || tripSettings.selectedCountries.includes(s.countryId));
    }

    if (provincesToFilterBy.length > 0) {
      filteredServices = filteredServices.filter(s => !s.province || provincesToFilterBy.includes(s.province));
    }
    setMiscServices(filteredServices.sort((a,b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
    }));
  }, [currentAllServicePrices, itemSourceCurrency, item.countryId, item.province, tripSettings.selectedCountries, tripSettings.selectedProvinces, isLoadingServices]);


  const handleInputChange = (field: keyof MiscItemType, value: any) => {
    onUpdate({
      ...item,
      [field]: value,
      selectedServicePriceId: (field === 'costAssignment' || field === 'quantity') ? item.selectedServicePriceId : undefined
    });
  };

  const handleNumericInputChange = (field: keyof MiscItemType, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onUpdate({
      ...item,
      [field]: numValue,
      selectedServicePriceId: field === 'unitCost' ? undefined : item.selectedServicePriceId
    });
  };

  const handlePredefinedServiceSelect = (selectedValue: string) => {
    if (selectedValue === "none") {
       const newSourceCurrency = item.countryId ? getCountryById(item.countryId)?.defaultCurrency || billingCurrency : 
                               (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0])?.defaultCurrency || billingCurrency : billingCurrency);
      onUpdate({
        ...item,
        name: `New misc`,
        selectedServicePriceId: undefined,
        unitCost: 0,
        note: undefined,
        province: item.province,
        countryId: item.countryId,
        countryName: item.countryId ? countries.find(c => c.id === item.countryId)?.name : undefined,
      });
      setItemSourceCurrency(newSourceCurrency);
    } else {
      const service = getServicePriceById(selectedValue);
      if (service) {
        onUpdate({
          ...item,
          name: item.name === `New misc` || !item.name || !item.selectedServicePriceId ? service.name : item.name,
          unitCost: service.price1 ?? 0,
          selectedServicePriceId: service.id,
          note: service.notes || undefined,
          province: service.province || item.province,
          countryId: service.countryId || item.countryId,
          countryName: service.countryId ? countries.find(c => c.id === service.countryId)?.name : item.countryName,
        });
        setItemSourceCurrency(service.currency);
      } else {
        const fallbackSourceCurrency = item.countryId ? getCountryById(item.countryId)?.defaultCurrency || billingCurrency : 
                                     (tripSettings.selectedCountries.length === 1 ? getCountryById(tripSettings.selectedCountries[0])?.defaultCurrency || billingCurrency : billingCurrency);
        onUpdate({
          ...item,
          name: `New misc`,
          selectedServicePriceId: selectedValue,
          unitCost: 0,
          note: undefined,
        });
        setItemSourceCurrency(fallbackSourceCurrency);
      }
    }
  };

  const serviceDefinitionNotFound = item.selectedServicePriceId && !selectedService && !isLoadingServices;
  const isPriceReadOnly = !!item.selectedServicePriceId && !!selectedService;

  const itemCountryName = item.countryId ? countries.find(c => c.id === item.countryId)?.name : undefined;
  const globalCountryNames = tripSettings.selectedCountries.map(id => countries.find(c => c.id === id)?.name).filter(Boolean) as string[];
  let locationContext = "Global";
  if (itemCountryName) {
    locationContext = item.province ? `${item.province}, ${itemCountryName}` : itemCountryName;
  } else if (globalCountryNames.length > 0) {
    locationContext = tripSettings.selectedProvinces.length > 0
      ? `${tripSettings.selectedProvinces.join('/')} (${globalCountryNames.join('/')})`
      : globalCountryNames.join('/');
  } else if (tripSettings.selectedProvinces.length > 0) {
    locationContext = tripSettings.selectedProvinces.join('/');
  }

  const conversionDetails = (itemSourceCurrency !== billingCurrency && getRate && !isLoadingExchangeRates) ? getRate(itemSourceCurrency, billingCurrency) : null;
  const unitCostConverted = item.unitCost !== undefined && conversionDetails ? item.unitCost * conversionDetails.finalRate : null;

  return (
    <BaseItemForm
      item={item}
      travelers={travelers}
      currency={billingCurrency}
      tripSettings={tripSettings}
      onUpdate={onUpdate as any}
      onDelete={onDelete}
      itemTypeLabel="Miscellaneous Item"
      dayNumber={dayNumber}
      itemSummaryLine={itemSummaryLine}
      isCurrentlyExpanded={isCurrentlyExpanded}
      onToggleExpand={onToggleExpand}
    >
       {(miscServices.length > 0 || item.selectedServicePriceId || isLoadingServices) && (
        <div className="mb-4">
          <FormField label={`Select Predefined Item (${locationContext} - ${itemSourceCurrency})`} id={`predefined-misc-${item.id}`}>
             {isLoadingServices && !passedInAllServicePrices ? (
                 <div className="flex items-center h-10 border rounded-md px-3 bg-muted/50">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading items...</span>
                </div>
            ) : (
                <Select
                value={item.selectedServicePriceId || "none"}
                onValueChange={handlePredefinedServiceSelect}
                disabled={miscServices.length === 0 && !item.selectedServicePriceId}
                >
                <SelectTrigger>
                    <SelectValue placeholder={miscServices.length === 0 && !item.selectedServicePriceId ? "No items match criteria" : "Choose a predefined item..."} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None (Custom Price)</SelectItem>
                    {miscServices.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                        {service.isFavorite && <Star className="inline-block h-3 w-3 mr-1.5 text-amber-400 fill-amber-400" />}
                        {service.name} ({service.province || (service.countryId ? countries.find(c => c.id === service.countryId)?.name : 'Generic')}) - {service.currency} {service.price1}
                        {service.subCategory ? ` (${service.subCategory})` : ''}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            )}
          </FormField>
          {selectedService && <p className="text-xs text-muted-foreground pt-1">Using: {selectedService.name}{selectedService.subCategory ? ` (${selectedService.subCategory})` : ''} (Priced in {selectedService.currency})</p>}
        </div>
      )}

      {serviceDefinitionNotFound && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service Not Found</AlertTitle>
          <AlertDescription>
            The selected miscellaneous item (ID: {item.selectedServicePriceId}) could not be found. Please choose another or set a custom price.
          </AlertDescription>
        </Alert>
      )}
       {itemSourceCurrency !== billingCurrency && selectedService && conversionDetails && !isLoadingExchangeRates && (
        <p className="text-xs text-blue-600 mb-2">Note: Prices shown in {itemSourceCurrency}. Totals converted to {billingCurrency} using rate ~{conversionDetails.finalRate.toFixed(4)}.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-3 sm:gap-4 mb-4">
        <FormField label="Miscellaneous Item Name / Description" id={`itemName-${item.id}`} className="md:col-span-1">
            <Input
            id={`itemName-${item.id}`}
            value={item.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={`e.g., Visa Fee, Souvenir`}
            className="h-9 text-sm"
            />
        </FormField>
        <FormField label="Note (Optional)" id={`itemNote-${item.id}`} className="md:col-span-1">
            <Input
            id={`itemNote-${item.id}`}
            value={item.note || ''}
            onChange={(e) => handleInputChange('note', e.target.value)}
            placeholder={`e.g., Details about the item`}
            className="h-9 text-sm"
            />
        </FormField>
      </div>

      <Separator className="my-4" />
      <div className="space-y-1 mb-2">
          <p className="text-sm font-medium text-muted-foreground">Configuration Details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label={`Unit Cost (${itemSourceCurrency})`} id={`unitCost-${item.id}`}>
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
          {conversionDetails && unitCostConverted !== null && !isLoadingExchangeRates && (
            <p className="text-xs text-muted-foreground mt-1">Approx. {formatCurrency(unitCostConverted, billingCurrency)}</p>
          )}
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
export const MiscItemForm = React.memo(MiscItemFormComponent);
    

