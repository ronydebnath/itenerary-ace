
/**
 * @fileoverview This page component allows administrators to manage all aspects of currencies,
 * including custom currency codes, exchange rates (base and specific markups),
 * global conversion markup, and performing conversions.
 *
 * @bangla এই পৃষ্ঠা কম্পোনেন্টটি প্রশাসকদের কাস্টম কারেন্সি কোড, বিনিময় হার (বেস এবং নির্দিষ্ট মার্কআপ),
 * গ্লোবাল রূপান্তর মার্কআপ, এবং রূপান্তর সম্পাদন সহ মুদ্রার সমস্ত দিক পরিচালনা করার অনুমতি দেয়।
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
import { LayoutDashboard, PlusCircle, Trash2, AlertCircle, Loader2, Settings, BadgeDollarSign, Edit, Repeat, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Tag, Info, Percent } from 'lucide-react';
import { useCustomCurrencies } from '@/hooks/useCustomCurrencies';
import type { CurrencyCode, ManagedCurrency, ExchangeRate, SpecificMarkupRate } from '@/types/itinerary';
import { REFERENCE_CURRENCY } from '@/types/itinerary';
import { Badge } from '@/components/ui/badge';
import { useExchangeRates, type ConversionRateDetails } from '@/hooks/useExchangeRates';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConversionResultState {
  originalAmount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  baseRate: number;
  finalRate: number;
  markupApplied: number;
  markupType: 'global' | 'specific' | 'none';
  convertedAmount: number;
}

const currencyCodeSchema = z.object({
  code: z.string().min(3, "Code must be 3 letters.").max(3, "Code must be 3 letters.").regex(/^[A-Z]+$/, "Code must be uppercase letters."),
});
type CurrencyCodeFormValues = z.infer<typeof currencyCodeSchema>;

type SortableRateKey = keyof Pick<ExchangeRate, 'fromCurrency' | 'toCurrency' | 'rate' | 'source'>;
type SortableDerivedKey = 'effectiveFinalRate' | 'markupAdded' | 'markupPercentageApplied';
type RateTableSortKey = SortableRateKey | SortableDerivedKey;

interface RateTableSortConfig { key: RateTableSortKey; direction: 'ascending' | 'descending'; }

type SpecificMarkupSortKey = keyof Pick<SpecificMarkupRate, 'fromCurrency' | 'toCurrency' | 'markupPercentage'>;
interface SpecificMarkupSortConfig { key: SpecificMarkupSortKey; direction: 'ascending' | 'descending'; }

export default function ManageCurrenciesPage() {
  const { isLoading: isLoadingCustomCurrencies, getAllManagedCurrencies, addCustomCurrency, deleteCustomCurrency, refreshCustomCurrencies, getAllCurrencyCodes: getAllManagedCurrencyCodesFromHook } = useCustomCurrencies();
  const { exchangeRates, isLoading: isLoadingExchangeRates, error: exchangeRateError, addRate, updateRate, deleteRate, getRate, globalMarkupPercentage, setGlobalMarkup, specificMarkupRates, addSpecificMarkup, updateSpecificMarkup, deleteSpecificMarkup, refreshRates, lastApiFetchTimestamp } = useExchangeRates();

  const [allCurrenciesList, setAllCurrenciesList] = React.useState<ManagedCurrency[]>([]);
  const [allManagedCurrencyCodes, setAllManagedCurrencyCodes] = React.useState<CurrencyCode[]>([]);
  const [isSubmittingCode, setIsSubmittingCode] = React.useState(false);
  const [conversionResult, setConversionResult] = React.useState<ConversionResultState | null>(null);
  const [conversionError, setConversionError] = React.useState<string | null>(null);
  
  const [isRateFormOpen, setIsRateFormOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<ExchangeRate | null>(null);
  const [rateTableSortConfig, setRateTableSortConfig] = React.useState<RateTableSortConfig | null>({ key: 'fromCurrency', direction: 'ascending' });

  const [isSpecificMarkupFormOpen, setIsSpecificMarkupFormOpen] = React.useState(false);
  const [editingSpecificMarkup, setEditingSpecificMarkup] = React.useState<SpecificMarkupRate | null>(null);
  const [specificMarkupSortConfig, setSpecificMarkupSortConfig] = React.useState<SpecificMarkupSortConfig | null>({ key: 'fromCurrency', direction: 'ascending' });


  React.useEffect(() => {
    if (!isLoadingCustomCurrencies) {
      setAllCurrenciesList(getAllManagedCurrencies());
      setAllManagedCurrencyCodes(getAllManagedCurrencyCodesFromHook());
    }
  }, [isLoadingCustomCurrencies, getAllManagedCurrencies, getAllManagedCurrencyCodesFromHook]);

  React.useEffect(() => { refreshCustomCurrencies(); }, [refreshCustomCurrencies]);
  React.useEffect(() => { console.log('CombinedCurrenciesPage: lastApiFetchTimestamp changed to:', lastApiFetchTimestamp); }, [lastApiFetchTimestamp]);

  const currencyCodeForm = useForm<CurrencyCodeFormValues>({ resolver: zodResolver(currencyCodeSchema), defaultValues: { code: "" } });
  const conversionSchema = z.object({
    amount: z.coerce.number().positive("Amount must be positive"),
    fromCurrency: z.custom<CurrencyCode>((val) => allManagedCurrencyCodes.includes(val as CurrencyCode), "Invalid from currency"),
    toCurrency: z.custom<CurrencyCode>((val) => allManagedCurrencyCodes.includes(val as CurrencyCode), "Invalid to currency"),
  });
  type ConversionFormValues = z.infer<typeof conversionSchema>;

  const rateSchema = z.object({
    fromCurrency: z.custom<CurrencyCode>((val) => allManagedCurrencyCodes.includes(val as CurrencyCode), "Invalid from currency"),
    toCurrency: z.custom<CurrencyCode>((val) => allManagedCurrencyCodes.includes(val as CurrencyCode), "Invalid to currency"),
    rate: z.coerce.number().positive("Rate must be positive"),
  }).refine(data => data.fromCurrency !== data.toCurrency, { message: "Cannot set rate from a currency to itself.", path: ["toCurrency"] });
  type RateFormValues = z.infer<typeof rateSchema>;
  
  const specificMarkupSchema = z.object({
    fromCurrency: z.custom<CurrencyCode>((val) => allManagedCurrencyCodes.includes(val as CurrencyCode), "Invalid from currency"),
    toCurrency: z.custom<CurrencyCode>((val) => allManagedCurrencyCodes.includes(val as CurrencyCode), "Invalid to currency"),
    markupPercentage: z.coerce.number().min(0, "Markup must be non-negative").max(50, "Markup cannot exceed 50%"),
  }).refine(data => data.fromCurrency !== data.toCurrency, { message: "Cannot set specific markup for same currency.", path: ["toCurrency"] });
  type SpecificMarkupFormValues = z.infer<typeof specificMarkupSchema>;

  const globalMarkupSchema = z.object({ markup: z.coerce.number().min(0, "Markup must be non-negative").max(50, "Markup cannot exceed 50%") });
  type GlobalMarkupFormValues = z.infer<typeof globalMarkupSchema>;

  const conversionForm = useForm<ConversionFormValues>({ resolver: zodResolver(conversionSchema), defaultValues: { amount: 100, fromCurrency: "USD", toCurrency: "THB" } });
  const rateForm = useForm<RateFormValues>({ resolver: zodResolver(rateSchema), defaultValues: { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 } });
  const specificMarkupFormHook = useForm<SpecificMarkupFormValues>({ resolver: zodResolver(specificMarkupSchema), defaultValues: { fromCurrency: "USD", toCurrency: "EUR", markupPercentage: 0 } });
  const globalMarkupForm = useForm<GlobalMarkupFormValues>({ resolver: zodResolver(globalMarkupSchema), defaultValues: { markup: globalMarkupPercentage } });

  React.useEffect(() => { globalMarkupForm.reset({ markup: globalMarkupPercentage }); }, [globalMarkupPercentage, globalMarkupForm]);
  React.useEffect(() => { if (editingRate) { rateForm.reset({ fromCurrency: editingRate.fromCurrency, toCurrency: editingRate.toCurrency, rate: editingRate.rate }); } else if (allManagedCurrencyCodes.length >= 2) { rateForm.reset({ fromCurrency: allManagedCurrencyCodes[0], toCurrency: allManagedCurrencyCodes[1] || allManagedCurrencyCodes[0], rate: 1 }); } }, [editingRate, rateForm, allManagedCurrencyCodes]);
  React.useEffect(() => { if (editingSpecificMarkup) { specificMarkupFormHook.reset(editingSpecificMarkup); } else if (allManagedCurrencyCodes.length >= 2) { specificMarkupFormHook.reset({ fromCurrency: allManagedCurrencyCodes[0], toCurrency: allManagedCurrencyCodes[1] || allManagedCurrencyCodes[0], markupPercentage: 0 }); } }, [editingSpecificMarkup, specificMarkupFormHook, allManagedCurrencyCodes]);

  React.useEffect(() => {
    if (conversionForm.formState.isSubmitted) conversionForm.trigger();
    if (rateForm.formState.isSubmitted) rateForm.trigger();
    if (specificMarkupFormHook.formState.isSubmitted) specificMarkupFormHook.trigger();
  }, [allManagedCurrencyCodes, conversionForm, rateForm, specificMarkupFormHook]);
  
  const handleAddCurrencyCode = async (data: CurrencyCodeFormValues) => { setIsSubmittingCode(true); const success = await addCustomCurrency(data.code as CurrencyCode); if (success) currencyCodeForm.reset({ code: "" }); refreshCustomCurrencies(); setIsSubmittingCode(false); };
  const handleDeleteCurrencyCode = async (code: CurrencyCode) => { await deleteCustomCurrency(code); refreshCustomCurrencies(); };
  
  const handleConversionSubmit = (data: ConversionFormValues) => {
    setConversionError(null); setConversionResult(null);
    const rateDetails = getRate(data.fromCurrency, data.toCurrency);
    if (rateDetails === null) { setConversionError(`Exchange rate ${data.fromCurrency} to ${data.toCurrency} undefined or incalculable.`); return; }
    const finalConvertedAmount = data.amount * rateDetails.finalRate;
    setConversionResult({ originalAmount: data.amount, fromCurrency: data.fromCurrency, toCurrency: data.toCurrency, baseRate: rateDetails.baseRate, finalRate: rateDetails.finalRate, markupApplied: rateDetails.markupApplied, markupType: rateDetails.markupType, convertedAmount: finalConvertedAmount });
  };

  const handleRateFormSubmit = (data: RateFormValues) => {
    if (editingRate) updateRate({ ...editingRate, ...data, updatedAt: new Date().toISOString(), source: 'manual' });
    else addRate(data);
    setIsRateFormOpen(false); setEditingRate(null); if (allManagedCurrencyCodes.length >= 2) rateForm.reset({ fromCurrency: allManagedCurrencyCodes[0], toCurrency: allManagedCurrencyCodes[1] || allManagedCurrencyCodes[0], rate: 1 });
  };

  const handleGlobalMarkupFormSubmit = (data: GlobalMarkupFormValues) => setGlobalMarkup(data.markup);

  const handleSpecificMarkupFormSubmit = (data: SpecificMarkupFormValues) => {
    if (editingSpecificMarkup) updateSpecificMarkup({ ...editingSpecificMarkup, ...data, updatedAt: new Date().toISOString() });
    else addSpecificMarkup(data);
    setIsSpecificMarkupFormOpen(false); setEditingSpecificMarkup(null); if (allManagedCurrencyCodes.length >= 2) specificMarkupFormHook.reset({ fromCurrency: allManagedCurrencyCodes[0], toCurrency: allManagedCurrencyCodes[1] || allManagedCurrencyCodes[0], markupPercentage: 0 });
  };

  const openEditRateDialog = (rateToEdit: ExchangeRate) => { setEditingRate(rateToEdit); setIsRateFormOpen(true); };
  const openNewRateDialog = () => { setEditingRate(null); if (allManagedCurrencyCodes.length >= 2) rateForm.reset({ fromCurrency: allManagedCurrencyCodes[0], toCurrency: allManagedCurrencyCodes[1] || allManagedCurrencyCodes[0], rate: 1 }); setIsRateFormOpen(true); };
  
  const openEditSpecificMarkupDialog = (markupToEdit: SpecificMarkupRate) => { setEditingSpecificMarkup(markupToEdit); setIsSpecificMarkupFormOpen(true); };
  const openNewSpecificMarkupDialog = () => { setEditingSpecificMarkup(null); if (allManagedCurrencyCodes.length >= 2) specificMarkupFormHook.reset({ fromCurrency: allManagedCurrencyCodes[0], toCurrency: allManagedCurrencyCodes[1] || allManagedCurrencyCodes[0], markupPercentage: 0 }); setIsSpecificMarkupFormOpen(true); };

  const lastFetchedDate = React.useMemo(() => lastApiFetchTimestamp && isValid(parseISO(lastApiFetchTimestamp)) ? format(parseISO(lastApiFetchTimestamp), "MMM d, yyyy HH:mm:ss") : "N/A (Using local/default rates)", [lastApiFetchTimestamp]);

  const requestRateTableSort = (key: RateTableSortKey) => { let direction: 'ascending' | 'descending' = 'ascending'; if (rateTableSortConfig && rateTableSortConfig.key === key && rateTableSortConfig.direction === 'ascending') direction = 'descending'; setRateTableSortConfig({ key, direction }); };
  const requestSpecificMarkupSort = (key: SpecificMarkupSortKey) => { let direction: 'ascending' | 'descending' = 'ascending'; if (specificMarkupSortConfig && specificMarkupSortConfig.key === key && specificMarkupSortConfig.direction === 'ascending') direction = 'descending'; setSpecificMarkupSortConfig({ key, direction }); };

  const sortedExchangeRates = React.useMemo(() => {
    let sortableItems = [...exchangeRates];
    if (rateTableSortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number | null | undefined;
        let bValue: string | number | null | undefined;
        
        const aRateDetails = getRate(a.fromCurrency, a.toCurrency); 
        const bRateDetails = getRate(b.fromCurrency, b.toCurrency);

        if (rateTableSortConfig.key === 'effectiveFinalRate') { aValue = aRateDetails?.finalRate; bValue = bRateDetails?.finalRate; }
        else if (rateTableSortConfig.key === 'markupAdded') { aValue = aRateDetails ? aRateDetails.finalRate - aRateDetails.baseRate : undefined; bValue = bRateDetails ? bRateDetails.finalRate - bRateDetails.baseRate : undefined; }
        else if (rateTableSortConfig.key === 'markupPercentageApplied') { aValue = aRateDetails?.markupApplied; bValue = bRateDetails?.markupApplied; }
        else { aValue = a[rateTableSortConfig.key as keyof ExchangeRate]; bValue = b[rateTableSortConfig.key as keyof ExchangeRate]; }
        
        if (aValue == null && bValue != null) return rateTableSortConfig.direction === 'ascending' ? 1 : -1; if (aValue != null && bValue == null) return rateTableSortConfig.direction === 'ascending' ? -1 : 1; if (aValue == null && bValue == null) return 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') return rateTableSortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        if (typeof aValue === 'string' && typeof bValue === 'string') return rateTableSortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        return 0;
      });
    } return sortableItems;
  }, [exchangeRates, rateTableSortConfig, getRate]);
  
  const sortedSpecificMarkups = React.useMemo(() => {
    let sortableItems = [...specificMarkupRates];
    if (specificMarkupSortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[specificMarkupSortConfig.key]; const bValue = b[specificMarkupSortConfig.key];
        if (typeof aValue === 'number' && typeof bValue === 'number') return specificMarkupSortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        if (typeof aValue === 'string' && typeof bValue === 'string') return specificMarkupSortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        return 0;
      });
    } return sortableItems;
  }, [specificMarkupRates, specificMarkupSortConfig]);

  const getSortIcon = (key: RateTableSortKey | SpecificMarkupSortKey, currentSortConfig: RateTableSortConfig | SpecificMarkupSortConfig | null) => { if (!currentSortConfig || currentSortConfig.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3 text-muted-foreground/70" />; return currentSortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />; };
  const isLoading = isLoadingCustomCurrencies || isLoadingExchangeRates;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8"><div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-10 w-10">
                <LayoutDashboard className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-primary flex items-center"><BadgeDollarSign className="mr-3 h-7 w-7 md:h-8 md:w-8" /> Manage Currencies &amp; Rates</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8"> {/* Left Column */}
          <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl flex items-center"><PlusCircle className="mr-2 h-5 w-5 text-accent"/>Add New Custom Currency Code</CardTitle><CardDescription>Add a new 3-letter uppercase currency code (e.g., CAD). After adding, define its exchange rates below.</CardDescription></CardHeader><CardContent><form onSubmit={currencyCodeForm.handleSubmit(handleAddCurrencyCode)} className="flex items-end gap-3"><div className="flex-grow"><Label htmlFor="currencyCode">New Currency Code</Label><Input id="currencyCode" maxLength={3} {...currencyCodeForm.register("code")} className="mt-1 uppercase" placeholder="e.g., CAD"/>{currencyCodeForm.formState.errors.code && <p className="text-xs text-destructive mt-1">{currencyCodeForm.formState.errors.code.message}</p>}</div><Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm" disabled={isSubmittingCode || isLoadingCustomCurrencies}>{isSubmittingCode ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}Add Code</Button></form></CardContent></Card>
          <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl">All Available Currency Codes</CardTitle><CardDescription>System default currencies cannot be deleted. Custom codes can be removed.</CardDescription></CardHeader><CardContent>{isLoadingCustomCurrencies ? (<div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading codes...</p></div>) : allCurrenciesList.length === 0 ? (<p className="text-muted-foreground text-center py-4">No currencies.</p>) : (<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader><TableBody>{allCurrenciesList.map((c) => (<TableRow key={c.code}><TableCell className="font-mono font-semibold">{c.code}</TableCell><TableCell><Badge variant={c.isCustom ? "outline" : "secondary"} className={c.isCustom ? "border-blue-500 text-blue-600" : ""}>{c.isCustom ? "Custom" : "System"}</Badge></TableCell><TableCell className="text-center">{c.isCustom ? (<Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8"><Trash2 className="h-4 w-4" /></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Confirm Deletion</DialogTitle><AlertDescription>Delete "{c.code}"?</AlertDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button variant="destructive" onClick={() => handleDeleteCurrencyCode(c.code as CurrencyCode)}>Delete</Button></DialogFooter></DialogContent></Dialog>) : (<span className="text-xs text-muted-foreground italic">N/A</span>)}</TableCell></TableRow>))}</TableBody></Table></div>)}</CardContent></Card>
          <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl flex items-center"><Settings className="mr-2 h-5 w-5"/>Global Conversion Markup</CardTitle><CardDescription>Set a global markup percentage for conversions. This applies if no specific pair markup is set. Current global markup: <strong>{globalMarkupPercentage}%</strong></CardDescription></CardHeader><CardContent><form onSubmit={globalMarkupForm.handleSubmit(handleGlobalMarkupFormSubmit)} className="flex items-end gap-3"><div className="flex-grow"><Label htmlFor="markup">Markup (%)</Label><Input id="markup" type="number" step="0.01" {...globalMarkupForm.register("markup")} className="mt-1" placeholder="e.g., 2.5"/>{globalMarkupForm.formState.errors.markup && <p className="text-xs text-destructive mt-1">{globalMarkupForm.formState.errors.markup.message}</p>}</div><Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm">Set Global Markup</Button></form></CardContent></Card>
        </div>
        
        <div className="space-y-8"> {/* Right Column */}
          <Card className="shadow-lg"><CardHeader><CardTitle className="text-xl flex items-center"><Repeat className="mr-2 h-5 w-5"/>Convert Currency</CardTitle><CardDescription>Enter amount and select currencies to convert. A markup will be applied (specific if defined, else global).</CardDescription></CardHeader><CardContent><form onSubmit={conversionForm.handleSubmit(handleConversionSubmit)} className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"><div><Label htmlFor="amount">Amount</Label><Input id="amount" type="number" {...conversionForm.register("amount")} className="mt-1" />{conversionForm.formState.errors.amount && <p className="text-xs text-destructive mt-1">{conversionForm.formState.errors.amount.message}</p>}</div><div><Label htmlFor="fromCurrency">From</Label><Controller control={conversionForm.control} name="fromCurrency" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length === 0}><SelectTrigger id="fromCurrency" className="mt-1"><SelectValue placeholder={isLoadingCustomCurrencies ? "Loading..." : "Select"} /></SelectTrigger><SelectContent>{allManagedCurrencyCodes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} />{conversionForm.formState.errors.fromCurrency && <p className="text-xs text-destructive mt-1">{conversionForm.formState.errors.fromCurrency.message}</p>}</div><div><Label htmlFor="toCurrency">To</Label><Controller control={conversionForm.control} name="toCurrency" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length === 0}><SelectTrigger id="toCurrency" className="mt-1"><SelectValue placeholder={isLoadingCustomCurrencies ? "Loading..." : "Select"} /></SelectTrigger><SelectContent>{allManagedCurrencyCodes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} />{conversionForm.formState.errors.toCurrency && <p className="text-xs text-destructive mt-1">{conversionForm.formState.errors.toCurrency.message}</p>}</div></div><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto" disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length < 2}>Convert</Button></form>{conversionError && (<Alert variant="destructive" className="mt-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{conversionError}</AlertDescription></Alert>)}{conversionResult && (<div className="mt-6 p-4 bg-secondary/30 dark:bg-secondary/10 border border-secondary rounded-md space-y-2"><p className="text-lg font-semibold text-primary dark:text-blue-400 text-center">Conversion Result</p><div className="text-sm text-foreground/90 dark:text-foreground/80 space-y-1"><p><strong>Original:</strong> {formatCurrency(conversionResult.originalAmount, conversionResult.fromCurrency)}</p><p><strong>Target:</strong> {conversionResult.toCurrency}</p><p className="font-mono">Base Rate (1 {conversionResult.fromCurrency}): {conversionResult.baseRate.toFixed(6)} {conversionResult.toCurrency}</p>{conversionResult.markupType !== 'none' && conversionResult.fromCurrency !== conversionResult.toCurrency && (<><p className="font-semibold text-accent dark:text-orange-400 pt-1 border-t border-border/50 mt-1">Markup Details ({conversionResult.markupType}):</p><ul className="list-disc list-inside pl-4 text-xs"><li>Applied Markup: {conversionResult.markupApplied.toFixed(2)}%</li><li className="font-mono">Markup Value: +{formatCurrency( (conversionResult.finalRate - conversionResult.baseRate) * conversionResult.originalAmount, conversionResult.toCurrency)}</li><li className="font-mono">Effective Rate (1 {conversionResult.fromCurrency}): {conversionResult.finalRate.toFixed(6)} {conversionResult.toCurrency}</li></ul></>)}<p className="text-xl font-bold text-accent-foreground dark:text-accent-foreground mt-2 pt-2 border-t border-border">Final Amount: {formatCurrency(conversionResult.convertedAmount, conversionResult.toCurrency)}</p></div></div>)}</CardContent></Card>
        </div>
      </div>
      
      <Card className="shadow-lg mt-8"><CardHeader><CardTitle className="text-xl flex items-center"><Tag className="mr-2 h-5 w-5"/>Manage Specific Currency Markups</CardTitle><CardDescription>Define markup percentages for specific currency pairs. These override the global markup.</CardDescription></CardHeader><CardContent>{isLoading ? (<div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading specific markups...</p></div>) : (<div className="space-y-4"><div className="flex justify-end"><Button onClick={openNewSpecificMarkupDialog} size="sm" disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length < 2}><PlusCircle className="mr-2 h-4 w-4" /> Add Specific Markup</Button></div>{specificMarkupRates.length === 0 ? (<p className="text-muted-foreground text-center py-4">No specific markups defined.</p>) : (<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead onClick={() => requestSpecificMarkupSort('fromCurrency')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">From {getSortIcon('fromCurrency', specificMarkupSortConfig)}</div></TableHead><TableHead onClick={() => requestSpecificMarkupSort('toCurrency')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">To {getSortIcon('toCurrency', specificMarkupSortConfig)}</div></TableHead><TableHead onClick={() => requestSpecificMarkupSort('markupPercentage')} className="text-right cursor-pointer hover:bg-muted/50"><div className="flex items-center justify-end">Markup % {getSortIcon('markupPercentage', specificMarkupSortConfig)}</div></TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader><TableBody>{sortedSpecificMarkups.map((sm) => (<TableRow key={sm.id}><TableCell>{sm.fromCurrency}</TableCell><TableCell>{sm.toCurrency}</TableCell><TableCell className="text-right font-mono">{sm.markupPercentage.toFixed(2)}%</TableCell><TableCell className="text-center"><Button variant="ghost" size="icon" onClick={() => openEditSpecificMarkupDialog(sm)} className="mr-2 text-primary hover:bg-primary/10 h-8 w-8"><Edit className="h-4 w-4" /></Button><Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8"><Trash2 className="h-4 w-4" /></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Confirm Deletion</DialogTitle><AlertDescription>Delete specific markup from {sm.fromCurrency} to {sm.toCurrency}?</AlertDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button variant="destructive" onClick={() => deleteSpecificMarkup(sm.id)}>Delete</Button></DialogFooter></DialogContent></Dialog></TableCell></TableRow>))}</TableBody></Table></div>)}</div>)}</CardContent></Card>

      <Card className="shadow-lg mt-8">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <CardTitle className="text-xl">Manage Base Exchange Rates</CardTitle>
                <CardDescription>
                    Define base rates. "Effective Final Rate" includes calculation logic &amp; markup (global or specific).
                    <br/>Last API fetch: <span className="font-semibold text-primary">{lastFetchedDate}</span>
                </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={() => refreshRates()} size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10 w-full sm:w-auto"><RefreshCw className="mr-2 h-4 w-4" /> Refresh from API</Button>
                <Button onClick={openNewRateDialog} size="sm" disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length < 2} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Add New Rate</Button>
            </div>
        </CardHeader>
        <CardContent>
            {isLoadingExchangeRates ? (
                <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading rates...</p></div>
            ) : exchangeRateError ? (
                <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{exchangeRateError}</AlertDescription></Alert>
            ) : sortedExchangeRates.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No exchange rates defined. Click "Add New Rate" or "Refresh".</p>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader><TableRow>
                            <TableHead onClick={() => requestRateTableSort('fromCurrency')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">From {getSortIcon('fromCurrency', rateTableSortConfig)}</div></TableHead>
                            <TableHead onClick={() => requestRateTableSort('toCurrency')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">To {getSortIcon('toCurrency', rateTableSortConfig)}</div></TableHead>
                            <TableHead onClick={() => requestRateTableSort('rate')} className="text-right cursor-pointer hover:bg-muted/50"><div className="flex items-center justify-end">Defined Base Rate {getSortIcon('rate', rateTableSortConfig)}</div></TableHead>
                            <TableHead onClick={() => requestRateTableSort('markupPercentageApplied')} className="text-right cursor-pointer hover:bg-muted/50"><div className="flex items-center justify-end">Markup % {getSortIcon('markupPercentageApplied', rateTableSortConfig)}</div></TableHead>
                            <TableHead onClick={() => requestRateTableSort('markupAdded')} className="text-right cursor-pointer hover:bg-muted/50"><div className="flex items-center justify-end">Markup Added {getSortIcon('markupAdded', rateTableSortConfig)}</div></TableHead>
                            <TableHead onClick={() => requestRateTableSort('effectiveFinalRate')} className="text-right cursor-pointer hover:bg-muted/50"><div className="flex items-center justify-end">Effective Final Rate {getSortIcon('effectiveFinalRate', rateTableSortConfig)}</div></TableHead>
                            <TableHead onClick={() => requestRateTableSort('source')} className="cursor-pointer hover:bg-muted/50 text-center"><div className="flex items-center justify-center">Source {getSortIcon('source', rateTableSortConfig)}</div></TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                            {sortedExchangeRates.map((rate) => {
                                const rateDetails = getRate(rate.fromCurrency, rate.toCurrency);
                                let effectiveFinalRateDisplay = "N/A";
                                let markupValueAddedDisplay = "N/A";
                                let markupPercentageDisplay = "N/A";
                                let markupTypeDisplay: string | null = null;

                                if (rateDetails) {
                                    effectiveFinalRateDisplay = rateDetails.finalRate.toFixed(6);
                                    markupValueAddedDisplay = (rateDetails.finalRate - rateDetails.baseRate).toFixed(6);
                                    if (Math.abs(parseFloat(markupValueAddedDisplay)) < 0.0000001) markupValueAddedDisplay = "0.000000";
                                    markupPercentageDisplay = rateDetails.markupApplied.toFixed(2) + "%";
                                    if (rateDetails.markupType !== 'none' && rateDetails.fromCurrency !== rateDetails.toCurrency) {
                                      markupTypeDisplay = rateDetails.markupType === 'specific' ? 'S' : 'G';
                                    }
                                } else {
                                    effectiveFinalRateDisplay = rate.rate.toFixed(6);
                                    markupValueAddedDisplay = "Calc Error";
                                    markupPercentageDisplay = "Error";
                                }

                                let displaySourceText: string;
                                let displaySourceVariant: 'secondary' | 'outline';
                                let displaySourceClassName: string;

                                if (lastApiFetchTimestamp) { // If API is active, all effective rates are API-driven
                                    displaySourceText = 'API';
                                    displaySourceVariant = 'secondary';
                                    displaySourceClassName = 'bg-blue-100 text-blue-700 border-blue-300';
                                } else { // API not active, show actual source
                                    displaySourceText = rate.source?.toUpperCase() || 'MANUAL';
                                    displaySourceVariant = rate.source === 'api' ? 'secondary' : 'outline';
                                    displaySourceClassName = rate.source === 'api' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-green-50 text-green-700 border-green-300';
                                }
                                
                                return (
                                    <TableRow key={rate.id}>
                                        <TableCell>{rate.fromCurrency}</TableCell>
                                        <TableCell>{rate.toCurrency}</TableCell>
                                        <TableCell className="text-right font-mono">{rate.rate.toFixed(6)}</TableCell>
                                        <TableCell className="text-right font-mono">
                                          <div className="flex items-center justify-end">
                                            {markupPercentageDisplay}
                                            {markupTypeDisplay && (
                                                <TooltipProvider delayDuration={100}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge variant="outline" className={`ml-1 px-1 py-0 text-xs rounded-sm ${markupTypeDisplay === 'S' ? 'border-purple-500 text-purple-600' : 'border-gray-400 text-gray-500'}`}>{markupTypeDisplay}</Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="text-xs p-1.5">
                                                            <p>{markupTypeDisplay === 'S' ? 'Specific Markup Applied' : 'Global Markup Applied'}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{markupValueAddedDisplay}</TableCell>
                                        <TableCell className="text-right font-mono">{effectiveFinalRateDisplay}</TableCell>
                                        <TableCell className="text-center">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge variant={displaySourceVariant} className={displaySourceClassName}>
                                                            {displaySourceText}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Defined Rate Source: {rate.source?.toUpperCase() || 'MANUAL'}</p>
                                                        <p>Last Updated: {rate.updatedAt ? format(parseISO(rate.updatedAt), "dd MMM yy HH:mm") : "N/A"}</p>
                                                        {lastApiFetchTimestamp && <p>System rates influenced by API data from: {format(parseISO(lastApiFetchTimestamp), "dd MMM yy HH:mm")}</p>}
                                                        {!lastApiFetchTimestamp && <p>System using local/default rates (API not recently fetched or unavailable).</p>}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => openEditRateDialog(rate)} className="mr-2 text-primary hover:bg-primary/10 h-8 w-8"><Edit className="h-4 w-4" /></Button>
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

      <Dialog open={isRateFormOpen} onOpenChange={(isOpen) => { setIsRateFormOpen(isOpen); if (!isOpen) setEditingRate(null); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingRate ? 'Edit' : 'Add'} Base Exchange Rate</DialogTitle><AlertDescription>This is a direct base rate. System may use {REFERENCE_CURRENCY} intermediate for conversions. API-fetched {REFERENCE_CURRENCY} rates may override manual {REFERENCE_CURRENCY} rates.</AlertDescription></DialogHeader><form onSubmit={rateForm.handleSubmit(handleRateFormSubmit)} className="space-y-4 py-4"><div><Label htmlFor="rateFromCurrency">From Currency</Label><Controller control={rateForm.control} name="fromCurrency" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length === 0}><SelectTrigger id="rateFromCurrency" className="mt-1"><SelectValue placeholder={isLoadingCustomCurrencies ? "Loading..." : "Select"} /></SelectTrigger><SelectContent>{allManagedCurrencyCodes.map(c => <SelectItem key={`from-${c}`} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} />{rateForm.formState.errors.fromCurrency && <p className="text-xs text-destructive mt-1">{rateForm.formState.errors.fromCurrency.message}</p>}</div><div><Label htmlFor="rateToCurrency">To Currency</Label><Controller control={rateForm.control} name="toCurrency" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length === 0}><SelectTrigger id="rateToCurrency" className="mt-1"><SelectValue placeholder={isLoadingCustomCurrencies ? "Loading..." : "Select"} /></SelectTrigger><SelectContent>{allManagedCurrencyCodes.map(c => <SelectItem key={`to-${c}`} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} />{rateForm.formState.errors.toCurrency && <p className="text-xs text-destructive mt-1">{rateForm.formState.errors.toCurrency.message}</p>}</div><div><Label htmlFor="rateValue">Rate (1 Unit of "From" = X Units of "To")</Label><Input id="rateValue" type="number" step="0.000001" {...rateForm.register("rate")} className="mt-1" />{rateForm.formState.errors.rate && <p className="text-xs text-destructive mt-1">{rateForm.formState.errors.rate.message}</p>}</div><div className="flex justify-end space-x-2 pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length < 2}>{editingRate ? 'Update' : 'Add'} Rate</Button></div></form></DialogContent></Dialog>
      <Dialog open={isSpecificMarkupFormOpen} onOpenChange={(isOpen) => { setIsSpecificMarkupFormOpen(isOpen); if(!isOpen) setEditingSpecificMarkup(null);}}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingSpecificMarkup ? 'Edit' : 'Add'} Specific Currency Markup</DialogTitle><AlertDescription>Define a markup percentage for a specific currency pair. This overrides the global markup.</AlertDescription></DialogHeader><form onSubmit={specificMarkupFormHook.handleSubmit(handleSpecificMarkupFormSubmit)} className="space-y-4 py-4"><div><Label htmlFor="smFromCurrency">From Currency</Label><Controller control={specificMarkupFormHook.control} name="fromCurrency" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length === 0}><SelectTrigger id="smFromCurrency" className="mt-1"><SelectValue placeholder={isLoadingCustomCurrencies ? "Loading..." : "Select"} /></SelectTrigger><SelectContent>{allManagedCurrencyCodes.map(c => <SelectItem key={`smfrom-${c}`} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} />{specificMarkupFormHook.formState.errors.fromCurrency && <p className="text-xs text-destructive mt-1">{specificMarkupFormHook.formState.errors.fromCurrency.message}</p>}</div><div><Label htmlFor="smToCurrency">To Currency</Label><Controller control={specificMarkupFormHook.control} name="toCurrency" render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length === 0}><SelectTrigger id="smToCurrency" className="mt-1"><SelectValue placeholder={isLoadingCustomCurrencies ? "Loading..." : "Select"} /></SelectTrigger><SelectContent>{allManagedCurrencyCodes.map(c => <SelectItem key={`smto-${c}`} value={c}>{c}</SelectItem>)}</SelectContent></Select>)} />{specificMarkupFormHook.formState.errors.toCurrency && <p className="text-xs text-destructive mt-1">{specificMarkupFormHook.formState.errors.toCurrency.message}</p>}</div><div><Label htmlFor="smMarkupPercentage">Markup Percentage (%)</Label><Input id="smMarkupPercentage" type="number" step="0.01" {...specificMarkupFormHook.register("markupPercentage")} className="mt-1" placeholder="e.g., 1.5 for 1.5%"/>{specificMarkupFormHook.formState.errors.markupPercentage && <p className="text-xs text-destructive mt-1">{specificMarkupFormHook.formState.errors.markupPercentage.message}</p>}</div><div className="flex justify-end space-x-2 pt-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoadingCustomCurrencies || allManagedCurrencyCodes.length < 2}>{editingSpecificMarkup ? 'Update' : 'Add'} Markup</Button></div></form></DialogContent></Dialog>
    </div></main>
  );
}

    
