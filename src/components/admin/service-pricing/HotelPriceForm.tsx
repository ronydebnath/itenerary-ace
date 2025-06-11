
"use client";

import * BReact from 'react';
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import type * as z from "zod"; // Import z for type inference if needed elsewhere
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage, // Import FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import type { ServicePriceItem, CurrencyCode, HotelDefinition, HotelRoomTypeDefinition, RoomTypeSeasonalPrice } from '@/types/itinerary';
import { PlusCircle, Trash2, XIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { generateGUID } from '@/lib/utils';
import { addDays } from 'date-fns'; // Import addDays

// Assuming ServicePriceFormValues is defined in the parent ServicePriceFormRouter
type ServicePriceFormValues = ReturnType<typeof useForm<any>>['control']['_defaultValues'];


interface HotelPriceFormProps {
  form: ReturnType<typeof useForm<ServicePriceFormValues>>;
}

export function HotelPriceForm({ form }: HotelPriceFormProps) {
  const hotelNameForLegend = form.watch('name');
  const hotelProvinceForLegend = form.watch('province');

  const { fields: roomTypeFields, append: appendRoomType, remove: removeRoomType } = useFieldArray({
    control: form.control, name: "hotelDetails.roomTypes", keyName: "fieldId"
  });

  // Ensure hotelDetails exists when category is hotel
  React.useEffect(() => {
    if (form.getValues('category') === 'hotel' && !form.getValues('hotelDetails.roomTypes')) {
        const today = new Date();
        const thirtyDaysFromToday = addDays(today, 30);
        form.setValue('hotelDetails.roomTypes', [{
            id: generateGUID(),
            name: 'Standard Room',
            extraBedAllowed: false,
            notes: '',
            characteristics: [],
            seasonalPrices: [{
                id: generateGUID(),
                startDate: today, 
                endDate: thirtyDaysFromToday,
                rate: 0,
                extraBedRate: undefined
            }]
        }], { shouldValidate: true });
    }
  }, [form.getValues('category'), form]);


  return (
    <div className="border border-border rounded-md p-4 mt-6 relative">
      <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4"> Room Types &amp; Nightly Rates for: {hotelNameForLegend || "Hotel"} {hotelProvinceForLegend && `(${hotelProvinceForLegend})`} </p>
      <div id="roomTypesContainer" className="space-y-6 pt-2">
        {roomTypeFields.map((roomField, roomIndex) => {
          const roomTypeNameWatch = form.watch(`hotelDetails.roomTypes.${roomIndex}.name`);
          const roomLegend = roomTypeNameWatch || `Room Type ${roomIndex + 1}`;
          return (
            <div key={roomField.fieldId} className="border border-border rounded-md p-4 pt-6 relative bg-card shadow-sm">
              <p className="text-base font-medium -mt-6 ml-2 px-1 bg-card inline-block absolute left-2 top-[0.1rem] max-w-[calc(100%-3rem)] truncate"> {roomLegend} </p>
              <Button type="button" variant="ghost" size="icon" onClick={() => roomTypeFields.length > 1 ? removeRoomType(roomIndex) : null} disabled={roomTypeFields.length <= 1} className="absolute top-1 right-1 h-7 w-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-sm hover:bg-destructive/80 disabled:opacity-50" aria-label="Remove Room Type" > <XIcon size={16} /> </Button>
              <div className="space-y-3 pt-2">
                <FormField control={form.control} name={`hotelDetails.roomTypes.${roomIndex}.name`} render={({ field }) => (<FormItem><FormLabel className="text-sm">Room Type Name</FormLabel><FormControl><Input placeholder="e.g., Deluxe Pool View" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={`hotelDetails.roomTypes.${roomIndex}.extraBedAllowed`} render={({ field }) => (<FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2"><FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => { field.onChange(checked); if (!checked) { const seasons = form.getValues(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`); seasons.forEach((_: any, seasonIdx: number) => { form.setValue(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIdx}.extraBedRate`, undefined, { shouldValidate: true }); }); } }} /></FormControl><FormLabel className="text-sm font-normal cursor-pointer"> Extra Bed Permitted for this Room Type? </FormLabel><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={`hotelDetails.roomTypes.${roomIndex}.notes`} render={({ field }) => (<FormItem><FormLabel className="text-sm">Room Details (Size, Amenities, Bed Type, View, etc.)</FormLabel><FormControl><Textarea placeholder="Describe room features, size, bed configuration, view, key amenities..." {...field} value={field.value || ''} rows={3} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <SeasonalRatesTable roomIndex={roomIndex} form={form} currency={form.getValues('currency')} />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="mt-3 border-primary text-primary hover:bg-primary/10 add-btn" 
                onClick={() => { 
                  const currentRoomSeasonalPrices = form.getValues(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`) || []; 
                  const defaultStartDate = new Date();
                  const defaultEndDate = addDays(defaultStartDate, 30);
                  form.setValue(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`, [
                    ...currentRoomSeasonalPrices, 
                    { id: generateGUID(), startDate: defaultStartDate, endDate: defaultEndDate, rate: 0, extraBedRate: undefined }
                  ], { shouldValidate: true }); 
                }}
              > 
                <PlusCircle className="mr-2 h-4 w-4" /> Add Season 
              </Button>
              <FormMessage>{(form.formState.errors.hotelDetails?.roomTypes?.[roomIndex] as any)?.seasonalPrices?.message}</FormMessage>
            </div>
          );
        })}
      </div>
      <Button type="button" variant="outline" onClick={() => {
         const defaultStartDate = new Date();
         const defaultEndDate = addDays(defaultStartDate, 30);
        appendRoomType({ 
          id: generateGUID(), 
          name: `Room Type ${roomTypeFields.length + 1}`, 
          extraBedAllowed: false, 
          notes: '', 
          characteristics: [], 
          seasonalPrices: [{ id: generateGUID(), startDate: defaultStartDate, endDate: defaultEndDate, rate: 0, extraBedRate: undefined }] 
        }, { shouldFocus: false })
      }} className="mt-4 border-accent text-accent hover:bg-accent/10 add-btn" > <PlusCircle className="mr-2 h-4 w-4" /> Add Room Type </Button>
      <FormMessage>{(form.formState.errors.hotelDetails?.roomTypes as any)?.message}</FormMessage>
      <FormMessage>{(form.formState.errors.hotelDetails as any)?.root?.message}</FormMessage>
    </div>
  );
}


interface SeasonalRatesTableProps {
  roomIndex: number;
  form: ReturnType<typeof useForm<ServicePriceFormValues>>;
  currency: CurrencyCode;
}

function SeasonalRatesTable({ roomIndex, form, currency }: SeasonalRatesTableProps) {
  const { fields, append, remove } = useFieldArray({ // `append` is not used here but kept for consistency
    control: form.control,
    name: `hotelDetails.roomTypes.${roomIndex}.seasonalPrices`,
    keyName: "seasonFieldId"
  });

  const roomExtraBedAllowed = useWatch({
    control: form.control,
    name: `hotelDetails.roomTypes.${roomIndex}.extraBedAllowed`,
  });

  // Ensure at least one seasonal price exists
  React.useEffect(() => {
    if (fields.length === 0) {
      const defaultStartDate = new Date();
      const defaultEndDate = addDays(defaultStartDate, 30);
      // Use `form.setValue` directly instead of `append` from useFieldArray here,
      // as `append` might have its own default value logic that could conflict.
      // Or ensure `append` can take full default object.
      // For safety, direct setValue for initial setup:
      form.setValue(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`,
        [{ id: generateGUID(), startDate: defaultStartDate, endDate: defaultEndDate, rate: 0, extraBedRate: undefined }],
        { shouldValidate: true }
      );
    }
  }, [fields.length, roomIndex, form]); // Removed `fields` from dependency array to avoid loop if form.setValue re-renders


  return (
    <div className="space-y-1 mt-4">
      <Label className="text-sm font-medium text-muted-foreground mb-1 block">Seasonal Pricing Periods</Label>
      <Table className="mb-1 border">
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[140px] px-2 py-1 text-xs">Start Date</TableHead>
            <TableHead className="w-[140px] px-2 py-1 text-xs">End Date</TableHead>
            <TableHead className="w-[120px] px-2 py-1 text-xs">Rate ({currency})</TableHead>
            {roomExtraBedAllowed && <TableHead className="w-[120px] px-2 py-1 text-xs">Extra Bed Rate</TableHead>}
            <TableHead className="w-[40px] px-1 py-1 text-center text-xs">Del</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((seasonField, seasonIndex) => (
            <TableRow key={seasonField.seasonFieldId}>
              <TableCell className="px-2 py-1">
                <Controller control={form.control} name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.startDate`} render={({ field, fieldState: { error } }) => (<FormItem><FormControl><DatePicker date={field.value} onDateChange={field.onChange} placeholder="dd-MM-yy" /></FormControl><FormMessage className="text-xs">{error?.message}</FormMessage></FormItem>)} />
              </TableCell>
              <TableCell className="px-2 py-1">
                <Controller control={form.control} name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.endDate`} render={({ field, fieldState: { error } }) => (<FormItem><FormControl><DatePicker date={field.value} onDateChange={field.onChange} minDate={form.getValues(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.startDate`)} placeholder="dd-MM-yy" /></FormControl><FormMessage className="text-xs">{error?.message || (form.formState.errors.hotelDetails?.roomTypes?.[roomIndex]?.seasonalPrices?.[seasonIndex] as any)?.endDate?.message}</FormMessage></FormItem>)} />
              </TableCell>
              <TableCell className="px-2 py-1">
                <FormField control={form.control} name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.rate`} render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-9 text-sm" /></FormControl><FormMessage className="text-xs" /></FormItem>)} />
              </TableCell>
              {roomExtraBedAllowed && (
                <TableCell className="px-2 py-1">
                  <FormField control={form.control} name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.extraBedRate`} render={({ field }) => (<FormItem><FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} className="h-9 text-sm" /></FormControl><FormMessage className="text-xs" /></FormItem>)} />
                </TableCell>
              )}
              <TableCell className="text-center px-1 py-1 align-middle">
                <Button type="button" variant="ghost" size="icon" onClick={() => fields.length > 1 ? remove(seasonIndex) : null} disabled={fields.length <= 1} className="h-7 w-7 text-destructive hover:text-destructive/80 disabled:opacity-50 remove-season flex items-center justify-center" aria-label="Remove Season" > <XIcon size={18} /> </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <FormMessage>{(form.formState.errors.hotelDetails?.roomTypes?.[roomIndex]?.seasonalPrices as any)?.message}</FormMessage>
    </div>
  );
}

