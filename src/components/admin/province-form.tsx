
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
import type { ProvinceItem } from '@/types/itinerary';

const provinceSchema = z.object({
  name: z.string().min(1, "Province name is required"),
});

type ProvinceFormValues = z.infer<typeof provinceSchema>;

interface ProvinceFormProps {
  initialData?: ProvinceItem;
  onSubmit: (data: Omit<ProvinceItem, 'id'>) => void;
  onCancel: () => void;
}

export function ProvinceForm({ initialData, onSubmit, onCancel }: ProvinceFormProps) {
  const form = useForm<ProvinceFormValues>({
    resolver: zodResolver(provinceSchema),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  const handleActualSubmit = (values: ProvinceFormValues) => {
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
