
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { AgentProfileSchema, type AgentProfile } from '@/types/agent';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CURRENCIES, type CountryItem } from '@/types/itinerary';
import { useCountries } from '@/hooks/useCountries';
import { Loader2 } from 'lucide-react';

interface AgentProfileFormProps {
  initialData?: Partial<AgentProfile>;
  onSubmit: (data: AgentProfile) => void;
  onCancel: () => void;
  isLoadingCountries: boolean;
  availableCountries: CountryItem[];
}

export function AgentProfileForm({
  initialData,
  onSubmit,
  onCancel,
  isLoadingCountries,
  availableCountries,
}: AgentProfileFormProps) {
  const form = useForm<AgentProfile>({
    resolver: zodResolver(AgentProfileSchema),
    defaultValues: {
      id: initialData?.id || `agent_${crypto.randomUUID()}`,
      fullName: initialData?.fullName || "",
      email: initialData?.email || "",
      phoneNumber: initialData?.phoneNumber || "",
      agencyName: initialData?.agencyName || "",
      agencyAddress: initialData?.agencyAddress || { street: "", city: "", postalCode: "", countryId: "" },
      preferredCurrency: initialData?.preferredCurrency || "USD",
      specializations: initialData?.specializations || "",
      yearsOfExperience: initialData?.yearsOfExperience || undefined,
      bio: initialData?.bio || "",
      profilePictureUrl: initialData?.profilePictureUrl || "",
    },
  });

  const watchCountryId = form.watch("agencyAddress.countryId");

  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
        <Card>
          <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" placeholder="agent@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl><Input type="tel" placeholder="+1 555 123 4567" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Agency Details (Optional)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="agencyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agency Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Global Travel Experts" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agencyAddress.street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl><Input placeholder="123 Travel Lane" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="agencyAddress.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input placeholder="Travelville" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agencyAddress.stateProvince"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State / Province</FormLabel>
                    <FormControl><Input placeholder="CA" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agencyAddress.postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl><Input placeholder="90210" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="agencyAddress.countryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isLoadingCountries}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingCountries ? "Loading countries..." : "Select country"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCountries.map(country => (
                        <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Professional Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="preferredCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CURRENCIES.map(curr => <SelectItem key={curr} value={curr}>{curr}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specializations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specializations (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="e.g., Luxury Travel, Adventure Tours, Corporate Bookings" {...field} rows={3} /></FormControl>
                  <FormDescription>Comma-separated or one per line.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yearsOfExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Experience (Optional)</FormLabel>
                  <FormControl><Input type="number" placeholder="5" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Bio (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="Tell us a bit about yourself..." {...field} rows={4} /></FormControl>
                  <FormDescription>Max 500 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="profilePictureUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL (Optional)</FormLabel>
                  <FormControl><Input type="url" placeholder="https://example.com/your-photo.jpg" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </form>
    </Form>
  );
}
