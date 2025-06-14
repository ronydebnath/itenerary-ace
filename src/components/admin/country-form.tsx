/**
 * @fileoverview This component provides a form for creating or editing country details.
 * It includes fields for the country name and its default currency. The form uses
 * Zod for validation and interacts with submit/cancel handlers provided by its parent
 * component (typically `CountryManager`).
 *
 * @bangla এই কম্পোনেন্টটি দেশের বিবরণ তৈরি বা সম্পাদনা করার জন্য একটি ফর্ম সরবরাহ করে।
 * এটিতে দেশের নাম এবং এর ডিফল্ট মুদ্রার জন্য ক্ষেত্র অন্তর্ভুক্ত রয়েছে। ফর্মটি বৈধতা
 * যাচাইয়ের জন্য Zod ব্যবহার করে এবং এর প্যারেন্ট কম্পোনেন্ট (`CountryManager`) দ্বারা
 * সরবরাহ করা সাবমিট/ বাতিল হ্যান্ডলারগুলির সাথে ইন্টারঅ্যাক্ট করে।
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
import type { CountryItem, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';

const countrySchema = z.object({
  name: z.string().min(1, "Country name is required"),
  defaultCurrency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency code"),
});

type CountryFormValues = z.infer<typeof countrySchema>;

interface CountryFormProps {
  initialData?: CountryItem;
  onSubmit: (data: CountryFormValues) => void; // Changed to match form values
  onCancel: () => void;
}

export function CountryForm({ initialData, onSubmit, onCancel }: CountryFormProps) {
  const form = useForm<CountryFormValues>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: initialData?.name || "",
      defaultCurrency: initialData?.defaultCurrency || (CURRENCIES.includes('USD') ? 'USD' : CURRENCIES[0]),
    },
  });

  const handleActualSubmit = (values: CountryFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleActualSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country Name</FormLabel>
              <FormControl><Input placeholder="e.g., Thailand, Japan" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultCurrency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Currency</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select default currency" /></SelectTrigger></FormControl>
                <SelectContent>
                  {CURRENCIES.map(curr => (
                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {initialData ? 'Update' : 'Create'} Country
          </Button>
        </div>
      </form>
    </Form>
  );
}
