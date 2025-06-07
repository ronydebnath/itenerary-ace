"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import { DatePicker } from "@/components/ui/date-picker"; // Assuming you have this or similar
import type { ServicePriceItem, CurrencyCode, ItineraryItemType, SeasonalRate } from '@/types/itinerary';
import { CURRENCIES, SERVICE_CATEGORIES } from '@/types/itinerary';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateGUID } from '@/lib/utils';

const seasonalRateSchema = z.object({
  id: z.string(),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  roomRate: z.coerce.number().min(0, "Room rate must be non-negative"),
  extraBedRate: z.coerce.number().min(0, "Extra bed rate must be non-negative").optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

const servicePriceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  category: z.custom<ItineraryItemType>((val) => SERVICE_CATEGORIES.includes(val as ItineraryItemType), "Invalid category"),
  subCategory: z.string().optional(), // Used for hotel room type, transfer mode/type
  price1: z.coerce.number().min(0, "Price must be non-negative"),
  price2: z.coerce.number().min(0, "Price must be non-negative").optional(),
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency"),
  unitDescription: z.string().min(1, "Unit description is required (e.g., per adult, per night)"),
  notes: z.string().optional(),
  seasonalRates: z.array(seasonalRateSchema).optional(),
  // Transfer specific mode, not directly part of ServicePriceItem, but helps manage subCategory
  transferMode: z.enum(['ticket', 'vehicle']).optional(),
});

type ServicePriceFormValues = z.infer<typeof servicePriceSchema>;

interface ServicePriceFormProps {
  initialData?: ServicePriceItem;
  onSubmit: (data: Omit<ServicePriceItem, 'id'>) => void;
  onCancel: () => void;
}

export function ServicePriceForm({ initialData, onSubmit, onCancel }: ServicePriceFormProps) {
  const form = useForm<ServicePriceFormValues>({
    resolver: zodResolver(servicePriceSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || "activity",
      subCategory: initialData?.subCategory || "",
      price1: initialData?.price1 || 0,
      price2: initialData?.price2,
      currency: initialData?.currency || "USD",
      unitDescription: initialData?.unitDescription || "",
      notes: initialData?.notes || "",
      seasonalRates: initialData?.category === 'hotel' && initialData?.seasonalRates 
        ? initialData.seasonalRates.map(sr => ({
            ...sr,
            startDate: sr.startDate ? new Date(sr.startDate) : new Date(),
            endDate: sr.endDate ? new Date(sr.endDate) : new Date(),
          }))
        : [],
      transferMode: initialData?.category === 'transfer' ? (initialData.subCategory?.startsWith('vehicle') ? 'vehicle' : 'ticket') : undefined,
    },
  });

  const selectedCategory = form.watch("category");
  const seasonalRates = form.watch("seasonalRates") || [];
  const transferMode = form.watch("transferMode");

  React.useEffect(() => {
    if (selectedCategory !== 'hotel') {
      form.setValue('seasonalRates', []);
    }
    if (selectedCategory !== 'transfer') {
      form.setValue('transferMode', undefined);
      // If not transfer, subCategory is free text
    } else {
      // If category is transfer, and subCategory was for hotel, clear it
      if (initialData?.category !== 'transfer' && form.getValues('subCategory')) {
        // form.setValue('subCategory', ''); // Let user define subCategory like vehicle type
      }
    }
  }, [selectedCategory, form, initialData?.category]);
  
  React.useEffect(() => {
    if (selectedCategory === 'transfer') {
      if (transferMode === 'ticket') {
        form.setValue('subCategory', 'ticket');
      } else if (transferMode === 'vehicle') {
        // User can type vehicle type in subCategory field if they want, or it defaults to 'vehicle'
         if(form.getValues('subCategory') === 'ticket' || !form.getValues('subCategory')) {
           form.setValue('subCategory', 'vehicle'); // Default subCategory for vehicle mode
         }
      }
    }
  }, [transferMode, selectedCategory, form]);


  const getPriceLabel = (priceField: 'price1' | 'price2'): string => {
    switch (selectedCategory) {
      case 'activity':
        return priceField === 'price1' ? "Adult Price" : "Child Price (Optional)";
      case 'meal':
        return priceField === 'price1' ? "Adult Meal Price" : "Child Meal Price (Optional)";
      case 'transfer':
        if (transferMode === 'ticket') {
          return priceField === 'price1' ? "Adult Ticket Price" : "Child Ticket Price (Optional)";
        }
        return priceField === 'price1' ? "Cost Per Vehicle" : ""; // No price2 for vehicle
      case 'hotel':
        return priceField === 'price1' ? "Default Room Rate (Nightly)" : "Default Extra Bed Rate (Optional)";
      case 'misc':
        return priceField === 'price1' ? "Unit Cost" : ""; // No price2 for misc
      default:
        return priceField === 'price1' ? "Price 1" : "Price 2 (Optional)";
    }
  };

  const showPrice2 = (): boolean => {
    if (selectedCategory === 'misc') return false;
    if (selectedCategory === 'transfer' && transferMode === 'vehicle') return false;
    return true;
  };
  
  const handleAddSeasonalRate = () => {
    const newRate: SeasonalRate = { 
      id: generateGUID(), 
      startDate: new Date(), 
      endDate: new Date(), 
      roomRate: 0, 
      extraBedRate: 0 
    };
    form.setValue('seasonalRates', [...(form.getValues('seasonalRates') || []), newRate]);
  };

  const handleRemoveSeasonalRate = (index: number) => {
    const currentRates = form.getValues('seasonalRates') || [];
    form.setValue('seasonalRates', currentRates.filter((_, i) => i !== index));
  };
  
  const handleActualSubmit = (values: ServicePriceFormValues) => {
    const { transferMode, ...dataToSubmit } = values; // Exclude form-only transferMode
    
    // Ensure subCategory is correctly set for transfers
    if (dataToSubmit.category === 'transfer') {
        if (values.transferMode === 'ticket') {
            dataToSubmit.subCategory = 'ticket';
        } else if (values.transferMode === 'vehicle') {
            // If subCategory is 'ticket' (from previous mode), or empty, set to 'vehicle'
            // Otherwise, user might have typed a specific vehicle type, e.g., "Sedan", "Van"
            if (dataToSubmit.subCategory === 'ticket' || !dataToSubmit.subCategory) {
                 dataToSubmit.subCategory = 'vehicle';
            }
        }
    }


    const seasonalRatesToSave = dataToSubmit.seasonalRates?.map(sr => ({
        ...sr,
        startDate: sr.startDate.toISOString().split('T')[0], // Store as YYYY-MM-DD string
        endDate: sr.endDate.toISOString().split('T')[0],
    }));

    onSubmit({ ...dataToSubmit, seasonalRates: seasonalRatesToSave });
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleActualSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] md:h-[70vh] pr-3">
            <div className="space-y-6 p-1">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl><Input placeholder="e.g., City Tour, Airport Transfer, Deluxe Room" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {SERVICE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>)}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            {selectedCategory === 'transfer' && (
                <FormField
                    control={form.control}
                    name="transferMode"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Transfer Mode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            {(selectedCategory === 'hotel' || (selectedCategory === 'transfer' && transferMode === 'vehicle')) && (
                 <FormField
                    control={form.control}
                    name="subCategory"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{selectedCategory === 'hotel' ? "Default Room Type (Optional)" : "Vehicle Type (Optional)"}</FormLabel>
                        <FormControl><Input placeholder={selectedCategory === 'hotel' ? "e.g., Deluxe King, Standard Twin" : "e.g., Sedan, SUV, Van"} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
             {selectedCategory !== 'hotel' && selectedCategory !== 'transfer' && (
                <FormField
                    control={form.control}
                    name="subCategory"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Sub-category (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., Guided, Private" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}


            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="price1"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{getPriceLabel('price1')}</FormLabel>
                    <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            {showPrice2() && (
                <FormField
                control={form.control}
                name="price2"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{getPriceLabel('price2')}</FormLabel>
                    <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormControl><Input placeholder="e.g., per adult, per night, per vehicle" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            </div>
            <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl><Textarea placeholder="Additional details about the service or pricing" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            {selectedCategory === 'hotel' && (
            <div className="space-y-4 pt-4 border-t mt-4">
                <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-primary">Seasonal Rates (Optional)</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSeasonalRate} className="border-primary text-primary hover:bg-primary/10">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Seasonal Rate
                </Button>
                </div>
                {seasonalRates.map((rate, index) => (
                <div key={rate.id || index} className="p-4 border rounded-md shadow-sm bg-card space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="font-medium">Seasonal Period {index + 1}</p>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSeasonalRate(index)} className="text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Controller
                        control={form.control}
                        name={`seasonalRates.${index}.startDate`}
                        render={({ field, fieldState: { error } }) => (
                        <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                                <DatePicker date={field.value} onDateChange={field.onChange} />
                            </FormControl>
                            {error && <FormMessage>{error.message}</FormMessage>}
                        </FormItem>
                        )}
                    />
                    <Controller
                        control={form.control}
                        name={`seasonalRates.${index}.endDate`}
                        render={({ field, fieldState: { error } }) => (
                        <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                                <DatePicker date={field.value} onDateChange={field.onChange} minDate={form.getValues(`seasonalRates.${index}.startDate`)}/>
                            </FormControl>
                             {error && <FormMessage>{error.message}</FormMessage>}
                             {form.formState.errors.seasonalRates?.[index]?.endDate && <FormMessage>{form.formState.errors.seasonalRates[index]?.endDate?.message}</FormMessage>}
                        </FormItem>
                        )}
                    />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name={`seasonalRates.${index}.roomRate`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Room Rate ({form.getValues('currency')})</FormLabel>
                            <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`seasonalRates.${index}.extraBedRate`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Extra Bed Rate ({form.getValues('currency')}) (Optional)</FormLabel>
                            <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                </div>
                ))}
                 {form.formState.errors.seasonalRates && typeof form.formState.errors.seasonalRates === 'string' && (
                    <FormMessage>{form.formState.errors.seasonalRates}</FormMessage>
                )}
                 {Array.isArray(form.formState.errors.seasonalRates) && form.formState.errors.seasonalRates.map((error, index) => (
                    error && <FormMessage key={index}>Error in seasonal rate {index + 1}: {Object.values(error).map(e => (e as any)?.message).filter(Boolean).join(', ')}</FormMessage>
                ))}


            </div>
            )}
            </div>
        </ScrollArea>
        <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {initialData ? 'Update' : 'Create'} Service Price
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Minimal DatePicker component (replace with your actual ShadCN DatePicker if available)
// For the purpose of this example, it will just be a simple date input.
// Make sure you have a proper DatePicker component in your project at ui/date-picker.
// If not, you might need to create one or use a library.

// const DatePicker: React.FC<{ date?: Date, onDateChange: (date?: Date) => void, minDate?: Date }> = ({ date, onDateChange, minDate }) => {
//   const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const dateValue = event.target.value ? new Date(event.target.value) : undefined;
//     onDateChange(dateValue);
//   };

//   return (
//     <Input 
//       type="date" 
//       value={date ? date.toISOString().split('T')[0] : ""} 
//       onChange={handleChange} 
//       min={minDate ? minDate.toISOString().split('T')[0] : undefined}
//     />
//   );
// };

// Ensure you have this component: src/components/ui/date-picker.tsx
// Example:
// import * as React from "react";
// import { format } from "date-fns";
// import { Calendar as CalendarIcon } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// export function DatePicker({ date, onDateChange, disabled, minDate, maxDate }: { date?: Date, onDateChange: (date?: Date) => void, disabled?: (date: Date) => boolean, minDate?: Date, maxDate?: Date }) {
//   return (
//     <Popover>
//       <PopoverTrigger asChild>
//         <Button
//           variant={"outline"}
//           className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
//         >
//           <CalendarIcon className="mr-2 h-4 w-4" />
//           {date ? format(date, "PPP") : <span>Pick a date</span>}
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent className="w-auto p-0">
//         <Calendar
//           mode="single"
//           selected={date}
//           onSelect={onDateChange}
//           initialFocus
//           disabled={disabled}
//           fromDate={minDate}
//           toDate={maxDate}
//         />
//       </PopoverContent>
//     </Popover>
//   );
// }
