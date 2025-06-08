
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
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
import { Card } from '@/components/ui/card';


const hotelRoomSeasonalPriceSchema = z.object({
  id: z.string(),
  seasonName: z.string().optional(), // Kept for data model, not in UI per HTML
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
  characteristics: z.array(z.object({ id: z.string(), key: z.string(), value: z.string() })).optional(), // Kept for data model
  notes: z.string().optional(), // Kept for data model
  seasonalPrices: z.array(hotelRoomSeasonalPriceSchema).min(1, "At least one seasonal price is required."),
});

const hotelDetailsSchema = z.object({
  id: z.string(),
  name: z.string(), // Hotel name is part of the main ServicePriceItem
  province: z.string(), // Province is part of the main ServicePriceItem
  roomTypes: z.array(hotelRoomTypeSchema).min(1, "At least one room type is required for detailed hotel pricing."),
});

const servicePriceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  province: z.string().optional(),
  category: z.custom<ItineraryItemType>((val) => SERVICE_CATEGORIES.includes(val as ItineraryItemType), "Invalid category"),
  subCategory: z.string().optional(), // Used for non-hotel or simple hotel
  price1: z.coerce.number().min(0, "Price must be non-negative").optional(), // Used for non-hotel or simple hotel
  price2: z.coerce.number().min(0, "Price must be non-negative").optional(), // Used for non-hotel or simple hotel
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency"),
  unitDescription: z.string().min(1, "Unit description is required (e.g., per adult, per night)"),
  notes: z.string().optional(),
  transferMode: z.enum(['ticket', 'vehicle']).optional(),
  maxPassengers: z.coerce.number().min(1, "Max passengers must be at least 1").optional(),
  // Conditional validation for hotelDetails
  hotelDetails: hotelDetailsSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.category === 'hotel') {
    if (!data.hotelDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Detailed hotel pricing (room types and seasons) is required for hotel category.",
        path: ["hotelDetails"],
      });
    }
  } else {
    // For non-hotel, ensure price1 is set (unless it's a transfer vehicle, where costPerVehicle is used)
    if (data.category !== 'transfer' || data.transferMode !== 'vehicle') {
        if (typeof data.price1 !== 'number') {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Price 1 / Default Rate is required.",
                path: ["price1"],
            });
        }
    }
    if (data.category === 'transfer' && data.transferMode === 'vehicle' && typeof data.price1 !== 'number') {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Cost Per Vehicle is required.",
            path: ["price1"],
        });
    }
  }
});

type ServicePriceFormValues = z.infer<typeof servicePriceSchema>;

interface ServicePriceFormProps {
  initialData?: ServicePriceItem;
  onSubmit: (data: Omit<ServicePriceItem, 'id'>) => void;
  onCancel: () => void;
}

export function ServicePriceForm({ initialData, onSubmit, onCancel }: ServicePriceFormProps) {
  const { provinces, isLoading: isLoadingProvinces } = useProvinces();
  
  const transformInitialData = (data?: ServicePriceItem): Partial<ServicePriceFormValues> => {
    if (!data) return { category: "activity", currency: "THB", unitDescription: "per person" };

    const baseTransformed: Partial<ServicePriceFormValues> = {
      name: data.name || "",
      province: data.province || "none",
      category: data.category || "activity",
      currency: data.currency || "THB",
      unitDescription: data.unitDescription || "",
      notes: data.notes || "",
    };

    if (data.category === 'hotel' && data.hotelDetails) {
      baseTransformed.hotelDetails = {
        ...data.hotelDetails,
        roomTypes: data.hotelDetails.roomTypes.map(rt => ({
          ...rt,
          seasonalPrices: rt.seasonalPrices.map(sp => ({
            ...sp,
            startDate: sp.startDate ? new Date(sp.startDate) : new Date(),
            endDate: sp.endDate ? new Date(sp.endDate) : new Date(),
          })),
        })),
      };
    } else if (data.category === 'hotel') {
      // If it's a hotel but no hotelDetails (old data or AI prefill), create a basic structure
      baseTransformed.hotelDetails = {
        id: data.id, // Or generateGUID() if no id from initialData
        name: data.name,
        province: data.province || "none",
        roomTypes: [{
          id: generateGUID(),
          name: data.subCategory || 'Default Room',
          seasonalPrices: data.seasonalRates && data.seasonalRates.length > 0 ? 
            data.seasonalRates.map(sr => ({
              id: sr.id || generateGUID(),
              startDate: sr.startDate ? new Date(sr.startDate) : new Date(),
              endDate: sr.endDate ? new Date(sr.endDate) : new Date(),
              rate: sr.roomRate,
              extraBedRate: sr.extraBedRate,
            })) : [{ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: data.price1 || 0, extraBedRate: data.price2 }]
        }]
      };
      // Clear out simpler hotel fields if we are using hotelDetails
      baseTransformed.subCategory = undefined;
      baseTransformed.price1 = undefined;
      baseTransformed.price2 = undefined;
    } else {
      // Non-hotel categories
      baseTransformed.subCategory = data.subCategory || "";
      baseTransformed.price1 = data.price1 || 0;
      baseTransformed.price2 = data.price2;
      if (data.category === 'transfer') {
        baseTransformed.transferMode = data.subCategory === 'ticket' ? 'ticket' : 'vehicle';
        baseTransformed.maxPassengers = data.maxPassengers || undefined;
      }
    }
    return baseTransformed;
  };


  const form = useForm<ServicePriceFormValues>({
    resolver: zodResolver(servicePriceSchema),
    defaultValues: transformInitialData(initialData),
  });
  
  const selectedCategory = form.watch("category");
  const transferMode = form.watch("transferMode");

  const { fields: roomTypeFields, append: appendRoomType, remove: removeRoomType } = useFieldArray({
    control: form.control,
    name: "hotelDetails.roomTypes",
    keyName: "fieldId" // To prevent re-rendering issues with default key 'id'
  });

  React.useEffect(() => {
    if (selectedCategory === 'hotel' && !form.getValues('hotelDetails')) {
      form.setValue('hotelDetails', {
        id: initialData?.id || generateGUID(),
        name: form.getValues('name'), // Use main service name for hotelDetails name
        province: form.getValues('province') || 'none',
        roomTypes: [],
      });
      if (initialData?.hotelDetails?.roomTypes?.length === 0 || (!initialData?.hotelDetails && initialData?.category ==='hotel' && roomTypeFields.length === 0) ) {
         setTimeout(() => appendRoomType({ 
            id: generateGUID(), 
            name: 'Standard Room', 
            seasonalPrices: [{ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: 0 }]
        }), 0);
      }
    } else if (selectedCategory !== 'hotel') {
      form.setValue('hotelDetails', undefined);
    }
  }, [selectedCategory, form, initialData, appendRoomType, roomTypeFields.length]);


  React.useEffect(() => {
    if (selectedCategory === 'transfer') {
      const currentTransferMode = form.getValues('transferMode');
      if (!currentTransferMode) {
        form.setValue('transferMode', 'ticket');
        form.setValue('subCategory', 'ticket'); // Default subCategory for ticket mode
      } else {
         if (currentTransferMode === 'ticket') {
            form.setValue('subCategory', 'ticket');
            form.setValue('maxPassengers', undefined);
        } else if (currentTransferMode === 'vehicle' && (form.getValues('subCategory') === 'ticket' || !form.getValues('subCategory'))){
            // If switching to vehicle and subCategory is ticket or empty, set to a default vehicle type
            form.setValue('subCategory', initialData?.category === 'transfer' && initialData?.subCategory && initialData.subCategory !== 'ticket' ? initialData.subCategory : VEHICLE_TYPES[0]);
        }
      }
    } else {
       form.setValue('transferMode', undefined);
       form.setValue('maxPassengers', undefined);
       // If not transfer, and subCategory was 'ticket', clear it
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
      // Hotel simple pricing is deprecated in favor of hotelDetails
      case 'misc': return "Unit Cost";
      default: return "Price 1 / Default Rate";
    }
  };

  const getPrice2Label = (): string | null => {
    switch (selectedCategory) {
      case 'activity': return "Child Price (Optional)";
      case 'meal': return "Child Meal Price (Optional)";
      case 'transfer': return transferMode === 'ticket' ? "Child Ticket Price (Optional)" : null;
      // Hotel simple pricing is deprecated
      default: return null;
    }
  };

  const getSubCategoryLabel = (): string | null => {
    switch (selectedCategory) {
        case 'activity': return "Activity Type (e.g., Guided, Entrance)";
        case 'meal': return "Meal Type (e.g., Set Menu, Buffet)";
        case 'transfer': return transferMode === 'vehicle' ? "Vehicle Type" : null;
        // Hotel simple pricing is deprecated
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

    // Ensure hotelDetails has the main service name and province
    if (dataToSubmit.category === 'hotel' && dataToSubmit.hotelDetails) {
      dataToSubmit.hotelDetails.name = dataToSubmit.name;
      dataToSubmit.hotelDetails.province = dataToSubmit.province || 'none'; // Ensure province is set
      dataToSubmit.hotelDetails.roomTypes = dataToSubmit.hotelDetails.roomTypes.map(rt => ({
        ...rt,
        seasonalPrices: rt.seasonalPrices.map(sp => ({
            ...sp,
            startDate: (sp.startDate as Date).toISOString().split('T')[0],
            endDate: (sp.endDate as Date).toISOString().split('T')[0],
        })),
      }));
      // Clear simpler hotel fields when using detailed pricing
      dataToSubmit.subCategory = undefined;
      dataToSubmit.price1 = undefined;
      dataToSubmit.price2 = undefined;
    } else if (dataToSubmit.category !== 'hotel') {
      dataToSubmit.hotelDetails = undefined; // Ensure hotelDetails is undefined for non-hotels
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
                {/* BASIC SERVICE DETAILS FIELDSET */}
                <div className="border border-border rounded-md p-4">
                    <p className="text-sm font-semibold -mt-6 px-1 bg-background inline-block mb-4">Basic Service Details</p>
                    <div className="space-y-4">
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
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl><Textarea placeholder="Additional details about the service or pricing" {...field} value={field.value || ''} rows={2} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>


                {/* CONDITIONAL PRICING FIELDS (NON-HOTEL OR SIMPLE HOTEL) */}
                {showSimplePricingFields && (
                    <div className="border border-border rounded-md p-4 mt-6">
                        <p className="text-sm font-semibold -mt-6 px-1 bg-background inline-block mb-4">Pricing Details: {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</p>
                        <div className="space-y-4">
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
                                        <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl>
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


                {/* HOTEL DETAILS FIELDSET (ROOM TYPES & SEASONS) */}
                {selectedCategory === 'hotel' && (
                    <div className="border border-border rounded-md p-4 mt-6">
                        <p className="text-sm font-semibold -mt-6 px-1 bg-background inline-block mb-4">Room Types &amp; Nightly Rates</p>
                        
                        <div id="roomTypesContainer" className="space-y-6">
                        {roomTypeFields.map((roomField, roomIndex) => {
                            const roomTypeName = form.watch(`hotelDetails.roomTypes.${roomIndex}.name`);
                            return (
                            <div key={roomField.fieldId} className="border border-border rounded-md p-4 pt-8 relative bg-card shadow-sm"> {/* Adjusted pt for legend */}
                                <p className="text-base font-medium -mt-11 px-1 bg-card inline-block mb-3 absolute left-2 top-4"> {/* Legend styling */}
                                {roomTypeName || `Room Type`}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => removeRoomType(roomIndex)}
                                    className="absolute top-2 right-2 h-7 w-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-sm hover:bg-destructive/80"
                                    aria-label="Remove Room Type"
                                >
                                    <XIcon size={16}/>
                                </button>

                                <div className="form-group mb-3"> {/* From HTML example */}
                                  <FormField
                                      control={form.control}
                                      name={`hotelDetails.roomTypes.${roomIndex}.name`}
                                      render={({ field }) => (
                                          <FormItem>
                                          <FormLabel className="text-sm text-muted-foreground">Room Type Name</FormLabel> {/* From HTML example */}
                                          <FormControl><Input placeholder="e.g., Deluxe Pool View" {...field} /></FormControl>
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
                                className="mt-3 border-primary text-primary hover:bg-primary/10 add-btn" // Added add-btn like class for consistency if needed
                                onClick={() => {
                                    const currentRoomSeasonalPrices = form.getValues(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`) || [];
                                    form.setValue(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`, [
                                        ...currentRoomSeasonalPrices,
                                        { id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: 0 }
                                    ]);
                                }}
                                >
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Season
                                </Button>
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
                                seasonalPrices: [{ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: 0 }]
                            })}
                            className="mt-4 border-accent text-accent hover:bg-accent/10 add-btn" // Added add-btn like class
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Room Type
                        </Button>
                         {form.formState.errors.hotelDetails?.roomTypes && typeof form.formState.errors.hotelDetails.roomTypes === 'string' && (
                             <FormMessage className="mt-2">{form.formState.errors.hotelDetails.roomTypes}</FormMessage>
                         )}
                         {form.formState.errors.hotelDetails?.root?.message && (
                            <FormMessage className="mt-2">{form.formState.errors.hotelDetails.root.message}</FormMessage>
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
  form: any; // Control from react-hook-form
  currency: CurrencyCode;
}

function SeasonalRatesTable({ roomIndex, form, currency }: SeasonalRatesTableProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `hotelDetails.roomTypes.${roomIndex}.seasonalPrices`,
    keyName: "seasonFieldId" 
  });
  
  // Ensure there's always at least one row if fields is empty initially
  React.useEffect(() => {
    if (fields.length === 0) {
      append({ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: 0 });
    }
  }, [fields, append]);


  return (
    <div className="space-y-1"> {/* Reduced space for tighter table layout */}
      {/* <Label className="text-sm">Seasonal Periods</Label> // Removed as per HTML structure */}
      <Table className="mb-1 border"> {/* Reduced margin */}
        <TableHeader className="bg-muted/30"> {/* Closer to HTML's th background */}
          <TableRow>
            <TableHead className="w-[180px] px-2 py-1 text-xs">Start Date</TableHead> {/* Adjusted padding & font size */}
            <TableHead className="w-[180px] px-2 py-1 text-xs">End Date</TableHead>
            <TableHead className="px-2 py-1 text-xs">Nightly Rate ({currency})</TableHead>
            <TableHead className="px-2 py-1 text-xs">Extra Bed ({currency})</TableHead>
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
                      <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-9 text-sm" /></FormControl> {/* Adjusted height & text size */}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell className="px-2 py-1">
                <FormField
                  control={form.control}
                  name={`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIndex}.extraBedRate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} className="h-9 text-sm" /></FormControl> {/* Adjusted height & text size */}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell className="text-center px-1 py-1">
                <button
                  type="button"
                  onClick={() => fields.length > 1 ? remove(seasonIndex) : null}
                  disabled={fields.length <= 1}
                  className="h-7 w-7 text-destructive hover:text-destructive/80 disabled:opacity-50 remove-season" // Added remove-season class
                  aria-label="Remove Season"
                >
                  <XIcon size={18} /> {/* Slightly larger X for visibility */}
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
        {form.formState.errors.hotelDetails?.roomTypes?.[roomIndex]?.seasonalPrices && typeof form.formState.errors.hotelDetails.roomTypes[roomIndex].seasonalPrices === 'string' && (
            <FormMessage className="text-xs">{ (form.formState.errors.hotelDetails.roomTypes[roomIndex].seasonalPrices as any).message || form.formState.errors.hotelDetails.roomTypes[roomIndex].seasonalPrices }</FormMessage>
        )}
    </div>
  );
}

```