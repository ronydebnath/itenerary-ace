
"use client";

import * as React from 'react';
import type { TripData, TripSettings, PaxDetails, ProvinceItem, CurrencyCode, CountryItem } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Save, Info, CalendarDays, Users, MapPin, Route, Loader2, DollarSign, Globe, FileText, Image as ImageIconLucide, Cog } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useProvinces } from '@/hooks/useProvinces';
import { useCountries } from '@/hooks/useCountries';
import Link from 'next/link';

interface PlannerHeaderProps {
  tripData: TripData;
  onUpdateTripData: (updatedTripData: Partial<TripData>) => void;
  onUpdateSettings: (updatedSettings: Partial<TripSettings>) => void;
  onUpdatePax: (updatedPax: Partial<PaxDetails>) => void;
  onManualSave: () => void;
  onReset: () => void;
  showCosts: boolean;
}

export function PlannerHeader({
  tripData,
  onUpdateTripData,
  onUpdateSettings,
  onUpdatePax,
  onManualSave,
  onReset,
  showCosts
}: PlannerHeaderProps) {
  const { countries: availableCountries, isLoading: isLoadingCountries } = useCountries();
  const { provinces: allAvailableProvinces, isLoading: isLoadingProvinces, getProvincesByCountry } = useProvinces();

  const handleSettingsChange = <K extends keyof TripSettings>(key: K, value: TripSettings[K]) => {
    onUpdateSettings({ [key]: value });
  };

  const handlePaxChange = <K extends keyof PaxDetails>(key: K, value: PaxDetails[K]) => {
    onUpdatePax({ [key]: value });
  };

  const handleCountryToggle = (countryId: string) => {
    const currentSelectedCountries = tripData.settings.selectedCountries || [];
    const newSelectedCountries = currentSelectedCountries.includes(countryId)
      ? currentSelectedCountries.filter(id => id !== countryId)
      : [...currentSelectedCountries, countryId];
    onUpdateSettings({ selectedCountries: newSelectedCountries, selectedProvinces: [] });
  };

  const handleProvinceToggle = (provinceName: string) => {
    const currentSelectedProvinces = tripData.settings.selectedProvinces || [];
    const newSelectedProvinces = currentSelectedProvinces.includes(provinceName)
      ? currentSelectedProvinces.filter(p => p !== provinceName)
      : [...currentSelectedProvinces, provinceName];
    onUpdateSettings({ selectedProvinces: newSelectedProvinces });
  };

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
      return provincesFromSelectedCountries.sort((a,b) => a.name.localeCompare(b.name));
    }
    return allAvailableProvinces.sort((a,b) => a.name.localeCompare(b.name));
  }, [isLoadingProvinces, tripData.settings.selectedCountries, allAvailableProvinces, getProvincesByCountry]);

  const selectedCountryNames = React.useMemo(() => {
    return (tripData.settings.selectedCountries || [])
      .map(id => availableCountries.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];
  }, [tripData.settings.selectedCountries, availableCountries]);

  const groupedProvinces = React.useMemo(() => {
    if (isLoadingProvinces || isLoadingCountries) return {};
    const groups: Record<string, ProvinceItem[]> = {};
    displayableProvinces.forEach(province => {
      const countryKey = province.countryId || 'unknown'; // Handle provinces that might not have a countryId (should not happen with good data)
      if (!groups[countryKey]) {
        groups[countryKey] = [];
      }
      groups[countryKey].push(province);
    });
    // Sort provinces within each group
    for (const countryId in groups) {
      groups[countryId].sort((a, b) => a.name.localeCompare(b.name));
    }
    // Sort country groups by country name
    const sortedGroupEntries = Object.entries(groups).sort(([countryIdA], [countryIdB]) => {
      const countryNameA = availableCountries.find(c => c.id === countryIdA)?.name || 'Unknown Country';
      const countryNameB = availableCountries.find(c => c.id === countryIdB)?.name || 'Unknown Country';
      return countryNameA.localeCompare(countryNameB);
    });
    return Object.fromEntries(sortedGroupEntries);
  }, [displayableProvinces, isLoadingProvinces, isLoadingCountries, availableCountries]);

  const numNights = Math.max(0, tripData.settings.numDays - 1);

  return (
    <Card className="mb-4 md:mb-6 shadow-xl no-print">
      <CardHeader className="bg-primary/10 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-headline text-primary flex items-center">
              <Route className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Itinerary Ace Planner
            </CardTitle>
            <CardDescription className="text-foreground/70 pt-1 text-xs sm:text-sm">
              Plan and calculate costs. Changes to core settings update the itinerary.
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap mt-2 sm:mt-0 self-start sm:self-auto">
            <Link href="/image-describer">
              <Button variant="outline" size="sm" className="bg-card hover:bg-muted shadow-sm text-xs sm:text-sm">
                <ImageIconLucide className="mr-1.5 h-3.5 w-3.5" />
                Describe Image
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-card hover:bg-muted shadow-sm text-xs sm:text-sm">
                <Cog className="mr-1.5 h-3.5 w-3.5" />
                Admin Dashboard
              </Button>
            </Link>
             <Button onClick={onManualSave} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs sm:text-sm">
              <Save className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Save Itinerary
            </Button>
            <Button variant="outline" onClick={onReset} size="sm" className="border-accent text-accent hover:bg-accent/10 text-xs sm:text-sm">
              <Edit3 className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> New/Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4 md:pt-6 space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div>
            <Label htmlFor="itineraryName" className="text-xs font-medium text-muted-foreground">Itinerary Name</Label>
            <Input
              id="itineraryName"
              value={tripData.itineraryName || ''}
              onChange={(e) => onUpdateTripData({ itineraryName: e.target.value })}
              placeholder="Enter itinerary name"
              className="text-sm sm:text-base font-semibold h-9 bg-background/70 mt-1"
            />
             {tripData.id ? (
              <p className="text-xs text-muted-foreground mt-1">
                ID: <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{tripData.id}</span>
              </p>
             ) : (
                <p className="text-xs text-red-500 font-bold mt-1">ID not available!</p>
             )}
          </div>
          <div>
            <Label htmlFor="clientName" className="text-xs font-medium text-muted-foreground">Client Name (Optional)</Label>
            <Input
              id="clientName"
              value={tripData.clientName || ''}
              onChange={(e) => onUpdateTripData({ clientName: e.target.value })}
              placeholder="Enter client name"
              className="text-sm sm:text-base h-9 bg-background/70 mt-1"
            />
          </div>
        </div>

        <div className="border-t pt-3 md:pt-4 mt-3 md:mt-4">
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
                />
                <Label htmlFor="isTemplate" className="text-xs sm:text-sm font-normal cursor-pointer flex items-center">
                <FileText className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" /> Mark as Itinerary Template
                </Label>
            </div>

            {tripData.settings.isTemplate && (
            <div className="mt-2 sm:mt-3 ml-6">
                <Label htmlFor="templateCategory" className="text-xs font-medium text-muted-foreground">Template Category (Optional)</Label>
                <Input
                id="templateCategory"
                value={tripData.settings.templateCategory || ''}
                onChange={(e) => onUpdateSettings({ templateCategory: e.target.value || undefined })}
                placeholder="e.g., Beach Holiday, Cultural Tour"
                className="text-xs sm:text-sm h-9 mt-1 bg-background/70"
                />
            </div>
            )}
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 items-end border-t pt-3 md:pt-4 mt-3 md:mt-4">
          <div>
            <Label htmlFor="startDate" className="text-xs font-medium text-muted-foreground flex items-center"><CalendarDays className="h-3 w-3 mr-1"/>Start Date</Label>
            <DatePicker
              date={startDateForPicker}
              onDateChange={(date) => handleSettingsChange('startDate', date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0])}
            />
          </div>
          <div>
            <Label htmlFor="numDays" className="text-xs font-medium text-muted-foreground">Days</Label>
            <Input id="numDays" type="number" value={tripData.settings.numDays} onChange={(e) => handleSettingsChange('numDays', parseInt(e.target.value, 10) || 1)} min="1" className="text-sm sm:text-base h-9 mt-1"/>
          </div>
          <div>
            <Label htmlFor="globalAdults" className="text-xs font-medium text-muted-foreground flex items-center"><Users className="h-3 w-3 mr-1"/>Adults</Label>
            <Input id="globalAdults" type="number" value={tripData.pax.adults} onChange={(e) => handlePaxChange('adults', parseInt(e.target.value, 10) || 0)} min="0" className="text-sm sm:text-base h-9 mt-1"/>
          </div>
          <div>
            <Label htmlFor="globalChildren" className="text-xs font-medium text-muted-foreground">Children</Label>
            <Input id="globalChildren" type="number" value={tripData.pax.children} onChange={(e) => handlePaxChange('children', parseInt(e.target.value, 10) || 0)} min="0" className="text-sm sm:text-base h-9 mt-1"/>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-end">
            <div>
                <Label htmlFor="currency" className="text-xs font-medium text-muted-foreground flex items-center"><Globe className="h-3 w-3 mr-1"/>Currency</Label>
                <Select value={tripData.pax.currency} onValueChange={(value) => handlePaxChange('currency', value as CurrencyCode)}>
                <SelectTrigger id="currency" className="w-full text-sm sm:text-base h-9 mt-1">
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
                <Label htmlFor="budget" className="text-xs font-medium text-muted-foreground flex items-center"><DollarSign className="h-3 w-3 mr-1"/>Budget (Optional)</Label>
                <Input id="budget" type="number" value={tripData.settings.budget || ''} onChange={(e) => handleSettingsChange('budget', e.target.value ? parseFloat(e.target.value) : undefined)} min="0" placeholder="e.g., 1000" className="text-sm sm:text-base h-9 mt-1"/>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 border-t pt-3 md:pt-4 mt-3 md:mt-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground flex items-center"><Globe className="h-3 w-3 mr-1"/>Selected Countries (Optional)</Label>
            <p className="text-xs text-muted-foreground/80 mb-1">
              Filters available provinces and services.
            </p>
            {isLoadingCountries ? (
              <div className="flex items-center justify-center h-24 border rounded-md bg-muted/50">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-xs sm:text-sm text-muted-foreground">Loading countries...</span>
              </div>
            ) : availableCountries.length > 0 ? (
              <ScrollArea className="h-24 md:h-28 w-full rounded-md border p-2 sm:p-3 bg-background/70">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-1.5">
                  {availableCountries.map((country) => (
                    <div key={country.id} className="flex items-center space-x-1.5 sm:space-x-2">
                      <Checkbox
                        id={`country-select-${country.id}`}
                        checked={(tripData.settings.selectedCountries || []).includes(country.id)}
                        onCheckedChange={() => handleCountryToggle(country.id)}
                        className="h-3.5 w-3.5"
                      />
                      <Label htmlFor={`country-select-${country.id}`} className="text-xs font-normal cursor-pointer">
                        {country.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
               <p className="text-xs text-muted-foreground text-center py-3 border rounded-md bg-muted/50">No countries available.</p>
            )}
             {selectedCountryNames.length > 0 && (
                <div className="pt-1 text-xs text-muted-foreground">
                  Selected: {selectedCountryNames.join(', ')}
                </div>
              )}
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1"/>Selected Provinces (Optional)</Label>
            <p className="text-xs text-muted-foreground/80 mb-1">
              Filters services within selected countries or all provinces.
            </p>
            {isLoadingProvinces ? (
              <div className="flex items-center justify-center h-24 border rounded-md bg-muted/50">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-xs sm:text-sm text-muted-foreground">Loading provinces...</span>
              </div>
            ) : Object.keys(groupedProvinces).length > 0 ? (
              <ScrollArea className="h-24 md:h-28 w-full rounded-md border p-2 sm:p-3 bg-background/70">
                {Object.entries(groupedProvinces).map(([countryId, provincesInGroup]) => {
                  const country = availableCountries.find(c => c.id === countryId);
                  // Only render the country group if it's relevant (either no global countries selected, or this country is selected)
                  if (!tripData.settings.selectedCountries || tripData.settings.selectedCountries.length === 0 || tripData.settings.selectedCountries.includes(countryId)) {
                    return (
                      <div key={countryId} className="mb-2">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                          {country?.name || "Other Provinces"}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 pl-2">
                          {provincesInGroup.map((province) => (
                            <div key={province.id} className="flex items-center space-x-1.5 sm:space-x-2">
                              <Checkbox
                                id={`province-select-${province.id}`}
                                checked={(tripData.settings.selectedProvinces || []).includes(province.name)}
                                onCheckedChange={() => handleProvinceToggle(province.name)}
                                className="h-3.5 w-3.5"
                              />
                              <Label htmlFor={`province-select-${province.id}`} className="text-xs font-normal cursor-pointer">
                                {province.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </ScrollArea>
            ) : (
               <p className="text-xs text-muted-foreground text-center py-3 border rounded-md bg-muted/50">
                 { (tripData.settings.selectedCountries || []).length > 0 ? "No provinces for selected countries." : "No provinces available."}
               </p>
            )}
            {(tripData.settings.selectedProvinces || []).length > 0 && (
                <div className="pt-1 text-xs text-muted-foreground">
                  Selected: {tripData.settings.selectedProvinces.join(', ')}
                </div>
              )}
          </div>
        </div>

        <div className="mt-3 md:mt-4 p-3 bg-secondary/20 rounded-lg border border-secondary/30 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground text-sm">Current Config:</span> <strong className="text-sm font-semibold text-primary">{numNights} Night(s) / {tripData.settings.numDays} Day(s)</strong> starting {displayStartDate}.
              For {tripData.pax.adults} Adult(s), {tripData.pax.children} Child(ren). Currency: {tripData.pax.currency}.
              {tripData.settings.isTemplate ? <Badge variant="outline" className="ml-1 border-accent text-accent text-xs">TEMPLATE{tripData.settings.templateCategory ? `: ${tripData.settings.templateCategory}` : ''}</Badge> : ""}
              {selectedCountryNames.length > 0 ? ` Countries: ${selectedCountryNames.join(', ')}.` : " All countries."}
              {(tripData.settings.selectedProvinces || []).length > 0 ? ` Provinces: ${tripData.settings.selectedProvinces.join(', ')}.` : (selectedCountryNames.length > 0 ? " All provinces in selected countries." : " All provinces.")}
              {showCosts && tripData.settings.budget ? ` Budget: ${formatCurrency(tripData.settings.budget, tripData.pax.currency)}.` : ""}
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
