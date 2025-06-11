
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ServicePriceItem, CurrencyCode, ItineraryItemType, VehicleType, HotelDefinition, HotelRoomTypeDefinition, RoomTypeSeasonalPrice, ActivityPackageDefinition, SchedulingData, SurchargePeriod, VehicleOption } from '@/types/itinerary';
import { CURRENCIES, SERVICE_CATEGORIES, VEHICLE_TYPES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

import { CommonPriceFields } from './CommonPriceFields';
import { HotelPriceForm } from './HotelPriceForm';
import { ActivityPriceForm } from './ActivityPriceForm';
import { TransferPriceForm } from './TransferPriceForm';
import { MealPriceForm } from './MealPriceForm';
import { MiscellaneousPriceForm } from './MiscellaneousPriceForm';
import { addDays } from 'date-fns'; // Import addDays

// --- Zod Schemas (copied from the old service-price-form.tsx) ---
const hotelRoomSeasonalPriceSchema = z.object({
  id: z.string(),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  rate: z.coerce.number().min(0, "Nightly rate must be non-negative"),
  extraBedRate: z.coerce.number().min(0, "Extra bed rate must be non-negative").optional(),
}).refine(data => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

const hotelRoomTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Room type name is required"),
  extraBedAllowed: z.boolean().optional().default(false),
  notes: z.string().optional().describe("Room Details: Size, Amenities, Bed Type, View etc."),
  seasonalPrices: z.array(hotelRoomSeasonalPriceSchema).min(1, "At least one seasonal price is required."),
  characteristics: z.array(z.object({ id: z.string(), key: z.string(), value: z.string() })).optional(),
});

const hotelDetailsSchema = z.object({
  id: z.string(),
  name: z.string(), // Will be synced with top-level name
  province: z.string(), // Will be synced with top-level province
  roomTypes: z.array(hotelRoomTypeSchema).min(1, "At least one room type is required for detailed hotel pricing."),
});

const activityPackageSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Package name is required"),
  price1: z.coerce.number().min(0, "Adult price must be non-negative"),
  price2: z.coerce.number().min(0, "Child price must be non-negative").optional(),
  notes: z.string().optional(),
  validityStartDate: z.string().optional().describe("ISO date string for package validity start"),
  validityEndDate: z.string().optional().describe("ISO date string for package validity end"),
  closedWeekdays: z.array(z.number().min(0).max(6)).optional().describe("Array of day numbers (0=Sun, 6=Sat) when package is closed"),
  specificClosedDates: z.array(z.string()).optional().describe("Array of ISO date strings for specific closed dates"),
}).refine(data => {
    if (data.validityStartDate && data.validityEndDate) {
        try {
            return new Date(data.validityEndDate) >= new Date(data.validityStartDate);
        } catch (e) { return true; }
    }
    return true;
}, {
    message: "Package validity end date cannot be before start date.",
    path: ["validityEndDate"],
});

const surchargePeriodSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Surcharge name is required"),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  surchargeAmount: z.coerce.number().min(0, "Surcharge amount must be non-negative"),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

const vehicleOptionSchema = z.object({
  id: z.string(),
  vehicleType: z.custom<VehicleType>((val) => VEHICLE_TYPES.includes(val as VehicleType), "Invalid vehicle type"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  maxPassengers: z.coerce.number().int().min(1, "Max passengers must be at least 1"),
  notes: z.string().optional(),
});

const servicePriceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  province: z.string().optional(),
  category: z.custom<ItineraryItemType>((val) => SERVICE_CATEGORIES.includes(val as ItineraryItemType), "Invalid category"),
  subCategory: z.string().optional(),
  price1: z.coerce.number().min(0, "Price must be non-negative").optional(),
  price2: z.coerce.number().min(0, "Price must be non-negative").optional(),
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency"),
  unitDescription: z.string().min(1, "Unit description is required"),
  notes: z.string().optional(),
  transferMode: z.enum(['ticket', 'vehicle']).optional(),
  vehicleOptions: z.array(vehicleOptionSchema).optional(),
  maxPassengers: z.coerce.number().int().min(1).optional(),
  hotelDetails: hotelDetailsSchema.optional(),
  activityPackages: z.array(activityPackageSchema).optional(),
  surchargePeriods: z.array(surchargePeriodSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.category === 'hotel') {
    if (!data.hotelDetails || !data.hotelDetails.roomTypes || data.hotelDetails.roomTypes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "For hotels, add at least one room type with seasonal pricing.",
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
      });
    }
    data.price1 = undefined; data.price2 = undefined; data.subCategory = undefined;
    data.vehicleOptions = undefined; data.transferMode = undefined; data.maxPassengers = undefined;
  } else if (data.category === 'activity') {
    if ((!data.activityPackages || data.activityPackages.length === 0) && typeof data.price1 !== 'number') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Define at least one package or provide a default Adult Price (if no packages).",
            path: ["activityPackages"],
        });
    }
    data.price1 = (data.activityPackages && data.activityPackages.length > 0) ? undefined : data.price1;
    data.price2 = (data.activityPackages && data.activityPackages.length > 0) ? undefined : data.price2;
    data.subCategory = undefined; data.hotelDetails = undefined;
    data.vehicleOptions = undefined; data.transferMode = undefined; data.maxPassengers = undefined;
  } else if (data.category === 'transfer') {
    if (data.transferMode === 'vehicle') {
      if (!data.vehicleOptions || data.vehicleOptions.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "For vehicle transfers, define at least one vehicle option.",
          path: ["vehicleOptions"],
        });
      }
      data.price1 = undefined; data.price2 = undefined; data.subCategory = undefined; data.maxPassengers = undefined;
    } else { // ticket mode
      if (typeof data.price1 !== 'number') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Adult Ticket Price is required.",
            path: ["price1"],
        });
      }
      data.subCategory = 'ticket';
      data.vehicleOptions = undefined; data.surchargePeriods = undefined;
    }
    data.hotelDetails = undefined; data.activityPackages = undefined;
  } else { // meal, misc
    if (typeof data.price1 !== 'number') {
      ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Primary price (e.g., Adult Price, Unit Cost) is required.",
          path: ["price1"],
      });
    }
    data.hotelDetails = undefined; data.activityPackages = undefined;
    data.vehicleOptions = undefined; data.transferMode = undefined; data.surchargePeriods = undefined; data.maxPassengers = undefined;
  }
});
// --- End Zod Schemas ---

type ServicePriceFormValues = z.infer<typeof servicePriceSchema>;

interface ServicePriceFormRouterProps {
  initialData?: Partial<ServicePriceItem>;
  onSubmit: (data: Omit<ServicePriceItem, 'id'>) => void;
  onCancel: () => void;
}

const transformInitialDataToFormValues = (data?: Partial<ServicePriceItem>): Partial<ServicePriceFormValues> => {
  const defaultCurrency: CurrencyCode = "THB";
  const defaultCategory: ItineraryItemType = "activity";
  const today = new Date();
  const thirtyDaysFromToday = addDays(today, 30);


  if (!data || Object.keys(data).length === 0) { // Default for new item
    return {
      category: defaultCategory,
      currency: defaultCurrency,
      name: "",
      activityPackages: [{
        id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '',
        validityStartDate: today.toISOString().split('T')[0],
        validityEndDate: thirtyDaysFromToday.toISOString().split('T')[0],
        closedWeekdays: [], specificClosedDates: []
      }],
      unitDescription: "per person",
    };
  }

  const baseTransformed: Partial<ServicePriceFormValues> = {
    name: data.name || "",
    province: data.province || undefined,
    category: data.category || defaultCategory,
    currency: data.currency || defaultCurrency,
    unitDescription: data.unitDescription || "",
    notes: data.notes || "",
    surchargePeriods: data.surchargePeriods?.map(sp => ({
      ...sp,
      startDate: sp.startDate ? new Date(sp.startDate) : today,
      endDate: sp.endDate ? new Date(sp.endDate) : thirtyDaysFromToday,
    })) || [],
  };

  if (baseTransformed.category === 'hotel') {
    let roomTypes: HotelRoomTypeDefinition[] = [];
    if (data.hotelDetails?.roomTypes && data.hotelDetails.roomTypes.length > 0) {
      roomTypes = data.hotelDetails.roomTypes.map(rt => ({
        ...rt, extraBedAllowed: rt.extraBedAllowed ?? false, notes: rt.notes || "",
        seasonalPrices: rt.seasonalPrices.map(sp => ({
          ...sp,
          startDate: sp.startDate ? new Date(sp.startDate as unknown as string) : today,
          endDate: sp.endDate ? new Date(sp.endDate as unknown as string) : thirtyDaysFromToday,
          extraBedRate: rt.extraBedAllowed ? (sp.extraBedRate ?? undefined) : undefined,
        })),
      }));
    } else if (data.price1 !== undefined) {
      roomTypes.push({
        id: generateGUID(), name: data.subCategory || 'Standard Room', extraBedAllowed: (typeof data.price2 === 'number' && data.price2 > 0),
        notes: data.notes || "", characteristics: [],
        seasonalPrices: [{ id: generateGUID(), startDate: today, endDate: thirtyDaysFromToday, rate: data.price1 || 0, extraBedRate: (typeof data.price2 === 'number' && data.price2 > 0) ? data.price2 : undefined }],
      });
    }
    if (roomTypes.length === 0) { roomTypes.push({ id: generateGUID(), name: 'Standard Room', extraBedAllowed: false, notes: '', characteristics: [], seasonalPrices: [{ id: generateGUID(), startDate: today, endDate: thirtyDaysFromToday, rate: 0, extraBedRate: undefined }] }); }
    baseTransformed.hotelDetails = { id: data.hotelDetails?.id || data.id || generateGUID(), name: baseTransformed.name || data.hotelDetails?.name || 'New Hotel', province: baseTransformed.province || data.hotelDetails?.province || '', roomTypes, };
    baseTransformed.price1 = undefined; baseTransformed.price2 = undefined; baseTransformed.subCategory = undefined;
    baseTransformed.unitDescription = data.unitDescription || 'per night';
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;

  } else if (baseTransformed.category === 'activity') {
    let packages: ActivityPackageDefinition[] = [];
    if (data.activityPackages && data.activityPackages.length > 0) {
      packages = data.activityPackages.map(pkg => ({ ...pkg, validityStartDate: pkg.validityStartDate || today.toISOString().split('T')[0], validityEndDate: pkg.validityEndDate || thirtyDaysFromToday.toISOString().split('T')[0], closedWeekdays: pkg.closedWeekdays || [], specificClosedDates: pkg.specificClosedDates || [] }));
    } else if (data.price1 !== undefined) {
      packages = [{ id: generateGUID(), name: data.subCategory || 'Standard Package', price1: data.price1, price2: data.price2, notes: data.notes || '', validityStartDate: today.toISOString().split('T')[0], validityEndDate: thirtyDaysFromToday.toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }];
    }
    if (packages.length === 0) { packages = [{ id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '', validityStartDate: today.toISOString().split('T')[0], validityEndDate: thirtyDaysFromToday.toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }]; }
    baseTransformed.activityPackages = packages;
    baseTransformed.price1 = undefined; baseTransformed.price2 = undefined; baseTransformed.subCategory = undefined;
    baseTransformed.unitDescription = data.unitDescription || 'per person';
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;

  } else if (baseTransformed.category === 'transfer') {
    baseTransformed.transferMode = data.transferMode || (data.subCategory === 'ticket' ? 'ticket' : (data.vehicleOptions && data.vehicleOptions.length > 0 ? 'vehicle' : 'ticket'));
    if (baseTransformed.transferMode === 'vehicle') {
      baseTransformed.vehicleOptions = data.vehicleOptions && data.vehicleOptions.length > 0 ? data.vehicleOptions : [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1 }];
      baseTransformed.price1 = undefined; baseTransformed.price2 = undefined; baseTransformed.subCategory = undefined; baseTransformed.maxPassengers = undefined;
      baseTransformed.unitDescription = data.unitDescription || 'per service';
    } else { // ticket mode
      baseTransformed.price1 = data.price1 ?? 0;
      baseTransformed.price2 = data.price2;
      baseTransformed.subCategory = 'ticket';
      baseTransformed.unitDescription = data.unitDescription || 'per person';
      baseTransformed.vehicleOptions = undefined;
      baseTransformed.surchargePeriods = undefined;
    }
    baseTransformed.hotelDetails = undefined; baseTransformed.activityPackages = undefined;
  } else { // meal, misc
    baseTransformed.subCategory = data.subCategory || "";
    baseTransformed.price1 = data.price1 ?? 0;
    baseTransformed.price2 = data.price2;
    baseTransformed.hotelDetails = undefined; baseTransformed.activityPackages = undefined;
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;
    baseTransformed.unitDescription = data.unitDescription || 'per person';
    baseTransformed.surchargePeriods = undefined;
  }
  return baseTransformed;
};


export function ServicePriceFormRouter({ initialData, onSubmit, onCancel }: ServicePriceFormRouterProps) {
  const form = useForm<ServicePriceFormValues>({
    resolver: zodResolver(servicePriceSchema),
    defaultValues: transformInitialDataToFormValues(initialData),
    mode: "onBlur", // Change to onBlur or onChange to see errors sooner
  });

  const selectedCategory = form.watch("category");

  React.useEffect(() => {
    const currentCategoryValue = form.getValues('category');
    const currentUnitDesc = form.getValues('unitDescription');
    const currentTransferMode = form.getValues('transferMode');
    const today = new Date();
    const thirtyDaysFromToday = addDays(today, 30);

    const setFormValueIfChanged = (fieldName: keyof ServicePriceFormValues, newValue: any, options?: any) => {
        if (JSON.stringify(form.getValues(fieldName)) !== JSON.stringify(newValue)) {
            form.setValue(fieldName, newValue, options);
        }
    };
    
    if (currentCategoryValue === 'activity') {
        setFormValueIfChanged('price1', undefined, { shouldValidate: true });
        setFormValueIfChanged('price2', undefined, { shouldValidate: true });
        setFormValueIfChanged('subCategory', undefined, { shouldValidate: true });
        setFormValueIfChanged('hotelDetails', undefined, { shouldValidate: true });
        setFormValueIfChanged('unitDescription', currentUnitDesc || 'per person', { shouldValidate: true });
        setFormValueIfChanged('vehicleOptions', undefined, { shouldValidate: true });
        setFormValueIfChanged('transferMode', undefined, { shouldValidate: true });
        setFormValueIfChanged('maxPassengers', undefined, { shouldValidate: true });
        if (!form.getValues('activityPackages') || form.getValues('activityPackages')?.length === 0) {
          setFormValueIfChanged('activityPackages', [{ id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '', validityStartDate: today.toISOString().split('T')[0], validityEndDate: thirtyDaysFromToday.toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }], { shouldValidate: true });
        }
    } else if (currentCategoryValue === 'hotel') {
        setFormValueIfChanged('price1', undefined, { shouldValidate: true });
        setFormValueIfChanged('price2', undefined, { shouldValidate: true });
        setFormValueIfChanged('subCategory', undefined, { shouldValidate: true });
        setFormValueIfChanged('activityPackages', undefined, { shouldValidate: true });
        setFormValueIfChanged('unitDescription', currentUnitDesc || 'per night', { shouldValidate: true });
        setFormValueIfChanged('vehicleOptions', undefined, { shouldValidate: true });
        setFormValueIfChanged('transferMode', undefined, { shouldValidate: true });
        setFormValueIfChanged('maxPassengers', undefined, { shouldValidate: true });
        const hotelDetails = form.getValues('hotelDetails');
        if (!hotelDetails || !hotelDetails.roomTypes || hotelDetails.roomTypes.length === 0) {
            const newHotelDetails: HotelDefinition = {
                id: initialData?.hotelDetails?.id || generateGUID(),
                name: form.getValues('name') || "New Hotel",
                province: form.getValues('province') || "",
                roomTypes: [{
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
                }]
            };
            setFormValueIfChanged('hotelDetails', newHotelDetails, { shouldValidate: true });
        }
    } else if (currentCategoryValue === 'transfer') {
        setFormValueIfChanged('hotelDetails', undefined, { shouldValidate: true });
        setFormValueIfChanged('activityPackages', undefined, { shouldValidate: true });
        if (!currentTransferMode) {
            setFormValueIfChanged('transferMode', 'ticket', { shouldValidate: true });
        }
        if (form.getValues('transferMode') === 'vehicle') {
             setFormValueIfChanged('price1', undefined, { shouldValidate: true });
             setFormValueIfChanged('price2', undefined, { shouldValidate: true });
             setFormValueIfChanged('subCategory', undefined, { shouldValidate: true });
             setFormValueIfChanged('maxPassengers', undefined, { shouldValidate: true });
             setFormValueIfChanged('unitDescription', currentUnitDesc || 'per service', { shouldValidate: true });
             if (!form.getValues('vehicleOptions') || form.getValues('vehicleOptions')?.length === 0) {
                setFormValueIfChanged('vehicleOptions', [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: ''}], { shouldValidate: true });
             }
        } else { // ticket mode
             setFormValueIfChanged('vehicleOptions', undefined, { shouldValidate: true });
             setFormValueIfChanged('surchargePeriods', undefined, { shouldValidate: true });
             setFormValueIfChanged('subCategory', 'ticket', { shouldValidate: true });
             setFormValueIfChanged('unitDescription', currentUnitDesc || 'per person', { shouldValidate: true });
             if (form.getValues('price1') === undefined) setFormValueIfChanged('price1', 0, { shouldValidate: true });
        }
    } else { // meal, misc
        setFormValueIfChanged('hotelDetails', undefined, { shouldValidate: true });
        setFormValueIfChanged('activityPackages', undefined, { shouldValidate: true });
        setFormValueIfChanged('vehicleOptions', undefined, { shouldValidate: true });
        setFormValueIfChanged('transferMode', undefined, { shouldValidate: true });
        setFormValueIfChanged('maxPassengers', undefined, { shouldValidate: true });
        setFormValueIfChanged('surchargePeriods', undefined, { shouldValidate: true });
        setFormValueIfChanged('unitDescription', currentUnitDesc || 'per person', { shouldValidate: true });
        if (form.getValues('price1') === undefined) {
            setFormValueIfChanged('price1', 0, { shouldValidate: true });
        }
    }
  }, [selectedCategory, form]);

  const handleActualSubmit = (values: ServicePriceFormValues) => {
    const dataToSubmit = { ...values };

    if (dataToSubmit.category === 'hotel' && dataToSubmit.hotelDetails) {
      dataToSubmit.hotelDetails.name = dataToSubmit.name; // Sync name
      dataToSubmit.hotelDetails.province = dataToSubmit.province || ''; // Sync province
      dataToSubmit.hotelDetails.roomTypes = dataToSubmit.hotelDetails.roomTypes.map(rt => ({
        ...rt,
        seasonalPrices: rt.seasonalPrices.map(sp => ({
            ...sp,
            startDate: (sp.startDate as Date).toISOString().split('T')[0],
            endDate: (sp.endDate as Date).toISOString().split('T')[0],
            extraBedRate: rt.extraBedAllowed ? sp.extraBedRate : undefined,
        })),
      }));
    } else if (dataToSubmit.category === 'transfer') {
        if (dataToSubmit.transferMode === 'vehicle' && dataToSubmit.surchargePeriods) {
          dataToSubmit.surchargePeriods = dataToSubmit.surchargePeriods.map(sp => ({
            ...sp,
            startDate: (sp.startDate as Date).toISOString().split('T')[0],
            endDate: (sp.endDate as Date).toISOString().split('T')[0],
          }));
        }
    }

    if (dataToSubmit.province === "none") {
      dataToSubmit.province = undefined;
    }
    // console.log("Submitting transformed data:", dataToSubmit);
    onSubmit({ ...dataToSubmit } as Omit<ServicePriceItem, 'id'>);
  };
  
  const handleFormError = (errors: any) => {
    console.error("Form validation errors:", errors);
    // You can add a toast message here to inform the user about validation errors
    // e.g., toast({ title: "Validation Error", description: "Please check the form for errors.", variant: "destructive" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleActualSubmit, handleFormError)} className="space-y-6">
        <ScrollArea className="h-[60vh] md:h-[70vh] pr-3">
            <div className="space-y-6 p-1">
                <CommonPriceFields form={form} />

                {selectedCategory === 'hotel' && <HotelPriceForm form={form} />}
                {selectedCategory === 'activity' && <ActivityPriceForm form={form} />}
                {selectedCategory === 'transfer' && <TransferPriceForm form={form} />}
                {selectedCategory === 'meal' && <MealPriceForm form={form} />}
                {selectedCategory === 'misc' && <MiscellaneousPriceForm form={form} />}

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
