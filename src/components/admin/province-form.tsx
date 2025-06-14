/**
 * @fileoverview This component provides a form for creating or editing province details.
 * It includes fields for the province name and selecting its parent country from a list
 * populated by the `useCountries` hook. The form uses Zod for validation and interacts
 * with submit/cancel handlers from its parent component (usually `ProvinceManager`).
 *
 * @bangla এই কম্পোনেন্টটি প্রদেশের বিবরণ তৈরি বা সম্পাদনা করার জন্য একটি ফর্ম সরবরাহ করে।
 * এটিতে প্রদেশের নাম এবং `useCountries` হুক দ্বারা জনবহুল তালিকা থেকে এর মূল দেশ
 * নির্বাচন করার জন্য ক্ষেত্র অন্তর্ভুক্ত রয়েছে। ফর্মটি বৈধতা যাচাইয়ের জন্য Zod ব্যবহার করে
 * এবং এর প্যারেন্ট কম্পোনেন্ট (`ProvinceManager`) থেকে সাবমিট/ বাতিল হ্যান্ডলারগুলির সাথে
 * ইন্টারঅ্যাক্ট করে।
 */
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProvinceItem, CountryItem } from '@/types/itinerary';
import { useCountries } from '@/hooks/useCountries'; // Import useCountries

const provinceSchema = z.object({
  name: z.string().min(1, "Province name is required"),
  countryId: z.string().min(1, "Country is required"),
});

type ProvinceFormValues = z.infer<typeof provinceSchema>;

interface ProvinceFormProps {
  initialData?: ProvinceItem;
  onSubmit: (data: Omit<ProvinceItem, 'id'>) => void;
  onCancel: () => void;
}

export function ProvinceForm({ initialData, onSubmit, onCancel }: ProvinceFormProps) {
  const { countries, isLoading: isLoadingCountries } = useCountries(); // Use the hook

  const form = useForm<ProvinceFormValues>({
    resolver: zodResolver(provinceSchema),
    defaultValues: {
      name: initialData?.name || "",
      countryId: initialData?.countryId || (countries.find(c => c.name === "Thailand")?.id || ""), // Default to Thailand if available
    },
  });
  
  React.useEffect(() => {
    if (!initialData?.countryId && countries.length > 0) {
      const defaultCountry = countries.find(c => c.name === "Thailand") || countries[0];
      if (defaultCountry) {
        form.setValue('countryId', defaultCountry.id);
      }
    }
  }, [countries, initialData, form]);


  const handleActualSubmit = (values: ProvinceFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleActualSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="countryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoadingCountries}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingCountries ? (
                    <SelectItem value="" disabled>Loading countries...</SelectItem>
                  ) : (
                    countries.map(country => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Province Name</FormLabel>
              <FormControl><Input placeholder="e.g., Bangkok, Chiang Mai" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {initialData ? 'Update' : 'Create'} Province
          </Button>
        </div>
      </form>
    </Form>
  );
}
