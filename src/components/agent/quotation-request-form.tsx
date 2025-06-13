
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
import { CURRENCIES, type CurrencyCode } from '@/types/itinerary';
import { parseISO, format, differenceInDays, isValid } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface QuotationRequestFormProps {
  onSubmit: (data: QuotationRequest) => void;
  onCancel: () => void;
  defaultAgentId?: string;
}

export function QuotationRequestForm({ onSubmit, onCancel, defaultAgentId }: QuotationRequestFormProps) {
  const form = useForm<QuotationRequest>({
    resolver: zodResolver(QuotationRequestSchema),
    defaultValues: {
      agentId: defaultAgentId,
      clientInfo: { adults: 1, children: 0 },
      tripDetails: { budgetCurrency: 'USD' },
      flightPrefs: { includeFlights: "To be discussed", airportTransfersRequired: false },
      status: "Pending",
      requestDate: new Date().toISOString(),
    },
  });

  const watchStartDate = form.watch("tripDetails.preferredStartDate");
  const watchEndDate = form.watch("tripDetails.preferredEndDate");
  const watchChildren = form.watch("clientInfo.children");
  const watchBudgetRange = form.watch("tripDetails.budgetRange");

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
          form.setValue("tripDetails.durationNights", undefined);
          form.setValue("tripDetails.durationDays", undefined);
        }
      } catch (e) {
        form.setValue("tripDetails.durationNights", undefined);
        form.setValue("tripDetails.durationDays", undefined);
      }
    }
  }, [watchStartDate, watchEndDate, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="h-[calc(100vh-280px)] pr-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>Details about the person or group requesting the quotation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="clientInfo.name" render={({ field }) => (<FormItem><FormLabel>Client Full Name *</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="clientInfo.email" render={({ field }) => (<FormItem><FormLabel>Client Email *</FormLabel><FormControl><Input type="email" placeholder="client@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="clientInfo.phone" render={({ field }) => (<FormItem><FormLabel>Client Phone (Optional)</FormLabel><FormControl><Input type="tel" placeholder="+1 555 123 4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="clientInfo.adults" render={({ field }) => (<FormItem><FormLabel>Adults *</FormLabel><FormControl><Input type="number" min="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="clientInfo.children" render={({ field }) => (<FormItem><FormLabel>Children</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="clientInfo.childAges" render={({ field }) => (<FormItem><FormLabel>Child Ages {watchChildren > 0 && "*"}</FormLabel><FormControl><Input placeholder="e.g., 5, 8, 12" {...field} disabled={!(watchChildren > 0)} /></FormControl><FormDescription className="text-xs">Comma-separated if multiple.</FormDescription><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="clientInfo.groupOrFamilyName" render={({ field }) => (<FormItem><FormLabel>Group/Family Name (Optional)</FormLabel><FormControl><Input placeholder="e.g., The Smith Family" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="tripDetails.destinations" render={({ field }) => (<FormItem><FormLabel>Destination(s) *</FormLabel><FormControl><Textarea placeholder="e.g., Paris, France; Bangkok & Phuket, Thailand; Italy (Rome, Florence, Venice)" {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="tripDetails.preferredStartDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Preferred Start Date</FormLabel><Controller control={form.control} name="tripDetails.preferredStartDate" render={({ field: { onChange, value } }) => <DatePicker date={value ? parseISO(value) : undefined} onDateChange={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : undefined)} placeholder="Select start date"/>} /><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="tripDetails.preferredEndDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Preferred End Date</FormLabel><Controller control={form.control} name="tripDetails.preferredEndDate" render={({ field: { onChange, value } }) => <DatePicker date={value ? parseISO(value) : undefined} onDateChange={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : undefined)} placeholder="Select end date" minDate={watchStartDate ? parseISO(watchStartDate) : undefined} />} /><FormMessage /></FormItem>)} />
                </div>
                 <FormField control={form.control} name="tripDetails.approximateDatesOrSeason" render={({ field }) => (<FormItem><FormLabel>Approximate Dates/Season (if specific dates unknown)</FormLabel><FormControl><Input placeholder="e.g., Mid-June for 2 weeks, Christmas 2024" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="tripDetails.durationDays" render={({ field }) => (<FormItem><FormLabel>Trip Duration (Days)</FormLabel><FormControl><Input type="number" min="1" placeholder="e.g., 7" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="tripDetails.durationNights" render={({ field }) => (<FormItem><FormLabel>Trip Duration (Nights)</FormLabel><FormControl><Input type="number" min="0" placeholder="e.g., 6" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <FormField control={form.control} name="tripDetails.tripType" render={({ field }) => (<FormItem><FormLabel>Type of Trip</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select trip type" /></SelectTrigger></FormControl><SelectContent>{TRIP_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="tripDetails.budgetRange" render={({ field }) => (<FormItem><FormLabel>Budget Expectation</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select budget range" /></SelectTrigger></FormControl><SelectContent>{BUDGET_RANGES.map(range => <SelectItem key={range} value={range}>{range}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                {watchBudgetRange === "Specific Amount (see notes)" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <FormField control={form.control} name="tripDetails.budgetAmount" render={({ field }) => (<FormItem><FormLabel>Specific Budget Amount *</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="tripDetails.budgetCurrency" render={({ field }) => (<FormItem><FormLabel>Currency for Budget</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Accommodation Preferences (Optional)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="accommodationPrefs.hotelStarRating" render={({ field }) => (<FormItem><FormLabel>Preferred Hotel Star Rating</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Any star rating" /></SelectTrigger></FormControl><SelectContent>{HOTEL_STAR_RATINGS.map(rating => <SelectItem key={rating} value={rating}>{rating}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="accommodationPrefs.roomPreferences" render={({ field }) => (<FormItem><FormLabel>Room Preferences</FormLabel><FormControl><Textarea placeholder="e.g., 1 King Bed, 2 Twin Beds + 1 Extra Bed, Connecting rooms, Ocean view" {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="accommodationPrefs.specificHotelRequests" render={({ field }) => (<FormItem><FormLabel>Specific Hotel Names or Location Preferences</FormLabel><FormControl><Textarea placeholder="e.g., 'Near Eiffel Tower', 'XYZ Resort', 'Quiet area'" {...field} rows={2} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Activity & Tour Preferences (Optional)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="activityPrefs.interests" render={({ field }) => (<FormItem><FormLabel>Client Interests</FormLabel><FormControl><Textarea placeholder="e.g., History, Museums, Beaches, Hiking, Shopping, Nightlife, Local Cuisine" {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="activityPrefs.mustDoActivities" render={({ field }) => (<FormItem><FormLabel>Must-do Activities or Sights</FormLabel><FormControl><Textarea placeholder="e.g., 'Visit the Colosseum', 'Snorkeling trip', 'Cooking class'" {...field} rows={3} /></FormControl><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Flight & Transfer Preferences (Optional)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="flightPrefs.includeFlights" render={({ field }) => (<FormItem><FormLabel>Include Flights in Quotation?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{["To be discussed", "Yes", "No"].map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                {form.watch("flightPrefs.includeFlights") === "Yes" && (
                  <>
                    <FormField control={form.control} name="flightPrefs.departureCity" render={({ field }) => (<FormItem><FormLabel>Departure City/Airport</FormLabel><FormControl><Input placeholder="e.g., London Heathrow (LHR)" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="flightPrefs.preferredAirlineClass" render={({ field }) => (<FormItem><FormLabel>Preferred Airline/Class</FormLabel><FormControl><Input placeholder="e.g., Economy, Business, Any Major Carrier" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </>
                )}
                <FormField control={form.control} name="flightPrefs.airportTransfersRequired" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Airport Transfers Required?</FormLabel><FormDescription>Include transfers to/from airports.</FormDescription></div><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Other Requirements</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="otherRequirements" render={({ field }) => (<FormItem><FormLabel>Special Requests or Notes</FormLabel><FormControl><Textarea placeholder="e.g., Dietary restrictions (vegetarian, gluten-free), accessibility needs, celebrating an anniversary, prefer non-smoking rooms, etc." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="quotationDeadline" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Preferred Quotation Deadline (Optional)</FormLabel><Controller control={form.control} name="quotationDeadline" render={({ field: { onChange, value } }) => <DatePicker date={value ? parseISO(value) : undefined} onDateChange={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : undefined)} placeholder="Select deadline"/>} /><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        <Separator className="my-6" />
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>Cancel</Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Quotation Request
          </Button>
        </div>
      </form>
    </Form>
  );
}

