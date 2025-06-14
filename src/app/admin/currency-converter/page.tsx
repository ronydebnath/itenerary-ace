
/**
 * @fileoverview This page component provides a user interface for currency conversion
 * and managing exchange rates. It allows users to convert amounts between different
 * currencies based on stored exchange rates (potentially fetched from an API),
 * set a global conversion markup, and add, edit, or delete base exchange rates.
 * It utilizes the `useExchangeRates` hook to manage exchange rate data and logic.
 *
 * @bangla এই পৃষ্ঠা কম্পোনেন্টটি মুদ্রা রূপান্তর এবং বিনিময় হার ব্যবস্থাপনার জন্য একটি
 * ব্যবহারকারী ইন্টারফেস সরবরাহ করে। এটি ব্যবহারকারীদের সংরক্ষিত বিনিময় হারের (সম্ভবত API থেকে আনা)
 * উপর ভিত্তি করে বিভিন্ন মুদ্রার মধ্যে পরিমাণ রূপান্তর করতে, একটি গ্লোবাল রূপান্তর মার্কআপ সেট করতে, এবং
 * বেস বিনিময় হার যোগ, সম্পাদনা বা মুছে ফেলতে দেয়। এটি বিনিময় হারের ডেটা এবং যুক্তি
 * পরিচালনা করার জন্য `useExchangeRates` হুক ব্যবহার করে।
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LayoutDashboard, Repeat, PlusCircle, Edit, Trash2, AlertCircle, Loader2, Settings, Percent, RefreshCw } from 'lucide-react';
import { useExchangeRates, type ConversionRateDetails } from '@/hooks/useExchangeRates';
import type { CurrencyCode, ExchangeRate } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

const conversionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  fromCurrency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid from currency"),
  toCurrency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid to currency"),
});
type ConversionFormValues = z.infer<typeof conversionSchema>;

const rateSchema = z.object({
  fromCurrency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid from currency"),
  toCurrency: z.custom<CurrencyCode>((val) => CURRENCIES.includes(val as CurrencyCode), "Invalid to currency"),
  rate: z.coerce.number().positive("Rate must be a positive number"),
}).refine(data => data.fromCurrency !== data.toCurrency, {
  message: "Cannot set an exchange rate from a currency to itself.",
  path: ["toCurrency"],
});
type RateFormValues = z.infer<typeof rateSchema>;

const markupSchema = z.object({
  markup: z.coerce.number().min(0, "Markup must be non-negative").max(50, "Markup cannot exceed 50%"),
});
type MarkupFormValues = z.infer<typeof markupSchema>;

interface ConversionResultState {
  originalAmount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  baseRate: number;
  finalRate: number;
  markupApplied: number;
  convertedAmount: number;
}

export default function CurrencyConverterPage() {
  const {
    exchangeRates,
    isLoading,
    error,
    addRate,
    updateRate,
    deleteRate,
    getRate,
    refreshRates,
    markupPercentage,
    setGlobalMarkup,
    lastApiFetchTimestamp
  } = useExchangeRates();

  const [conversionResult, setConversionResult] = React.useState<ConversionResultState | null>(null);
  const [conversionError, setConversionError] = React.useState<string | null>(null);

  const [isRateFormOpen, setIsRateFormOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<ExchangeRate | null>(null);

  const conversionForm = useForm<ConversionFormValues>({
    resolver: zodResolver(conversionSchema),
    defaultValues: { amount: 100, fromCurrency: "USD", toCurrency: "THB" },
  });

  const rateForm = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 },
  });

  const markupForm = useForm<MarkupFormValues>({
    resolver: zodResolver(markupSchema),
    defaultValues: { markup: markupPercentage },
  });

  React.useEffect(() => {
    markupForm.reset({ markup: markupPercentage });
  }, [markupPercentage, markupForm]);

  React.useEffect(() => {
    if (editingRate) {
      rateForm.reset({
        fromCurrency: editingRate.fromCurrency,
        toCurrency: editingRate.toCurrency,
        rate: editingRate.rate,
      });
    } else {
      rateForm.reset({ fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 });
    }
  }, [editingRate, rateForm]);

  React.useEffect(() => {
    console.log('CurrencyConverterPage: lastApiFetchTimestamp changed to:', lastApiFetchTimestamp);
  }, [lastApiFetchTimestamp]);

  const handleConversionSubmit = (data: ConversionFormValues) => {
    setConversionError(null);
    setConversionResult(null);
    const rateDetails = getRate(data.fromCurrency, data.toCurrency);
    console.log("CurrencyConverterPage: rateDetails from getRate:", rateDetails);

    if (rateDetails === null) {
      setConversionError(`Exchange rate from ${data.fromCurrency} to ${data.toCurrency} is not defined or calculable. Ensure base rates to/from USD are set for all relevant currencies.`);
      return;
    }
    const finalConvertedAmount = data.amount * rateDetails.finalRate;

    const resultToDisplay: ConversionResultState = {
      originalAmount: data.amount,
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      baseRate: rateDetails.baseRate,
      finalRate: rateDetails.finalRate,
      markupApplied: rateDetails.markupApplied,
      convertedAmount: finalConvertedAmount,
    };
    console.log("CurrencyConverterPage: resultToDisplay to be set in state:", resultToDisplay);
    setConversionResult(resultToDisplay);
  };

  const handleRateFormSubmit = (data: RateFormValues) => {
    if (editingRate) {
      updateRate({ ...editingRate, ...data, updatedAt: new Date().toISOString() });
    } else {
      addRate(data);
    }
    setIsRateFormOpen(false);
    setEditingRate(null);
    rateForm.reset({ fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 });
  };

  const handleMarkupFormSubmit = (data: MarkupFormValues) => {
    setGlobalMarkup(data.markup);
  };

  const openEditRateDialog = (rateToEdit: ExchangeRate) => {
    setEditingRate(rateToEdit);
    setIsRateFormOpen(true);
  };

  const openNewRateDialog = () => {
    setEditingRate(null);
    rateForm.reset({ fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 });
    setIsRateFormOpen(true);
  };

  const lastFetchedDate = React.useMemo(() => {
    if (lastApiFetchTimestamp && isValid(parseISO(lastApiFetchTimestamp))) {
      return format(parseISO(lastApiFetchTimestamp), "MMM d, yyyy HH:mm:ss");
    }
    return "N/A (Using local/default rates)";
  }, [lastApiFetchTimestamp]);

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="outline" size="icon" className="h-10 w-10">
                <LayoutDashboard className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center">
              <Repeat className="mr-3 h-7 w-7 md:h-8 md:w-8" /> Currency Converter
            </h1>
          </div>
        </div>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Settings className="mr-2 h-5 w-5"/>Conversion Markup Settings</CardTitle>
            <CardDescription>Set a global markup percentage for conversions. This markup is applied when the 'From' and 'To' currencies are different, using USD as an intermediate. Current markup: <strong>{markupPercentage}%</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={markupForm.handleSubmit(handleMarkupFormSubmit)} className="flex items-end gap-3">
              <div className="flex-grow">
                <Label htmlFor="markup">Markup Percentage (%)</Label>
                <Input
                  id="markup"
                  type="number"
                  step="0.01"
                  {...markupForm.register("markup")}
                  className="mt-1"
                  placeholder="e.g., 2.5 for 2.5%"
                />
                {markupForm.formState.errors.markup && <p className="text-xs text-destructive mt-1">{markupForm.formState.errors.markup.message}</p>}
              </div>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm">Set Markup</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Convert Currency</CardTitle>
            <CardDescription>Enter amount and select currencies to convert. A markup of <strong>{markupPercentage}%</strong> will be applied if the 'From' and 'To' currencies are different.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={conversionForm.handleSubmit(handleConversionSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="number" {...conversionForm.register("amount")} className="mt-1" />
                  {conversionForm.formState.errors.amount && <p className="text-xs text-destructive mt-1">{conversionForm.formState.errors.amount.message}</p>}
                </div>
                <div>
                  <Label htmlFor="fromCurrency">From</Label>
                  <Controller
                    control={conversionForm.control}
                    name="fromCurrency"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="fromCurrency" className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                  {conversionForm.formState.errors.fromCurrency && <p className="text-xs text-destructive mt-1">{conversionForm.formState.errors.fromCurrency.message}</p>}
                </div>
                <div>
                  <Label htmlFor="toCurrency">To</Label>
                  <Controller
                    control={conversionForm.control}
                    name="toCurrency"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="toCurrency" className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                   {conversionForm.formState.errors.toCurrency && <p className="text-xs text-destructive mt-1">{conversionForm.formState.errors.toCurrency.message}</p>}
                </div>
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">Convert</Button>
            </form>
            {conversionError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Conversion Error</AlertTitle>
                <AlertDescription>{conversionError}</AlertDescription>
              </Alert>
            )}
            {conversionResult && (
              <div className="mt-6 p-4 bg-secondary/30 dark:bg-secondary/10 border border-secondary rounded-md space-y-2">
                <p className="text-lg font-semibold text-primary dark:text-blue-400 text-center">Conversion Result</p>
                <div className="text-sm text-foreground/90 dark:text-foreground/80 space-y-1">
                  <p><strong>Original:</strong> {formatCurrency(conversionResult.originalAmount, conversionResult.fromCurrency)} ({conversionResult.fromCurrency})</p>
                  <p><strong>Target:</strong> {conversionResult.toCurrency}</p>
                  <p className="font-mono"><strong>Base Rate (1 {conversionResult.fromCurrency}):</strong> {conversionResult.baseRate.toFixed(6)} {conversionResult.toCurrency} (System calculated, possibly via USD)</p>

                  {conversionResult.markupApplied > 0 && conversionResult.fromCurrency !== conversionResult.toCurrency && (
                    <>
                      <p className="font-semibold text-accent dark:text-orange-400 pt-1 border-t border-border/50 mt-1">Markup Details:</p>
                      <ul className="list-disc list-inside pl-4 text-xs">
                        <li><strong>Applied Markup:</strong> {conversionResult.markupApplied.toFixed(2)}%</li>
                        <li className="font-mono"><strong>Markup Value:</strong> +{formatCurrency( (conversionResult.finalRate - conversionResult.baseRate) * conversionResult.originalAmount, conversionResult.toCurrency)}</li>
                        <li className="font-mono"><strong>Effective Rate (1 {conversionResult.fromCurrency}):</strong> {conversionResult.finalRate.toFixed(6)} {conversionResult.toCurrency}</li>
                      </ul>
                    </>
                  )}
                  <p className="text-xl font-bold text-accent-foreground dark:text-accent-foreground mt-2 pt-2 border-t border-border">
                    Final Converted Amount: {formatCurrency(conversionResult.convertedAmount, conversionResult.toCurrency)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-xl">Manage Base Exchange Rates</CardTitle>
              <CardDescription>Define base rates. The "Effective Final Rate" column shows how the system (using USD intermediate &amp; current markup of <strong>{markupPercentage}%</strong>) would calculate it. Last API fetch: <span className="font-semibold text-primary">{lastFetchedDate}</span></CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={refreshRates} size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh from API
                </Button>
                <Button onClick={openNewRateDialog} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Rate
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading rates...</p>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Rates</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : exchangeRates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No exchange rates defined. Click "Add New Rate" or "Refresh from API".</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="text-right">Defined Base Rate</TableHead>
                      <TableHead className="text-right">Effective Final Rate (incl. Markup)</TableHead>
                      <TableHead className="text-right">Markup Added</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exchangeRates.map((rate) => {
                      const rateDetails = getRate(rate.fromCurrency, rate.toCurrency);
                      let effectiveFinalRateDisplay = "N/A";
                      let markupAddedDisplay = "N/A";

                      if (rateDetails) {
                        effectiveFinalRateDisplay = rateDetails.finalRate.toFixed(6);
                        markupAddedDisplay = (rateDetails.finalRate - rateDetails.baseRate).toFixed(6);
                         if (Math.abs(parseFloat(markupAddedDisplay)) < 0.0000001) markupAddedDisplay = "0.000000"; // Display zero clearly
                      } else {
                        // Try to show defined rate even if full calc fails
                        effectiveFinalRateDisplay = rate.rate.toFixed(6);
                        markupAddedDisplay = "Calc Error";
                      }

                      return (
                        <TableRow key={rate.id}>
                          <TableCell>{rate.fromCurrency}</TableCell>
                          <TableCell>{rate.toCurrency}</TableCell>
                          <TableCell className="text-right font-mono">{rate.rate.toFixed(4)}</TableCell>
                          <TableCell className="text-right font-mono">{effectiveFinalRateDisplay}</TableCell>
                          <TableCell className="text-right font-mono">{markupAddedDisplay}</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => openEditRateDialog(rate)} className="mr-2 text-primary hover:bg-primary/10 h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Deletion</DialogTitle>
                                  <AlertDescription>
                                    Are you sure you want to delete the base rate from {rate.fromCurrency} to {rate.toCurrency}?
                                  </AlertDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                  <Button variant="destructive" onClick={() => deleteRate(rate.id)}>Delete</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isRateFormOpen} onOpenChange={(isOpen) => {
            setIsRateFormOpen(isOpen);
            if (!isOpen) setEditingRate(null);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRate ? 'Edit' : 'Add'} Base Exchange Rate</DialogTitle>
              <AlertDescription>This is a direct base rate. The system may use USD as an intermediate for actual conversions if a direct path to USD is more optimal or this rate is missing. API-fetched rates for USD pairs may override manual USD rates.</AlertDescription>
            </DialogHeader>
            <form onSubmit={rateForm.handleSubmit(handleRateFormSubmit)} className="space-y-4 py-4">
              <div>
                <Label htmlFor="rateFromCurrency">From Currency</Label>
                 <Controller
                    control={rateForm.control}
                    name="fromCurrency"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="rateFromCurrency" className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={`from-${c}`} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                {rateForm.formState.errors.fromCurrency && <p className="text-xs text-destructive mt-1">{rateForm.formState.errors.fromCurrency.message}</p>}
              </div>
              <div>
                <Label htmlFor="rateToCurrency">To Currency</Label>
                 <Controller
                    control={rateForm.control}
                    name="toCurrency"
                    render={({ field }) => (
                       <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="rateToCurrency" className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={`to-${c}`} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                {rateForm.formState.errors.toCurrency && <p className="text-xs text-destructive mt-1">{rateForm.formState.errors.toCurrency.message}</p>}
              </div>
              <div>
                <Label htmlFor="rateValue">Rate (1 Unit of "From" = X Units of "To")</Label>
                <Input id="rateValue" type="number" step="0.000001" {...rateForm.register("rate")} className="mt-1" />
                {rateForm.formState.errors.rate && <p className="text-xs text-destructive mt-1">{rateForm.formState.errors.rate.message}</p>}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">{editingRate ? 'Update' : 'Add'} Rate</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
    
