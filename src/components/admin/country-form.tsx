
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
import type { CountryItem } from '@/types/itinerary';

const countrySchema = z.object({
  name: z.string().min(1, "Country name is required"),
});

type CountryFormValues = z.infer<typeof countrySchema>;

interface CountryFormProps {
  initialData?: CountryItem;
  onSubmit: (data: Omit<CountryItem, 'id'>) => void;
  onCancel: () => void;
}

export function CountryForm({ initialData, onSubmit, onCancel }: CountryFormProps) {
  const form = useForm<CountryFormValues>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: initialData?.name || "",
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
