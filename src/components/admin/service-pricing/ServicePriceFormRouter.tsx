
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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

const simplifiedHotelRoomSeasonalPriceSchema = z.object({
  id: z.string(),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  rate: z.coerce.number().min(0, "Nightly rate must be non-negative"),
  extraBedRate: z.coerce.number().min(0, "Extra bed rate must be non-negative").optional(),
  seasonName: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

const simplifiedHotelRoomTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Room type name is required"),
  extraBedAllowed: z.boolean().optional().default(false),
  notes: z.string().optional(),
  seasonalPrices: z.array(simplifiedHotelRoomSeasonalPriceSchema)
    .min(1, "Each room type must have at least one seasonal price period."),
  characteristics: z.array(z.object({ id: z.string(), key: z.string(), value: z.string() })).optional(),
});

const hotelDetailsSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Hotel name (within details) is required."),
  province: z.string().min(1, "Hotel province is required. Please select a Province at the top of the form."),
  roomTypes: z.array(simplifiedHotelRoomTypeSchema)
    .min(1, "Hotel must have at least one room type defined by default.")
    .max(1, "For new services, only one default room type is initially created."),
});

const activityPackageSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Package name is required"),
  price1: z.coerce.number().min(0, "Adult price must be non-negative"),
  price2: z.coerce.number().min(0, "Child price must be non-negative").optional(),
  notes: z.string().optional(),
  validityStartDate: z.string().refine(val => !val || isValid(parseISO(val)), {message: "Invalid start date format."}).optional(),
  validityEndDate: z.string().refine(val => !val || isValid(parseISO(val)), {message: "Invalid end date format."}).optional(),
  closedWeekdays: z.array(z.number().min(0).max(6)).optional(),
  specificClosedDates: z.array(z.string().refine(val => !val || isValid(parseISO(val)), {message: "Invalid specific closed date format."})).optional(),
}).refine(data => {
    if (data.validityStartDate && data.validityEndDate) {
        try {
            const startDate = parseISO(data.validityStartDate);
            const endDate = parseISO(data.validityEndDate);
            if (isValid(startDate) && isValid(endDate)) {
                return endDate >= startDate;
            } return true;
        } catch (e) { return true; }
    } return true;
}, { message: "Package validity end date cannot be before start date.", path: ["validityEndDate"] });

const surchargePeriodSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Surcharge name is required"),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  surchargeAmount: z.coerce.number().min(0, "Surcharge amount must be non-negative"),
}).refine(data => data.endDate >= data.startDate, { message: "End date cannot be before start date", path: ["endDate"] });

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
  selectedServicePriceId: z.string().optional(),
  
  transferMode: z.enum(['ticket', 'vehicle']).optional(),
  vehicleOptions: z.array(vehicleOptionSchema).optional(),
  maxPassengers: z.coerce.number().int().min(1).optional(),
  hotelDetails: hotelDetailsSchema.optional(),
  activityPackages: z.array(activityPackageSchema).optional(),
  surchargePeriods: z.array(surchargePeriodSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.category === 'hotel') {
    if (!data.hotelDetails) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hotel details are required. Ensure province is selected.", path: ["hotelDetails"]});
    }
    data.price1 = undefined; data.price2 = undefined; data.subCategory = undefined;
    data.vehicleOptions = undefined; data.transferMode = undefined; data.maxPassengers = undefined;
  } else if (data.category === 'activity') {
    if ((!data.activityPackages || data.activityPackages.length === 0) && (typeof data.price1 !== 'number' || data.price1 < 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "For activities, either define at least one package or provide a valid default Adult Price (price1).", path: ["price1"] });
    }
    if (data.activityPackages && data.activityPackages.length > 0) {
        data.price1 = undefined;
        data.price2 = undefined;
    }
    data.subCategory = undefined; data.hotelDetails = undefined;
    data.vehicleOptions = undefined; data.transferMode = undefined; data.maxPassengers = undefined;
  } else if (data.category === 'transfer') {
    if (data.transferMode === 'vehicle') {
      if (!data.vehicleOptions || data.vehicleOptions.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "For vehicle transfers, define at least one vehicle option.", path: ["vehicleOptions"] });
      }
      data.price1 = undefined; data.price2 = undefined; data.subCategory = undefined; data.maxPassengers = undefined;
    } else { // ticket mode
      if (typeof data.price1 !== 'number') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adult Ticket Price is required for ticket-based transfers.", path: ["price1"] });
      }
      data.subCategory = 'ticket';
      data.vehicleOptions = undefined; data.surchargePeriods = undefined;
    }
    data.hotelDetails = undefined; data.activityPackages = undefined;
  } else { // meal, misc
    if (typeof data.price1 !== 'number') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Primary price is required for this category.", path: ["price1"] });
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

// --- Default Data Creation Helpers ---
const createDefaultSeasonalPriceForForm = (rate: number = 0): RoomTypeSeasonalPrice => {
  const today = new Date();
  return {
    id: generateGUID(),
    startDate: today, // Will be Date object for DatePicker
    endDate: addDays(today, 30), // Will be Date object for DatePicker
    rate: rate,
    extraBedRate: undefined,
    seasonName: "Default Season"
  };
};

const createDefaultRoomTypeForForm = (): HotelRoomTypeDefinition => ({
  id: generateGUID(),
  name: 'Standard Room (Default)',
  extraBedAllowed: false,
  notes: 'Default room type. Add more details in Edit mode.',
  seasonalPrices: [createDefaultSeasonalPriceForForm(0)], // Updated to call new helper
  characteristics: [],
});

const createDefaultSimplifiedHotelDetails = (name?: string, province?: string, existingId?: string): HotelDefinition => ({
  id: existingId || generateGUID(),
  name: name || "New Hotel (Default Name)",
  province: province || "", // This will be validated by hotelDetailsSchema to require min(1)
  roomTypes: [createDefaultRoomTypeForForm()], // Updated to call new helper
});


const transformInitialDataToFormValues = (data?: Partial<ServicePriceItem>): Partial<ServicePriceFormValues> => {
  const defaultCurrency: CurrencyCode = "THB";
  const defaultCategory: ItineraryItemType = "activity";
  const today = new Date();

  let baseTransformed: Partial<ServicePriceFormValues> = {
    name: data?.name || "",
    province: data?.province || undefined,
    category: data?.category || defaultCategory,
    currency: data?.currency || defaultCurrency,
    notes: data?.notes || "",
    selectedServicePriceId: data?.selectedServicePriceId || undefined,
  };

  baseTransformed.surchargePeriods = data?.surchargePeriods?.map(sp => {
    const initialStartDate = sp.startDate && typeof sp.startDate === 'string' ? parseISO(sp.startDate) : (sp.startDate instanceof Date ? sp.startDate : today);
    const initialEndDate = sp.endDate && typeof sp.endDate === 'string' ? parseISO(sp.endDate) : (sp.endDate instanceof Date ? sp.endDate : addDays(initialStartDate, 30));
    return { ...sp, id: sp.id || generateGUID(), startDate: isValid(initialStartDate) ? initialStartDate : today, endDate: isValid(initialEndDate) ? initialEndDate : addDays(isValid(initialStartDate) ? initialStartDate : today, 30) };
  }) || [];

  if (!data || Object.keys(data).length === 0) { // Completely new item
    baseTransformed.category = defaultCategory; 
    if (defaultCategory === 'activity') {
      baseTransformed.activityPackages = [{ id: generateGUID(), name: 'Standard Package', price1: 0, validityStartDate: today.toISOString().split('T')[0], validityEndDate: addDays(today, 30).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }];
    } else if (defaultCategory === 'hotel') {
      baseTransformed.hotelDetails = createDefaultSimplifiedHotelDetails(baseTransformed.name, baseTransformed.province);
    }
    return baseTransformed;
  }

  if (baseTransformed.category === 'hotel') {
    let hotelDetailsToSet: HotelDefinition;
    if (data.hotelDetails && Array.isArray(data.hotelDetails.roomTypes) && data.hotelDetails.roomTypes.length > 0 &&
        data.hotelDetails.roomTypes[0] && Array.isArray(data.hotelDetails.roomTypes[0].seasonalPrices) && data.hotelDetails.roomTypes[0].seasonalPrices.length > 0) {
        
        const transformedRoomTypes = data.hotelDetails.roomTypes.map(rt => ({
            ...rt,
            id: rt.id || generateGUID(),
            seasonalPrices: rt.seasonalPrices.map(sp => {
                const sDate = sp.startDate && typeof sp.startDate === 'string' ? parseISO(sp.startDate) : (sp.startDate instanceof Date ? sp.startDate : today);
                const eDate = sp.endDate && typeof sp.endDate === 'string' ? parseISO(sp.endDate) : (sp.endDate instanceof Date ? sp.endDate : addDays(sDate, 30));
                return {
                    ...sp,
                    id: sp.id || generateGUID(),
                    startDate: isValid(sDate) ? sDate : today,
                    endDate: isValid(eDate) ? eDate : addDays(isValid(sDate) ? sDate : today, 30),
                    rate: typeof sp.rate === 'number' ? sp.rate : 0,
                };
            })
        }));

        hotelDetailsToSet = {
            id: data.hotelDetails.id || data.id || generateGUID(),
            name: data.name || data.hotelDetails.name || "Hotel Name from Data",
            province: data.province || data.hotelDetails.province || "",
            roomTypes: transformedRoomTypes
        };

    } else { // Fallback to create a default structure if initialData.hotelDetails is incomplete
        hotelDetailsToSet = createDefaultSimplifiedHotelDetails(
            data.name || baseTransformed.name,
            data.province || baseTransformed.province,
            data.id || data.hotelDetails?.id || generateGUID()
        );
    }
    baseTransformed.hotelDetails = hotelDetailsToSet;
    baseTransformed.price1 = undefined; baseTransformed.price2 = undefined; baseTransformed.subCategory = undefined;
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;

  } else if (baseTransformed.category === 'activity') {
    let packages: ActivityPackageDefinition[] = [];
    if (data.activityPackages && data.activityPackages.length > 0) {
      packages = data.activityPackages.map(pkg => ({ ...pkg, id: pkg.id || generateGUID(), validityStartDate: pkg.validityStartDate || today.toISOString().split('T')[0], validityEndDate: pkg.validityEndDate || addDays(today, 30).toISOString().split('T')[0], closedWeekdays: pkg.closedWeekdays || [], specificClosedDates: pkg.specificClosedDates || [] }));
    } else if (data.price1 !== undefined) {
      packages = [{ id: generateGUID(), name: data.subCategory || 'Standard Package', price1: data.price1, price2: data.price2, notes: data.notes || '', validityStartDate: today.toISOString().split('T')[0], validityEndDate: addDays(today, 30).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }];
    }
    if (packages.length === 0) { packages = [{ id: generateGUID(), name: 'Standard Package', price1: 0, validityStartDate: today.toISOString().split('T')[0], validityEndDate: addDays(today, 30).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }]; }
    baseTransformed.activityPackages = packages;
    baseTransformed.price1 = (packages.length > 0) ? undefined : (data.price1 ?? 0);
    baseTransformed.price2 = (packages.length > 0) ? undefined : data.price2;
    baseTransformed.subCategory = undefined;
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;
  } else if (baseTransformed.category === 'transfer') {
    baseTransformed.transferMode = data.transferMode || (data.subCategory === 'ticket' ? 'ticket' : (data.vehicleOptions && data.vehicleOptions.length > 0 ? 'vehicle' : 'ticket'));
    if (baseTransformed.transferMode === 'vehicle') {
      baseTransformed.vehicleOptions = data.vehicleOptions && data.vehicleOptions.length > 0 ? data.vehicleOptions.map(vo => ({...vo, id: vo.id || generateGUID()})) : [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: '' }];
      baseTransformed.price1 = undefined; baseTransformed.price2 = undefined; baseTransformed.subCategory = undefined; baseTransformed.maxPassengers = undefined;
    } else { // ticket mode
      baseTransformed.price1 = data.price1 ?? 0;
      baseTransformed.price2 = data.price2;
      baseTransformed.subCategory = 'ticket';
      baseTransformed.vehicleOptions = undefined;
    }
    baseTransformed.hotelDetails = undefined; baseTransformed.activityPackages = undefined;
  } else { // meal, misc
    baseTransformed.subCategory = data.subCategory || "";
    baseTransformed.price1 = data.price1 ?? 0;
    baseTransformed.price2 = data.price2;
    baseTransformed.hotelDetails = undefined; baseTransformed.activityPackages = undefined;
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;
    baseTransformed.surchargePeriods = undefined;
  }
  return baseTransformed;
};

function formatZodErrorsForAlert(errors: any): string {
  let messages: string[] = [];
  function processError(errObj: any, currentPath: string) {
    if (errObj._errors && Array.isArray(errObj._errors) && errObj._errors.length > 0) {
      messages.push(`${currentPath || 'Form'}: ${errObj._errors.join(', ')}`);
    }
    for (const key in errObj) {
      if (key === "_errors") continue;
      if (errObj[key] && typeof errObj[key] === 'object') {
        processError(errObj[key], currentPath ? `${currentPath}.${key}` : key);
      }
    }
  }
  processError(errors, "");
  return messages.filter(Boolean).join("\n") || "Unknown validation error. Check console.";
}


export function ServicePriceFormRouter({ initialData, onSubmit, onCancel }: ServicePriceFormRouterProps) {
  const form = useForm<ServicePriceFormValues>({
    resolver: zodResolver(servicePriceSchema),
    defaultValues: transformInitialDataToFormValues(initialData),
    mode: "onSubmit",
  });

  const selectedCategory = form.watch("category");
  const watchedName = form.watch('name');
  const watchedProvince = form.watch('province');
  const watchedTransferMode = form.watch('transferMode');
  const isNewService = !initialData?.id;

  React.useEffect(() => {
    const currentCategoryValue = selectedCategory;
    const currentName = watchedName;
    const currentProvince = watchedProvince;
    const today = new Date();

    // Clear fields not relevant to the current category
    if (currentCategoryValue !== 'hotel') form.setValue('hotelDetails', undefined, { shouldValidate: false });
    if (currentCategoryValue !== 'activity') {
       form.setValue('activityPackages', undefined, { shouldValidate: false });
       if(currentCategoryValue !== 'transfer' && currentCategoryValue !== 'meal' && currentCategoryValue !== 'misc' && form.getValues('price1') === undefined) {
            form.setValue('price1', 0, { shouldValidate: true, shouldDirty: true });
       }
    }
    if (currentCategoryValue !== 'transfer') {
      form.setValue('transferMode', undefined, { shouldValidate: false });
      form.setValue('vehicleOptions', undefined, { shouldValidate: false });
      form.setValue('surchargePeriods', undefined, { shouldValidate: false });
      form.setValue('maxPassengers', undefined, { shouldValidate: false });
    }

    // Category-specific initialization and syncing
    if (currentCategoryValue === 'hotel' && isNewService) {
        console.log("DEBUG Router: NEW hotel - Forcing simplified default structure.");
        const newValidHotelDetails = createDefaultSimplifiedHotelDetails(currentName, currentProvince, form.getValues('hotelDetails.id'));
        form.setValue('hotelDetails', newValidHotelDetails, { shouldValidate: true, shouldDirty: true });
        console.log("DEBUG Router: Default hotelDetails set for new item:", JSON.stringify(newValidHotelDetails));
    } else if (currentCategoryValue === 'hotel' && !isNewService) { // Editing existing hotel
        const hotelDetailsCurrent = form.getValues('hotelDetails');
        if (hotelDetailsCurrent) {
            let changed = false;
            if (hotelDetailsCurrent.name !== (currentName || "Hotel Name")) {
              form.setValue('hotelDetails.name', currentName || "Hotel Name", {shouldValidate: true, shouldDirty: true });
              changed = true;
            }
            const provinceToSetInDetails = currentProvince || "";
            if (hotelDetailsCurrent.province !== provinceToSetInDetails) {
               form.setValue('hotelDetails.province', provinceToSetInDetails, { shouldValidate: true, shouldDirty: true });
               changed = true;
            }
            if (changed) console.log(`DEBUG Router: Synced hotelDetails name/province for existing hotel.`);
        } else { // Should ideally not happen if data loaded correctly for edit
            console.warn("DEBUG Router: HotelDetails missing for existing hotel being edited. Re-initializing with defaults.");
            const defaultDetails = createDefaultSimplifiedHotelDetails(currentName, currentProvince);
            form.setValue('hotelDetails', defaultDetails, { shouldValidate: true, shouldDirty: true });
        }
    } else if (currentCategoryValue === 'activity') {
      if (!form.getValues('activityPackages') || form.getValues('activityPackages')?.length === 0) {
        if (isNewService || !initialData?.activityPackages?.length) { // Only set default if truly new or no packages came from initial data
          form.setValue('activityPackages', [{ id: generateGUID(), name: 'Standard Package', price1: 0, validityStartDate: today.toISOString().split('T')[0], validityEndDate: addDays(today, 30).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }], { shouldValidate: true, shouldDirty: true });
          form.setValue('price1', undefined, { shouldValidate: false }); // Clear price1 if packages are added
          form.setValue('price2', undefined, { shouldValidate: false });
        }
      } else { // Activity packages exist
          form.setValue('price1', undefined, { shouldValidate: false });
          form.setValue('price2', undefined, { shouldValidate: false });
      }
    } else if (currentCategoryValue === 'transfer') {
      const effectiveTransferMode = form.getValues('transferMode') || 'ticket';
      if (form.getValues('transferMode') !== effectiveTransferMode) {
        form.setValue('transferMode', effectiveTransferMode, { shouldValidate: true, shouldDirty: true });
      }
      if (effectiveTransferMode === 'vehicle') {
         form.setValue('price1', undefined, { shouldValidate: true }); 
         form.setValue('price2', undefined, { shouldValidate: true }); 
         form.setValue('subCategory', undefined, { shouldValidate: true });
         form.setValue('maxPassengers', undefined, { shouldValidate: true });
         if (!form.getValues('vehicleOptions') || form.getValues('vehicleOptions')?.length === 0) {
            form.setValue('vehicleOptions', [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: ''}], { shouldValidate: true, shouldDirty: true });
         }
      } else { // ticket mode
         form.setValue('vehicleOptions', undefined, { shouldValidate: false });
         form.setValue('surchargePeriods', undefined, { shouldValidate: false });
         form.setValue('subCategory', 'ticket', { shouldValidate: true, shouldDirty: true });
         if (form.getValues('price1') === undefined) form.setValue('price1', 0, { shouldValidate: true, shouldDirty: true });
      }
    } else { // meal, misc
      if (form.getValues('price1') === undefined) {
        form.setValue('price1', 0, { shouldValidate: true, shouldDirty: true });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, watchedName, watchedProvince, form, isNewService /*, initialData*/ ]); // Removed initialData from deps to avoid re-running on every form update


  const handleActualSubmit = (values: ServicePriceFormValues) => {
    console.log('DEBUG Router: Form values received by handleActualSubmit:', JSON.parse(JSON.stringify(values, null, 2)));
    const dataToSubmit: any = JSON.parse(JSON.stringify(values)); 

    if (dataToSubmit.category === 'hotel' && dataToSubmit.hotelDetails?.roomTypes) {
      dataToSubmit.hotelDetails.name = dataToSubmit.name; 
      dataToSubmit.hotelDetails.province = dataToSubmit.province || ""; 
      dataToSubmit.hotelDetails.roomTypes = dataToSubmit.hotelDetails.roomTypes.map((rt: any) => ({
        ...rt,
        seasonalPrices: rt.seasonalPrices.map((sp: any) => ({
          ...sp,
          startDate: (sp.startDate instanceof Date ? format(sp.startDate, 'yyyy-MM-dd') : (typeof sp.startDate === 'string' && isValid(parseISO(sp.startDate)) ? format(parseISO(sp.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))),
          endDate: (sp.endDate instanceof Date ? format(sp.endDate, 'yyyy-MM-dd') : (typeof sp.endDate === 'string' && isValid(parseISO(sp.endDate)) ? format(parseISO(sp.endDate), 'yyyy-MM-dd') : format(addDays(new Date(),30), 'yyyy-MM-dd'))),
          extraBedRate: rt.extraBedAllowed ? sp.extraBedRate : undefined,
        })),
      }));
    } else if (dataToSubmit.category === 'transfer' && dataToSubmit.transferMode === 'vehicle' && dataToSubmit.surchargePeriods) {
      dataToSubmit.surchargePeriods = dataToSubmit.surchargePeriods.map((sp: any) => ({
        ...sp,
        startDate: (sp.startDate instanceof Date ? format(sp.startDate, 'yyyy-MM-dd') : (typeof sp.startDate === 'string' && isValid(parseISO(sp.startDate)) ? format(parseISO(sp.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))),
        endDate: (sp.endDate instanceof Date ? format(sp.endDate, 'yyyy-MM-dd') : (typeof sp.endDate === 'string' && isValid(parseISO(sp.endDate)) ? format(parseISO(sp.endDate), 'yyyy-MM-dd') : format(addDays(new Date(),30), 'yyyy-MM-dd'))),
      }));
    } else if (dataToSubmit.category === 'activity' && dataToSubmit.activityPackages) {
      dataToSubmit.activityPackages = dataToSubmit.activityPackages.map((pkg: any) => ({
        ...pkg,
        validityStartDate: pkg.validityStartDate && isValid(parseISO(pkg.validityStartDate)) ? pkg.validityStartDate : undefined,
        validityEndDate: pkg.validityEndDate && isValid(parseISO(pkg.validityEndDate)) ? pkg.validityEndDate : undefined,
        specificClosedDates: Array.isArray(pkg.specificClosedDates) ? pkg.specificClosedDates.filter((d:string) => d && isValid(parseISO(d))) : undefined,
      }));
    }

    if (dataToSubmit.province === "none") dataToSubmit.province = undefined;
    console.log("DEBUG Router: Submitting transformed data to parent:", JSON.parse(JSON.stringify(dataToSubmit)));
    onSubmit({ ...dataToSubmit } as Omit<ServicePriceItem, 'id'>);
  };

  const handleFormError = (errors: any) => {
    console.error("DEBUG Router: Form validation errors (raw object from react-hook-form):", JSON.parse(JSON.stringify(errors, null, 2)));
    const errorMessages = formatZodErrorsForAlert(errors);
    alert(`VALIDATION ERROR! Please correct the following issues:\n\n${errorMessages}\n\n(Check browser console for more details.)`);
  };

  const onFormSubmitAttempt = () => {
    console.log("DEBUG Router: Form submit attempt. Current form values:", JSON.parse(JSON.stringify(form.getValues(), null, 2)));
    console.log("DEBUG Router: Current form errors before handleSubmit runs its callbacks:", JSON.parse(JSON.stringify(form.formState.errors, null, 2)));
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault(); 
          onFormSubmitAttempt();
          form.handleSubmit(handleActualSubmit, handleFormError)(e);
        }}
        className="space-y-6"
      >
        <ScrollArea className="h-[60vh] md:h-[70vh] pr-3">
          <div className="space-y-6 p-1">
            <CommonPriceFields form={form} />
            {selectedCategory === 'hotel' && <HotelPriceForm form={form} isNewService={isNewService} />}
            {selectedCategory === 'activity' && <ActivityPriceForm form={form} />}
            {selectedCategory === 'transfer' && <TransferPriceForm form={form} />}
            {selectedCategory === 'meal' && <MealPriceForm form={form} />}
            {selectedCategory === 'misc' && <MiscellaneousPriceForm form={form} />}
          </div>
        </ScrollArea>
        
        <div className="mt-4 p-2 border border-dashed border-red-500 bg-red-50/50">
          <h3 className="text-sm font-semibold text-red-700">DEBUG: Current Form Validation Errors (Live)</h3>
          <pre className="text-xs text-red-600 whitespace-pre-wrap break-all max-h-40 overflow-auto">
            {JSON.stringify(form.formState.errors, null, 2)}
          </pre>
        </div>

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

    