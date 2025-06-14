/**
 * @fileoverview This page component allows administrators to add a new service price item.
 * It utilizes the `ServicePriceFormRouter` to render the appropriate form fields based
 * on the selected service category. It can optionally prefill form data from localStorage
 * if an AI parsing process (like contract import) has placed temporary data there.
 * Submitted data is saved to localStorage.
 *
 * @bangla এই পৃষ্ঠা কম্পোনেন্টটি প্রশাসকদের একটি নতুন পরিষেবা মূল্য আইটেম যোগ করার অনুমতি দেয়।
 * এটি নির্বাচিত পরিষেবা বিভাগের উপর ভিত্তি করে উপযুক্ত ফর্ম ক্ষেত্রগুলি রেন্ডার করার জন্য
 * `ServicePriceFormRouter` ব্যবহার করে। যদি কোনও AI পার্সিং প্রক্রিয়া (যেমন চুক্তি আমদানি)
 * অস্থায়ী ডেটা localStorage-এ রেখে থাকে, তবে এটি ঐচ্ছিকভাবে ফর্ম ডেটা প্রিফিল করতে পারে।
 * জমা দেওয়া ডেটা localStorage-এ সংরক্ষিত হয়।
 */
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ServicePriceFormRouter } from '@/components/admin/service-pricing/ServicePriceFormRouter';
import type { ServicePriceItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, ListPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';
const TEMP_PREFILL_DATA_KEY = 'tempServicePricePrefillData';

export default function NewServicePricePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [initialData, setInitialData] = React.useState<Partial<ServicePriceItem> | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const prefillDataString = localStorage.getItem(TEMP_PREFILL_DATA_KEY);
      if (prefillDataString) {
        const parsedData = JSON.parse(prefillDataString);
        setInitialData(parsedData);
        localStorage.removeItem(TEMP_PREFILL_DATA_KEY); 
      }
    } catch (error: any) {
      console.error("Error reading prefill data from localStorage:", error);
      toast({ title: "Error", description: `Could not load prefill data: ${error.message}`, variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  const handleFormSubmit = (data: Omit<ServicePriceItem, 'id'>) => {
    console.log("NewServicePricePage: handleFormSubmit called with data:", data);
    try {
      const storedPrices = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      const allPrices: ServicePriceItem[] = storedPrices ? JSON.parse(storedPrices) : [];
      
      const newServicePrice: ServicePriceItem = { ...data, id: generateGUID() };
      const updatedPrices = [...allPrices, newServicePrice];
      
      localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(updatedPrices));
      
      toast({ title: "Success", description: `Service price "${data.name}" added.` });
      router.push('/admin/pricing');
    } catch (error: any) {
      console.error("Error saving new service price:", error);
      toast({ title: "Error", description: `Could not save new service price: ${error.message}`, variant: "destructive" });
    }
  };
  
  const handleCancel = () => {
    router.push('/admin/pricing');
  };
  
  if (isLoading) {
    return (
        <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4"/>
            <p className="text-muted-foreground">Loading form...</p>
        </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
             <Link href="/" passHref>
                <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                  <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary flex items-center">
              <ListPlus className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7" /> Add New Service Price
            </CardTitle>
            <Link href="/admin/pricing" passHref>
              <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to List
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <ServicePriceFormRouter
            key={JSON.stringify(initialData) || 'new-service'} 
            initialData={initialData}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </main>
  );
}
