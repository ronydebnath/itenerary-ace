
/**
 * @fileoverview This page component allows administrators to manage currency codes.
 * Users can add new custom currency codes and view both system-default and custom
 * currencies. Custom currencies can be deleted.
 *
 * @bangla এই পৃষ্ঠা কম্পোনেন্টটি প্রশাসকদের কারেন্সি কোড পরিচালনা করার অনুমতি দেয়।
 * ব্যবহারকারীরা নতুন কাস্টম কারেন্সি কোড যোগ করতে এবং সিস্টেম-ডিফল্ট ও কাস্টম উভয়
 * কারেন্সি দেখতে পারেন। কাস্টম কারেন্সি মুছে ফেলা যাবে।
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LayoutDashboard, PlusCircle, Trash2, AlertCircle, Loader2, Settings, BadgeDollarSign, Edit } from 'lucide-react';
import { useCustomCurrencies } from '@/hooks/useCustomCurrencies';
import type { CurrencyCode, ManagedCurrency } from '@/types/itinerary';
import { Badge } from '@/components/ui/badge';

const currencyCodeSchema = z.object({
  code: z.string()
    .min(3, "Currency code must be 3 letters.")
    .max(3, "Currency code must be 3 letters.")
    .regex(/^[A-Z]+$/, "Currency code must be uppercase letters."),
});
type CurrencyCodeFormValues = z.infer<typeof currencyCodeSchema>;

export default function ManageCurrenciesPage() {
  const {
    isLoading,
    getAllManagedCurrencies,
    addCustomCurrency,
    deleteCustomCurrency,
    refreshCustomCurrencies,
  } = useCustomCurrencies();

  const [allCurrencies, setAllCurrencies] = React.useState<ManagedCurrency[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading) {
      setAllCurrencies(getAllManagedCurrencies());
    }
  }, [isLoading, getAllManagedCurrencies]);

  const form = useForm<CurrencyCodeFormValues>({
    resolver: zodResolver(currencyCodeSchema),
    defaultValues: { code: "" },
  });

  const handleAddCurrency = async (data: CurrencyCodeFormValues) => {
    setIsSubmitting(true);
    const success = await addCustomCurrency(data.code as CurrencyCode);
    if (success) {
      form.reset({ code: "" }); // Clear form on success
      refreshCustomCurrencies(); // Refresh the list
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (code: CurrencyCode) => {
    await deleteCustomCurrency(code);
    refreshCustomCurrencies(); // Refresh the list
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
              <BadgeDollarSign className="mr-3 h-7 w-7 md:h-8 md:w-8" /> Manage Currencies
            </h1>
          </div>
        </div>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center"><PlusCircle className="mr-2 h-5 w-5 text-accent"/>Add New Custom Currency</CardTitle>
            <CardDescription>
              Add a new 3-letter uppercase currency code (e.g., CAD, NZD).
              After adding, you must define its exchange rates on the Currency Converter page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleAddCurrency)} className="flex items-end gap-3">
              <div className="flex-grow">
                <Label htmlFor="currencyCode">New Currency Code</Label>
                <Input
                  id="currencyCode"
                  maxLength={3}
                  {...form.register("code")}
                  className="mt-1 uppercase"
                  placeholder="e.g., CAD"
                />
                {form.formState.errors.code && <p className="text-xs text-destructive mt-1">{form.formState.errors.code.message}</p>}
              </div>
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm" disabled={isSubmitting || isLoading}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Code
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-xl">All Available Currencies</CardTitle>
              <CardDescription>System default currencies cannot be deleted from this interface.</CardDescription>
            </div>
            <Link href="/admin/currency-converter" passHref>
                <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" /> Manage Rates
                </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading currencies...</p>
              </div>
            ) : allCurrencies.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No currencies defined. Add a custom currency or check system defaults.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCurrencies.map((currency) => (
                      <TableRow key={currency.code}>
                        <TableCell className="font-mono font-semibold">{currency.code}</TableCell>
                        <TableCell>
                          {currency.isCustom ? (
                            <Badge variant="outline" className="border-blue-500 text-blue-600">Custom</Badge>
                          ) : (
                            <Badge variant="secondary">System</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {currency.isCustom ? (
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
                                    Are you sure you want to delete the custom currency "{currency.code}"? This action cannot be undone.
                                  </AlertDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                  <Button variant="destructive" onClick={() => handleDelete(currency.code)}>Delete</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
