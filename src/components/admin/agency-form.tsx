
/**
 * @fileoverview This component provides a form for creating or editing agency details.
 * It includes fields for agency name, address (street, city, postal code, country),
 * contact email, and phone number. The form uses Zod for validation and interacts
 * with submit/cancel handlers provided by its parent component.
 *
 * @bangla এই কম্পোনেন্টটি এজেন্সি বিবরণ তৈরি বা সম্পাদনা করার জন্য একটি ফর্ম সরবরাহ করে।
 * এটিতে এজেন্সির নাম, ঠিকানা (রাস্তা, শহর, পোস্টাল কোড, দেশ), যোগাযোগের ইমেল এবং ফোন
 * নম্বরের জন্য ক্ষেত্র অন্তর্ভুক্ত রয়েছে। ফর্মটি বৈধতা যাচাইয়ের জন্য Zod ব্যবহার করে
 * এবং এর প্যারেন্ট কম্পোনেন্ট দ্বারা সরবরাহ করা সাবমিট/বাতিল হ্যান্ডলারগুলির সাথে ইন্টারঅ্যাক্ট করে।
 */
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { AgencySchema, type Agency } from '@/types/agent';
import type { CountryItem } from '@/types/itinerary';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCountries } from '@/hooks/useCountries';
import { Loader2 } from 'lucide-react';

type AgencyFormValues = Omit<Agency, 'id'> & { id?: string }; // id is optional for creation

interface AgencyFormProps {
  initialData?: Agency;
  onSubmit: (data: AgencyFormValues) => void;
  onCancel: () => void;
}

export function AgencyForm({ initialData, onSubmit, onCancel }: AgencyFormProps) {
  const { countries, isLoading: isLoadingCountries } = useCountries();

  const form = useForm<AgencyFormValues>({
    resolver: zodResolver(AgencySchema.omit({ id: initialData ? false : true })), // Omit ID validation for creation
    defaultValues: {
      id: initialData?.id,
      name: initialData?.name || "",
      mainAddress: initialData?.mainAddress || { street: "", city: "", postalCode: "", countryId: "" },
      contactEmail: initialData?.contactEmail || "",
      contactPhone: initialData?.contactPhone || "",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        mainAddress: initialData.mainAddress || { street: "", city: "", postalCode: "", countryId: "" }
      });
    } else if (!isLoadingCountries && countries.length > 0 && !form.getValues('mainAddress.countryId')) {
        // Pre-select first country if creating new and no country is set
        form.setValue('mainAddress.countryId', countries[0].id);
    }
  }, [initialData, form, countries, isLoadingCountries]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agency Name</FormLabel>
              <FormControl><Input placeholder="e.g., Global Travel Experts" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2 border p-4 rounded-md">
            <h3 className="text-sm font-medium text-muted-foreground">Main Address</h3>
            <FormField
                control={form.control}
                name="mainAddress.street"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl><Input placeholder="123 Travel Lane" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="mainAddress.city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Travelville" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="mainAddress.stateProvince" render={({ field }) => (<FormItem><FormLabel>State/Province</FormLabel><FormControl><Input placeholder="CA" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="mainAddress.postalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input placeholder="90210" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField
                control={form.control}
                name="mainAddress.countryId"
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
                        {countries.map(country => (
                            <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl><Input type="email" placeholder="contact@agency.com" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl><Input type="tel" placeholder="+1 555 123 4567" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update Agency' : 'Create Agency'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
