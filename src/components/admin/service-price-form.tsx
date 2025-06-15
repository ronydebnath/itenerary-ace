
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
import { Label } from "@/components/ui/label";
import type { ServicePriceItem, CurrencyCode, ItineraryItemType, VehicleType, HotelDefinition, HotelRoomTypeDefinition, RoomTypeSeasonalPrice, ActivityPackageDefinition, SchedulingData, SurchargePeriod, VehicleOption } from '@/types/itinerary';
import { CURRENCIES, SERVICE_CATEGORIES, VEHICLE_TYPES } from '@/types/itinerary';
import { PlusCircle, Trash2, XIcon, AlertTriangle, Car } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateGUID } from '@/lib/utils';
import { useProvinces } from '@/hooks/useProvinces';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ActivityPackageScheduler } from '@/components/itinerary/items/activity-package-scheduler';


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
  name: z.string(),
  province: z.string(),
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
  subCategory: z.string().optional(), // Used for Meal Type, Misc Sub-Type, or 'ticket' for transfers
  price1: z.coerce.number().min(0, "Price must be non-negative").optional(), // Primary price for non-vehicle transfers, non-hotel, non-activity
  price2: z.coerce.number().min(0, "Price must be non-negative").optional(), // Secondary price
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency"),
  unitDescription: z.string().optional(),
  notes: z.string().optional(),
  
  // Transfer specific
  transferMode: z.enum(['ticket', 'vehicle']).optional(),
  vehicleOptions: z.array(vehicleOptionSchema).optional(), // For vehicle-based transfers
  maxPassengers: z.coerce.number().int().min(1).optional(), // Top-level, less relevant if vehicleOptions used

  // Hotel specific
  hotelDetails: hotelDetailsSchema.optional(),
  // Activity specific
  activityPackages: z.array(activityPackageSchema).optional(),
  // Surcharges (currently mainly for vehicle transfers)
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
    if (!data.unitDescription) data.unitDescription = 'per night';
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
    if (!data.unitDescription) data.unitDescription = 'per person';
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
      if (!data.unitDescription) data.unitDescription = 'per service'; // Or 'per vehicle option chosen'
      data.price1 = undefined; data.price2 = undefined; data.subCategory = undefined; data.maxPassengers = undefined;
    } else { // ticket mode
      if (typeof data.price1 !== 'number') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Adult Ticket Price is required.",
            path: ["price1"],
        });
      }
      data.subCategory = 'ticket'; // Enforce subCategory for ticket mode
      if (!data.unitDescription) data.unitDescription = 'per person';
      data.vehicleOptions = undefined; data.surchargePeriods = undefined; // Surcharges are for vehicle mode
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
    if (!data.unitDescription) data.unitDescription = 'per person';
    data.hotelDetails = undefined; data.activityPackages = undefined;
    data.vehicleOptions = undefined; data.transferMode = undefined; data.surchargePeriods = undefined; data.maxPassengers = undefined;
  }
});

type ServicePriceFormValues = z.infer<typeof servicePriceSchema>;

interface ServicePriceFormProps {
  initialData?: Partial<ServicePriceItem>;
  onSubmit: (data: Omit<ServicePriceItem, 'id'>) => void;
  onCancel: () => void;
}

const transformInitialDataToFormValues = (data?: Partial<ServicePriceItem>): Partial<ServicePriceFormValues> => {
  const defaultCurrency: CurrencyCode = "THB";
  const defaultCategory: ItineraryItemType = "activity";

  if (!data || Object.keys(data).length === 0) { // Default for new item
    return {
      category: defaultCategory,
      currency: defaultCurrency,
      name: "",
      activityPackages: [{
        id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '',
        validityStartDate: new Date().toISOString().split('T')[0],
        validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
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
      startDate: sp.startDate ? new Date(sp.startDate) : new Date(),
      endDate: sp.endDate ? new Date(sp.endDate) : new Date(),
    })) || [],
  };

  if (baseTransformed.category === 'hotel') {
    // ... (hotelDetails transformation - remains mostly the same)
    let roomTypes: HotelRoomTypeDefinition[] = [];
    if (data.hotelDetails?.roomTypes && data.hotelDetails.roomTypes.length > 0) {
      roomTypes = data.hotelDetails.roomTypes.map(rt => ({
        ...rt, extraBedAllowed: rt.extraBedAllowed ?? false, notes: rt.notes || "",
        seasonalPrices: rt.seasonalPrices.map(sp => ({
          ...sp,
          startDate: sp.startDate ? new Date(sp.startDate as unknown as string) : new Date(),
          endDate: sp.endDate ? new Date(sp.endDate as unknown as string) : new Date(),
          extraBedRate: rt.extraBedAllowed ? (sp.extraBedRate ?? undefined) : undefined,
        })),
      }));
    } else if (data.price1 !== undefined) { 
      roomTypes.push({
        id: generateGUID(), name: data.subCategory || 'Standard Room', extraBedAllowed: (typeof data.price2 === 'number' && data.price2 > 0),
        notes: data.notes || "", characteristics: [],
        seasonalPrices: [{ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: data.price1 || 0, extraBedRate: (typeof data.price2 === 'number' && data.price2 > 0) ? data.price2 : undefined }],
      });
    }
    if (roomTypes.length === 0) { roomTypes.push({ id: generateGUID(), name: 'Standard Room', extraBedAllowed: false, notes: '', characteristics: [], seasonalPrices: [{ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: undefined }] }); }
    baseTransformed.hotelDetails = { id: data.hotelDetails?.id || data.id || generateGUID(), name: baseTransformed.name || data.hotelDetails?.name || 'New Hotel', province: baseTransformed.province || data.hotelDetails?.province || '', roomTypes, };
    baseTransformed.price1 = undefined; baseTransformed.price2 = undefined; baseTransformed.subCategory = undefined;
    baseTransformed.unitDescription = data.unitDescription || 'per night';
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;

  } else if (baseTransformed.category === 'activity') {
    // ... (activityPackages transformation - remains mostly the same)
    let packages: ActivityPackageDefinition[] = [];
    if (data.activityPackages && data.activityPackages.length > 0) {
      packages = data.activityPackages.map(pkg => ({ ...pkg, validityStartDate: pkg.validityStartDate || new Date().toISOString().split('T')[0], validityEndDate: pkg.validityEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], closedWeekdays: pkg.closedWeekdays || [], specificClosedDates: pkg.specificClosedDates || [] }));
    } else if (data.price1 !== undefined) { 
      packages = [{ id: generateGUID(), name: data.subCategory || 'Standard Package', price1: data.price1, price2: data.price2, notes: data.notes || '', validityStartDate: new Date().toISOString().split('T')[0], validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }];
    }
    if (packages.length === 0) { packages = [{ id: generateGUID(), name: 'Standard Package', price1: 0, price2: undefined, notes: '', validityStartDate: new Date().toISOString().split('T')[0], validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], closedWeekdays: [], specificClosedDates: [] }]; }
    baseTransformed.activityPackages = packages;
    baseTransformed.price1 = undefined; baseTransformed.price2 = undefined; baseTransformed.subCategory = undefined;
    baseTransformed.unitDescription = data.unitDescription || 'per person';
    baseTransformed.vehicleOptions = undefined; baseTransformed.transferMode = undefined; baseTransformed.maxPassengers = undefined;

  } else if (baseTransformed.category === 'transfer') {
    baseTransformed.transferMode = data.transferMode || (data.subCategory === 'ticket' ? 'ticket' : (data.vehicleOptions && data.vehicleOptions.length > 0 ? 'vehicle' : 'ticket')); // Default or infer
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
      baseTransformed.surchargePeriods = undefined; // Surcharges only for vehicle
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
