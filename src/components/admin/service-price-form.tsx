
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
import { DatePicker } from "@/components/ui/date-picker";
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
  province: z.string().optional(), // New province field
  category: z.custom<ItineraryItemType>((val) => SERVICE_CATEGORIES.includes(val as ItineraryItemType), "Invalid category"),
  subCategory: z.string().optional(),
  price1: z.coerce.number().min(0, "Price must be non-negative"),
  price2: z.coerce.number().min(0, "Price must be non-negative").optional(),
  currency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid currency"),
  unitDescription: z.string().min(1, "Unit description is required (e.g., per adult, per night)"),
  notes: z.string().optional(),
  seasonalRates: z.array(seasonalRateSchema).optional(),
  transferMode: z.enum(['ticket', 'vehicle']).optional(), // Form-only field
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
      province: initialData?.province || "", // Initialize province
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
      transferMode: initialData?.category === 'transfer' 
        ? (initialData.subCategory === 'ticket' ? 'ticket' : 'vehicle') 
        : undefined,
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
    } else {
      if (initialData?.category === 'transfer') {
        form.setValue('transferMode', initialData.subCategory === 'ticket' ? 'ticket' : 'vehicle');
        if (initialData.subCategory !== 'ticket') {
            form.setValue('subCategory', initialData.subCategory || '');
        }
      } else {
        form.setValue('transferMode', 'ticket');
        form.setValue('subCategory', 'ticket'); 
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, form.setValue]); 

  React.useEffect(() => {
    if (selectedCategory === 'transfer') {
      if (transferMode === 'ticket') {
        form.setValue('subCategory', 'ticket');
      } else if (transferMode === 'vehicle') {
        if (form.getValues('subCategory') === 'ticket') {
           form.setValue('subCategory', initialData?.subCategory && initialData?.subCategory !== 'ticket' ? initialData.subCategory : '');
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferMode, selectedCategory, form.setValue, form.getValues]); 


  const getPrice1Label = (): string => {
    switch (selectedCategory) {
      case 'activity': return "Adult Price";
      case 'meal': return "Adult Meal Price";
      case 'transfer': return transferMode === 'ticket' ? "Adult Ticket Price" : "Cost Per Vehicle";
      case 'hotel': return "Default Room Rate (Nightly)";
      case 'misc': return "Unit Cost";
      default: return "Price 1";
    }
  };

  const getPrice2Label = (): string | null => {
    switch (selectedCategory) {
      case 'activity': return "Child Price (Optional)";
      case 'meal': return "Child Meal Price (Optional)";
      case 'transfer': return transferMode === 'ticket' ? "Child Ticket Price (Optional)" : null;
      case 'hotel': return "Default Extra Bed Rate (Optional)";
      default: return null;
    }
  };
  
  const getSubCategoryLabel = (): string | null => {
    switch (selectedCategory) {
        case 'activity': return "Activity Type (e.g., Guided, Entrance)";
        case 'meal': return "Meal Type (e.g., Set Menu, Buffet)";
        case 'transfer': return transferMode === 'vehicle' ? "Vehicle Type (e.g., Sedan, Van)" : null;
        case 'hotel': return "Default Room Type (e.g., Deluxe King)";
        case 'misc': return "Item Sub-Type (e.g., Visa Fee, Souvenir)";
        default: return "Sub-category (Optional)";
    }
  };

  const showPrice2 = (): boolean => getPrice2Label() !== null;
  const showSubCategoryInput = (): boolean => {
    if (selectedCategory === 'transfer' && transferMode === 'ticket') return false;
    return getSubCategoryLabel() !== null;
  };
  
  const handleAddSeasonalRate = () => {
    const newRate: SeasonalRate = { 
      id: generateGUID(), 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date().toISOString().split('T')[0], 
      roomRate: 0, 
      extraBedRate: 0 
    };
    const currentRates = form.getValues('seasonalRates') || [];
    const newRatesForForm = [...currentRates, { 
        id: newRate.id, 
        startDate: new Date(), 
        endDate: new Date(), 
        roomRate: 0, 
        extraBedRate: 0 
    }];
    form.setValue('seasonalRates', newRatesForForm as any[]);
  };

  const handleRemoveSeasonalRate = (index: number) => {
    const currentRates = form.getValues('seasonalRates') || [];
    form.setValue('seasonalRates', currentRates.filter((_, i) => i !== index));
  };
  
  const handleActualSubmit = (values: ServicePriceFormValues) => {
    const { transferMode: _transferMode, ...dataToSubmit } = values; 
    
    if (dataToSubmit.category === 'transfer') {
        if (values.transferMode === 'ticket') {
            dataToSubmit.subCategory = 'ticket';
        } else if (values.transferMode === 'vehicle') {
            dataToSubmit.subCategory = dataToSubmit.subCategory?.trim() || 'vehicle';
        }
    }
    if (dataToSubmit.category !== 'hotel') {
        delete dataToSubmit.seasonalRates;
    } else {
        dataToSubmit.seasonalRates = dataToSubmit.seasonalRates?.map(sr => ({
            ...sr,
            startDate: (sr.startDate as Date).toISOString().split('T')[0], 
            endDate: (sr.endDate as Date).toISOString().split('T')[0],
        }));
    }
    
    if (!getPrice2Label()) {
        dataToSubmit.price2 = undefined;
    }

    onSubmit({ ...dataToSubmit });
  };

  const subCategoryLabel = getSubCategoryLabel();

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
                        <FormControl><Input placeholder="e.g., City Tour, Airport Transfer" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Province / Location (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., Bangkok, Pattaya, Phuket" {...field} /></FormControl>
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
                </div>
                
                <div className="space-y-4 pt-4 border-t mt-4">
                    <h3 className="text-md font-medium text-muted-foreground">Category Specific Details: {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</h3>
                    
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

                    {showSubCategoryInput() && subCategoryLabel && (
                        <FormField
                            control={form.control}
                            name="subCategory"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{subCategoryLabel}</FormLabel>
                                <FormControl><Input placeholder={subCategoryLabel.startsWith("Vehicle Type") ? "e.g., Sedan, SUV" : "Details..."} {...field} /></FormControl>
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
                        {showPrice2() && getPrice2Label() && (
                            <FormField
                            control={form.control}
                            name="price2"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{getPrice2Label()}</FormLabel>
                                <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        )}
                    </div>
                </div>
                
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
                    <h3 className="text-lg font-medium text-primary">Seasonal Rates (Optional for Hotels)</h3>
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
