
"use client";

import * as React from 'react';
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import {
  FormField as ShadcnFormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { PlusCircle, XIcon } from 'lucide-react';
import { generateGUID } from '@/lib/utils';
import { addDays, isValid, parseISO } from 'date-fns';
import type { ServicePriceFormValues } from './ServicePriceFormRouter';
import type { CurrencyCode } from '@/types/itinerary';
import { Label } from "@/components/ui/label"; // Ensure this import is present

// Helper function to create default seasonal price for the form
function createDefaultSeasonalPriceForForm() {
  const today = new Date();
  return {
    id: generateGUID(),
    seasonName: 'New Season',
    startDate: today,
    endDate: addDays(today, 30),
    rate: 0,
    extraBedRate: undefined,
  };
}

// Helper function to create default room type structure for the form
function createDefaultRoomTypeForForm(index: number) {
  return {
    id: generateGUID(),
    name: `Room Type ${index + 1}`,
    extraBedAllowed: false,
    notes: '',
    characteristics: [],
    seasonalPrices: [createDefaultSeasonalPriceForForm()]
  };
}

interface HotelPriceFormProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
}

export function HotelPriceForm({ form }: HotelPriceFormProps) {
  const hotelNameForLegend = form.watch('name');
  const hotelProvinceForLegend = form.watch('province');
  const currency = form.watch('currency') as CurrencyCode || 'THB';

  const { fields: roomTypeFields, append: appendRoomType, remove: removeRoomType } = useFieldArray({
    control: form.control,
    name: "hotelDetails.roomTypes",
    keyName: "roomTypeFieldId"
  });
  
  React.useEffect(() => {
    const hotelDetails = form.getValues('hotelDetails');
    if (hotelDetails && (!hotelDetails.roomTypes || hotelDetails.roomTypes.length === 0)) {
      const defaultRoom = createDefaultRoomTypeForForm(0);
      form.setValue('hotelDetails.roomTypes', [defaultRoom], { shouldValidate: true, shouldDirty: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.getValues('hotelDetails')?.id]);


  return (
    <div className="space-y-6">
      <div className="border border-border rounded-md p-4 mt-6 relative">
        <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">
          Room Types & Nightly Rates for: {hotelNameForLegend || "New Hotel"} {hotelProvinceForLegend && `(${hotelProvinceForLegend})`}
        </p>
        <div id="roomTypesContainer" className="space-y-6 pt-2">
          {roomTypeFields.map((roomField, roomIndex) => (
            <RoomTypeCard
              key={roomField.roomTypeFieldId}
              form={form}
              roomIndex={roomIndex}
              currency={currency}
              removeRoomType={() => removeRoomType(roomIndex)}
              canRemoveRoomType={roomTypeFields.length > 1}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => appendRoomType(createDefaultRoomTypeForForm(roomTypeFields.length))}
          className="mt-4 border-accent text-accent hover:bg-accent/10 add-btn"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Room Type
        </Button>
        {(form.formState.errors.hotelDetails?.roomTypes as any)?.message && (
          <FormMessage className="mt-2 text-sm text-destructive">
            {(form.formState.errors.hotelDetails?.roomTypes as any).message}
          </FormMessage>
        )}
        {form.formState.errors.hotelDetails?.root?.message && (
            <FormMessage className="mt-2 text-sm text-destructive">
                {form.formState.errors.hotelDetails.root.message}
            </FormMessage>
        )}
      </div>
    </div>
  );
}

interface RoomTypeCardProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
  roomIndex: number;
  currency: CurrencyCode;
  removeRoomType: () => void;
  canRemoveRoomType: boolean;
}

function RoomTypeCard({ form, roomIndex, currency, removeRoomType, canRemoveRoomType }: RoomTypeCardProps) {
  const roomTypeNameWatch = form.watch(`hotelDetails.roomTypes.${roomIndex}.name`);
  const roomLegend = roomTypeNameWatch || `Room Type ${roomIndex + 1}`;

  return (
    <Card className="border-primary/30 rounded-lg p-4 pt-6 relative bg-card shadow-md">
      <div className="flex justify-between items-center absolute left-2 top-[-0.7rem] w-[calc(100%-1rem)]">
        <p className="text-base font-medium -mt-6 ml-2 px-1 bg-card inline-block max-w-[calc(100%-3rem)] truncate">
          {roomLegend}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={removeRoomType}
          disabled={!canRemoveRoomType}
          className="h-7 w-7 text-destructive hover:bg-destructive/10 disabled:opacity-50 relative -top-2"
        >
          <XIcon size={16} />
        </Button>
      </div>
      <div className="space-y-3 pt-2">
        <ShadcnFormField
          control={form.control}
          name={`hotelDetails.roomTypes.${roomIndex}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Room Type Name</FormLabel>
              <FormControl><Input placeholder="e.g., Deluxe Pool View" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ShadcnFormField
          control={form.control}
          name={`hotelDetails.roomTypes.${roomIndex}.extraBedAllowed`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (!checked) {
                      const seasons = form.getValues(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`);
                      seasons.forEach((_, seasonIdx) => {
                        form.setValue(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIdx}.extraBedRate`, undefined, { shouldValidate: true });
                      });
                    }
                  }}
                />
              </FormControl>
              <FormLabel className="text-sm font-normal cursor-pointer"> Extra Bed Permitted for this Room Type? </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <ShadcnFormField
          control={form.control}
          name={`hotelDetails.roomTypes.${roomIndex}.notes`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Room Details (Size, Amenities, Bed Type, View, etc.)</FormLabel>
              <FormControl><Textarea placeholder="Describe room features..." {...field} value={field.value || ''} rows={2} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <SeasonalRatesTableForRoomType form={form} roomIndex={roomIndex} currency={currency} />
    </Card>
  );
}

interface SeasonalRatesTableForRoomTypeProps {
  form: ReturnType<typeof useFormContext<ServicePriceFormValues>>;
  roomIndex: number;
  currency: CurrencyCode;
}

function SeasonalRatesTableForRoomType({ form, roomIndex, currency }: SeasonalRatesTableForRoomTypeProps) {
  const { fields: seasonFields, append: appendSeason, remove: removeSeason } = useFieldArray({
    control: form.control,
    name: `hotelDetails.roomTypes.${roomIndex}.seasonalPrices`,
    keyName: "seasonFieldId"
  });

  const roomExtraBedAllowed = form.watch(`hotelDetails.roomTypes.${roomIndex}.extraBedAllowed`);

  React.useEffect(() => {
    if (seasonFields.length === 0) {
      appendSeason(createDefaultSeasonalPriceForForm(), { shouldFocus: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonFields.length, appendSeason]);

  return (
    <div className="space-y-1 mt-4">
      <Label className="text-sm font-medium text-muted-foreground mb-1 block">Seasonal Pricing Periods</Label>
      <div className="overflow-x-auto">
        <Table className="mb-1 border min-w-[600px]">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[150px] px-2 py-1 text-xs">Season Name</TableHead>
              <TableHead className="w-[160px] px-2 py-1 text-xs">Start Date</TableHead>
              <TableHead className="w-[160px] px-2 py-1 text-xs">End Date</TableHead>
              <TableHead className="w-[120px] px-2 py-1 text-xs">Rate ({currency})</TableHead>
              {roomExtraBedAllowed && <TableHead className="w-[130px] px-2 py-1 text-xs">Extra Bed Rate</TableHead>}
              <TableHead className="w-[40px] px-1 py-1 text-center text-xs">Del</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seasonFields.map((seasonField, seasonIndex) => (
              <TableRow key={seasonField.seasonFieldId}>
                <TableCell className="px-2 py-1">
                   <ShadcnFormField
                    control={form.control}
                    name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.seasonName`}
                    render={({ field }) => (
                        <FormControl><Input placeholder="e.g. High Season" {...field} value={field.value || ''} className="h-9 text-sm" /></FormControl>
                    )}
                    />
                </TableCell>
                <TableCell className="px-2 py-1">
                  <Controller
                    control={form.control}
                    name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.startDate`}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormItem>
                        <FormControl><DatePicker date={value} onDateChange={onChange} placeholder="dd-MM-yy" /></FormControl>
                        {error && <FormMessage className="text-xs">{error.message}</FormMessage>}
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="px-2 py-1">
                  <Controller
                    control={form.control}
                    name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.endDate`}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <FormItem>
                        <FormControl><DatePicker date={value} onDateChange={onChange} minDate={form.getValues(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.startDate`)} placeholder="dd-MM-yy" /></FormControl>
                        {error && <FormMessage className="text-xs">{error.message}</FormMessage>}
                        {(form.formState.errors.hotelDetails?.roomTypes?.[roomIndex]?.seasonalPrices?.[seasonIndex] as any)?.endDate?.message && (
                            <FormMessage className="text-xs">{(form.formState.errors.hotelDetails?.roomTypes?.[roomIndex]?.seasonalPrices?.[seasonIndex] as any).endDate.message}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </TableCell>
                <TableCell className="px-2 py-1">
                  <ShadcnFormField
                    control={form.control}
                    name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.rate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-9 text-sm" /></FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </TableCell>
                {roomExtraBedAllowed && (
                  <TableCell className="px-2 py-1">
                    <ShadcnFormField
                      control={form.control}
                      name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.extraBedRate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} className="h-9 text-sm" /></FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                )}
                <TableCell className="text-center px-1 py-1 align-middle">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => seasonFields.length > 1 ? removeSeason(seasonIndex) : null}
                    disabled={seasonFields.length <= 1}
                    className="h-7 w-7 text-destructive hover:text-destructive/80 disabled:opacity-50 flex items-center justify-center"
                  >
                    <XIcon size={18} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => appendSeason(createDefaultSeasonalPriceForForm(), { shouldFocus: true })}
        className="mt-3 border-primary text-primary hover:bg-primary/10 add-btn"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add Season
      </Button>
      {(form.formState.errors.hotelDetails?.roomTypes?.[roomIndex]?.seasonalPrices as any)?.message && (
        <FormMessage className="text-xs text-destructive mt-1">
          {(form.formState.errors.hotelDetails?.roomTypes?.[roomIndex]?.seasonalPrices as any).message}
        </FormMessage>
      )}
    </div>
  );
}
