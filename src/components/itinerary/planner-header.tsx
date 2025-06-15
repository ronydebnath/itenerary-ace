/**
 * @fileoverview This component renders the header section of the itinerary planner.
 * It includes fields for setting the itinerary name, client name, start date, number of days,
 * number of adults/children, preferred currency, global budget, and selection of
 * countries/provinces to focus the itinerary on. It also provides buttons for saving
 * and resetting the itinerary.
 *
 * @bangla এই কম্পোনেন্টটি ভ্রমণপথ পরিকল্পনাকারীর হেডার অংশ রেন্ডার করে।
 * এটিতে ভ্রমণপথের নাম, ক্লায়েন্টের নাম, শুরুর তারিখ, দিনের সংখ্যা, প্রাপ্তবয়স্ক/শিশুর
 * সংখ্যা, পছন্দের মুদ্রা, গ্লোবাল বাজেট এবং ভ্রমণপথকে কেন্দ্র করে দেশ/প্রদেশ নির্বাচনের
 * জন্য ক্ষেত্র অন্তর্ভুক্ত রয়েছে। এটি ভ্রমণপথ সংরক্ষণ এবং রিসেট করার জন্য বোতামও সরবরাহ করে।
 */
"use client";

import * as React from 'react';
import type { TripData, TripSettings, PaxDetails, ProvinceItem, CurrencyCode, CountryItem, QuotationRequest } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Save, Info, CalendarDays, Users, MapPin, Route, Loader2, DollarSign, Globe, FileText, Image as ImageIconLucide, Wand2, Landmark, Send } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useProvinces } from '@/hooks/useProvinces';
import { useCountries } from '@/hooks/useCountries';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface PlannerHeaderProps {
  tripData: TripData;
  onUpdateTripData: (updateFn: (currentTripData: TripData | null) => Partial<TripData> | TripData) => void;
  onUpdateSettings: (updatedSettings: Partial<TripSettings>) => void;
  onUpdatePax: (updatedPax: Partial<PaxDetails>) => void;
  onManualSave: () => void;
  onReset: () => void;
  showCosts: boolean;
  quotationRequestDetails?: QuotationRequest | null;
  handleSendQuotationToAgent?: () => void; 
}

function PlannerHeaderComponent({
  tripData,
  onUpdateTripData,
  onUpdateSettings,
  onUpdatePax,
  onManualSave,
  onReset,
  showCosts,
  quotationRequestDetails,
  handleSendQuotationToAgent,
}: PlannerHeaderProps) {
  const { countries: availableCountries, isLoading: isLoadingCountries } = useCountries();
  const { provinces: allAvailableProvinces, isLoading: isLoadingProvinces, getProvincesByCountry } = useProvinces();

  const handleCountryToggle = React.useCallback((countryId: string) => {
    onUpdateSettings({
      selectedCountries: (tripData.settings.selectedCountries || []).includes(countryId)
        ? (tripData.settings.selectedCountries || []).filter(id => id !== countryId)
        : [...(tripData.settings.selectedCountries || []), countryId],
      selectedProvinces: [] 
    });
  }, [onUpdateSettings, tripData.settings.selectedCountries]);

  const handleProvinceToggle = React.useCallback((provinceName: string) => {
    onUpdateSettings({
      selectedProvinces: (tripData.settings.selectedProvinces || []).includes(provinceName)
        ? (tripData.settings.selectedProvinces || []).filter(p => p !== provinceName)
        : [...(tripData.settings.selectedProvinces || []), provinceName]
    });
  }, [onUpdateSettings, tripData.settings.selectedProvinces]);


  const startDateForPicker = React.useMemo(() => {
    try {
      return tripData.settings.startDate && isValid(parseISO(tripData.settings.startDate)) ? parseISO(tripData.settings.startDate) : new Date();
    } catch {
      return new Date();
    }
  }, [tripData.settings.startDate]);

  const displayStartDate = React.useMemo(() => {
    return tripData.settings.startDate && isValid(parseISO(tripData.settings.startDate)) ? format(parseISO(tripData.settings.startDate), "MMMM d, yyyy") : 'N/A';
  }, [tripData.settings.startDate]);


  const displayableProvinces = React.useMemo(() => {
    if (isLoadingProvinces) return [];
    const globallySelectedCountries = tripData.settings.selectedCountries || [];
    if (globallySelectedCountries.length > 0) {
      let provincesFromSelectedCountries: ProvinceItem[] = [];
      globallySelectedCountries.forEach(countryId => {
        provincesFromSelectedCountries = provincesFromSelectedCountries.concat(getProvincesByCountry(countryId));
      });
      return provincesFromSelectedCountries.sort((a, b) => a.name.localeCompare(b.name));
    }
    return allAvailableProvinces.sort((a, b) => a.name.localeCompare(b.name));
  }, [isLoadingProvinces, tripData.settings.selectedCountries, allAvailableProvinces, getProvincesByCountry]);


  const selectedCountryNames = React.useMemo(() => {
    return (tripData.settings.selectedCountries || [])
      .map(id => availableCountries.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];
  }, [tripData.settings.selectedCountries, availableCountries]);

  const groupedProvinces = React.useMemo(() => {
    if (isLoadingProvinces || isLoadingCountries) return {};
    const groups: Record<string, { countryName: string; provinces: ProvinceItem[] }> = {};

    displayableProvinces.forEach(province => {
      const country = availableCountries.find(c => c.id === province.countryId);
      const countryKey = province.countryId || 'unknown';
      const countryName = country?.name || 'Other Provinces';

      if (!groups[countryKey]) {
        groups[countryKey] = { countryName, provinces: [] };
      }
      groups[countryKey].provinces.push(province);
    });

    for (const key in groups) {
      groups[key].provinces.sort((a, b) => a.name.localeCompare(b.name));
    }

    const sortedGroupEntries = Object.entries(groups).sort(([, groupA], [, groupB]) => {
      return groupA.countryName.localeCompare(groupB.countryName);
    });
    return Object.fromEntries(sortedGroupEntries);
  }, [displayableProvinces, isLoadingProvinces, isLoadingCountries, availableCountries]);


  const numNights = Math.max(0, tripData.settings.numDays - 1);
  const canSendQuotation = !!tripData.quotationRequestId && !!quotationRequestDetails && !!handleSendQuotationToAgent;

  return (
    <Card className="mb-4 md:mb-6 shadow-xl no-print">
      <CardHeader className="bg-primary/5 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-grow">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center">
              <Route className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              Itinerary Planner
            </CardTitle>
            <CardDescription className="text-muted-foreground pt-1 text-sm">
              Craft and cost your perfect trip. Changes to settings below will update the itinerary.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 self-start sm:self-auto w-full sm:w-auto">
            <Link href="/image-describer" className="w-full xs:w-auto">
              <Button variant="outline" size="sm" className="bg-card hover:bg-muted shadow-sm text-xs sm:text-sm h-9 w-full xs:w-auto">
                <ImageIconLucide className="mr-1.5 h-4 w-4" />
                Describe Image
              </Button>
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild className="w-full xs:w-auto">
                  <Button variant="outline" size="sm" className="bg-card hover:bg-muted shadow-sm text-xs sm:text-sm h-9 w-full xs:w-auto" disabled>
                    <Wand2 className="mr-1.5 h-4 w-4" />
                    AI Smart Suggestions
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI-powered suggestions to improve your itinerary. (Coming Soon!)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {canSendQuotation && handleSendQuotationToAgent && (
                 <Button onClick={handleSendQuotationToAgent} size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm h-9 w-full xs:w-auto">
                    <Send className="mr-1.5 h-4 w-4" /> Send Quotation to Agent
                </Button>
            )}
            <Button onClick={onManualSave} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs sm:text-sm h-9 w-full xs:w-auto">
              <Save className="mr-1.5 h-4 w-4" /> Save
            </Button>
            <Button variant="outline" onClick={onReset} size="sm" className="border-destructive text-destructive hover:bg-destructive/10 text-xs sm:text-sm h-9 w-full xs:w-auto">
              <Edit3 className="mr-1.5 h-4 w-4" /> New/Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itineraryName" className="text-sm font-medium text-muted-foreground">Itinerary Name</Label>
            <Input
              id="itineraryName"
              value={tripData.itineraryName || ''}
              onChange={(e) => onUpdateTripData(currentData => ({ ...currentData, itineraryName: e.target.value }))}
              placeholder="Enter itinerary name"
              className="text-base font-semibold h-10 mt-1"
            />
            {tripData.id && (
              <p className="text-xs text-muted-foreground mt-1">
                ID: <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{tripData.id}</span>
                {tripData.quotationRequestId && (
                    <span className="ml-2">Quote Ref: <Badge variant="secondary" className="text-xs font-mono">{tripData.quotationRequestId.split('-').pop()}</Badge></span>
                )}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="clientName" className="text-sm font-medium text-muted-foreground">Client Name (Optional)</Label>
            <Input
              id="clientName"
              value={tripData.clientName || ''}
              onChange={(e) => onUpdateTripData(currentData => ({ ...currentData, clientName: e.target.value }))}
              placeholder="Enter client name"
              className="text-base h-10 mt-1"
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isTemplate"
              checked={tripData.settings.isTemplate || false}
              onCheckedChange={(checked) => {
                const isNowTemplate = !!checked;
                onUpdateSettings({
                  isTemplate: isNowTemplate,
                  templateCategory: isNowTemplate ? tripData.settings.templateCategory : undefined
                });
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="isTemplate" className="text-sm font-normal cursor-pointer flex items-center">
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> Mark as Itinerary Template
            </Label>
          </div>
          {tripData.settings.isTemplate && (
            <div className="mt-3 ml-6">
              <Label htmlFor="templateCategory" className="text-sm font-medium text-muted-foreground">Template Category (Optional)</Label>
              <Input
                id="templateCategory"
                value={tripData.settings.templateCategory || ''}
                onChange={(e) => onUpdateSettings({ templateCategory: e.target.value || undefined })}
                placeholder="e.g., Beach Holiday, Cultural Tour"
                className="text-sm h-10 mt-1"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end border-t pt-4 mt-4">
          <div>
            <Label htmlFor="startDate" className="text-sm font-medium text-muted-foreground flex items-center"><CalendarDays className="h-4 w-4 mr-1.5" />Start Date</Label>
            <DatePicker
              date={startDateForPicker}
              onDateChange={(date) => onUpdateSettings({ startDate: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0] })}
            />
          </div>
          <div>
            <Label htmlFor="numDays" className="text-sm font-medium text-muted-foreground">Days</Label>
            <Input id="numDays" type="number" value={tripData.settings.numDays} onChange={(e) => onUpdateSettings({ numDays: parseInt(e.target.value, 10) || 1 })} min="1" className="h-10 mt-1" />
          </div>
          <div>
            <Label htmlFor="globalAdults" className="text-sm font-medium text-muted-foreground flex items-center"><Users className="h-4 w-4 mr-1.5" />Adults</Label>
            <Input id="globalAdults" type="number" value={tripData.pax.adults} onChange={(e) => onUpdatePax({ adults: parseInt(e.target.value, 10) || 0 })} min="0" className="h-10 mt-1" />
          </div>
          <div>
            <Label htmlFor="globalChildren" className="text-sm font-medium text-muted-foreground">Children</Label>
            <Input id="globalChildren" type="number" value={tripData.pax.children} onChange={(e) => onUpdatePax({ children: parseInt(e.target.value, 10) || 0 })} min="0" className="h-10 mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="currency" className="text-sm font-medium text-muted-foreground flex items-center"><Landmark className="h-4 w-4 mr-1.5" />Billing Currency</Label>
            <Select value={tripData.pax.currency} onValueChange={(value) => onUpdatePax({ currency: value as CurrencyCode })}>
              <SelectTrigger id="currency" className="w-full h-10 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(curr => (
                  <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="budget" className="text-sm font-medium text-muted-foreground flex items-center"><DollarSign className="h-4 w-4 mr-1.5" />Budget (Optional)</Label>
            <Input id="budget" type="number" value={tripData.settings.budget || ''} onChange={(e) => onUpdateSettings({ budget: e.target.value ? parseFloat(e.target.value) : undefined })} min="0" placeholder="e.g., 1000" className="h-10 mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 border-t pt-4 mt-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground flex items-center"><Globe className="h-4 w-4 mr-1.5" />Selected Countries (Optional)</Label>
            <p className="text-xs text-muted-foreground/80 mb-1.5">
              Filters available provinces and services.
            </p>
            {isLoadingCountries ? (
              <div className="flex items-center justify-center h-28 border rounded-md bg-muted/50">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading countries...</span>
              </div>
            ) : availableCountries.length > 0 ? (
              <ScrollArea className="h-28 w-full rounded-md border p-3 bg-background">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {availableCountries.map((country) => (
                    <div key={country.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`country-select-${country.id}`}
                        checked={(tripData.settings.selectedCountries || []).includes(country.id)}
                        onCheckedChange={() => handleCountryToggle(country.id)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`country-select-${country.id}`} className="text-sm font-normal cursor-pointer">
                        <span className="break-words">{country.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-md bg-muted/50">No countries available.</p>
            )}
            {selectedCountryNames.length > 0 && (
              <div className="pt-1.5 text-xs text-muted-foreground">
                Selected: <span className="font-medium">{selectedCountryNames.join(', ')}</span>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground flex items-center"><MapPin className="h-4 w-4 mr-1.5" />Selected Provinces (Optional)</Label>
            <p className="text-xs text-muted-foreground/80 mb-1.5">
              Filters services within selected countries or all provinces.
            </p>
            {isLoadingProvinces ? (
              <div className="flex items-center justify-center h-28 border rounded-md bg-muted/50">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading provinces...</span>
              </div>
            ) : Object.keys(groupedProvinces).length > 0 ? (
              <ScrollArea className="h-28 w-full rounded-md border p-1 bg-background">
                <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedProvinces)}>
                  {Object.entries(groupedProvinces).map(([countryId, { countryName, provinces: provincesInGroup }]) => {
                    if (tripData.settings.selectedCountries.length === 0 || tripData.settings.selectedCountries.includes(countryId)) {
                      return (
                        <AccordionItem value={countryId} key={countryId} className="border-b-0">
                          <AccordionTrigger className="py-1.5 px-2 text-xs hover:bg-muted/50 rounded-sm [&[data-state=open]>svg]:text-primary">
                            <span className="truncate text-muted-foreground hover:text-foreground">{countryName} ({provincesInGroup.length})</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-0 pb-1 pl-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                              {provincesInGroup.map((province) => (
                                <div key={province.id} className="flex items-center space-x-2 py-0.5">
                                  <Checkbox
                                    id={`province-select-${province.id}`}
                                    checked={(tripData.settings.selectedProvinces || []).includes(province.name)}
                                    onCheckedChange={() => handleProvinceToggle(province.name)}
                                    className="h-3.5 w-3.5"
                                  />
                                  <Label htmlFor={`province-select-${province.id}`} className="text-xs font-normal cursor-pointer">
                                    <span className="break-words">{province.name}</span>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    }
                    return null;
                  })}
                </Accordion>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-md bg-muted/50">
                { (tripData.settings.selectedCountries || []).length > 0 ? "No provinces for selected countries." : "No provinces available."}
              </p>
            )}
            {(tripData.settings.selectedProvinces || []).length > 0 && (
              <div className="pt-1.5 text-xs text-muted-foreground">
                Selected: <span className="font-medium">{tripData.settings.selectedProvinces.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-secondary text-muted-foreground">
          <div className="flex flex-col text-xs sm:text-sm sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1">
            <span className="font-semibold text-foreground break-words">Current Config:</span>
            <span className="break-words"><strong className="text-primary">{numNights} Night(s) / {tripData.settings.numDays} Day(s)</strong> starting {displayStartDate}.</span>
            <span className="break-words">For {tripData.pax.adults} Adult(s), {tripData.pax.children} Child(ren).</span>
            <span className="break-words">Billing Currency: {tripData.pax.currency}.</span>
            {tripData.settings.isTemplate ? <Badge variant="outline" className="ml-1.5 border-accent text-accent text-xs self-start sm:self-center">TEMPLATE{tripData.settings.templateCategory ? `: ${tripData.settings.templateCategory}` : ''}</Badge> : ""}
            {selectedCountryNames.length > 0 ? <span className="break-words"> Countries: {selectedCountryNames.join(', ')}.</span> : ""}
            {(tripData.settings.selectedProvinces || []).length > 0 ? <span className="break-words"> Provinces: {tripData.settings.selectedProvinces.join(', ')}.</span> : ""}
            {showCosts && tripData.settings.budget ? <span className="break-words"> Budget: {formatCurrency(tripData.settings.budget, tripData.pax.currency)}.</span> : ""}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const PlannerHeader = React.memo(PlannerHeaderComponent);
