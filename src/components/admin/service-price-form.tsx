
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
import type { ServicePriceItem, CurrencyCode, ItineraryItemType, VehicleType, HotelDefinition, HotelRoomTypeDefinition, RoomTypeSeasonalPrice, ActivityPackageDefinition, SchedulingData, SurchargePeriod } from '@/types/itinerary';
import { CURRENCIES, SERVICE_CATEGORIES, VEHICLE_TYPES } from '@/types/itinerary';
import { PlusCircle, Trash2, XIcon, AlertTriangle } from 'lucide-react';
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

const servicePriceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  province: z.string().optional(),
  category: z.custom<ItineraryItemType>((val) => SERVICE_CATEGORIES.includes(val as ItineraryItemType), "Invalid category"),
  subCategory: z.string().optional(),
  price1: z.coerce.number().min(0, "Price must be non-negative").optional(),
  price2: z.coerce.number().min(0, "Price must be non-negative").optional(),
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency"),
  unitDescription: z.string().optional(),
  notes: z.string().optional(),
  transferMode: z.enum(['ticket', 'vehicle']).optional(),
  maxPassengers: z.coerce.number().min(1, "Max passengers must be at least 1").optional(),
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
    if (!data.unitDescription) data.unitDescription = 'per night';
    data.price1 = undefined;
    data.price2 = undefined;
    data.subCategory = undefined;
    data.surchargePeriods = undefined; // Surcharges not for hotels

  } else if (data.category === 'activity') {
    if (!data.activityPackages || data.activityPackages.length === 0) {
       if (typeof data.price1 !== 'number') { 
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Define at least one package or provide a default Adult Price (if no packages).",
            path: ["activityPackages"], 
        });
       }
    }
     if (!data.unitDescription) data.unitDescription = 'per person';
     data.price1 = undefined; 
     data.price2 = undefined;
     data.subCategory = undefined;
     data.surchargePeriods = undefined; // Surcharges not for activities

  } else { 
    if (data.category === 'transfer' && data.transferMode === 'vehicle') {
      if (typeof data.price1 !== 'number') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Cost Per Vehicle is required.",
            path: ["price1"],
        });
      }
       if (!data.unitDescription) data.unitDescription = 'per vehicle';
    } else if (data.category !== 'transfer' || data.transferMode === 'ticket') {
        if (typeof data.price1 !== 'number') {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Primary price (e.g., Adult Price, Unit Cost) is required.",
                path: ["price1"],
            });
        }
        if (!data.unitDescription) data.unitDescription = 'per person';
        data.surchargePeriods = undefined; // Surcharges only for vehicle transfers
    }
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

  if (!data || Object.keys(data).length === 0) {
    return {
      category: defaultCategory,
      currency: defaultCurrency,
      name: "",
      activityPackages: [{
        id: generateGUID(),
        name: 'Standard Package',
        price1: 0,
        price2: undefined,
        notes: '',
        validityStartDate: new Date().toISOString().split('T')[0],
        validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        closedWeekdays: [],
        specificClosedDates: []
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
    let roomTypes: HotelRoomTypeDefinition[] = [];
    if (data.hotelDetails?.roomTypes && data.hotelDetails.roomTypes.length > 0) {
      roomTypes = data.hotelDetails.roomTypes.map(rt => ({
        ...rt,
        extraBedAllowed: rt.extraBedAllowed ?? false,
        notes: rt.notes || "",
        seasonalPrices: rt.seasonalPrices.map(sp => ({
          ...sp,
          startDate: sp.startDate ? new Date(sp.startDate as unknown as string) : new Date(),
          endDate: sp.endDate ? new Date(sp.endDate as unknown as string) : new Date(),
          extraBedRate: rt.extraBedAllowed ? (sp.extraBedRate ?? undefined) : undefined,
        })),
      }));
    } else if (data.price1 !== undefined) { 
      roomTypes.push({
        id: generateGUID(),
        name: data.subCategory || 'Standard Room',
        extraBedAllowed: (typeof data.price2 === 'number' && data.price2 > 0),
        notes: data.notes || "",
        seasonalPrices: [{
            id: generateGUID(), startDate: new Date(), endDate: new Date(),
            rate: data.price1 || 0,
            extraBedRate: (typeof data.price2 === 'number' && data.price2 > 0) ? data.price2 : undefined
          }],
        characteristics: [],
      });
    }

    if (roomTypes.length === 0) { 
      roomTypes.push({
        id: generateGUID(), name: 'Standard Room', extraBedAllowed: false, notes: '', characteristics: [],
        seasonalPrices: [{ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: undefined }]
      });
    }

    baseTransformed.hotelDetails = {
      id: data.hotelDetails?.id || data.id || generateGUID(),
      name: baseTransformed.name || data.hotelDetails?.name || 'New Hotel',
      province: baseTransformed.province || data.hotelDetails?.province || '',
      roomTypes,
    };
    baseTransformed.price1 = undefined;
    baseTransformed.price2 = undefined;
    baseTransformed.subCategory = undefined;
    baseTransformed.unitDescription = data.unitDescription || 'per night';
    baseTransformed.surchargePeriods = undefined;

  } else if (baseTransformed.category === 'activity') {
    let packages: ActivityPackageDefinition[] = [];
    if (data.activityPackages && data.activityPackages.length > 0) {
      packages = data.activityPackages.map(pkg => ({
        ...pkg,
        validityStartDate: pkg.validityStartDate || new Date().toISOString().split('T')[0],
        validityEndDate: pkg.validityEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        closedWeekdays: pkg.closedWeekdays || [],
        specificClosedDates: pkg.specificClosedDates || []
      }));
    } else if (data.price1 !== undefined) { 
      packages = [{
        id: generateGUID(),
        name: data.subCategory || 'Standard Package',
        price1: data.price1,
        price2: data.price2,
        notes: data.notes || '',
        validityStartDate: new Date().toISOString().split('T')[0],
        validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        closedWeekdays: [],
        specificClosedDates: []
      }];
    }

    if (packages.length === 0) { 
        packages = [{
          id: generateGUID(),
          name: 'Standard Package',
          price1: 0,
          price2: undefined,
          notes: '',
          validityStartDate: new Date().toISOString().split('T')[0],
          validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          closedWeekdays: [],
          specificClosedDates: []
        }];
    }
    baseTransformed.activityPackages = packages;
    baseTransformed.price1 = undefined;
    baseTransformed.price2 = undefined;
    baseTransformed.subCategory = undefined;
    baseTransformed.unitDescription = data.unitDescription || 'per person';
    baseTransformed.surchargePeriods = undefined;

  } else { 
    baseTransformed.subCategory = data.subCategory || "";
    baseTransformed.price1 = data.price1 ?? 0;
    baseTransformed.price2 = data.price2;
    baseTransformed.hotelDetails = undefined;
    baseTransformed.activityPackages = undefined;
    if (data.category === 'transfer') {
      baseTransformed.transferMode = data.subCategory === 'ticket' ? 'ticket' : 'vehicle';
      if (baseTransformed.transferMode === 'vehicle') {
        if (data.subCategory && VEHICLE_TYPES.includes(data.subCategory as VehicleType)) {
          baseTransformed.subCategory = data.subCategory as VehicleType;
        } else {
          baseTransformed.subCategory = VEHICLE_TYPES[0]; 
        }
        // Surcharge periods only for vehicle transfers
      } else { // ticket mode
         baseTransformed.subCategory = 'ticket';
         baseTransformed.surchargePeriods = undefined;
      }
      baseTransformed.maxPassengers = data.maxPassengers || undefined;
      baseTransformed.unitDescription = data.unitDescription || (baseTransformed.transferMode === 'vehicle' ? 'per vehicle' : 'per person');
    } else { // misc, meal
      baseTransformed.unitDescription = data.unitDescription || 'per person';
      baseTransformed.surchargePeriods = undefined;
    }
  }
  return baseTransformed;
};


export function ServicePriceForm({ initialData, onSubmit, onCancel }: ServicePriceFormProps) {
  const { provinces, isLoading: isLoadingProvinces } = useProvinces();

  const form = useForm<ServicePriceFormValues>({
    resolver: zodResolver(servicePriceSchema),
    defaultValues: transformInitialDataToFormValues(initialData),
    mode: "onChange", 
  });

  const selectedCategory = form.watch("category");
  const transferMode = form.watch("transferMode");
  const hotelNameForLegend = form.watch('name');
  const hotelProvinceForLegend = form.watch('province');
  const activityNameForLegend = form.watch('name');


  const { fields: roomTypeFields, append: appendRoomType, remove: removeRoomType } = useFieldArray({
    control: form.control,
    name: "hotelDetails.roomTypes",
    keyName: "fieldId" 
  });

  const { fields: activityPackageFields, append: appendActivityPackage, remove: removeActivityPackage } = useFieldArray({
    control: form.control,
    name: "activityPackages",
    keyName: "packageFieldId" 
  });

  const { fields: surchargePeriodFields, append: appendSurchargePeriod, remove: removeSurchargePeriod } = useFieldArray({
    control: form.control,
    name: "surchargePeriods",
    keyName: "surchargeFieldId"
  });


 React.useEffect(() => {
    const currentCategoryValue = form.getValues('category');
    const currentUnitDesc = form.getValues('unitDescription');

    const setFormValueIfChanged = (fieldName: keyof ServicePriceFormValues, newValue: any, options?: any) => {
        if (form.getValues(fieldName) !== newValue) {
            form.setValue(fieldName, newValue, options);
        }
    };
    
    if (currentCategoryValue === 'activity') {
        setFormValueIfChanged('price1', undefined, { shouldValidate: true });
        setFormValueIfChanged('price2', undefined, { shouldValidate: true });
        setFormValueIfChanged('subCategory', undefined, { shouldValidate: true });
        setFormValueIfChanged('hotelDetails', undefined, { shouldValidate: true });
        setFormValueIfChanged('unitDescription', currentUnitDesc || 'per person', { shouldValidate: true });
        setFormValueIfChanged('surchargePeriods', undefined, { shouldValidate: true });
    } else if (currentCategoryValue === 'hotel') {
        setFormValueIfChanged('price1', undefined, { shouldValidate: true });
        setFormValueIfChanged('price2', undefined, { shouldValidate: true });
        setFormValueIfChanged('subCategory', undefined, { shouldValidate: true });
        setFormValueIfChanged('activityPackages', undefined, { shouldValidate: true });
        setFormValueIfChanged('unitDescription', currentUnitDesc || 'per night', { shouldValidate: true });
        setFormValueIfChanged('surchargePeriods', undefined, { shouldValidate: true });
    } else { 
        setFormValueIfChanged('hotelDetails', undefined, { shouldValidate: true });
        setFormValueIfChanged('activityPackages', undefined, { shouldValidate: true });
        if (!currentUnitDesc || ['per night', 'per person activity'].includes(currentUnitDesc)) {
            const defaultUnitDesc = currentCategoryValue === 'transfer' && form.getValues('transferMode') === 'vehicle' ? 'per vehicle' : 'per person';
            setFormValueIfChanged('unitDescription', defaultUnitDesc, { shouldValidate: true });
        }
        if (form.getValues('price1') === undefined) {
            setFormValueIfChanged('price1', 0, { shouldValidate: true });
        }
        if (currentCategoryValue === 'transfer' && form.getValues('transferMode') === 'ticket') {
           setFormValueIfChanged('surchargePeriods', undefined, { shouldValidate: true });
        } else if (currentCategoryValue !== 'transfer') {
           setFormValueIfChanged('surchargePeriods', undefined, { shouldValidate: true });
        }
    }
  }, [selectedCategory, form]); 


 React.useEffect(() => {
    const currentCategory = form.getValues('category');
    const setFormValueIfChanged = (fieldName: keyof ServicePriceFormValues, newValue: any, options?: any) => {
        if (form.getValues(fieldName) !== newValue) {
            form.setValue(fieldName, newValue, options);
        }
    };

    if (currentCategory === 'transfer') {
      const currentTransferModeValue = form.getValues('transferMode');
      const currentSubCategoryValue = form.getValues('subCategory');
      const currentUnitDesc = form.getValues('unitDescription');

      if (!currentTransferModeValue) { 
        setFormValueIfChanged('transferMode', 'ticket', { shouldValidate: true });
        setFormValueIfChanged('subCategory', 'ticket', { shouldValidate: true });
        setFormValueIfChanged('unitDescription', 'per person', { shouldValidate: true });
        setFormValueIfChanged('surchargePeriods', undefined, { shouldValidate: true });
      } else if (currentTransferModeValue === 'ticket') {
        if (currentSubCategoryValue !== 'ticket') {
          setFormValueIfChanged('subCategory', 'ticket', { shouldValidate: true });
        }
        setFormValueIfChanged('maxPassengers', undefined, { shouldValidate: true });
        if (currentUnitDesc !== 'per person') {
          setFormValueIfChanged('unitDescription', 'per person', { shouldValidate: true });
        }
        setFormValueIfChanged('surchargePeriods', undefined, { shouldValidate: true });
      } else if (currentTransferModeValue === 'vehicle'){ 
        if (currentSubCategoryValue === 'ticket' || !currentSubCategoryValue || !VEHICLE_TYPES.includes(currentSubCategoryValue as VehicleType)) {
            setFormValueIfChanged('subCategory', VEHICLE_TYPES[0], { shouldValidate: true });
        }
        if (currentUnitDesc !== 'per vehicle') {
          setFormValueIfChanged('unitDescription', 'per vehicle', { shouldValidate: true });
        }
      }
    } else { 
       setFormValueIfChanged('transferMode', undefined, { shouldValidate: true });
       setFormValueIfChanged('maxPassengers', undefined, { shouldValidate: true });
       setFormValueIfChanged('surchargePeriods', undefined, { shouldValidate: true });
       if (form.getValues('subCategory') === 'ticket') { 
           setFormValueIfChanged('subCategory', '', { shouldValidate: true });
       }
    }
  }, [selectedCategory, transferMode, form]);


  const getPrice1Label = (): string => {
    switch (selectedCategory) {
      case 'meal': return "Adult Meal Price";
      case 'transfer': return transferMode === 'ticket' ? "Adult Ticket Price" : "Cost Per Vehicle";
      case 'misc': return "Unit Cost";
      default: return "Default Adult Price / Main Rate";
    }
  };

  const getPrice2Label = (): string | null => {
    switch (selectedCategory) {
      case 'meal': return "Child Meal Price (Optional)";
      case 'transfer': return transferMode === 'ticket' ? "Child Ticket Price (Optional)" : null;
      default: return null;
    }
  };

  const getSubCategoryLabel = (): string | null => {
    switch (selectedCategory) {
        case 'meal': return "Meal Type (e.g., Set Menu, Buffet)";
        case 'transfer': return transferMode === 'vehicle' ? "Vehicle Type" : null;
        case 'misc': return "Item Sub-Type (e.g., Visa Fee, Souvenir)";
        default: return "Sub-category (Optional)";
    }
  };

  const showSimplePricingFields = selectedCategory !== 'hotel' && selectedCategory !== 'activity';

  const showSubCategoryInput = (): boolean => {
    if (selectedCategory === 'hotel' || selectedCategory === 'activity') return false;
    if (selectedCategory === 'transfer' && transferMode === 'ticket') return false;
    if (selectedCategory === 'transfer' && transferMode === 'vehicle') return false; 
    return getSubCategoryLabel() !== null;
  };
  const showMaxPassengers = (): boolean => selectedCategory === 'transfer' && transferMode === 'vehicle';
  const showSurchargeSection = (): boolean => selectedCategory === 'transfer' && transferMode === 'vehicle';

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
      dataToSubmit.price1 = undefined;
      dataToSubmit.price2 = undefined;
      dataToSubmit.subCategory = undefined;
      dataToSubmit.activityPackages = undefined;
      dataToSubmit.surchargePeriods = undefined;
      dataToSubmit.unitDescription = dataToSubmit.unitDescription || "per night";
    } else if (dataToSubmit.category === 'activity' && dataToSubmit.activityPackages) {
      dataToSubmit.price1 = undefined;
      dataToSubmit.price2 = undefined;
      dataToSubmit.subCategory = undefined;
      dataToSubmit.hotelDetails = undefined;
      dataToSubmit.surchargePeriods = undefined;
      dataToSubmit.unitDescription = dataToSubmit.unitDescription || "per person";
    } else if (dataToSubmit.category !== 'hotel' && dataToSubmit.category !== 'activity') {
      dataToSubmit.hotelDetails = undefined;
      dataToSubmit.activityPackages = undefined;
       const defaultUnitDesc = dataToSubmit.category === 'transfer' && values.transferMode === 'vehicle' ? 'per vehicle' : 'per person';
      dataToSubmit.unitDescription = dataToSubmit.unitDescription || defaultUnitDesc;
      if (dataToSubmit.category === 'transfer' && values.transferMode === 'vehicle' && dataToSubmit.surchargePeriods) {
        dataToSubmit.surchargePeriods = dataToSubmit.surchargePeriods.map(sp => ({
          ...sp,
          startDate: (sp.startDate as Date).toISOString().split('T')[0],
          endDate: (sp.endDate as Date).toISOString().split('T')[0],
        }));
      } else {
        dataToSubmit.surchargePeriods = undefined;
      }
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
                                <FormLabel>Service / Hotel / Activity Name</FormLabel>
                                <FormControl><Input placeholder="e.g., City Tour, Oceanview Resort, Chao Phraya Cruise" {...field} /></FormControl>
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
                            name="unitDescription"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit Description</FormLabel>
                                <FormControl><Input
                                    placeholder={selectedCategory === 'hotel' ? 'per night' : (selectedCategory === 'transfer' && transferMode === 'vehicle' ? 'per vehicle' : 'per person')}
                                    {...field}
                                    value={field.value || ''}
                                /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>General Service Notes (Optional)</FormLabel>
                                <FormControl><Textarea placeholder="Overall details about the service, not specific to a package or room type" {...field} value={field.value || ''} rows={2} /></FormControl>
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
                        </div>
                    </div>
                )}

                {showSurchargeSection() && (
                    <div className="border border-border rounded-md p-4 mt-6 relative">
                        <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" /> Vehicle Surcharges ({form.getValues('name')})
                        </p>
                        <div id="surchargePeriodsContainer" className="space-y-4 pt-2">
                            {surchargePeriodFields.map((surchargeField, surchargeIndex) => (
                                <div key={surchargeField.surchargeFieldId} className="border border-muted rounded-md p-3 bg-card shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <Label className="text-sm font-medium">Surcharge Period {surchargeIndex + 1}</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeSurchargePeriod(surchargeIndex)}
                                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                        >
                                            <XIcon size={16} />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                        <FormField
                                            control={form.control}
                                            name={`surchargePeriods.${surchargeIndex}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Name</FormLabel>
                                                    <FormControl><Input placeholder="e.g., New Year Peak" {...field} className="h-9 text-sm" /></FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                        <Controller
                                            control={form.control}
                                            name={`surchargePeriods.${surchargeIndex}.startDate`}
                                            render={({ field, fieldState: { error } }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Start Date</FormLabel>
                                                    <FormControl>
                                                        <DatePicker date={field.value} onDateChange={field.onChange} placeholder="dd-MM-yy" />
                                                    </FormControl>
                                                    {error && <FormMessage className="text-xs">{error.message}</FormMessage>}
                                                </FormItem>
                                            )}
                                        />
                                        <Controller
                                            control={form.control}
                                            name={`surchargePeriods.${surchargeIndex}.endDate`}
                                            render={({ field, fieldState: { error } }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">End Date</FormLabel>
                                                    <FormControl>
                                                        <DatePicker 
                                                            date={field.value} 
                                                            onDateChange={field.onChange} 
                                                            minDate={form.getValues(`surchargePeriods.${surchargeIndex}.startDate`)}
                                                            placeholder="dd-MM-yy"
                                                        />
                                                    </FormControl>
                                                    {error && <FormMessage className="text-xs">{error.message}</FormMessage>}
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`surchargePeriods.${surchargeIndex}.surchargeAmount`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Amount ({form.getValues('currency')})</FormLabel>
                                                    <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-9 text-sm" /></FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendSurchargePeriod({ id: generateGUID(), name: '', startDate: new Date(), endDate: new Date(), surchargeAmount: 0 }, { shouldFocus: false })}
                            className="mt-4 border-orange-500 text-orange-600 hover:bg-orange-500/10 add-btn"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Surcharge Period
                        </Button>
                        {(form.formState.errors.surchargePeriods as any)?.message && (
                            <FormMessage className="mt-2 text-sm text-destructive">{(form.formState.errors.surchargePeriods as any).message}</FormMessage>
                        )}
                    </div>
                )}
                
                {selectedCategory === 'hotel' && (
                    <div className="border border-border rounded-md p-4 mt-6 relative">
                         <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">
                           Room Types &amp; Nightly Rates for: {hotelNameForLegend || "Hotel"} {hotelProvinceForLegend && `(${hotelProvinceForLegend})`}
                         </p>

                        <div id="roomTypesContainer" className="space-y-6 pt-2">
                        {roomTypeFields.map((roomField, roomIndex) => {
                            const roomTypeNameWatch = form.watch(`hotelDetails.roomTypes.${roomIndex}.name`);
                            const roomLegend = roomTypeNameWatch || `Room Type ${roomIndex + 1}`;
                            return (
                            <div key={roomField.fieldId} className="border border-border rounded-md p-4 pt-6 relative bg-card shadow-sm">
                                <p className="text-base font-medium -mt-6 ml-2 px-1 bg-card inline-block absolute left-2 top-[0.1rem] max-w-[calc(100%-3rem)] truncate">
                                 {roomLegend}
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
                                          <FormLabel className="text-sm">Room Type Name</FormLabel>
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
                                              if (!checked) { 
                                                const seasons = form.getValues(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices`);
                                                seasons.forEach((_, seasonIdx) => {
                                                  form.setValue(`hotelDetails.roomTypes.${roomIndex}.seasonalPrices.${seasonIdx}.extraBedRate`, undefined, { shouldValidate: true });
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
                                            <FormLabel className="text-sm">Room Details (Size, Amenities, Bed Type, View, etc.)</FormLabel>
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
                                    ], { shouldValidate: true });
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
                            }, { shouldFocus: false })}
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

                
                {selectedCategory === 'activity' && (
                  <div className="border border-border rounded-md p-4 mt-6 relative">
                    <p className="text-sm font-semibold -mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4">
                      Activity Packages for: {activityNameForLegend || "Activity"}
                    </p>
                    <div id="activityPackagesContainer" className="space-y-4 pt-2">
                      {activityPackageFields.map((packageField, packageIndex) => {
                        const currentPackageValues = form.watch(`activityPackages.${packageIndex}`);
                        const packageLegend = currentPackageValues?.name || `Package ${packageIndex + 1}`;

                        return (
                        <div key={packageField.packageFieldId} className="border border-border rounded-md p-4 pt-6 relative bg-card shadow-sm">
                           <p className="text-base font-medium -mt-6 ml-2 px-1 bg-card inline-block absolute left-2 top-[0.1rem] max-w-[calc(100%-3rem)] truncate">
                             {packageLegend}
                           </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => activityPackageFields.length > 1 ? removeActivityPackage(packageIndex) : null}
                            disabled={activityPackageFields.length <= 1 && activityPackageFields[0]?.name === "Standard Package" && activityPackageFields[0]?.price1 === 0} 
                            className="absolute top-1 right-1 h-7 w-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-sm hover:bg-destructive/80 disabled:opacity-50"
                            aria-label="Remove Package"
                          >
                            <XIcon size={16} />
                          </Button>
                          <div className="space-y-3 pt-2">
                            <FormField
                              control={form.control}
                              name={`activityPackages.${packageIndex}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Package Name</FormLabel>
                                  <FormControl><Input placeholder="e.g., Sunset Cruise, Full Day Tour" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                control={form.control}
                                name={`activityPackages.${packageIndex}.price1`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-sm">Adult Price ({form.getValues('currency')})</FormLabel>
                                    <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name={`activityPackages.${packageIndex}.price2`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-sm">Child Price ({form.getValues('currency')}) (Optional)</FormLabel>
                                    <FormControl><Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <FormField
                              control={form.control}
                              name={`activityPackages.${packageIndex}.notes`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Package Notes/Details</FormLabel>
                                  <FormControl><Textarea placeholder="Inclusions, duration, what to bring, etc." {...field} value={field.value || ''} rows={2} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <Controller
                                control={form.control}
                                name={`activityPackages.${packageIndex}`} 
                                render={({ field: { onChange, value }}) => (
                                    <ActivityPackageScheduler
                                        packageId={packageField.id} 
                                        initialSchedulingData={{ 
                                            validityStartDate: value.validityStartDate,
                                            validityEndDate: value.validityEndDate,
                                            closedWeekdays: value.closedWeekdays,
                                            specificClosedDates: value.specificClosedDates,
                                        }}
                                        onSchedulingChange={(newSchedule: SchedulingData) => {
                                            onChange({ ...value, ...newSchedule });
                                        }}
                                    />
                                )}
                            />
                          </div>
                        </div>
                      );
                      })}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendActivityPackage({
                        id: generateGUID(),
                        name: `Package ${activityPackageFields.length + 1}`,
                        price1: 0,
                        price2: undefined,
                        notes: '',
                        validityStartDate: new Date().toISOString().split('T')[0],
                        validityEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                        closedWeekdays: [],
                        specificClosedDates: []
                       }, { shouldFocus: false })}
                      className="mt-4 border-accent text-accent hover:bg-accent/10 add-btn"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Package
                    </Button>
                    {(form.formState.errors.activityPackages as any)?.message && (
                        <FormMessage className="mt-2 text-sm text-destructive">{(form.formState.errors.activityPackages as any).message}</FormMessage>
                    )}
                    {form.formState.errors.activityPackages?.root?.message && (
                        <FormMessage className="mt-2 text-sm text-destructive">{form.formState.errors.activityPackages.root.message}</FormMessage>
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
  form: ReturnType<typeof useForm<ServicePriceFormValues>>;
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
      append({ id: generateGUID(), startDate: new Date(), endDate: new Date(), rate: 0, extraBedRate: undefined }, { shouldFocus: false });
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
                        <DatePicker date={field.value} onDateChange={field.onChange} placeholder="dd-MM-yy" />
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
                            placeholder="dd-MM-yy"
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

    

    
