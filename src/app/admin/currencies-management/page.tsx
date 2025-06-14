
/**
 * @fileoverview This page component allows administrators to manage all aspects of currencies,
 * including custom currency codes, exchange rates, conversion markup, and performing conversions.
 * It combines the functionality previously split between "Manage Currencies" and "Currency Converter".
 *
 * @bangla এই পৃষ্ঠা কম্পোনেন্টটি প্রশাসকদের কাস্টম কারেন্সি কোড, বিনিময় হার, রূপান্তর মার্কআপ,
 * এবং রূপান্তর সম্পাদন সহ মুদ্রার সমস্ত দিক পরিচালনা করার অনুমতি দেয়। এটি পূর্বে "মুদ্রা পরিচালনা"
 * এবং "মুদ্রা রূপান্তরকারী" এর মধ্যে বিভক্ত কার্যকারিতা একত্রিত করে।
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LayoutDashboard, PlusCircle, Trash2, AlertCircle, Loader2, Settings, BadgeDollarSign, Edit, Repeat, RefreshCw } from 'lucide-react';
import { useCustomCurrencies } from '@/hooks/useCustomCurrencies';
import type { CurrencyCode, ManagedCurrency, ExchangeRate } from '@/types/itinerary';
import { Badge } from '@/components/ui/badge';
import { useExchangeRates, type ConversionRateDetails } from '@/hooks/useExchangeRates';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

interface ConversionResultState {
  originalAmount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  baseRate: number;
  finalRate: number;
  markupApplied: number;
  convertedAmount: number;
}

const currencyCodeSchema = z.object({
  code: z.string()
    .min(3, "Currency code must be 3 letters.")
    .max(3, "Currency code must be 3 letters.")
    .regex(/^[A-Z]+$/, "Currency code must be uppercase letters."),
});
type CurrencyCodeFormValues = z.infer<typeof currencyCodeSchema>;

export default function ManageCurrenciesPage() {
  const {
    isLoading: isLoadingCustomCurrencies,
    getAllManagedCurrencies,
    addCustomCurrency,
    deleteCustomCurrency,
    refreshCustomCurrencies,
    getAllCurrencyCodes: getAllManagedCurrencyCodesFromHook, // Renamed to avoid conflict
  } = useCustomCurrencies();

  const {
    exchangeRates,
    isLoading: isLoadingExchangeRates,
    error: exchangeRateError,
    addRate,
    updateRate,
    deleteRate,
    getRate,
    refreshRates,
    markupPercentage,
    setGlobalMarkup,
    lastApiFetchTimestamp
  } = useExchangeRates();

  const [allCurrenciesList, setAllCurrenciesList] = React.useState<ManagedCurrency[]>([]);
  const [allManagedCurrencyCodes, setAllManagedCurrencyCodes] = React.useState<CurrencyCode[]>([]);
  const [isSubmittingCode, setIsSubmittingCode] = React.useState(false);
  const [conversionResult, setConversionResult] = React.useState<ConversionResultState | null>(null);
  const [conversionError, setConversionError] = React.useState<string | null>(null);
  const [isRateFormOpen, setIsRateFormOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<ExchangeRate | null>(null);

  React.useEffect(() => {
    if (!isLoadingCustomCurrencies) {
      setAllCurrenciesList(getAllManagedCurrencies());
      setAllManagedCurrencyCodes(getAllManagedCurrencyCodesFromHook());
    }
  }, [isLoadingCustomCurrencies, getAllManagedCurrencies, getAllManagedCurrencyCodesFromHook]);

  React.useEffect(() => {
    refreshCustomCurrencies(); 
  }, [refreshCustomCurrencies]);

  const currencyCodeForm = useForm<CurrencyCodeFormValues>({
    resolver: zodResolver(currencyCodeSchema),
    defaultValues: { code: "" },
  });

  const conversionSchema = z.object({
    amount: z.coerce.number().positive("Amount must be positive"),
    fromCurrency: z.custom<CurrencyCode>((val) => allManagedCurrencyCodes.includes(val as CurrencyCode), "Invalid from currency"),
    toCurrency: z.custom<CurrencyCode>((val) => allManagedCurrencyCodes.includes(val as CurrencyCode), "Invalid to currency"),
  });
  type ConversionFormValues = z.infer<typeof conversionSchema>;

  const rateSchema = z.object({
    fromCurrency: z.custom<CurrencyCode>((val) => allManagedCurrencyCodes.includes(val as CurrencyCode), "Invalid from currency"),
    toCurrency: z.custom<CurrencyCode>((val) => allManagedCurrencyCodes.includes(val as CurrencyCode), "Invalid to currency"),
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
    } else if (allManagedCurrencyCodes.length >= 2) {
      rateForm.reset({ fromCurrency: allManagedCurrencyCodes[0], toCurrency: allManagedCurrencyCodes[1] || allManagedCurrencyCodes[0], rate: 1 });
    }
  }, [editingRate, rateForm, allManagedCurrencyCodes]);

  React.useEffect(() => {
    if (conversionForm.formState.isSubmitted) conversionForm.trigger();
    if (rateForm.formState.isSubmitted) rateForm.trigger();
  }, [allManagedCurrencyCodes, conversionForm, rateForm]);
  
  React.useEffect(() => {
    console.log('CombinedCurrenciesPage: lastApiFetchTimestamp changed to:', lastApiFetchTimestamp);
  }, [lastApiFetchTimestamp]);

  const handleAddCurrencyCode = async (data: CurrencyCodeFormValues) => {
    setIsSubmittingCode(true);
    const success = await addCustomCurrency(data.code as CurrencyCode);
    if (success) {
      currencyCodeForm.reset({ code: "" });
      refreshCustomCurrencies(); 
    }
    setIsSubmittingCode(false);
  };

  const handleDeleteCurrencyCode = async (code: CurrencyCode) => {
    await deleteCustomCurrency(code);
    refreshCustomCurrencies(); 
  };
  
  const handleConversionSubmit = (data: ConversionFormValues) => {
    setConversionError(null);
    setConversionResult(null);
    const rateDetails = getRate(data.fromCurrency, data.toCurrency);
    console.log("CombinedCurrenciesPage: rateDetails from getRate:", rateDetails);

    if (rateDetails === null) {
      setConversionError(`Exchange rate from ${data.fromCurrency} to ${data.toCurrency} is not defined or calculable. Ensure base rates to/from USD are set.`);
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
    console.log("CombinedCurrenciesPage: resultToDisplay to be set in state:", resultToDisplay);
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
    if (allManagedCurrencyCodes.length >= 2) {
        rateForm.reset({ fromCurrency: allManagedCurrencyCodes[0], toCurrency: allManagedCurrencyCodes[1] || allManagedCurrencyCodes[0], rate: 1 });
    }
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
    if (allManagedCurrencyCodes.length >= 2) {
        rateForm.reset({ fromCurrency: allManagedCurrencyCodes[0], toCurrency: allManagedCurrencyCodes[1] || allManagedCurrencyCodes[0], rate: 1 });
    }
    setIsRateFormOpen(true);
  };

  const lastFetchedDate = React.useMemo(() => {
    if (lastApiFetchTimestamp && isValid(parseISO(lastApiFetchTimestamp))) {
      return format(parseISO(lastApiFetchTimestamp), "MMM d, yyyy HH:mm:ss");
    }
    return "N/A (Using local/default rates)";
  }, [lastApiFetchTimestamp]);

  const isLoading = isLoadingCustomCurrencies || isLoadingExchangeRates;

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
              <BadgeDollarSign className="mr-3 h-7 w-7 md:h-8 md:w-8" /> Manage Currencies &amp; Rates
            </h1>
          </div>
        </div>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><PlusCircle className="mr-2 h-5 w-5 text-accent"/>Add New Custom Currency Code</CardTitle>
            <CardDescription>
              Add a new 3-letter uppercase currency code (e.g., CAD). After adding, define its exchange rates below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={currencyCodeForm.handleSubmit(handleAddCurrencyCode)} className="flex items-end gap-3">
              <div className="flex-grow">
                <Label htmlFor="currencyCode">New Currency Code</Label>
                <Input
                  id="currencyCode"
                  maxLength={3}
                  {...currencyCodeForm.register("code")}
                  className="mt-1 uppercase"
                  placeholder="e.g., CAD"
                />
                {currencyCodeForm.formState.errors.code && <p className="text-xs text-destructive mt-1">{currencyCodeForm.formState.errors.code.message}</p>}
              </div>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm" disabled={isSubmittingCode || isLoadingCustomCurrencies}>
                {isSubmittingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Code
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">All Available Currency Codes</CardTitle>
            <CardDescription>System default currencies cannot be deleted. Custom codes can be removed.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCustomCurrencies ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading currency codes...</p></div>
            ) : allCurrenciesList.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No currencies defined.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {allCurrenciesList.map((currency) => (
                      <TableRow key={currency.code}>
                        <TableCell className="font-mono font-semibold">{currency.code}</TableCell>
                        <TableCell><Badge variant={currency.isCustom ? "outline" : "secondary"} className={currency.isCustom ? "border-blue-500 text-blue-600" : ""}>{currency.isCustom ? "Custom" : "System"}</Badge></TableCell>
                        <TableCell className="text-center">
                          {currency.isCustom ? (
                            <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8"><Trash2 className="h-4 w-4" /></Button></DialogTrigger>
                              <DialogContent><DialogHeader><DialogTitle>Confirm Deletion</DialogTitle><AlertDescription>Delete "{currency.code}"? This cannot be undone.</AlertDescription></DialogHeader>
                                <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button variant="destructive" onClick={() => handleDeleteCurrencyCode(currency.code)}>Delete</Button></DialogFooter></DialogContent>
                            </Dialog>
                          ) : (<span className="text-xs text-muted-foreground italic">N/A</span>)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Settings className="mr-2 h-5 w-5"/>Conversion Markup Settings</CardTitle>
            <CardDescription>Set a global markup percentage for conversions. This markup is applied when the 'From' and 'To' currencies are different, using USD as an intermediate. Current markup: <strong>{markupPercentage}%</strong></CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={markupForm.handleSubmit(handleMarkupFormSubmit)} className="flex items-end gap-3">
              <div className="flex-grow">
                <Label htmlFor="markup">Markup Percentage (%)</Label>
                <Input id="markup" type="number" step="0.01" {...markupForm.register("markup")} className="mt-1" placeholder="e.g., 2.5 for 2.5%" />
                {markupForm.formState.errors.markup && <p className="text-xs text-destructive mt-1">{markupForm.formState.errors.markup.message}</p>}
              </div>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm">Set Markup</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><Repeat className="mr-2 h-5 w-5"/>Convert Currency</CardTitle>
            <CardDescription>Enter amount and select currencies to convert. A markup of <strong>{markupPercentage}%</strong> will be applied if the 'From' and 'To' currencies are different.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={conversionForm.handleSubmit(handleConversionSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" {...conversionForm.register("amount")} className="mt-1" />{conversionForm.formState.errors.amount && <p className="text-xs text-destructive mt-1">{conversionForm.formState.errors.amount.message}</p>}</div>
                <div><Label htmlFor="fromCurrency">From</Label><Controller control={conversionForm.control} name="fromCurrency" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length === 0}><SelectTrigger id="fromCurrency" className="mt-1"><SelectValue placeholder={isLoadingCustomCurrencies ? "Loading..." : "Select"} /></SelectTrigger><SelectContent>{allManagedCurrencyCodes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} />{conversionForm.formState.errors.fromCurrency && <p className="text-xs text-destructive mt-1">{conversionForm.formState.errors.fromCurrency.message}</p>}</div>
                <div><Label htmlFor="toCurrency">To</Label><Controller control={conversionForm.control} name="toCurrency" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length === 0}><SelectTrigger id="toCurrency" className="mt-1"><SelectValue placeholder={isLoadingCustomCurrencies ? "Loading..." : "Select"} /></SelectTrigger><SelectContent>{allManagedCurrencyCodes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} />{conversionForm.formState.errors.toCurrency && <p className="text-xs text-destructive mt-1">{conversionForm.formState.errors.toCurrency.message}</p>}</div>
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto" disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length < 2}>Convert</Button>
            </form>
            {conversionError && (<Alert variant="destructive" className="mt-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Conversion Error</AlertTitle><AlertDescription>{conversionError}</AlertDescription></Alert>)}
            {conversionResult && (
              <div className="mt-6 p-4 bg-secondary/30 dark:bg-secondary/10 border border-secondary rounded-md space-y-2">
                <p className="text-lg font-semibold text-primary dark:text-blue-400 text-center">Conversion Result</p>
                <div className="text-sm text-foreground/90 dark:text-foreground/80 space-y-1">
                  <p><strong>Original:</strong> {formatCurrency(conversionResult.originalAmount, conversionResult.fromCurrency)} ({conversionResult.fromCurrency})</p>
                  <p><strong>Target:</strong> {conversionResult.toCurrency}</p>
                  <p className="font-mono"><strong>Base Rate (1 {conversionResult.fromCurrency}):</strong> {conversionResult.baseRate.toFixed(6)} {conversionResult.toCurrency} (System calculated, possibly via USD)</p>
                  {conversionResult.markupApplied > 0 && conversionResult.fromCurrency !== conversionResult.toCurrency && (
                    <><p className="font-semibold text-accent dark:text-orange-400 pt-1 border-t border-border/50 mt-1">Markup Details:</p><ul className="list-disc list-inside pl-4 text-xs"><li><strong>Applied Markup:</strong> {conversionResult.markupApplied.toFixed(2)}%</li><li className="font-mono"><strong>Markup Value:</strong> +{formatCurrency( (conversionResult.finalRate - conversionResult.baseRate) * conversionResult.originalAmount, conversionResult.toCurrency)}</li><li className="font-mono"><strong>Effective Rate (1 {conversionResult.fromCurrency}):</strong> {conversionResult.finalRate.toFixed(6)} {conversionResult.toCurrency}</li></ul></>
                  )}
                  <p className="text-xl font-bold text-accent-foreground dark:text-accent-foreground mt-2 pt-2 border-t border-border">Final Converted Amount: {formatCurrency(conversionResult.convertedAmount, conversionResult.toCurrency)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <div><CardTitle className="text-xl">Manage Base Exchange Rates</CardTitle><CardDescription>Define base rates. "Effective Final Rate" shows system calculation (via USD &amp; markup <strong>{markupPercentage}%</strong>). Last API fetch: <span className="font-semibold text-primary">{lastFetchedDate}</span></CardDescription></div>
            <div className="flex flex-col sm:flex-row gap-2"><Button onClick={() => refreshRates()} size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10"><RefreshCw className="mr-2 h-4 w-4" /> Refresh from API</Button><Button onClick={openNewRateDialog} size="sm" disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length < 2}><PlusCircle className="mr-2 h-4 w-4" /> Add New Rate</Button></div>
          </CardHeader>
          <CardContent>
            {isLoadingExchangeRates ? (
              <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading rates...</p></div>
            ) : exchangeRateError ? (
              <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error Loading Rates</AlertTitle><AlertDescription>{exchangeRateError}</AlertDescription></Alert>
            ) : exchangeRates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No exchange rates defined. Click "Add New Rate" or "Refresh from API".</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>From</TableHead><TableHead>To</TableHead><TableHead className="text-right">Defined Base Rate</TableHead><TableHead className="text-right">Effective Final Rate (incl. Markup)</TableHead><TableHead className="text-right">Markup Added</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {exchangeRates.map((rate) => {
                      const rateDetails = getRate(rate.fromCurrency, rate.toCurrency);
                      let effectiveFinalRateDisplay = "N/A";
                      let markupAddedDisplay = "N/A";
                      if (rateDetails) { effectiveFinalRateDisplay = rateDetails.finalRate.toFixed(6); markupAddedDisplay = (rateDetails.finalRate - rateDetails.baseRate).toFixed(6); if (Math.abs(parseFloat(markupAddedDisplay)) < 0.0000001) markupAddedDisplay = "0.000000";} else { effectiveFinalRateDisplay = rate.rate.toFixed(6); markupAddedDisplay = "Calc Error"; }
                      return (
                        <TableRow key={rate.id}>
                          <TableCell>{rate.fromCurrency}</TableCell><TableCell>{rate.toCurrency}</TableCell><TableCell className="text-right font-mono">{rate.rate.toFixed(6)}</TableCell><TableCell className="text-right font-mono">{effectiveFinalRateDisplay}</TableCell><TableCell className="text-right font-mono">{markupAddedDisplay}</TableCell>
                          <TableCell className="text-center"><Button variant="ghost" size="icon" onClick={() => openEditRateDialog(rate)} className="mr-2 text-primary hover:bg-primary/10 h-8 w-8"><Edit className="h-4 w-4" /></Button>
                            <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8"><Trash2 className="h-4 w-4" /></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Confirm Deletion</DialogTitle><AlertDescription>Delete rate from {rate.fromCurrency} to {rate.toCurrency}?</AlertDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button variant="destructive" onClick={() => deleteRate(rate.id)}>Delete</Button></DialogFooter></DialogContent></Dialog>
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

        <Dialog open={isRateFormOpen} onOpenChange={(isOpen) => { setIsRateFormOpen(isOpen); if (!isOpen) setEditingRate(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{editingRate ? 'Edit' : 'Add'} Base Exchange Rate</DialogTitle><AlertDescription>This is a direct base rate. System may use USD intermediate for conversions. API-fetched USD rates may override manual USD rates.</AlertDescription></DialogHeader>
            <form onSubmit={rateForm.handleSubmit(handleRateFormSubmit)} className="space-y-4 py-4">
              <div><Label htmlFor="rateFromCurrency">From Currency</Label><Controller control={rateForm.control} name="fromCurrency" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length === 0}><SelectTrigger id="rateFromCurrency" className="mt-1"><SelectValue placeholder={isLoadingCustomCurrencies ? "Loading..." : "Select"} /></SelectTrigger><SelectContent>{allManagedCurrencyCodes.map(c => <SelectItem key={`from-${c}`} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} />{rateForm.formState.errors.fromCurrency && <p className="text-xs text-destructive mt-1">{rateForm.formState.errors.fromCurrency.message}</p>}</div>
              <div><Label htmlFor="rateToCurrency">To Currency</Label><Controller control={rateForm.control} name="toCurrency" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length === 0}><SelectTrigger id="rateToCurrency" className="mt-1"><SelectValue placeholder={isLoadingCustomCurrencies ? "Loading..." : "Select"} /></SelectTrigger><SelectContent>{allManagedCurrencyCodes.map(c => <SelectItem key={`to-${c}`} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} />{rateForm.formState.errors.toCurrency && <p className="text-xs text-destructive mt-1">{rateForm.formState.errors.toCurrency.message}</p>}</div>
              <div><Label htmlFor="rateValue">Rate (1 Unit of "From" = X Units of "To")</Label><Input id="rateValue" type="number" step="0.000001" {...rateForm.register("rate")} className="mt-1" />{rateForm.formState.errors.rate && <p className="text-xs text-destructive mt-1">{rateForm.formState.errors.rate.message}</p>}</div>
              <div className="flex justify-end space-x-2 pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length < 2}>{editingRate ? 'Update' : 'Add'} Rate</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
