
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ServicePriceItem, CurrencyCode, ItineraryItemType, VehicleType, HotelDefinition, HotelRoomTypeDefinition, RoomTypeSeasonalPrice, ActivityPackageDefinition, SurchargePeriod, VehicleOption } from '@/types/itinerary';
import { CURRENCIES, SERVICE_CATEGORIES, VEHICLE_TYPES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';

import { CommonPriceFields } from './CommonPriceFields';
import { HotelPriceForm } from './HotelPriceForm';
import { ActivityPriceForm } from './ActivityPriceForm';
import { TransferPriceForm } from './TransferPriceForm';
import { MealPriceForm } from './MealPriceForm';
import { MiscellaneousPriceForm } from './MiscellaneousPriceForm';
import { addDays, isValid, parseISO, format } from 'date-fns';

// --- Zod Schemas ---
const hotelRoomSeasonalPriceSchema = z.object({
  id: z.string(),
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
  notes: z.string().optional().describe("Room Details: Size, Amenities, Bed Type, View etc."),
  seasonalPrices: z.array(hotelRoomSeasonalPriceSchema).min(1, "Each room type must have at least one seasonal price period."),
  characteristics: z.array(z.object({ id: z.string(), key: z.string(), value: z.string() })).optional(),
});

const hotelDetailsSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Hotel name (within details) is required."),
  province: z.string().min(1, "Hotel province (within details) is required. Please select a province for the hotel at the top of the form."),
  roomTypes: z.array(hotelRoomTypeSchema).min(1, "At least one room type is required for hotel pricing."),
});

const activityPackageSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Package name is required"),
  price1: z.coerce.number().min(0, "Adult price must be non-negative"),
  price2: z.coerce.number().min(0, "Child price must be non-negative").optional(),
  notes: z.string().optional(),
  validityStartDate: z.string().refine(val => !val || isValid(parseISO(val)), {message: "Invalid start date format."}).optional(),
  validityEndDate: z.string().refine(val => !val || isValid(parseISO(val)), {message: "Invalid end date format."}).optional(),
  closedWeekdays: z.array(z.number().min(0).max(6)).optional().describe("Array of day numbers (0=Sun, 6=Sat) when package is closed"),
  specificClosedDates: z.array(z.string().refine(val => isValid(parseISO(val)), {message: "Invalid specific closed date format."})).optional(),
}).refine(data => {
    if (data.validityStartDate && data.validityEndDate) {
        try {
            const startDate = parseISO(data.validityStartDate);
            const endDate = parseISO(data.validityEndDate);
            if (isValid(startDate) && isValid(endDate)) {
                return endDate >= startDate;
            }
            return true; 
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
  notes: z.string().optional(),
  transferMode: z.enum(['ticket', 'vehicle']).optional(),
  vehicleOptions: z.array(vehicleOptionSchema).optional(),
  maxPassengers: z.coerce.number().int().min(1).optional(),
  hotelDetails: hotelDetailsSchema.optional(),
  activityPackages: z.array(activityPackageSchema).optional(),
  surchargePeriods: z.array(surchargePeriodSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.category === 'hotel') {
    if (!data.hotelDetails) { 
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hotel details (including name, province, room types, and pricing) are required for the hotel category.",
        path: ["hotelDetails"],
      });
    }
    // Specific checks for hotelDetails.name and hotelDetails.province are now within hotelDetailsSchema itself.
    // Specific checks for roomTypes and seasonalPrices are also within their respective schemas.
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
    } else { 
      if (typeof data.price1 !== 'number') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Adult Ticket Price is required for ticket-based transfers.",
            path: ["price1"],
        });
      }
      data.subCategory = 'ticket'; 
      data.vehicleOptions = undefined; 
      data.surchargePeriods = undefined;
    }
    data.hotelDetails = undefined; data.activityPackages = undefined;
  } else { 
    if (typeof data.price1 !== 'number') {
      ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Primary price (e.g., Adult Price, Unit Cost) is required for this category.",
          path: ["price1"],
      });
    }
    data.hotelDetails = undefined; data.activityPackages = undefined;
    data.vehicleOptions = undefined; data.transferMode = undefined; data.surchargePeriods = undefined; data.maxPassengers = undefined;
  }
});

export type ServicePriceFormValues = z.infer<typeof servicePriceSchema>;

interface ServicePriceFormRouterProps {
  initialData?: Partial<ServicePriceItem>;
  onSubmit: (data: Omit<ServicePriceItem, 'id'>) => void;
  onCancel: () => void;
}

const createDefaultSeasonalPrice = (): RoomTypeSeasonalPrice => {
  const today = new Date();
  const thirtyDaysFromToday = addDays(today, 30);
  return {
    id: generateGUID(),
    startDate: today,
    endDate: thirtyDaysFromToday,
    rate: 0,
    extraBedRate: undefined,
  };
};

const createDefaultRoomType = (): HotelRoomTypeDefinition => ({
  id: generateGUID(),
  name: 'Standard Room',
  extraBedAllowed: false,
  notes: '',
  characteristics: [],
  seasonalPrices: [createDefaultSeasonalPrice()],
});

const createDefaultHotelDetails = (name?: string, province?: string, existingId?: string): HotelDefinition => ({
  id: existingId || generateGUID(),
  name: name || "New Hotel",
  province: province || "", // Zod for hotelDetails.province requires min(1), so user must select one
  roomTypes: [createDefaultRoomType()],
});


const transformInitialDataToFormValues = (data?: Partial<ServicePriceItem>): Partial<ServicePriceFormValues> => {
  const defaultCurrency: CurrencyCode = "THB";
  const defaultCategory: ItineraryItemType = "activity"; 
  const today = new Date();
  const thirtyDaysFromToday = addDays(today, 30);

  let baseTransformed: Partial<ServicePriceFormValues> = {
    name: data?.name || "",
    province: data?.province || undefined,
    category: data?.category || defaultCategory,
    currency: data?.currency || defaultCurrency,
    notes: data?.notes || "",
  };
  
  baseTransformed.surchargePeriods = data?.surchargePeriods?.map(sp => {
    const initialStartDate = sp.startDate && typeof sp.startDate === 'string' ? parseISO(sp.startDate) : (sp.startDate instanceof Date ? sp.startDate : today);
    const initialEndDate = sp.endDate && typeof sp.endDate === 'string' ? parseISO(sp.endDate) : (sp.endDate instanceof Date ? sp.endDate : thirtyDaysFromToday);
    return {
      ...sp,
      startDate: isValid(initialStartDate) ? initialStartDate : today,
      endDate: isValid(initialEndDate) ? initialEndDate : addDays(isValid(initialStartDate) ? initialStartDate : today, 30),
    }
  }) || [];

  if (!data || Object.keys(data).length === 0) { // Entirely new item
    baseTransformed.category = defaultCategory; 
    baseTransformed.activityPackages = [{
        id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '',
        validityStartDate: today.toISOString().split('T')[0],
        validityEndDate: thirtyDaysFromToday.toISOString().split('T')[0],
        closedWeekdays: [], specificClosedDates: []
    }];
    return baseTransformed;
  }


  if (baseTransformed.category === 'hotel') {
    let hotelDetailsToSet: HotelDefinition;
    if (data.hotelDetails && data.hotelDetails.id && data.hotelDetails.name && Array.isArray(data.hotelDetails.roomTypes) && data.hotelDetails.roomTypes.length > 0) {
      hotelDetailsToSet = {
        ...data.hotelDetails,
        name: data.hotelDetails.name || baseTransformed.name || "Hotel Name from Initial Data",
        province: data.hotelDetails.province || baseTransformed.province || "",
        roomTypes: data.hotelDetails.roomTypes.map(rt => ({
          ...rt,
          extraBedAllowed: rt.extraBedAllowed ?? false,
          notes: rt.notes || "",
          seasonalPrices: (Array.isArray(rt.seasonalPrices) && rt.seasonalPrices.length > 0 ? rt.seasonalPrices : [createDefaultSeasonalPrice()]).map(sp => {
            const initialStartDate = sp.startDate && typeof sp.startDate === 'string' ? parseISO(sp.startDate) : (sp.startDate instanceof Date ? sp.startDate : today);
            const initialEndDate = sp.endDate && typeof sp.endDate === 'string' ? parseISO(sp.endDate) : (sp.endDate instanceof Date ? sp.endDate : thirtyDaysFromToday);
            return {
              ...sp,
              id: sp.id || generateGUID(),
              startDate: isValid(initialStartDate) ? initialStartDate : today,
              endDate: isValid(initialEndDate) ? initialEndDate : addDays((isValid(initialStartDate) ? initialStartDate : today), 30),
              extraBedRate: rt.extraBedAllowed ? (sp.extraBedRate ?? undefined) : undefined,
            };
          }),
        })),
      };
    } else {
      hotelDetailsToSet = createDefaultHotelDetails(baseTransformed.name, baseTransformed.province, data.hotelDetails?.id || data.id);
    }
    baseTransformed.hotelDetails = hotelDetailsToSet;
    baseTransformed.price1 = undefined; baseTransformed.price2 = undefined; baseTransformed.subCategory = undefined;
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
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;

  } else if (baseTransformed.category === 'transfer') {
    baseTransformed.transferMode = data.transferMode || (data.subCategory === 'ticket' ? 'ticket' : (data.vehicleOptions && data.vehicleOptions.length > 0 ? 'vehicle' : 'ticket'));
    if (baseTransformed.transferMode === 'vehicle') {
      baseTransformed.vehicleOptions = data.vehicleOptions && data.vehicleOptions.length > 0 ? data.vehicleOptions : [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: '' }];
      baseTransformed.price1 = undefined; baseTransformed.price2 = undefined; baseTransformed.subCategory = undefined; baseTransformed.maxPassengers = undefined;
    } else { 
      baseTransformed.price1 = data.price1 ?? 0;
      baseTransformed.price2 = data.price2;
      baseTransformed.subCategory = 'ticket';
      baseTransformed.vehicleOptions = undefined;
    }
    baseTransformed.hotelDetails = undefined; baseTransformed.activityPackages = undefined;
  } else { 
    baseTransformed.subCategory = data.subCategory || "";
    baseTransformed.price1 = data.price1 ?? 0;
    baseTransformed.price2 = data.price2;
    baseTransformed.hotelDetails = undefined; baseTransformed.activityPackages = undefined;
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;
    baseTransformed.surchargePeriods = undefined;
  }
  return baseTransformed;
};


export function ServicePriceFormRouter({ initialData, onSubmit, onCancel }: ServicePriceFormRouterProps) {
  const form = useForm<ServicePriceFormValues>({
    resolver: zodResolver(servicePriceSchema),
    defaultValues: transformInitialDataToFormValues(initialData),
    mode: "onBlur", 
  });

  const selectedCategory = form.watch("category");
  const watchedName = form.watch('name');
  const watchedProvince = form.watch('province');
  const watchedTransferMode = form.watch('transferMode');


  React.useEffect(() => {
    const currentCategoryValue = form.getValues('category');
    const currentName = watchedName; 
    const currentProvince = watchedProvince; 
    const currentTransferModeVal = watchedTransferMode;
    const today = new Date();

    console.log(`DEBUG Router Effect: Category changed to ${currentCategoryValue}. Watched Name: "${currentName}", Province: "${currentProvince}"`);

    const setValueAndValidate = (fieldName: keyof ServicePriceFormValues, newValue: any) => {
        form.setValue(fieldName, newValue, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    };
    
    // Clear fields not relevant to the current category
    if (currentCategoryValue !== 'hotel') setValueAndValidate('hotelDetails', undefined);
    if (currentCategoryValue !== 'activity') setValueAndValidate('activityPackages', undefined);
    if (currentCategoryValue !== 'transfer') {
        setValueAndValidate('transferMode', undefined);
        setValueAndValidate('vehicleOptions', undefined);
        setValueAndValidate('surchargePeriods', undefined);
        setValueAndValidate('maxPassengers', undefined);
    } else { // Transfer specific
      if (currentTransferModeVal !== 'vehicle') {
        setValueAndValidate('vehicleOptions', undefined);
        setValueAndValidate('surchargePeriods', undefined);
      }
      if (currentTransferModeVal !== 'ticket') {
        // No specific fields to clear for ticket other than what vehicle clears
      }
    }


    if (currentCategoryValue === 'hotel') {
        let hotelDetailsCurrent = form.getValues('hotelDetails');
        console.log("DEBUG Router Effect (Hotel): Current hotelDetails before sync/init:", JSON.parse(JSON.stringify(hotelDetailsCurrent || {})));

        const isStructureIncomplete = !hotelDetailsCurrent ||
                                  !Array.isArray(hotelDetailsCurrent.roomTypes) || 
                                  hotelDetailsCurrent.roomTypes.length === 0 ||
                                  !hotelDetailsCurrent.roomTypes[0] || 
                                  !Array.isArray(hotelDetailsCurrent.roomTypes[0].seasonalPrices) || 
                                  hotelDetailsCurrent.roomTypes[0].seasonalPrices.length === 0;

        if (isStructureIncomplete) {
            console.log("DEBUG Router Effect (Hotel): Re-initializing hotelDetails structure.");
            const newHotelDetails = createDefaultHotelDetails(currentName, currentProvince, hotelDetailsCurrent?.id);
            setValueAndValidate('hotelDetails', newHotelDetails);
            hotelDetailsCurrent = newHotelDetails; // use the newly set one for immediate sync
        }
        
        // Sync name and province if they differ or if hotelDetails was just created
        if (hotelDetailsCurrent) {
            let needsUpdate = false;
            const updatedDetails = { ...hotelDetailsCurrent };
            if (hotelDetailsCurrent.name !== (currentName || "New Hotel")) {
                updatedDetails.name = currentName || "New Hotel";
                needsUpdate = true;
            }
            if (hotelDetailsCurrent.province !== (currentProvince || "")) { // Province can be "" initially, Zod for hotelDetails.province will catch it
                updatedDetails.province = currentProvince || "";
                needsUpdate = true;
            }
            if (needsUpdate) {
                console.log(`DEBUG Router Effect (Hotel): Syncing hotelDetails name/province. Name: "${updatedDetails.name}", Prov: "${updatedDetails.province}"`);
                setValueAndValidate('hotelDetails', updatedDetails);
            }
        }

        setValueAndValidate('price1', undefined); setValueAndValidate('price2', undefined); setValueAndValidate('subCategory', undefined);

    } else if (currentCategoryValue === 'activity') {
        if (!form.getValues('activityPackages') || form.getValues('activityPackages')?.length === 0) {
          const thirtyDaysFromToday = addDays(today, 30);
          setValueAndValidate('activityPackages', [{ id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '', validityStartDate: today.toISOString().split('T')[0], validityEndDate: thirtyDaysFromToday.toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }]);
        }
        setValueAndValidate('price1', undefined); setValueAndValidate('price2', undefined); setValueAndValidate('subCategory', undefined);

    } else if (currentCategoryValue === 'transfer') {
        if (!currentTransferModeVal) { 
            setValueAndValidate('transferMode', 'ticket');
        }
        if (form.getValues('transferMode') === 'vehicle') { // Check live value after potential default
             setValueAndValidate('price1', undefined); setValueAndValidate('price2', undefined); setValueAndValidate('subCategory', undefined);
             setValueAndValidate('maxPassengers', undefined); // Not for vehicle options
             if (!form.getValues('vehicleOptions') || form.getValues('vehicleOptions')?.length === 0) {
                setValueAndValidate('vehicleOptions', [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: ''}]);
             }
        } else { // ticket mode
             setValueAndValidate('vehicleOptions', undefined);
             setValueAndValidate('surchargePeriods', undefined);
             setValueAndValidate('subCategory', 'ticket');
             if (form.getValues('price1') === undefined) setValueAndValidate('price1', 0);
        }
    } else { // meal, misc
        if (form.getValues('price1') === undefined) {
            setValueAndValidate('price1', 0);
        }
    }

  }, [selectedCategory, watchedName, watchedProvince, watchedTransferMode, form]);

  const handleActualSubmit = (values: ServicePriceFormValues) => {
    console.log("DEBUG Router: handleActualSubmit called.");
    console.log('DEBUG Router: Form values received by handleActualSubmit (before final Zod validation in onSubmit prop):', JSON.parse(JSON.stringify(values, null, 2)));
    console.log("DEBUG Router: Current form errors (should be empty if this is reached):", JSON.parse(JSON.stringify(form.formState.errors, null, 2)));
    
    const dataToSubmit = { ...values };

    if (dataToSubmit.category === 'hotel' && dataToSubmit.hotelDetails) {
      // Ensure name and province are sourced from top-level for final submission consistency
      dataToSubmit.hotelDetails.name = dataToSubmit.name; 
      dataToSubmit.hotelDetails.province = dataToSubmit.province || ""; // Ensure it's a string
      
      dataToSubmit.hotelDetails.roomTypes = dataToSubmit.hotelDetails.roomTypes.map(rt => ({
        ...rt,
        seasonalPrices: rt.seasonalPrices.map(sp => ({
            ...sp,
            startDate: (sp.startDate instanceof Date ? format(sp.startDate, 'yyyy-MM-dd') : sp.startDate),
            endDate: (sp.endDate instanceof Date ? format(sp.endDate, 'yyyy-MM-dd') : sp.endDate),
            extraBedRate: rt.extraBedAllowed ? sp.extraBedRate : undefined,
        })),
      }));
    } else if (dataToSubmit.category === 'transfer') {
        if (dataToSubmit.transferMode === 'vehicle' && dataToSubmit.surchargePeriods) {
          dataToSubmit.surchargePeriods = dataToSubmit.surchargePeriods.map(sp => ({
            ...sp,
            startDate: (sp.startDate instanceof Date ? format(sp.startDate, 'yyyy-MM-dd') : sp.startDate),
            endDate: (sp.endDate instanceof Date ? format(sp.endDate, 'yyyy-MM-dd') : sp.endDate),
          }));
        }
    } else if (dataToSubmit.category === 'activity' && dataToSubmit.activityPackages) {
        dataToSubmit.activityPackages = dataToSubmit.activityPackages.map(pkg => ({
            ...pkg,
            validityStartDate: pkg.validityStartDate && isValid(parseISO(pkg.validityStartDate)) ? pkg.validityStartDate : undefined,
            validityEndDate: pkg.validityEndDate && isValid(parseISO(pkg.validityEndDate)) ? pkg.validityEndDate : undefined,
            specificClosedDates: Array.isArray(pkg.specificClosedDates) ? pkg.specificClosedDates.filter(d => isValid(parseISO(d))) : undefined,
        }));
    }


    if (dataToSubmit.province === "none") { 
      dataToSubmit.province = undefined;
    }
    console.log("DEBUG Router: Submitting transformed data to parent:", JSON.parse(JSON.stringify(dataToSubmit)));
    onSubmit({ ...dataToSubmit } as Omit<ServicePriceItem, 'id'>);
  };

  const handleFormError = (errors: any) => {
    console.log("DEBUG Router: handleFormError called");
    console.error("DEBUG Router: Form validation errors:", JSON.stringify(errors, null, 2));
    alert("VALIDATION ERROR! Please check the browser console (F12 -> Console) for details on which fields are invalid, then correct them and try saving again.");
  };
  
  const onFormSubmitAttempt = () => {
    console.log("DEBUG Router: Form submit attempt. Current form values:", JSON.parse(JSON.stringify(form.getValues(), null, 2)));
    console.log("DEBUG Router: Current form errors before handleSubmit runs its callbacks:", JSON.parse(JSON.stringify(form.formState.errors, null, 2)));
  };


  return (
    <Form {...form}>
      <form onSubmit={(e) => {
        e.preventDefault(); 
        onFormSubmitAttempt(); 
        form.handleSubmit(handleActualSubmit, handleFormError)(e);
      }} className="space-y-6">
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
    

