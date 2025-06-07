
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ServicePriceItem, CurrencyCode, ItineraryItemType } from '@/types/itinerary';
import { CURRENCIES, SERVICE_CATEGORIES } from '@/types/itinerary';

const servicePriceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  category: z.custom<ItineraryItemType>((val) => SERVICE_CATEGORIES.includes(val as ItineraryItemType), "Invalid category"),
  subCategory: z.string().optional(),
  price1: z.coerce.number().min(0, "Price must be non-negative"),
  price2: z.coerce.number().min(0, "Price must be non-negative").optional(),
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency"),
  unitDescription: z.string().min(1, "Unit description is required (e.g., per adult, per night)"),
  notes: z.string().optional(),
});

type ServicePriceFormValues = z.infer<typeof servicePriceSchema>;

interface ServicePriceFormProps {
  initialData?: ServicePriceItem;
  onSubmit: (data: ServicePriceFormValues) => void;
  onCancel: () => void;
}

export function ServicePriceForm({ initialData, onSubmit, onCancel }: ServicePriceFormProps) {
  const form = useForm<ServicePriceFormValues>({
    resolver: zodResolver(servicePriceSchema),
    defaultValues: initialData || {
      name: "",
      category: "activity",
      subCategory: "",
      price1: 0,
      price2: undefined,
      currency: "USD",
      unitDescription: "",
      notes: "",
    },
  });

  const selectedCategory = form.watch("category");

  const getPriceLabel = (priceField: 'price1' | 'price2'): string => {
    switch (selectedCategory) {
      case 'activity':
        return priceField === 'price1' ? "Adult Price" : "Child Price (Optional)";
      case 'meal':
        return priceField === 'price1' ? "Adult Meal Price" : "Child Meal Price (Optional)";
      case 'transfer':
        // This could be more dynamic based on subCategory ('ticket' vs 'vehicle')
        return priceField === 'price1' ? "Primary Price (Adult/Vehicle)" : "Secondary Price (Child)";
      case 'hotel':
        return priceField === 'price1' ? "Room Rate (Nightly)" : "Extra Bed Rate (Optional)";
      case 'misc':
        return priceField === 'price1' ? "Unit Cost" : ""; // No price2 for misc usually
      default:
        return priceField === 'price1' ? "Price 1" : "Price 2";
    }
  };

  const showPrice2 = selectedCategory !== 'misc'; // Example: Misc items usually have one price.

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl><Input placeholder="e.g., City Tour, Airport Transfer" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub-category (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g., Ticket, Vehicle, Room Type" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getPriceLabel('price1')}</FormLabel>
                <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {showPrice2 && (
            <FormField
              control={form.control}
              name="price2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getPriceLabel('price2')}</FormLabel>
                  <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            name="unitDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Description</FormLabel>
                <FormControl><Input placeholder="e.g., per adult, per night" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl><Textarea placeholder="Additional details about the service or pricing" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {initialData ? 'Update' : 'Create'} Service Price
          </Button>
        </div>
      </form>
    </Form>
  );
}
