
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
const hotelRoomSeasonalPriceSchema = z.object({
  id: z.string().min(1, "Seasonal price ID is required."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  rate: z.coerce.number().min(0, "Nightly rate must be non-negative."),
  extraBedRate: z.coerce.number().min(0, "Extra bed rate must be non-negative.").optional().nullable(),
  seasonName: z.string().optional().nullable(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

const hotelRoomTypeSchema = z.object({
  id: z.string().min(1, "Room type ID is required."),
  name: z.string().min(1, "Room type name is required."),
  extraBedAllowed: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
  seasonalPrices: z.array(hotelRoomSeasonalPriceSchema)
    .min(1, "Each room type must have at least one seasonal price period."),
  characteristics: z.array(z.object({ id: z.string(), key: z.string(), value: z.string() })).optional(),
});

const hotelDetailsSchema = z.object({
  id: z.string().min(1, "Hotel details ID is required."),
  name: z.string().min(1, "Hotel name (within details) is required."),
  province: z.string().min(1, "Hotel province is required. Please select a Province at the top of the form."),
  roomTypes: z.array(hotelRoomTypeSchema)
    .min(1, "Hotel must have at least one room type defined."),
});

const activityPackageSchema = z.object({
  id: z.string().min(1, "Package ID required"),
  name: z.string().min(1, "Package name is required"),
  price1: z.coerce.number().min(0, "Adult price must be non-negative"),
  price2: z.coerce.number().min(0, "Child price must be non-negative").optional().nullable(),
  notes: z.string().optional().nullable(),
  validityStartDate: z.string().refine(val => !val || isValid(parseISO(val)), {message: "Invalid start date format."}).optional().nullable(),
  validityEndDate: z.string().refine(val => !val || isValid(parseISO(val)), {message: "Invalid end date format."}).optional().nullable(),
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
  id: z.string().min(1, "Surcharge ID required"),
  name: z.string().min(1, "Surcharge name is required"),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  surchargeAmount: z.coerce.number().min(0, "Surcharge amount must be non-negative"),
}).refine(data => data.endDate >= data.startDate, { message: "End date cannot be before start date", path: ["endDate"] });

const vehicleOptionSchema = z.object({
  id: z.string().min(1, "Vehicle option ID required"),
  vehicleType: z.custom<VehicleType>((val) => VEHICLE_TYPES.includes(val as VehicleType), "Invalid vehicle type"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  maxPassengers: z.coerce.number().int().min(1, "Max passengers must be at least 1"),
  notes: z.string().optional().nullable(),
});

const servicePriceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  province: z.string().optional().nullable(),
  category: z.custom<ItineraryItemType>((val) => SERVICE_CATEGORIES.includes(val as ItineraryItemType), "Invalid category"),
  subCategory: z.string().optional().nullable(),
  price1: z.coerce.number().min(0, "Price must be non-negative").optional().nullable(),
  price2: z.coerce.number().min(0, "Price must be non-negative").optional().nullable(),
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency"),
  notes: z.string().optional().nullable(),
  selectedServicePriceId: z.string().optional().nullable(),
  
  transferMode: z.enum(['ticket', 'vehicle']).optional(),
  vehicleOptions: z.array(vehicleOptionSchema).optional(),
  maxPassengers: z.coerce.number().int().min(1).optional().nullable(),
  hotelDetails: hotelDetailsSchema.optional(),
  activityPackages: z.array(activityPackageSchema).optional(),
  surchargePeriods: z.array(surchargePeriodSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.category === 'hotel') {
    if (!data.hotelDetails) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hotel details are required. Ensure province is selected.", path: ["hotelDetails"]});
    } else if (!data.hotelDetails.province && data.province) { 
        data.hotelDetails.province = data.province;
    } else if (!data.hotelDetails.province && !data.province) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A province must be selected for hotel services.", path: ["province"] });
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
    } else { 
      if (typeof data.price1 !== 'number') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adult Ticket Price is required for ticket-based transfers.", path: ["price1"] });
      }
      data.subCategory = 'ticket';
      data.vehicleOptions = undefined; data.surchargePeriods = undefined;
    }
    data.hotelDetails = undefined; data.activityPackages = undefined;
  } else { 
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
const createDefaultSeasonalPrice = (rate: number = 0): RoomTypeSeasonalPrice => {
  const today = new Date();
  return {
    id: generateGUID(),
    startDate: today,
    endDate: addDays(today, 30),
    rate: rate,
    extraBedRate: undefined,
    seasonName: "Default Season"
  };
};

const createDefaultRoomType = (name?: string): HotelRoomTypeDefinition => ({
  id: generateGUID(),
  name: name || 'Standard Room (Default)',
  extraBedAllowed: false,
  notes: 'Default room type details.',
  seasonalPrices: [createDefaultSeasonalPrice(0)],
  characteristics: [],
});

const createDefaultSimplifiedHotelDetails = (name?: string, province?: string, existingId?: string): HotelDefinition => ({
  id: existingId || generateGUID(),
  name: name || "New Hotel (Default Name)",
  province: province || "", 
  roomTypes: [createDefaultRoomType()],
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

  if (!data || Object.keys(data).length === 0) {
    baseTransformed.category = defaultCategory; 
    if (defaultCategory === 'hotel') {
      baseTransformed.hotelDetails = createDefaultSimplifiedHotelDetails(
        baseTransformed.name, 
        baseTransformed.province,
        undefined 
      );
    } else if (defaultCategory === 'activity') {
      baseTransformed.activityPackages = [{ id: generateGUID(), name: 'Standard Package', price1: 0, validityStartDate: today.toISOString().split('T')[0], validityEndDate: addDays(today, 30).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }];
    } else if (defaultCategory === 'meal' || defaultCategory === 'misc') {
      baseTransformed.price1 = 0;
    } else if (defaultCategory === 'transfer') {
      baseTransformed.transferMode = 'ticket';
      baseTransformed.price1 = 0;
    }
    return baseTransformed;
  }

  if (baseTransformed.category === 'hotel') {
    let hotelDetailsToSet: HotelDefinition;
    if (data.hotelDetails && Array.isArray(data.hotelDetails.roomTypes) && data.hotelDetails.roomTypes.length > 0) {
        const transformedRoomTypes = data.hotelDetails.roomTypes.map(rt => ({
            ...rt,
            id: rt.id || generateGUID(),
            name: rt.name || "Unnamed Room Type",
            extraBedAllowed: rt.extraBedAllowed ?? false,
            notes: rt.notes || "",
            characteristics: rt.characteristics || [],
            seasonalPrices: (Array.isArray(rt.seasonalPrices) && rt.seasonalPrices.length > 0 ? rt.seasonalPrices : [createDefaultSeasonalPrice(rt.price1 || 0)]).map(sp => { // Use rt.price1 if migrating from old structure
                const sDate = sp.startDate && typeof sp.startDate === 'string' ? parseISO(sp.startDate) : (sp.startDate instanceof Date ? sp.startDate : today);
                const eDate = sp.endDate && typeof sp.endDate === 'string' ? parseISO(sp.endDate) : (sp.endDate instanceof Date ? sp.endDate : addDays(sDate, 30));
                return {
                    ...sp,
                    id: sp.id || generateGUID(),
                    startDate: isValid(sDate) ? sDate : today,
                    endDate: isValid(eDate) ? eDate : addDays(isValid(sDate) ? sDate : today, 30),
                    rate: typeof sp.rate === 'number' ? sp.rate : 0,
                    extraBedRate: typeof sp.extraBedRate === 'number' ? sp.extraBedRate : undefined,
                    seasonName: sp.seasonName || "Default Season"
                };
            })
        }));
        hotelDetailsToSet = {
            id: data.hotelDetails.id || data.id || generateGUID(), // Prioritize hotelDetails.id, then service item id
            name: data.name || data.hotelDetails.name || "Hotel Name from Data",
            province: data.province || data.hotelDetails.province || "",
            roomTypes: transformedRoomTypes
        };
    } else { 
        hotelDetailsToSet = createDefaultSimplifiedHotelDetails(
            data.name || baseTransformed.name,
            data.province || baseTransformed.province,
            data.id || data.hotelDetails?.id || generateGUID() // Use data.id for hotelDetails.id if hotelDetails object itself is missing
        );
    }
    baseTransformed.hotelDetails = hotelDetailsToSet;
    baseTransformed.price1 = undefined; baseTransformed.price2 = undefined; baseTransformed.subCategory = undefined;
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;
  } else if (baseTransformed.category === 'activity') {
    let packages: ActivityPackageDefinition[] = [];
    if (data.activityPackages && data.activityPackages.length > 0) {
      packages = data.activityPackages.map(pkg => ({ ...pkg, id: pkg.id || generateGUID(), name: pkg.name || "Unnamed Package", price1: pkg.price1 ?? 0, validityStartDate: pkg.validityStartDate || today.toISOString().split('T')[0], validityEndDate: pkg.validityEndDate || addDays(today, 30).toISOString().split('T')[0], closedWeekdays: pkg.closedWeekdays || [], specificClosedDates: pkg.specificClosedDates || [] }));
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
      baseTransformed.vehicleOptions = data.vehicleOptions && data.vehicleOptions.length > 0 ? data.vehicleOptions.map(vo => ({...vo, id: vo.id || generateGUID(), vehicleType: vo.vehicleType || VEHICLE_TYPES[0], price: vo.price ?? 0, maxPassengers: vo.maxPassengers ?? 1 })) : [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: '' }];
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
  const defaultValuesFromInitial = React.useMemo(() => transformInitialDataToFormValues(initialData), [initialData]);
  const form = useForm<ServicePriceFormValues>({
    resolver: zodResolver(servicePriceSchema),
    defaultValues: defaultValuesFromInitial,
    mode: "onSubmit", 
  });

  const watchedCategory = form.watch("category");
  const watchedName = form.watch('name');
  const watchedProvince = form.watch('province');
  const isNewService = !initialData?.id;


  React.useEffect(() => {
    const currentCategoryValue = form.getValues('category');
    const currentName = form.getValues('name');
    const currentProvince = form.getValues('province');
    const today = new Date();

    const setFieldValue = (path: any, value: any) => form.setValue(path, value, { shouldValidate: true, shouldDirty: true });
    
    const needsHotelStructureReinitialization = (details: any) => 
        !details || !details.id || // Check for hotelDetails.id itself
        !Array.isArray(details.roomTypes) || details.roomTypes.length === 0 ||
        !details.roomTypes[0] || !details.roomTypes[0].id || // Check for roomTypes[0].id
        !Array.isArray(details.roomTypes[0].seasonalPrices) || details.roomTypes[0].seasonalPrices.length === 0 ||
        !details.roomTypes[0].seasonalPrices[0] || !details.roomTypes[0].seasonalPrices[0].id; // Check for seasonalPrices[0].id

    // Clear fields not relevant to the current category
    if (currentCategoryValue !== 'hotel' && form.getValues('hotelDetails')) setFieldValue('hotelDetails', undefined);
    if (currentCategoryValue !== 'activity' && form.getValues('activityPackages')) setFieldValue('activityPackages', undefined);
    if (currentCategoryValue !== 'transfer') {
      if (form.getValues('transferMode')) setFieldValue('transferMode', undefined);
      if (form.getValues('vehicleOptions')) setFieldValue('vehicleOptions', undefined);
      if (form.getValues('surchargePeriods')) setFieldValue('surchargePeriods', undefined);
      if (form.getValues('maxPassengers')) setFieldValue('maxPassengers', undefined);
    }
    if (currentCategoryValue === 'hotel' || currentCategoryValue === 'activity' || (currentCategoryValue === 'transfer' && form.getValues('transferMode') === 'vehicle')) {
        if (form.getValues('price1') !== undefined) setFieldValue('price1', undefined);
        if (form.getValues('price2') !== undefined) setFieldValue('price2', undefined);
    }
    if (currentCategoryValue !== 'meal' && currentCategoryValue !== 'misc' && !(currentCategoryValue === 'transfer' && form.getValues('transferMode') === 'ticket')) {
        if (form.getValues('subCategory') !== undefined) setFieldValue('subCategory', undefined);
    }


    if (currentCategoryValue === 'hotel') {
        let hotelDetails = form.getValues('hotelDetails');
        const expectedHotelName = currentName || (isNewService ? "New Hotel (Default Name)" : hotelDetails?.name);
        const expectedHotelProvince = currentProvince || (isNewService ? "" : hotelDetails?.province);

        if (needsHotelStructureReinitialization(hotelDetails) || 
            (hotelDetails && hotelDetails.name !== expectedHotelName) || 
            (hotelDetails && hotelDetails.province !== expectedHotelProvince)
           ) {
            console.log(`DEBUG Router: Hotel category. isNew: ${isNewService}. Rebuilding/Syncing hotelDetails. Name: ${expectedHotelName}, Prov: ${expectedHotelProvince}. Current hotelDetails.id: ${hotelDetails?.id}`);
            const newOrUpdatedHotelDetails = createDefaultSimplifiedHotelDetails(
                expectedHotelName, 
                expectedHotelProvince, 
                isNewService ? undefined : hotelDetails?.id // For NEW service, hotelDetails.id gets new GUID. For existing, preserve its ID.
            );
            setFieldValue('hotelDetails', newOrUpdatedHotelDetails);
        }
    } else if (currentCategoryValue === 'activity') {
      if ((!form.getValues('activityPackages') || form.getValues('activityPackages')?.length === 0) && isNewService) {
        setFieldValue('activityPackages', [{ id: generateGUID(), name: 'Standard Package', price1: 0, validityStartDate: today.toISOString().split('T')[0], validityEndDate: addDays(today, 30).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }]);
      } else if (form.getValues('activityPackages') && form.getValues('activityPackages')?.length === 0 && !isNewService && initialData?.activityPackages && initialData.activityPackages.length > 0){
        // If editing and packages were cleared, restore from initialData if available (or handle as needed)
        setFieldValue('activityPackages', transformInitialDataToFormValues(initialData).activityPackages);
      }
    } else if (currentCategoryValue === 'transfer') {
      const effectiveTransferMode = form.getValues('transferMode') || 'ticket';
      if (form.getValues('transferMode') !== effectiveTransferMode) {
        setFieldValue('transferMode', effectiveTransferMode);
      }
      if (effectiveTransferMode === 'vehicle') {
         if ((!form.getValues('vehicleOptions') || form.getValues('vehicleOptions')?.length === 0) && isNewService) {
            setFieldValue('vehicleOptions', [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: ''}]);
         }
      } else { 
         setFieldValue('subCategory', 'ticket');
         if (form.getValues('price1') === undefined) setFieldValue('price1', 0);
      }
    } else if (currentCategoryValue === 'meal' || currentCategoryValue === 'misc') {
      if (form.getValues('price1') === undefined && (isNewService || !initialData?.price1)) {
        setFieldValue('price1', 0);
      }
    }
  // Using watched values as dependencies
  }, [watchedCategory, watchedName, watchedProvince, isNewService, initialData, form.setValue, form.getValues]);


  const handleActualSubmit = (values: ServicePriceFormValues) => {
    console.log('DEBUG Router: Form values received by handleActualSubmit:', JSON.parse(JSON.stringify(values, null, 2)));
    const dataToSubmit: any = JSON.parse(JSON.stringify(values)); 

    if (dataToSubmit.category === 'hotel' && dataToSubmit.hotelDetails?.roomTypes) {
      dataToSubmit.hotelDetails.name = dataToSubmit.name || dataToSubmit.hotelDetails.name; 
      dataToSubmit.hotelDetails.province = dataToSubmit.province || dataToSubmit.hotelDetails.province || ""; 
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
            {watchedCategory === 'hotel' && <HotelPriceForm form={form} />}
            {watchedCategory === 'activity' && <ActivityPriceForm form={form} />}
            {watchedCategory === 'transfer' && <TransferPriceForm form={form} />}
            {watchedCategory === 'meal' && <MealPriceForm form={form} />}
            {watchedCategory === 'misc' && <MiscellaneousPriceForm form={form} />}
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
