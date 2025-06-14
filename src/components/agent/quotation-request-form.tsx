/**
 * @fileoverview This component provides a comprehensive form for travel agents to submit
 * new quotation requests. It captures client information, detailed trip preferences
 * (destinations, dates, duration, type, budget), accommodation choices, activity interests,
 * and flight requirements. The form utilizes Zod for validation and is designed to collect
 * all necessary data for an admin to prepare a travel proposal.
 *
 * @bangla এই কম্পোনেন্টটি ট্রাভেল এজেন্টদের নতুন উদ্ধৃতি অনুরোধ জমা দেওয়ার জন্য একটি
 * ব্যাপক ফর্ম সরবরাহ করে। এটি ক্লায়েন্টের তথ্য, বিস্তারিত ভ্রমণ পছন্দ (গন্তব্য, তারিখ,
 * সময়কাল, প্রকার, বাজেট), আবাসনের পছন্দ, কার্যকলাপের আগ্রহ এবং ফ্লাইটের প্রয়োজনীয়তা
 * ক্যাপচার করে। ফর্মটি বৈধতা যাচাইয়ের জন্য Zod ব্যবহার করে এবং একটি অ্যাডমিনকে ভ্রমণের
 * প্রস্তাবনা প্রস্তুত করার জন্য সমস্ত প্রয়োজনীয় ডেটা সংগ্রহ করার জন্য ডিজাইন করা হয়েছে।
 */
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import {
  QuotationRequestSchema,
  type QuotationRequest,
  TRIP_TYPES,
  BUDGET_RANGES,
  HOTEL_STAR_RATINGS,
} from '@/types/quotation';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CURRENCIES, type CurrencyCode, type CountryItem, type ProvinceItem } from '@/types/itinerary';
import { parseISO, format, differenceInDays, isValid } from 'date-fns';
import { Loader2, MapPin, Globe } from 'lucide-react';
import { useCountries } from '@/hooks/useCountries';
import { useProvinces } from '@/hooks/useProvinces';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface QuotationRequestFormProps {
  onSubmit: (data: QuotationRequest) => void;
  onCancel: () => void;
  defaultAgentId?: string;
}

export function QuotationRequestForm({ onSubmit, onCancel, defaultAgentId }: QuotationRequestFormProps) {
  const { countries, isLoading: isLoadingCountries, getCountryById } = useCountries();
  const { provinces: allProvinces, isLoading: isLoadingProvinces, getProvincesByCountry } = useProvinces();

  const form = useForm<QuotationRequest>({
    resolver: zodResolver(QuotationRequestSchema),
    defaultValues: {
      agentId: defaultAgentId,
      clientInfo: {
        adults: 1,
        children: 0,
        clientReference: "",
        childAges: "",
        groupOrFamilyName: "",
      },
      tripDetails: {
        budgetCurrency: 'USD',
        preferredCountryIds: [],
        preferredProvinceNames: [],
      },
      accommodationPrefs: {
        hotelStarRating: "Any",
        roomPreferences: "",
        specificHotelRequests: "",
      },
      activityPrefs: {
        interests: "",
        mustDoActivities: "",
      },
      flightPrefs: {
        includeFlights: "To be discussed",
        airportTransfersRequired: false,
        departureCity: "",
        preferredAirlineClass: "",
      },
      otherRequirements: "",
      status: "Pending",
      requestDate: new Date().toISOString(),
      quotationDeadline: undefined,
    },
  });

  const watchStartDate = form.watch("tripDetails.preferredStartDate");
  const watchEndDate = form.watch("tripDetails.preferredEndDate");
  const watchChildren = form.watch("clientInfo.children");
  const watchBudgetRange = form.watch("tripDetails.budgetRange");
  const watchSelectedCountryIds = form.watch("tripDetails.preferredCountryIds");
  const durationDays = form.watch("tripDetails.durationDays");
  const durationNights = form.watch("tripDetails.durationNights");


  React.useEffect(() => {
    if (watchStartDate && watchEndDate) {
      try {
        const start = parseISO(watchStartDate);
        const end = parseISO(watchEndDate);
        if (isValid(start) && isValid(end) && end >= start) {
          const nights = differenceInDays(end, start);
          const days = nights + 1;
          form.setValue("tripDetails.durationNights", nights, { shouldValidate: true });
          form.setValue("tripDetails.durationDays", days, { shouldValidate: true });
        } else {
          form.setValue("tripDetails.durationNights", undefined, { shouldValidate: true });
          form.setValue("tripDetails.durationDays", undefined, { shouldValidate: true });
        }
      } catch (e) {
        form.setValue("tripDetails.durationNights", undefined, { shouldValidate: true });
        form.setValue("tripDetails.durationDays", undefined, { shouldValidate: true });
      }
    } else {
        form.setValue("tripDetails.durationNights", undefined, { shouldValidate: true });
        form.setValue("tripDetails.durationDays", undefined, { shouldValidate: true });
    }
  }, [watchStartDate, watchEndDate, form]);

  const displayableProvinces = React.useMemo(() => {
    if (isLoadingProvinces) return [];
    if (!watchSelectedCountryIds || watchSelectedCountryIds.length === 0) {
      return allProvinces.sort((a,b) => a.name.localeCompare(b.name));
    }
    let provincesFromSelectedCountries: ProvinceItem[] = [];
    watchSelectedCountryIds.forEach(countryId => {
      provincesFromSelectedCountries = provincesFromSelectedCountries.concat(getProvincesByCountry(countryId));
    });
    return provincesFromSelectedCountries.sort((a,b) => a.name.localeCompare(b.name));
  }, [isLoadingProvinces, watchSelectedCountryIds, allProvinces, getProvincesByCountry]);


  const selectedCountryNames = React.useMemo(() => {
    return (watchSelectedCountryIds || [])
      .map(id => countries.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];
  }, [watchSelectedCountryIds, countries]);

  const groupedProvinces = React.useMemo(() => {
    if (isLoadingProvinces || isLoadingCountries) return {};
    const groups: Record<string, { countryName: string; provinces: ProvinceItem[] }> = {};
    
    displayableProvinces.forEach(province => {
      const country = countries.find(c => c.id === province.countryId);
      const countryKey = province.countryId || 'unknown';
      const countryName = country?.name || 'Unknown Country';

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
  }, [displayableProvinces, isLoadingProvinces, isLoadingCountries, countries]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[calc(100vh-280px)] pr-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>Details about the group requesting the quotation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <FormField control={form.control} name="clientInfo.clientReference" render={({ field }) => (<FormItem><FormLabel>Client Reference (For your records - Optional)</FormLabel><FormControl><Input placeholder="e.g., Smith Family Summer Trip, Mr. J Q1" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="clientInfo.adults" render={({ field }) => (<FormItem><FormLabel>Adults *</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="clientInfo.children" render={({ field }) => (<FormItem><FormLabel>Children</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="clientInfo.childAges" render={({ field }) => (<FormItem><FormLabel>Child Ages {watchChildren > 0 && "*"}</FormLabel><FormControl><Input placeholder="e.g., 5, 8, 12" {...field} value={field.value || ''} disabled={!(watchChildren > 0)} /></FormControl><FormDescription className="text-xs">Comma-separated if multiple.</FormDescription><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="clientInfo.groupOrFamilyName" render={({ field }) => (<FormItem><FormLabel>Group/Family Name (Optional)</FormLabel><FormControl><Input placeholder="e.g., The Adventure Seekers" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <FormField
                    control={form.control}
                    name="tripDetails.preferredCountryIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 flex items-center mb-1"><Globe className="h-4 w-4 mr-2 text-primary"/>Preferred Countries *</FormLabel>
                        {isLoadingCountries ? (
                          <div className="flex items-center justify-center h-24 border rounded-md bg-muted/50">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="ml-2 text-xs sm:text-sm text-muted-foreground">Loading countries...</span>
                          </div>
                        ) : countries.length > 0 ? (
                          <ScrollArea className="h-28 w-full rounded-md border p-3 bg-background">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
                              {countries.map((country) => (
                                <FormField
                                  key={country.id}
                                  control={form.control}
                                  name="tripDetails.preferredCountryIds"
                                  render={({ field: countryField }) => (
                                    <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={countryField.value?.includes(country.id)}
                                          onCheckedChange={(checked) => {
                                            const newValue = checked
                                              ? [...(countryField.value || []), country.id]
                                              : (countryField.value || []).filter((id) => id !== country.id);
                                            countryField.onChange(newValue);
                                            const currentProvinces = form.getValues("tripDetails.preferredProvinceNames") || [];
                                            const validProvincesForNewCountries = currentProvinces.filter(provName => 
                                                allProvinces.find(p => p.name === provName && newValue.includes(p.countryId))
                                            );
                                            form.setValue("tripDetails.preferredProvinceNames", validProvincesForNewCountries);
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">{country.name}</FormLabel>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                           <p className="text-sm text-muted-foreground text-center py-4 border rounded-md bg-muted/50">No countries available for selection.</p>
                        )}
                        {selectedCountryNames.length > 0 && (<div className="pt-1 text-xs text-muted-foreground">Selected Countries: {selectedCountryNames.join(', ')}</div>)}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                 <FormField
                    control={form.control}
                    name="tripDetails.preferredProvinceNames"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80 flex items-center mb-1"><MapPin className="h-4 w-4 mr-2 text-primary"/>Preferred Provinces (Optional)</FormLabel>
                         <FormDescription className="text-xs mb-1">
                           {(!watchSelectedCountryIds || watchSelectedCountryIds.length === 0) ? "Select countries first to see relevant provinces, or choose from all." : "Provinces within selected countries."}
                         </FormDescription>
                        {isLoadingProvinces || isLoadingCountries ? (
                          <div className="flex items-center justify-center h-36 border rounded-md bg-muted/50">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="ml-2 text-xs sm:text-sm text-muted-foreground">Loading provinces...</span>
                          </div>
                        ) : Object.keys(groupedProvinces).length > 0 ? (
                          <ScrollArea className="h-36 w-full rounded-md border p-1 bg-background">
                            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedProvinces)}>
                              {Object.entries(groupedProvinces).map(([countryId, { countryName, provinces: provincesInGroup }]) => (
                                <AccordionItem value={countryId} key={countryId} className="border-b-0">
                                  <AccordionTrigger className="py-1.5 px-2 text-xs hover:bg-muted/50 rounded-sm sticky top-0 bg-background z-10">
                                    {countryName} ({provincesInGroup.length})
                                  </AccordionTrigger>
                                  <AccordionContent className="pt-0 pb-1 pl-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                                      {provincesInGroup.map((province) => (
                                        <FormField
                                          key={province.id}
                                          control={form.control}
                                          name="tripDetails.preferredProvinceNames"
                                          render={({ field: provinceField }) => (
                                            <FormItem className="flex flex-row items-start space-x-2 space-y-0 py-0.5">
                                              <FormControl>
                                                <Checkbox
                                                  checked={provinceField.value?.includes(province.name)}
                                                  onCheckedChange={(checked) => {
                                                    return checked
                                                      ? provinceField.onChange([...(provinceField.value || []), province.name])
                                                      : provinceField.onChange(
                                                        (provinceField.value || []).filter(
                                                            (value) => value !== province.name
                                                          )
                                                        )
                                                  }}
                                                />
                                              </FormControl>
                                              <FormLabel className="font-normal text-xs cursor-pointer">{province.name}</FormLabel>
                                            </FormItem>
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          </ScrollArea>
                        ) : (
                           <p className="text-sm text-muted-foreground text-center py-4 border rounded-md bg-muted/50">
                            {(!watchSelectedCountryIds || watchSelectedCountryIds.length === 0) ? "No provinces available (select countries or add provinces in admin)." : "No provinces in selected countries."}
                           </p>
                        )}
                        {(form.getValues("tripDetails.preferredProvinceNames") || []).length > 0 && (<div className="pt-1 text-xs text-muted-foreground">Selected Provinces: {form.getValues("tripDetails.preferredProvinceNames")!.join(', ')}</div>)}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="tripDetails.preferredStartDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Preferred Start Date</FormLabel><Controller control={form.control} name="tripDetails.preferredStartDate" render={({ field: { onChange, value } }) => <DatePicker date={value ? parseISO(value) : undefined} onDateChange={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : undefined)} placeholder="Select start date"/>} /><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="tripDetails.preferredEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Preferred End Date</FormLabel><Controller control={form.control} name="tripDetails.preferredEndDate" render={({ field: { onChange, value } }) => <DatePicker date={value ? parseISO(value) : undefined} onDateChange={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : undefined)} placeholder="Select end date" minDate={watchStartDate ? parseISO(watchStartDate) : undefined} />} /><FormMessage /></FormItem>)} />
                </div>
                <p className="text-sm text-muted-foreground pt-2">
                  {typeof durationNights === 'number' && typeof durationDays === 'number'
                    ? `Duration: ${durationNights} night(s) / ${durationDays} day(s)`
                    : 'Duration: Auto-calculated based on dates'}
                </p>
                 <FormField control={form.control} name="tripDetails.tripType" render={({ field }) => (<FormItem><FormLabel>Type of Trip</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select trip type" /></SelectTrigger></FormControl><SelectContent>{TRIP_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="tripDetails.budgetRange" render={({ field }) => (<FormItem><FormLabel>Budget Expectation</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select budget range" /></SelectTrigger></FormControl><SelectContent>{BUDGET_RANGES.map(range => <SelectItem key={range} value={range}>{range}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                {watchBudgetRange === "Specific Amount (see notes)" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <FormField control={form.control} name="tripDetails.budgetAmount" render={({ field }) => (<FormItem><FormLabel>Specific Budget Amount *</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="tripDetails.budgetCurrency" render={({ field }) => (<FormItem><FormLabel>Currency for Budget</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Accommodation Preferences (Optional)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="accommodationPrefs.hotelStarRating" render={({ field }) => (<FormItem><FormLabel>Preferred Hotel Star Rating</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Any star rating" /></SelectTrigger></FormControl><SelectContent>{HOTEL_STAR_RATINGS.map(rating => <SelectItem key={rating} value={rating}>{rating}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="accommodationPrefs.roomPreferences" render={({ field }) => (<FormItem><FormLabel>Room Preferences</FormLabel><FormControl><Textarea placeholder="e.g., 1 King Bed, 2 Twin Beds + 1 Extra Bed, Connecting rooms, Ocean view" {...field} value={field.value || ''} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="accommodationPrefs.specificHotelRequests" render={({ field }) => (<FormItem><FormLabel>Specific Hotel Names or Location Preferences</FormLabel><FormControl><Textarea placeholder="e.g., 'Near Eiffel Tower', 'XYZ Resort', 'Quiet area'" {...field} value={field.value || ''} rows={2} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Activity & Tour Preferences (Optional)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="activityPrefs.interests" render={({ field }) => (<FormItem><FormLabel>Client Interests</FormLabel><FormControl><Textarea placeholder="e.g., History, Beaches, Hiking, Shopping, Nightlife, Local Cuisine" {...field} value={field.value || ''} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="activityPrefs.mustDoActivities" render={({ field }) => (<FormItem><FormLabel>Must-do Activities or Sights</FormLabel><FormControl><Textarea placeholder="e.g., 'Visit the Colosseum', 'Snorkeling trip', 'Cooking class'" {...field} value={field.value || ''} rows={3} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Flight & Transfer Preferences (Optional)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="flightPrefs.includeFlights" render={({ field }) => (<FormItem><FormLabel>Include Flights in Quotation?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{["To be discussed", "Yes", "No"].map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                {form.watch("flightPrefs.includeFlights") === "Yes" && (
                  <>
                    <FormField control={form.control} name="flightPrefs.departureCity" render={({ field }) => (<FormItem><FormLabel>Departure City/Airport</FormLabel><FormControl><Input placeholder="e.g., London Heathrow (LHR)" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="flightPrefs.preferredAirlineClass" render={({ field }) => (<FormItem><FormLabel>Preferred Airline/Class</FormLabel><FormControl><Input placeholder="e.g., Economy, Business, Any Major Carrier" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                  </>
                )}
                <FormField control={form.control} name="flightPrefs.airportTransfersRequired" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Airport Transfers Required?</FormLabel><FormDescription>Include transfers to/from airports.</FormDescription></div><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Other Requirements</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="otherRequirements" render={({ field }) => (<FormItem><FormLabel>Special Requests or Notes</FormLabel><FormControl><Textarea placeholder="e.g., Dietary restrictions (vegetarian, gluten-free), accessibility needs, celebrating an anniversary, prefer non-smoking rooms, etc." {...field} value={field.value || ''} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="quotationDeadline" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Preferred Quotation Deadline (Optional)</FormLabel><Controller control={form.control} name="quotationDeadline" render={({ field: { onChange, value } }) => <DatePicker date={value ? parseISO(value) : undefined} onDateChange={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : undefined)} placeholder="Select deadline"/>} /><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        <Separator className="my-6" />
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>Cancel</Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting || isLoadingCountries || isLoadingProvinces}>
            {(form.formState.isSubmitting || isLoadingCountries || isLoadingProvinces) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Quotation Request
          </Button>
        </div>
      </form>
    </Form>
  );
}
