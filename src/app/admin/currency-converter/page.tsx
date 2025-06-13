
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LayoutDashboard, Repeat, PlusCircle, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import type { CurrencyCode, ExchangeRate } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

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


export default function CurrencyConverterPage() {
  const { exchangeRates, isLoading, error, addRate, updateRate, deleteRate, getRate, refreshRates } = useExchangeRates();
  const [convertedAmount, setConvertedAmount] = React.useState<number | null>(null);
  const [conversionError, setConversionError] = React.useState<string | null>(null);
  
  const [isRateFormOpen, setIsRateFormOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<ExchangeRate | null>(null);

  const conversionForm = useForm<ConversionFormValues>({
    resolver: zodResolver(conversionSchema),
    defaultValues: { amount: 100, fromCurrency: "USD", toCurrency: "THB" },
  });

  const rateForm = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: { fromCurrency: "USD", toCurrency: "EUR", rate: 0.90 },
  });

  React.useEffect(() => {
    if (editingRate) {
      rateForm.reset({
        fromCurrency: editingRate.fromCurrency,
        toCurrency: editingRate.toCurrency,
        rate: editingRate.rate,
      });
    } else {
      rateForm.reset({ fromCurrency: "USD", toCurrency: "EUR", rate: 0.90 });
    }
  }, [editingRate, rateForm]);

  const handleConversionSubmit = (data: ConversionFormValues) => {
    setConversionError(null);
    setConvertedAmount(null);
    const rate = getRate(data.fromCurrency, data.toCurrency);
    if (rate === null) {
      setConversionError(`Exchange rate from ${data.fromCurrency} to ${data.toCurrency} is not defined.`);
      return;
    }
    setConvertedAmount(data.amount * rate);
  };

  const handleRateFormSubmit = (data: RateFormValues) => {
    if (editingRate) {
      updateRate({ ...editingRate, ...data });
    } else {
      addRate(data);
    }
    setIsRateFormOpen(false);
    setEditingRate(null);
    rateForm.reset({ fromCurrency: "USD", toCurrency: "EUR", rate: 0.90 });
  };

  const openEditRateDialog = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setIsRateFormOpen(true);
  };
  
  const openNewRateDialog = () => {
    setEditingRate(null);
    rateForm.reset({ fromCurrency: "USD", toCurrency: "EUR", rate: 0.90 });
    setIsRateFormOpen(true);
  };

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

        {/* Conversion Section */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Convert Currency</CardTitle>
            <CardDescription>Enter amount and select currencies to convert.</CardDescription>
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
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">Convert</Button>
            </form>
            {conversionError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Conversion Error</AlertTitle>
                <AlertDescription>{conversionError}</AlertDescription>
              </Alert>
            )}
            {convertedAmount !== null && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md text-center">
                <p className="text-sm text-green-700">Converted Amount:</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatCurrency(convertedAmount, conversionForm.getValues("toCurrency"))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exchange Rate Management Section */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-xl">Manage Exchange Rates</CardTitle>
              <CardDescription>Define and update exchange rates used for conversion.</CardDescription>
            </div>
            <Button onClick={openNewRateDialog} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Rate
            </Button>
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
              <p className="text-muted-foreground text-center py-4">No exchange rates defined yet. Click "Add New Rate" to start.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead className="text-right">Rate (1 From = X To)</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exchangeRates.map((rate) => (
                      <TableRow key={rate.id}>
                        <TableCell>{rate.fromCurrency}</TableCell>
                        <TableCell>{rate.toCurrency}</TableCell>
                        <TableCell className="text-right font-mono">{rate.rate.toFixed(4)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="icon" onClick={() => openEditRateDialog(rate)} className="mr-2 text-primary hover:bg-primary/10 h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteRate(rate.id)} className="text-destructive hover:bg-destructive/10 h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={refreshRates} className="mt-4">Refresh Rate List</Button>
          </CardContent>
        </Card>

        {/* Add/Edit Rate Dialog */}
        <Dialog open={isRateFormOpen} onOpenChange={(isOpen) => {
            setIsRateFormOpen(isOpen);
            if (!isOpen) setEditingRate(null);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRate ? 'Edit' : 'Add'} Exchange Rate</DialogTitle>
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
                <Label htmlFor="rateValue">Rate (1 From = X To)</Label>
                <Input id="rateValue" type="number" step="0.0001" {...rateForm.register("rate")} className="mt-1" />
                {rateForm.formState.errors.rate && <p className="text-xs text-destructive mt-1">{rateForm.formState.errors.rate.message}</p>}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">{editingRate ? 'Update' : 'Add'} Rate</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}

