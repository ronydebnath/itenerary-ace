
/**
 * @fileoverview This component acts as a router for different service price forms.
 * Based on the selected service category (e.g., hotel, activity, transfer), it dynamically
 * renders the appropriate specialized form component. It also handles the overall form
 * structure using `react-hook-form`, manages common fields, and defines the Zod schema
 * for validating all possible service price configurations.
 *
 * @bangla এই কম্পোনেন্টটি বিভিন্ন পরিষেবা মূল্য ফর্মের জন্য একটি রাউটার হিসেবে কাজ করে।
 * নির্বাচিত পরিষেবা বিভাগের (যেমন, হোটেল, কার্যকলাপ, ট্রান্সফার) উপর ভিত্তি করে, এটি গতিশীলভাবে
 * উপযুক্ত বিশেষায়িত ফর্ম কম্পোনেন্ট রেন্ডার করে। এটি `react-hook-form` ব্যবহার করে সামগ্রিক
 * ফর্ম কাঠামো পরিচালনা করে, সাধারণ ক্ষেত্রগুলি পরিচালনা করে এবং সমস্ত সম্ভাব্য পরিষেবা মূল্য
 * কনফিগারেশন যাচাই করার জন্য Zod স্কিমা সংজ্ঞায়িত করে।
 */
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ServicePriceItem, CurrencyCode, ItineraryItemType, VehicleType, HotelDefinition, HotelRoomTypeDefinition, RoomTypeSeasonalPrice, ActivityPackageDefinition, SurchargePeriod, VehicleOption, CountryItem } from '@/types/itinerary';
import { CURRENCIES, SERVICE_CATEGORIES, VEHICLE_TYPES } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { CommonPriceFields } from './CommonPriceFields';
import { HotelPriceForm } from './HotelPriceForm';
import { ActivityPriceForm } from './ActivityPriceForm';
import { TransferPriceForm } from './TransferPriceForm';
import { MealPriceForm } from './MealPriceForm';
import { MiscellaneousPriceForm } from './MiscellaneousPriceForm';
import { addDays, isValid, parseISO, format, areIntervalsOverlapping } from 'date-fns';
import { useCountries } from '@/hooks/useCountries';
import { Loader2 } from 'lucide-react'; 

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
    .min(1, "Each room type must have at least one seasonal price period.")
    .refine(
      (seasonalPrices) => {
        if (!seasonalPrices || seasonalPrices.length < 2) {
          return true; 
        }
        for (let i = 0; i < seasonalPrices.length; i++) {
          for (let j = i + 1; j < seasonalPrices.length; j++) {
            const periodA = seasonalPrices[i];
            const periodB = seasonalPrices[j];
            if (
              periodA.startDate && periodA.endDate &&
              periodB.startDate && periodB.endDate &&
              isValid(periodA.startDate) && isValid(periodA.endDate) &&
              isValid(periodB.startDate) && isValid(periodB.endDate)
            ) {
              if (areIntervalsOverlapping(
                { start: periodA.startDate, end: periodA.endDate },
                { start: periodB.startDate, end: periodB.endDate },
                { inclusive: true } 
              )) {
                return false; 
              }
            }
          }
        }
        return true;
      },
      {
        message: "Seasonal price periods cannot overlap within the same room type.",
      }
    ),
  characteristics: z.array(z.object({ id: z.string(), key: z.string(), value: z.string() })).optional(),
});

const hotelDetailsSchema = z.object({
  id: z.string().min(1, "Hotel details ID is required."),
  name: z.string().min(1, "Hotel name (within details) is required."),
  countryId: z.string().min(1, "Hotel country is required. Please select a Country at the top of the form."),
  province: z.string().min(1, "Hotel province is required. Please select a Province at the top of the form."),
  starRating: z.coerce.number().int().min(1).max(5).optional().nullable().describe("Hotel star rating from 1 to 5."),
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
  countryId: z.string().optional().nullable(),
  province: z.string().optional().nullable(), 
  category: z.custom<ItineraryItemType>((val) => SERVICE_CATEGORIES.includes(val as ItineraryItemType), "Invalid category"),
  subCategory: z.string().optional().nullable(),
  price1: z.coerce.number().min(0, "Price must be non-negative").optional().nullable(),
  price2: z.coerce.number().min(0, "Price must be non-negative").optional().nullable(),
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency"),
  unitDescription: z.string().optional().nullable(), // Added nullable for consistency
  notes: z.string().optional().nullable(),
  selectedServicePriceId: z.string().optional().nullable(),
  isFavorite: z.boolean().optional(),
  
  transferMode: z.enum(['ticket', 'vehicle']).optional(),
  vehicleOptions: z.array(vehicleOptionSchema).optional(),
  maxPassengers: z.coerce.number().int().min(1).optional().nullable(),
  hotelDetails: hotelDetailsSchema.optional(),
  activityPackages: z.array(activityPackageSchema).optional(),
  surchargePeriods: z.array(surchargePeriodSchema).optional(),
}).superRefine((data, ctx) => {
  if (data.category === 'hotel') {
    if (!data.countryId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Country is required for hotel services.", path: ["countryId"] });
    if (!data.province) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Province is required for hotel services.", path: ["province"] });
    if (!data.hotelDetails) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Hotel details are required.", path: ["hotelDetails"]});
    } else {
        if(!data.hotelDetails.countryId && data.countryId) data.hotelDetails.countryId = data.countryId;
        if(!data.hotelDetails.province && data.province) data.hotelDetails.province = data.province;
    }
    data.price1 = undefined; data.price2 = undefined; data.subCategory = undefined;
    data.vehicleOptions = undefined; data.transferMode = undefined; data.maxPassengers = undefined;
    if(!data.unitDescription) data.unitDescription = "per night";
  } else if (data.category === 'activity') {
    if ((!data.activityPackages || data.activityPackages.length === 0) && (typeof data.price1 !== 'number' || data.price1 < 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "For activities, either define packages or provide a valid default Adult Price.", path: ["price1"] });
    }
    if (data.activityPackages && data.activityPackages.length > 0) {
        data.price1 = undefined; data.price2 = undefined;
    }
    data.subCategory = undefined; data.hotelDetails = undefined;
    data.vehicleOptions = undefined; data.transferMode = undefined; data.maxPassengers = undefined;
    if(!data.unitDescription) data.unitDescription = "per person";
  } else if (data.category === 'transfer') {
    if (data.transferMode === 'vehicle') {
      if (!data.vehicleOptions || data.vehicleOptions.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "For vehicle transfers, define at least one vehicle option.", path: ["vehicleOptions"] });
      }
      data.price1 = undefined; data.price2 = undefined; data.subCategory = undefined; data.maxPassengers = undefined;
      if(!data.unitDescription) data.unitDescription = "per service";
    } else { 
      if (typeof data.price1 !== 'number') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Adult Ticket Price is required for ticket-based transfers.", path: ["price1"] });
      }
      data.subCategory = 'ticket';
      data.vehicleOptions = undefined; data.surchargePeriods = undefined;
      if(!data.unitDescription) data.unitDescription = "per person";
    }
    data.hotelDetails = undefined; data.activityPackages = undefined;
  } else { 
    if (typeof data.price1 !== 'number') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Primary price is required for this category.", path: ["price1"] });
    }
    data.hotelDetails = undefined; data.activityPackages = undefined;
    data.vehicleOptions = undefined; data.transferMode = undefined; data.surchargePeriods = undefined; data.maxPassengers = undefined;
    if(!data.unitDescription) data.unitDescription = "per person";
  }
});

export type ServicePriceFormValues = z.infer<typeof servicePriceSchema>;

interface ServicePriceFormRouterProps {
  initialData?: Partial<ServicePriceItem>;
  onSubmit: (data: Omit<ServicePriceItem, 'id'>) => void;
  onCancel: () => void;
}

const createDefaultSeasonalPrice = (rate: number = 0): RoomTypeSeasonalPrice => {
  const today = new Date();
  return { id: generateGUID(), startDate: today.toISOString().split('T')[0], endDate: addDays(today, 30).toISOString().split('T')[0], rate, extraBedRate: undefined, seasonName: "Default Season" };
};
const createDefaultRoomType = (name?: string): HotelRoomTypeDefinition => ({ id: generateGUID(), name: name || 'Standard Room', extraBedAllowed: false, notes: '', seasonalPrices: [createDefaultSeasonalPrice()], characteristics: [] });

const transformInitialDataToFormValues = (initialData?: Partial<ServicePriceItem>, countries?: CountryItem[]): Partial<ServicePriceFormValues> => {
  const defaultCategory: ItineraryItemType = initialData?.category || "activity";
  const today = new Date();
  
  let defaultCurrency: CurrencyCode = CURRENCIES.includes('USD') ? 'USD' : CURRENCIES[0];
  if (initialData?.countryId) {
    const country = countries?.find(c => c.id === initialData.countryId);
    if (country?.defaultCurrency) {
      defaultCurrency = country.defaultCurrency;
    }
  } else if (defaultCategory === 'hotel') {
    const thailand = countries?.find(c => c.name === "Thailand");
    if (thailand?.defaultCurrency) defaultCurrency = thailand.defaultCurrency;
  }

  let baseTransformed: Partial<ServicePriceFormValues> = {
    name: initialData?.name || "",
    countryId: initialData?.countryId || undefined,
    province: initialData?.province || undefined,
    category: defaultCategory,
    unitDescription: initialData?.unitDescription || (defaultCategory === 'hotel' ? 'per night' : (defaultCategory === 'transfer' && initialData?.transferMode === 'vehicle' ? 'per service' : 'per person')),
    currency: initialData?.currency || defaultCurrency,
    notes: initialData?.notes || "",
    selectedServicePriceId: initialData?.selectedServicePriceId || undefined,
    isFavorite: initialData?.isFavorite || false,
  };
  
  if ((!initialData || Object.keys(initialData).length === 0 || !initialData.category) && baseTransformed.category === 'hotel' && !baseTransformed.countryId) {
    const thailand = countries?.find(c => c.name === "Thailand");
    if (thailand) {
      baseTransformed.countryId = thailand.id;
      if(thailand.defaultCurrency) baseTransformed.currency = thailand.defaultCurrency;
    }
  }

  baseTransformed.surchargePeriods = initialData?.surchargePeriods?.map(sp => {
    const initialStartDate = sp.startDate && typeof sp.startDate === 'string' ? parseISO(sp.startDate) : (sp.startDate instanceof Date ? sp.startDate : today);
    const initialEndDate = sp.endDate && typeof sp.endDate === 'string' ? parseISO(sp.endDate) : (sp.endDate instanceof Date ? sp.endDate : addDays(initialStartDate, 30));
    return { ...sp, id: sp.id || generateGUID(), startDate: isValid(initialStartDate) ? initialStartDate : today, endDate: isValid(initialEndDate) ? initialEndDate : addDays(isValid(initialStartDate) ? initialStartDate : today, 30) };
  }) || [];

  if (!initialData || Object.keys(initialData).length === 0) { 
    if (baseTransformed.category === 'hotel') {
        baseTransformed.hotelDetails = { id: generateGUID(), name: baseTransformed.name || "New Hotel", countryId: baseTransformed.countryId || "", province: baseTransformed.province || "", starRating: 3, roomTypes: [createDefaultRoomType()] };
    } else if (baseTransformed.category === 'activity') {
      baseTransformed.activityPackages = [{ id: generateGUID(), name: 'Standard Package', price1: 0, validityStartDate: today.toISOString().split('T')[0], validityEndDate: addDays(today, 30).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }];
    } else if (baseTransformed.category === 'transfer') {
      baseTransformed.transferMode = 'ticket'; baseTransformed.price1 = 0;
    } else { baseTransformed.price1 = 0; }
    return baseTransformed;
  }

  if (baseTransformed.category === 'hotel') {
    const hotelDefFromInitial = initialData.hotelDetails;
    const transformedRoomTypes = (hotelDefFromInitial?.roomTypes && hotelDefFromInitial.roomTypes.length > 0 ? hotelDefFromInitial.roomTypes : [createDefaultRoomType(initialData.subCategory)])
        .map(rt => ({
            ...rt, id: rt.id || generateGUID(), name: rt.name || "Unnamed Room Type", extraBedAllowed: rt.extraBedAllowed ?? false, notes: rt.notes || "", characteristics: rt.characteristics || [],
            seasonalPrices: (Array.isArray(rt.seasonalPrices) && rt.seasonalPrices.length > 0 ? rt.seasonalPrices : [createDefaultSeasonalPrice(rt.price1 || 0)]).map(sp => { 
                const sDate = sp.startDate && typeof sp.startDate === 'string' ? parseISO(sp.startDate) : (sp.startDate instanceof Date ? sp.startDate : today);
                const eDate = sp.endDate && typeof sp.endDate === 'string' ? parseISO(sp.endDate) : (sp.endDate instanceof Date ? sp.endDate : addDays(sDate, 30));
                return { ...sp, id: sp.id || generateGUID(), startDate: isValid(sDate) ? sDate : today, endDate: isValid(eDate) ? eDate : addDays(isValid(sDate) ? sDate : today, 30), rate: typeof sp.rate === 'number' ? sp.rate : 0, extraBedRate: typeof sp.extraBedRate === 'number' ? sp.extraBedRate : undefined, seasonName: sp.seasonName || "Default Season" };
            })
        }));
    baseTransformed.hotelDetails = {
        id: hotelDefFromInitial?.id || initialData.id || generateGUID(),
        name: initialData.name || hotelDefFromInitial?.name || "Hotel Name from Data",
        countryId: initialData.countryId || hotelDefFromInitial?.countryId || "",
        province: initialData.province || hotelDefFromInitial?.province || "",
        starRating: hotelDefFromInitial?.starRating,
        roomTypes: transformedRoomTypes
    };
  } else if (baseTransformed.category === 'activity') {
    let packages: ActivityPackageDefinition[] = [];
    if (initialData.activityPackages && initialData.activityPackages.length > 0) {
      packages = initialData.activityPackages.map(pkg => ({ ...pkg, id: pkg.id || generateGUID(), name: pkg.name || "Unnamed Package", price1: pkg.price1 ?? 0, validityStartDate: pkg.validityStartDate || today.toISOString().split('T')[0], validityEndDate: pkg.validityEndDate || addDays(today, 30).toISOString().split('T')[0], closedWeekdays: pkg.closedWeekdays || [], specificClosedDates: pkg.specificClosedDates || [] }));
    } else if (initialData.price1 !== undefined) {
      packages = [{ id: generateGUID(), name: initialData.subCategory || 'Standard Package', price1: initialData.price1, price2: initialData.price2, notes: initialData.notes || '', validityStartDate: today.toISOString().split('T')[0], validityEndDate: addDays(today, 30).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }];
    }
    if (packages.length === 0) { packages = [{ id: generateGUID(), name: 'Standard Package', price1: 0, validityStartDate: today.toISOString().split('T')[0], validityEndDate: addDays(today, 30).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }]; }
    baseTransformed.activityPackages = packages;
  } else if (baseTransformed.category === 'transfer') {
    baseTransformed.transferMode = initialData.transferMode || (initialData.subCategory === 'ticket' ? 'ticket' : (initialData.vehicleOptions && initialData.vehicleOptions.length > 0 ? 'vehicle' : 'ticket'));
    if (baseTransformed.transferMode === 'vehicle') {
      baseTransformed.vehicleOptions = initialData.vehicleOptions && initialData.vehicleOptions.length > 0 ? initialData.vehicleOptions.map(vo => ({...vo, id: vo.id || generateGUID(), vehicleType: vo.vehicleType || VEHICLE_TYPES[0], price: vo.price ?? 0, maxPassengers: vo.maxPassengers ?? 1 })) : [{ id: generateGUID(), vehicleType: VEHICLE_TYPES[0], price: 0, maxPassengers: 1, notes: '' }];
    } else { baseTransformed.price1 = initialData.price1 ?? 0; baseTransformed.price2 = initialData.price2; baseTransformed.subCategory = 'ticket';}
  } else { baseTransformed.subCategory = initialData.subCategory || ""; baseTransformed.price1 = initialData.price1 ?? 0; baseTransformed.price2 = initialData.price2; }
  
  return baseTransformed;
};


export function ServicePriceFormRouter({ initialData, onSubmit, onCancel }: ServicePriceFormRouterProps) {
  const { countries, isLoading: isLoadingCountries, getCountryById } = useCountries();
  const defaultValuesFromInitial = React.useMemo(() => transformInitialDataToFormValues(initialData, countries), [initialData, countries]);
  
  const form = useForm<ServicePriceFormValues>({
    resolver: zodResolver(servicePriceSchema),
    defaultValues: defaultValuesFromInitial,
    mode: "onSubmit", 
  });

  const watchedCategory = form.watch("category");
  const watchedName = form.watch('name');
  const watchedCountryId = form.watch('countryId');
  const watchedProvince = form.watch('province');
  const isNewService = !initialData?.id;
  const isCreateMode = !initialData?.id;

  React.useEffect(() => {
    if(!isLoadingCountries) {
      form.reset(transformInitialDataToFormValues(initialData, countries));
    }
  }, [initialData, countries, form.reset, form, isLoadingCountries]);

  React.useEffect(() => {
    const currentCategoryValue = form.getValues('category');
    const currentName = form.getValues('name');
    const currentCountryId = form.getValues('countryId');
    const currentProvince = form.getValues('province');
    const currentUnitDesc = form.getValues('unitDescription');
    
    const setFieldValue = (path: any, value: any) => form.setValue(path, value, { shouldValidate: true, shouldDirty: true });
    
    if (currentCategoryValue === 'hotel') {
        let hotelDetailsCurrent = form.getValues('hotelDetails');
        const expectedHotelName = currentName || (isNewService ? "New Hotel" : hotelDetailsCurrent?.name);
        const expectedCountryId = currentCountryId || (hotelDetailsCurrent?.countryId || "");
        const expectedProvince = currentProvince || hotelDetailsCurrent?.province || "";
        let updateRequired = false;

        if (!hotelDetailsCurrent || (isNewService && (!hotelDetailsCurrent.id || !hotelDetailsCurrent.name))) {
            setFieldValue('hotelDetails', { 
                id: generateGUID(), 
                name: expectedHotelName, 
                countryId: expectedCountryId, 
                province: expectedProvince, 
                starRating: hotelDetailsCurrent?.starRating ?? 3,
                roomTypes: hotelDetailsCurrent?.roomTypes?.length ? hotelDetailsCurrent.roomTypes : [createDefaultRoomType()] 
            });
        } else {
            if (hotelDetailsCurrent.name !== expectedHotelName) { hotelDetailsCurrent.name = expectedHotelName || ""; updateRequired = true; }
            if (hotelDetailsCurrent.countryId !== expectedCountryId) { hotelDetailsCurrent.countryId = expectedCountryId; updateRequired = true; }
            if (hotelDetailsCurrent.province !== expectedProvince) { hotelDetailsCurrent.province = expectedProvince; updateRequired = true; }
            if (!hotelDetailsCurrent.id) { hotelDetailsCurrent.id = generateGUID(); updateRequired = true; }
            if (hotelDetailsCurrent.starRating === undefined) { hotelDetailsCurrent.starRating = 3; updateRequired = true;}
            if (updateRequired) setFieldValue('hotelDetails', { ...hotelDetailsCurrent });
        }
        if(!currentUnitDesc) setFieldValue('unitDescription', 'per night');
    } else if (currentCategoryValue === 'activity') {
        if(!currentUnitDesc) setFieldValue('unitDescription', 'per person');
    } else if (currentCategoryValue === 'transfer') {
        const currentTransferMode = form.getValues('transferMode');
        if (currentTransferMode === 'vehicle' && !currentUnitDesc) {
            setFieldValue('unitDescription', 'per service');
        } else if (currentTransferMode !== 'vehicle' && !currentUnitDesc) { // ticket or undefined defaults to per person
             setFieldValue('unitDescription', 'per person');
        }
    } else { // meal, misc
        if(!currentUnitDesc) setFieldValue('unitDescription', 'per person');
    }
  }, [watchedCategory, watchedName, watchedCountryId, watchedProvince, isNewService, initialData, form, countries]);

  const handleActualSubmit = (values: ServicePriceFormValues) => {
    const dataToSubmit: any = JSON.parse(JSON.stringify(values)); 
    if (dataToSubmit.category === 'hotel' && dataToSubmit.hotelDetails?.roomTypes) {
      dataToSubmit.hotelDetails.name = dataToSubmit.name || dataToSubmit.hotelDetails.name; 
      dataToSubmit.hotelDetails.countryId = dataToSubmit.countryId || dataToSubmit.hotelDetails.countryId;
      dataToSubmit.hotelDetails.province = dataToSubmit.province || dataToSubmit.hotelDetails.province || ""; 
      dataToSubmit.hotelDetails.starRating = dataToSubmit.hotelDetails.starRating; 
      dataToSubmit.hotelDetails.roomTypes = dataToSubmit.hotelDetails.roomTypes.map((rt: any) => ({
        ...rt,
        seasonalPrices: rt.seasonalPrices.map((sp: any) => ({
          ...sp,
          startDate: (sp.startDate instanceof Date ? format(sp.startDate, 'yyyy-MM-dd') : (typeof sp.startDate === 'string' && isValid(parseISO(sp.startDate)) ? format(parseISO(sp.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))),
          endDate: (sp.endDate instanceof Date ? format(sp.endDate, 'yyyy-MM-dd') : (typeof sp.endDate === 'string' && isValid(parseISO(sp.endDate)) ? format(parseISO(sp.endDate), 'yyyy-MM-dd') : format(addDays(new Date(),30), 'yyyy-MM-dd'))),
        })),
      }));
    } 
    
    if (dataToSubmit.surchargePeriods) {
        dataToSubmit.surchargePeriods = dataToSubmit.surchargePeriods.map((sp: any) => ({
            ...sp,
             startDate: (sp.startDate instanceof Date ? format(sp.startDate, 'yyyy-MM-dd') : (typeof sp.startDate === 'string' && isValid(parseISO(sp.startDate)) ? format(parseISO(sp.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))),
             endDate: (sp.endDate instanceof Date ? format(sp.endDate, 'yyyy-MM-dd') : (typeof sp.endDate === 'string' && isValid(parseISO(sp.endDate)) ? format(parseISO(sp.endDate), 'yyyy-MM-dd') : format(addDays(new Date(),30), 'yyyy-MM-dd'))),
        }));
    }
    if (dataToSubmit.activityPackages) {
        dataToSubmit.activityPackages = dataToSubmit.activityPackages.map((ap:any) => ({
            ...ap,
            validityStartDate: ap.validityStartDate || undefined,
            validityEndDate: ap.validityEndDate || undefined,
        }));
    }

    if (dataToSubmit.countryId === "none") dataToSubmit.countryId = undefined;
    if (dataToSubmit.province === "none") dataToSubmit.province = undefined;
    onSubmit({ ...dataToSubmit } as Omit<ServicePriceItem, 'id'>);
  };

  const handleFormError = (errors: any) => { console.error("Form validation errors:", errors); };

  if (isLoadingCountries) {
    return <div className="flex justify-center items-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary"/> <p className="ml-2">Loading form configuration...</p></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleActualSubmit, handleFormError)} className="space-y-6">
        <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-250px)] pr-3">
          <div className="space-y-4 md:space-y-6 p-1">
            <CommonPriceFields form={form} />
            {watchedCategory === 'hotel' && <HotelPriceForm form={form} />}
            {watchedCategory === 'activity' && <ActivityPriceForm form={form} isCreateMode={isCreateMode} />}
            {watchedCategory === 'transfer' && <TransferPriceForm form={form} />}
            {watchedCategory === 'meal' && <MealPriceForm form={form} isCreateMode={isCreateMode} />}
            {watchedCategory === 'misc' && <MiscellaneousPriceForm form={form} isCreateMode={isCreateMode} />}
          </div>
        </ScrollArea>
        <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onCancel} size="sm" className="h-9 text-sm">Cancel</Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground h-9 text-sm" size="sm">
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            {initialData?.id ? 'Update' : 'Create'} Service Price
          </Button>
        </div>
      </form>
    </Form>
  );
}

