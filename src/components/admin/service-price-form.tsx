
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
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
import { DatePicker } from "@/components/ui/date-picker";
import type { ServicePriceItem, CurrencyCode, ItineraryItemType, VehicleType, HotelDefinition, HotelRoomTypeDefinition, RoomTypeSeasonalPrice } from '@/types/itinerary';
import { CURRENCIES, SERVICE_CATEGORIES, VEHICLE_TYPES } from '@/types/itinerary';
import { PlusCircle, Trash2, XIcon } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateGUID } from '@/lib/utils';
import { useProvinces } from '@/hooks/useProvinces';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";


const hotelRoomSeasonalPriceSchema = z.object({
  id: z.string(),
  seasonName: z.string().optional(), // Kept for data model, but not in UI based on latest HTML
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  rate: z.coerce.number().min(0, "Nightly rate must be non-negative"),
  extraBedRate: z.coerce.number().min(0, "Extra bed rate must be non-negative").optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});


const hotelRoomTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Room type name is required"),
  extraBedAllowed: z.boolean().optional().default(false),
  notes: z.string().optional().describe("Room Details: Size, Amenities, Bed Type, View etc."), // Re-purposed
  seasonalPrices: z.array(hotelRoomSeasonalPriceSchema).min(1, "At least one seasonal price is required."),
  characteristics: z.array(z.object({ id: z.string(), key: z.string(), value: z.string() })).optional(), // Keep for data, not in UI
});

const hotelDetailsSchema = z.object({
  id: z.string(),
  name: z.string(), // Hotel name from basic details
  province: z.string(), // Hotel province from basic details
  roomTypes: z.array(hotelRoomTypeSchema).min(1, "At least one room type is required for detailed hotel pricing."),
});

const servicePriceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  province: z.string().optional(),
  category: z.custom<ItineraryItemType>((val) => SERVICE_CATEGORIES.includes(val as ItineraryItemType), "Invalid category"),
  subCategory: z.string().optional(), // For non-hotels
  price1: z.coerce.number().min(0, "Price must be non-negative").optional(), // For non-hotels
  price2: z.coerce.number().min(0, "Price must be non-negative").optional(), // For non-hotels
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency"),
  unitDescription: z.string().min(1, "Unit description is required (e.g., per adult, per night)"),
  notes: z.string().optional(), // General notes for the service itself
  transferMode: z.enum(['ticket', 'vehicle']).optional(),
  maxPassengers: z.coerce.number().min(1, "Max passengers must be at least 1").optional(),
  hotelDetails: hotelDetailsSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.category === 'hotel') {
    if (!data.hotelDetails || !data.hotelDetails.roomTypes || data.hotelDetails.roomTypes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "For hotels, please add at least one room type with seasonal pricing.",
        path: ["hotelDetails.roomTypes"],
      });
    } else {
      data.hotelDetails.roomTypes.forEach((roomType, roomIndex) => {
        if (!roomType.seasonalPrices || roomType.seasonalPrices.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Each room type must have at least one seasonal price period.",
            path: [`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`],
          });
        }
        roomType.seasonalPrices.forEach((price, priceIndex) => {
          if (roomType.extraBedAllowed && typeof price.extraBedRate !== 'number') {
            // Optional: could make extraBedRate required if extraBedAllowed is true
            // For now, just ensuring it's a non-negative number if provided
          }
        });
      });
    }
  } else { // Non-hotel categories
    if (data.category === 'transfer' && data.transferMode === 'vehicle') {
      if (typeof data.price1 !== 'number') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Cost Per Vehicle is required.",
            path: ["price1"],
        });
      }
    } else { 
        if (typeof data.price1 !== 'number') {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Primary price (e.g., Adult Price, Unit Cost) is required.",
                path: ["price1"],
            });
        }
    }
  }
});

type ServicePriceFormValues = z.infer<typeof servicePriceSchema>;

interface ServicePriceFormProps {
  initialData?: Partial<ServicePriceItem>; 
  onSubmit: (data: Omit<ServicePriceItem, 'id'>) => void;
  onCancel: () => void;
}

export function ServicePriceForm({ initialData, onSubmit, onCancel }: ServicePriceFormProps) {
  const { provinces, isLoading: isLoadingProvinces } = useProvinces();

  const transformInitialDataToFormValues = (data?: Partial<ServicePriceItem>): Partial<ServicePriceFormValues> => {
    if (!data) return { category: "activity", currency: "THB", unitDescription: "per person" };

    const baseTransformed: Partial<ServicePriceFormValues> = {
      name: data.name || "",
      province: data.province || undefined,
      category: data.category || "activity",
      currency: data.currency || "THB",
      unitDescription: data.unitDescription || "",
      notes: data.notes || "", // General service notes
    };

    if (data.category === 'hotel') {
        if (data.hotelDetails && data.hotelDetails.roomTypes && data.hotelDetails.roomTypes.length > 0) {
            baseTransformed.hotelDetails = {
                id: data.hotelDetails.id || data.id || generateGUID(), // Use hotelDetails.id if available, else service id, else new
                name: data.name || data.hotelDetails.name || "",
                province: data.province || data.hotelDetails.province || "",
                roomTypes: data.hotelDetails.roomTypes.map(rt => ({
                    id: rt.id || generateGUID(),
                    name: rt.name || 'Default Room Type',
                    extraBedAllowed: typeof rt.extraBedAllowed === 'boolean' ? rt.extraBedAllowed : false,
                    notes: rt.notes || "", // For Room Details
                    characteristics: rt.characteristics || [],
                    seasonalPrices: rt.seasonalPrices.map(sp => ({
                        id: sp.id || generateGUID(),
                        seasonName: sp.seasonName, // Keep if exists
                        startDate: sp.startDate ? new Date(sp.startDate) : new Date(),
                        endDate: sp.endDate ? new Date(sp.endDate) : new Date(),
                        rate: sp.rate,
                        extraBedRate: sp.extraBedRate
                    })),
                })),
            };
        } else { // Fallback for simpler/older hotel data from AI or initial load
            baseTransformed.hotelDetails = {
                id: data.id || generateGUID(),
                name: data.name || "New Hotel",
                province: data.province || "",
                roomTypes: [{
                    id: generateGUID(),
                    name: data.subCategory || 'Standard Room',
                    extraBedAllowed: typeof data.price2 === 'number', // Infer from old price2
                    notes: "", // Empty for new/fallback
                    characteristics: [],
                    seasonalPrices: data.seasonalRates && data.seasonalRates.length > 0 ?
                        data.seasonalRates.map(sr => ({
                            id: sr.id || generateGUID(),
                            seasonName: undefined,
                            startDate: sr.startDate ? new Date(sr.startDate) : new Date(),
                            endDate: sr.endDate ? new Date(sr.endDate) : new Date(),
                            rate: sr.roomRate,
                            extraBedRate: sr.extraBedRate
                        }))
                        : [{ // Default season if no seasonalRates from AI
                            id: generateGUID(), seasonName: undefined, startDate: new Date(), endDate: new Date(),
                            rate: data.price1 || 0,
                            extraBedRate: data.price2
                          }]
                }]
            };
        }
       baseTransformed.price1 = undefined;
       baseTransformed.price2 = undefined;
       baseTransformed.subCategory = undefined;
       baseTransformed.unitDescription = data.unitDescription || 'per night';
    } else { // Non-hotel
      baseTransformed.subCategory = data.subCategory || "";
      baseTransformed.price1 = data.price1 ?? 0; 
      baseTransformed.price2 = data.price2;
       baseTransformed.hotelDetails = undefined;
      if (data.category === 'transfer') {
        baseTransformed.transferMode = data.subCategory === 'ticket' ? 'ticket' : 'vehicle';
        baseTransformed.maxPassengers = data.maxPassengers || undefined;
      }
    }
    return baseTransformed;
  };


  const form = useForm<ServicePriceFormValues>({
    resolver: zodResolver(servicePriceSchema),
    defaultValues: transformInitialDataToFormValues(initialData),
  });

  const selectedCategory = form.watch("category");
  const transferMode = form.watch("transferMode");

  const { fields: roomTypeFields, append: appendRoomType, remove: removeRoomType } = useFieldArray({
    control: form.control,
    name: "hotelDetails.roomTypes",
    keyName: "fieldId" // Important for React key prop
  });

  React.useEffect(() => {
    if (selectedCategory === 'hotel') {
      if (!form.getValues('hotelDetails')) { 
        form.setValue('hotelDetails', {
          id: initialData?.id || generateGUID(),
          name: form.getValues('name') || initialData?.name || 'New Hotel',
          province: form.getValues('province') || initialData?.province || '',
          roomTypes: [],
        });
      }
      // Ensure at least one room type if hotel category is selected and none exist
      if (form.getValues('hotelDetails.roomTypes')?.length === 0) {
          setTimeout(() => appendRoomType({
            id: generateGUID(),
            name: 'Standard Room', // Default name
            extraBedAllowed: false,
            notes: '', // Default empty notes for Room Details
            characteristics: [],
            seasonalPrices: [{ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: undefined }]
        }), 0);
      }
      form.setValue('price1', undefined);
      form.setValue('price2', undefined);
      form.setValue('subCategory', undefined);
      form.setValue('unitDescription', form.getValues('unitDescription') || 'per night');
    } else if (selectedCategory !== 'hotel') {
      form.setValue('hotelDetails', undefined);
      if (!form.getValues('unitDescription') || form.getValues('unitDescription') === 'per night') {
        form.setValue('unitDescription', 'per person');
      }
    }
  }, [selectedCategory, form, initialData, appendRoomType]);


  React.useEffect(() => {
    if (selectedCategory === 'transfer') {
      const currentTransferMode = form.getValues('transferMode');
      if (!currentTransferMode) {
        form.setValue('transferMode', 'ticket');
        form.setValue('subCategory', 'ticket');
      } else {
         if (currentTransferMode === 'ticket') {
            form.setValue('subCategory', 'ticket');
            form.setValue('maxPassengers', undefined);
        } else if (currentTransferMode === 'vehicle' && (form.getValues('subCategory') === 'ticket' || !form.getValues('subCategory'))){
            form.setValue('subCategory', initialData?.category === 'transfer' && initialData?.subCategory && initialData.subCategory !== 'ticket' ? initialData.subCategory : VEHICLE_TYPES[0]);
        }
      }
    } else {
       form.setValue('transferMode', undefined);
       form.setValue('maxPassengers', undefined);
       if (form.getValues('subCategory') === 'ticket' && selectedCategory !== 'transfer') {
           form.setValue('subCategory', '');
       }
    }
  }, [selectedCategory, form, initialData?.category, initialData?.subCategory]);

    React.useEffect(() => {
        if (selectedCategory === 'transfer' && transferMode === 'vehicle') {
            const currentSubCategory = form.getValues('subCategory');
            if (currentSubCategory === 'ticket' || !VEHICLE_TYPES.includes(currentSubCategory as VehicleType)) {
               form.setValue('subCategory', initialData?.category === 'transfer' && initialData?.subCategory && VEHICLE_TYPES.includes(initialData.subCategory as VehicleType) ? initialData.subCategory : VEHICLE_TYPES[0]);
            }
        }
    }, [transferMode, selectedCategory, form, initialData?.subCategory, initialData?.category]);


  const getPrice1Label = (): string => {
    switch (selectedCategory) {
      case 'activity': return "Adult Price";
      case 'meal': return "Adult Meal Price";
      case 'transfer': return transferMode === 'ticket' ? "Adult Ticket Price" : "Cost Per Vehicle";
      case 'misc': return "Unit Cost";
      default: return "Price 1 / Default Rate";
    }
  };

  const getPrice2Label = (): string | null => {
    switch (selectedCategory) {
      case 'activity': return "Child Price (Optional)";
      case 'meal': return "Child Meal Price (Optional)";
      case 'transfer': return transferMode === 'ticket' ? "Child Ticket Price (Optional)" : null;
      default: return null;
    }
  };

  const getSubCategoryLabel = (): string | null => {
    switch (selectedCategory) {
        case 'activity': return "Activity Type (e.g., Guided, Entrance)";
        case 'meal': return "Meal Type (e.g., Set Menu, Buffet)";
        case 'transfer': return transferMode === 'vehicle' ? "Vehicle Type" : null;
        case 'misc': return "Item Sub-Type (e.g., Visa Fee, Souvenir)";
        default: return "Sub-category (Optional)";
    }
  };

  const showSimplePricingFields = selectedCategory !== 'hotel';
  const showSubCategoryInput = (): boolean => {
    if (selectedCategory === 'hotel') return false;
    if (selectedCategory === 'transfer' && transferMode === 'ticket') return false;
    if (selectedCategory === 'transfer' && transferMode === 'vehicle') return false;
    return getSubCategoryLabel() !== null;
  };
  const showMaxPassengers = (): boolean => selectedCategory === 'transfer' && transferMode === 'vehicle';

  const handleActualSubmit = (values: ServicePriceFormValues) => {
    const { transferMode: _formTransferMode, ...dataToSubmit } = values;

    if (dataToSubmit.category === 'hotel' && dataToSubmit.hotelDetails) {
      dataToSubmit.hotelDetails.name = dataToSubmit.name; 
      dataToSubmit.hotelDetails.province = dataToSubmit.province || ''; 
      dataToSubmit.hotelDetails.roomTypes = dataToSubmit.hotelDetails.roomTypes.map(rt => ({
        ...rt,
        seasonalPrices: rt.seasonalPrices.map(sp => ({
            ...sp,
            startDate: (sp.startDate as Date).toISOString().split('T')[0],
            endDate: (sp.endDate as Date).toISOString().split('T')[0],
            extraBedRate: rt.extraBedAllowed ? sp.extraBedRate : undefined, 
        })),
      }));
      dataToSubmit.subCategory = undefined;
      dataToSubmit.price1 = undefined;
      dataToSubmit.price2 = undefined;
      dataToSubmit.unitDescription = dataToSubmit.unitDescription || "per night";
    } else if (dataToSubmit.category !== 'hotel') {
      dataToSubmit.hotelDetails = undefined;
      dataToSubmit.unitDescription = dataToSubmit.unitDescription || (dataToSubmit.category === 'transfer' && values.transferMode === 'vehicle' ? 'per vehicle' : 'per person');
    }

    if (dataToSubmit.category === 'transfer') {
        if (values.transferMode === 'ticket') {
            dataToSubmit.subCategory = 'ticket';
            dataToSubmit.maxPassengers = undefined;
        }
    } else {
        dataToSubmit.maxPassengers = undefined;
    }

    if (dataToSubmit.province === "none") {
      dataToSubmit.province = undefined;
    }

    onSubmit({ ...dataToSubmit } as Omit<ServicePriceItem, 'id'>);
  };

  const subCategoryLabel = getSubCategoryLabel();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleActualSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] md:h-[70vh] pr-3">
            <div className="space-y-6 p-1">
                <div className="border border-border rounded-md p-4 relative">
                    <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Basic Service Details</p>
                    <div className="space-y-4 pt-2">
                        <FormField
                            control={form.control}
                            name="province"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Province / Location (Optional)</FormLabel>
                                <Select
                                    onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                                    value={field.value || "none"}
                                    disabled={isLoadingProvinces}
                                >
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select province..." />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="none">— Select —</SelectItem>
                                    {provinces.map(p => (
                                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Service / Hotel Name</FormLabel>
                                <FormControl><Input placeholder="e.g., City Tour, Oceanview Resort" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Currency</FormLabel>
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
                            name="notes" // General service notes
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>General Service Notes (Optional)</FormLabel>
                                <FormControl><Textarea placeholder="Additional details about the service or pricing" {...field} value={field.value || ''} rows={2} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>


                {showSimplePricingFields && (
                    <div className="border border-border rounded-md p-4 relative mt-6">
                        <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Pricing Details: {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</p>
                        <div className="space-y-4 pt-2">
                            {selectedCategory === 'transfer' && (
                                <FormField
                                    control={form.control}
                                    name="transferMode"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Transfer Mode</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select transfer mode" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="ticket">Ticket Basis</SelectItem>
                                            <SelectItem value="vehicle">Vehicle Basis</SelectItem>
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )}

                            {selectedCategory === 'transfer' && transferMode === 'vehicle' && (
                                <FormField
                                    control={form.control}
                                    name="subCategory"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select vehicle type" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {VEHICLE_TYPES.map(vType => <SelectItem key={vType} value={vType}>{vType}</SelectItem>)}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )}

                            {showSubCategoryInput() && subCategoryLabel && (
                                <FormField
                                    control={form.control}
                                    name="subCategory"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{subCategoryLabel}</FormLabel>
                                        <FormControl><Input placeholder={subCategoryLabel.startsWith("Vehicle Type") ? "e.g., Sedan, SUV" : "Details..."} {...field} value={field.value || ''}/></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="price1"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{getPrice1Label()}</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} value={field.value ?? ''}/></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                {getPrice2Label() && (
                                    <FormField
                                    control={form.control}
                                    name="price2"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{getPrice2Label()}</FormLabel>
                                        <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                )}
                            </div>
                            {showMaxPassengers() && (
                                <FormField
                                    control={form.control}
                                    name="maxPassengers"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Passengers (per vehicle)</FormLabel>
                                        <FormControl><Input type="number" placeholder="e.g., 4" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} min="1" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )}
                             <FormField
                                control={form.control}
                                name="unitDescription"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unit Description</FormLabel>
                                    <FormControl><Input placeholder="e.g., per adult, per vehicle" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}


                {selectedCategory === 'hotel' && (
                    <div className="border border-border rounded-md p-4 mt-6 relative">
                         <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">Room Types &amp; Nightly Rates</p>

                        <div id="roomTypesContainer" className="space-y-6 pt-2">
                        {roomTypeFields.map((roomField, roomIndex) => {
                            const roomTypeName = form.watch(`hotelDetails.roomTypes.${roomIndex}.name`);
                            return (
                            <div key={roomField.fieldId} className="border border-border rounded-md p-4 pt-6 relative bg-card shadow-sm">
                                <p className="text-base font-medium -mt-6 ml-2 px-1 bg-card inline-block absolute left-2 top-[0.1rem] max-w-[calc(100%-3rem)] truncate">
                                 {roomTypeName || `Room Type ${roomIndex + 1}`}
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => roomTypeFields.length > 1 ? removeRoomType(roomIndex) : null}
                                    disabled={roomTypeFields.length <= 1}
                                    className="absolute top-1 right-1 h-7 w-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-sm hover:bg-destructive/80 disabled:opacity-50"
                                    aria-label="Remove Room Type"
                                >
                                    <XIcon size={16}/>
                                </Button>

                                <div className="space-y-3 pt-2">
                                  <FormField
                                      control={form.control}
                                      name={`hotelDetails.roomTypes.${roomIndex}.name`}
                                      render={({ field }) => (
                                          <FormItem>
                                          <FormLabel className="text-sm text-muted-foreground">Room Type Name</FormLabel>
                                          <FormControl><Input placeholder="e.g., Deluxe Pool View" {...field} /></FormControl>
                                          <FormMessage />
                                          </FormItem>
                                      )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`hotelDetails.roomTypes.${roomIndex}.extraBedAllowed`}
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                              field.onChange(checked);
                                              // If unchecked, clear extra bed rates for all seasons of this room type
                                              if (!checked) {
                                                const seasons = form.getValues(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`);
                                                seasons.forEach((_, seasonIdx) => {
                                                  form.setValue(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIdx}.extraBedRate`, undefined);
                                                });
                                              }
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal cursor-pointer">
                                          Extra Bed Permitted for this Room Type?
                                        </FormLabel>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                   <FormField
                                        control={form.control}
                                        name={`hotelDetails.roomTypes.${roomIndex}.notes`}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm text-muted-foreground">Room Details (Size, Amenities, Bed Type, View, etc.)</FormLabel>
                                            <FormControl>
                                            <Textarea
                                                placeholder="Describe room features, size, bed configuration, view, key amenities..."
                                                {...field}
                                                value={field.value || ''}
                                                rows={3}
                                            />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                
                                <SeasonalRatesTable roomIndex={roomIndex} form={form} currency={form.getValues('currency')} />

                                <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3 border-primary text-primary hover:bg-primary/10 add-btn"
                                onClick={() => {
                                    const currentRoomSeasonalPrices = form.getValues(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`) || [];
                                    form.setValue(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`, [
                                        ...currentRoomSeasonalPrices,
                                        { id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: undefined }
                                    ]);
                                }}
                                >
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Season
                                </Button>
                                 {(form.formState.errors.hotelDetails?.roomTypes?.[roomIndex] as any)?.seasonalPrices?.message && (
                                     <FormMessage className="mt-2 text-xs text-destructive">
                                        {(form.formState.errors.hotelDetails?.roomTypes?.[roomIndex] as any)?.seasonalPrices?.message}
                                    </FormMessage>
                                 )}
                            </div>
                            );
                        })}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => appendRoomType({
                                id: generateGUID(),
                                name: `Room Type ${roomTypeFields.length + 1}`,
                                extraBedAllowed: false,
                                notes: '',
                                characteristics: [],
                                seasonalPrices: [{ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: undefined }]
                            })}
                            className="mt-4 border-accent text-accent hover:bg-accent/10 add-btn"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Room Type
                        </Button>
                         {(form.formState.errors.hotelDetails?.roomTypes as any)?.message && (
                            <FormMessage className="mt-2 text-sm text-destructive">{(form.formState.errors.hotelDetails?.roomTypes as any).message}</FormMessage>
                         )}
                         {form.formState.errors.hotelDetails?.root?.message && (
                            <FormMessage className="mt-2 text-sm text-destructive">{form.formState.errors.hotelDetails.root.message}</FormMessage>
                         )}
                    </div>
                )}
            </div>
        </ScrollArea>
        <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {initialData?.id ? 'Update' : 'Create'} Service Price
          </Button>
        </div>
      </form>
    </Form>
  );
}


interface SeasonalRatesTableProps {
  roomIndex: number;
  form: ReturnType<typeof useForm<ServicePriceFormValues>>; // More specific type
  currency: CurrencyCode;
}

function SeasonalRatesTable({ roomIndex, form, currency }: SeasonalRatesTableProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `hotelDetails.roomTypes.${roomIndex}.seasonalPrices`,
    keyName: "seasonFieldId" 
  });

  const roomExtraBedAllowed = useWatch({
    control: form.control,
    name: `hotelDetails.roomTypes.${roomIndex}.extraBedAllowed`,
  });

  React.useEffect(() => {
    if (fields.length === 0) {
      append({ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: undefined });
    }
  }, [fields, append]);
  

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
                <Controller
                  control={form.control}
                  name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.startDate`}
                  render={({ field, fieldState: { error } }) => (
                    <FormItem>
                      <FormControl>
                        <DatePicker date={field.value} onDateChange={field.onChange} />
                      </FormControl>
                      {error && <FormMessage className="text-xs">{error.message}</FormMessage>}
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell className="px-2 py-1">
                <Controller
                  control={form.control}
                  name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.endDate`}
                  render={({ field, fieldState: { error } }) => (
                    <FormItem>
                      <FormControl>
                        <DatePicker
                            date={field.value}
                            onDateChange={field.onChange}
                            minDate={form.getValues(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.startDate`)}
                        />
                      </FormControl>
                       {error && <FormMessage className="text-xs">{error.message}</FormMessage>}
                       {form.formState.errors.hotelDetails?.roomTypes?.[roomIndex]?.seasonalPrices?.[seasonIndex]?.endDate?.message && (
                         <FormMessage className="text-xs">{form.formState.errors.hotelDetails.roomTypes[roomIndex].seasonalPrices[seasonIndex].endDate.message}</FormMessage>
                       )}
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell className="px-2 py-1">
                <FormField
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
                    <FormField
                    control={form.control}
                    name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.extraBedRate`}
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                value={field.value ?? ''}
                                onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                                className="h-9 text-sm"
                            />
                            </FormControl>
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
                  onClick={() => fields.length > 1 ? remove(seasonIndex) : null}
                  disabled={fields.length <= 1}
                  className="h-7 w-7 text-destructive hover:text-destructive/80 disabled:opacity-50 remove-season flex items-center justify-center"
                  aria-label="Remove Season"
                >
                  <XIcon size={18} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
       {(form.formState.errors.hotelDetails?.roomTypes?.[roomIndex]?.seasonalPrices as any)?.message && (
            <FormMessage className="text-xs text-destructive">{(form.formState.errors.hotelDetails?.roomTypes?.[roomIndex]?.seasonalPrices as any).message}</FormMessage>
       )}
    </div>
  );
}
