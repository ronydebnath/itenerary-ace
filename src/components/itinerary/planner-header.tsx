
"use client";

import * as React from 'react';
import type { TripData, TripSettings, PaxDetails, ProvinceItem, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Save, Info, CalendarDays, Users, MapPin, Route, Loader2, DollarSign, Globe, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useProvinces } from '@/hooks/useProvinces';

interface PlannerHeaderProps {
  tripData: TripData;
  onUpdateTripData: (updatedTripData: Partial<TripData>) => void; // For itineraryName, clientName
  onUpdateSettings: (updatedSettings: Partial<TripSettings>) => void;
  onUpdatePax: (updatedPax: Partial<PaxDetails>) => void;
  onManualSave: () => void;
  onReset: () => void; // This is for "Start New Itinerary"
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
  const { provinces: availableProvinces, isLoading: isLoadingProvinces } = useProvinces();

  const handleSettingsChange = <K extends keyof TripSettings>(key: K, value: TripSettings[K]) => {
    onUpdateSettings({ [key]: value });
  };

  const handlePaxChange = <K extends keyof PaxDetails>(key: K, value: PaxDetails[K]) => {
    onUpdatePax({ [key]: value });
  };

  const handleProvinceToggle = (provinceName: string) => {
    const currentSelected = tripData.settings.selectedProvinces || [];
    const newSelected = currentSelected.includes(provinceName)
      ? currentSelected.filter(p => p !== provinceName)
      : [...currentSelected, provinceName];
    onUpdateSettings({ selectedProvinces: newSelected });
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


  return (
    <Card className="mb-6 shadow-xl no-print">
      <CardHeader className="bg-primary/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <CardTitle className="text-3xl font-headline text-primary">Itinerary Ace Planner</CardTitle>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={onManualSave} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Save className="mr-2 h-4 w-4" /> Save Itinerary
            </Button>
            <Button variant="outline" onClick={onReset} size="sm" className="border-accent text-accent hover:bg-accent/10">
              <Edit3 className="mr-2 h-4 w-4" /> Start New Itinerary
            </Button>
          </div>
        </div>
        <CardDescription className="text-foreground/70 pt-2">
          Dynamically plan and calculate costs. Changes to core settings (dates, pax, provinces) will update the itinerary.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itineraryName" className="text-xs font-medium text-muted-foreground">Itinerary Name</Label>
            <Input
              id="itineraryName"
              value={tripData.itineraryName || ''}
              onChange={(e) => onUpdateTripData({ itineraryName: e.target.value })}
              placeholder="Enter itinerary name"
              className="text-base font-semibold h-9 bg-background/70 mt-1"
            />
             {tripData.id ? (
              <p className="text-xs text-muted-foreground mt-1">
                ID: <span className="font-mono bg-muted px-1 py-0.5 rounded">{tripData.id}</span>
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
              className="text-base h-9 bg-background/70 mt-1"
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
                />
                <Label htmlFor="isTemplate" className="text-sm font-normal cursor-pointer flex items-center">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> Mark as Itinerary Template
                </Label>
            </div>

            {tripData.settings.isTemplate && (
            <div className="mt-3 ml-6">
                <Label htmlFor="templateCategory" className="text-xs font-medium text-muted-foreground">Template Category (Optional)</Label>
                <Input
                id="templateCategory"
                value={tripData.settings.templateCategory || ''}
                onChange={(e) => onUpdateSettings({ templateCategory: e.target.value || undefined })}
                placeholder="e.g., Beach Holiday, Cultural Tour"
                className="text-sm h-9 mt-1 bg-background/70"
                />
            </div>
            )}
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end border-t pt-4 mt-4">
          <div>
            <Label htmlFor="startDate" className="text-xs font-medium text-muted-foreground flex items-center"><CalendarDays className="h-3 w-3 mr-1"/>Start Date</Label>
            <DatePicker
              date={startDateForPicker}
              onDateChange={(date) => handleSettingsChange('startDate', date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0])}
            />
          </div>
          <div>
            <Label htmlFor="numDays" className="text-xs font-medium text-muted-foreground">Number of Days</Label>
            <Input id="numDays" type="number" value={tripData.settings.numDays} onChange={(e) => handleSettingsChange('numDays', parseInt(e.target.value, 10) || 1)} min="1" className="text-base h-9 mt-1"/>
          </div>
          <div>
            <Label htmlFor="globalAdults" className="text-xs font-medium text-muted-foreground flex items-center"><Users className="h-3 w-3 mr-1"/>Adults</Label>
            <Input id="globalAdults" type="number" value={tripData.pax.adults} onChange={(e) => handlePaxChange('adults', parseInt(e.target.value, 10) || 0)} min="0" className="text-base h-9 mt-1"/>
          </div>
          <div>
            <Label htmlFor="globalChildren" className="text-xs font-medium text-muted-foreground">Children</Label>
            <Input id="globalChildren" type="number" value={tripData.pax.children} onChange={(e) => handlePaxChange('children', parseInt(e.target.value, 10) || 0)} min="0" className="text-base h-9 mt-1"/>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
                <Label htmlFor="currency" className="text-xs font-medium text-muted-foreground flex items-center"><Globe className="h-3 w-3 mr-1"/>Currency</Label>
                <Select value={tripData.pax.currency} onValueChange={(value) => handlePaxChange('currency', value as CurrencyCode)}>
                <SelectTrigger id="currency" className="w-full text-base h-9 mt-1">
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
                <Input id="budget" type="number" value={tripData.settings.budget || ''} onChange={(e) => handleSettingsChange('budget', e.target.value ? parseFloat(e.target.value) : undefined)} min="0" placeholder="e.g., 1000" className="text-base h-9 mt-1"/>
            </div>
        </div>

        <div>
          <Label className="text-xs font-medium text-muted-foreground flex items-center"><MapPin className="h-3 w-3 mr-1"/>Selected Provinces (Optional)</Label>
          <p className="text-xs text-muted-foreground/80 mb-1">
            Filters available services. If none selected, all services are considered.
          </p>
          {isLoadingProvinces ? (
            <div className="flex items-center justify-center h-24 border rounded-md bg-muted/50">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading provinces...</span>
            </div>
          ) : availableProvinces.length > 0 ? (
            <ScrollArea className="h-28 w-full rounded-md border p-3 bg-background/70">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1.5">
                {availableProvinces.map((province) => (
                  <div key={province.id} className="flex items-center space-x-2">
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
            </ScrollArea>
          ) : (
             <p className="text-xs text-muted-foreground text-center py-3 border rounded-md bg-muted/50">No provinces available.</p>
          )}
           {(tripData.settings.selectedProvinces || []).length > 0 && (
              <div className="pt-1 text-xs text-muted-foreground">
                Selected: {tripData.settings.selectedProvinces.join(', ')}
              </div>
            )}
        </div>
        
        <div className="mt-4 p-3 bg-secondary/20 rounded-lg border border-secondary/30 text-xs text-muted-foreground">
            <div> {/* Changed from <p> to <div> */}
              <strong className="text-foreground">Current Config:</strong> {tripData.settings.numDays} Days starting {displayStartDate}. For {tripData.pax.adults} Adult(s), {tripData.pax.children} Child(ren). Currency: {tripData.pax.currency}.
              {tripData.settings.isTemplate ? <Badge variant="outline" className="ml-1 border-accent text-accent">TEMPLATE{tripData.settings.templateCategory ? `: ${tripData.settings.templateCategory}` : ''}</Badge> : ""}
              {tripData.settings.selectedProvinces.length > 0 ? ` Provinces: ${tripData.settings.selectedProvinces.join(', ')}.` : " All provinces."}
              {showCosts && tripData.settings.budget ? ` Budget: ${formatCurrency(tripData.settings.budget, tripData.pax.currency)}.` : ""}
            </div>
        </div>

      </CardContent>
    </Card>
  );
}

