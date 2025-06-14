/**
 * @fileoverview This page component allows administrators to edit an existing service price item.
 * It fetches the service price details based on the ID from the URL, pre-fills the
 * `ServicePriceFormRouter` with this data, and handles the submission of updated information
 * back to localStorage.
 *
 * @bangla এই পৃষ্ঠা কম্পোনেন্টটি প্রশাসকদের একটি বিদ্যমান পরিষেবা মূল্য আইটেম সম্পাদনা করার
 * অনুমতি দেয়। এটি URL থেকে আইডির উপর ভিত্তি করে পরিষেবা মূল্যের বিবরণ আনে, এই ডেটা সহ
 * `ServicePriceFormRouter` প্রি-ফিল করে, এবং আপডেট করা তথ্য localStorage-এ জমা দেওয়ার
 * প্রক্রিয়া পরিচালনা করে।
 */
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ServicePriceFormRouter } from '@/components/admin/service-pricing/ServicePriceFormRouter';
import type { ServicePriceItem } from '@/types/itinerary';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, Edit, ArrowLeft, Loader2 } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

export default function EditServicePricePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { id } = params;

  const [initialData, setInitialData] = React.useState<Partial<ServicePriceItem> | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (id) {
      try {
        const storedPrices = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
        if (storedPrices) {
          const allPrices: ServicePriceItem[] = JSON.parse(storedPrices);
          const serviceToEdit = allPrices.find(sp => sp.id === id);
          if (serviceToEdit) {
            setInitialData(serviceToEdit);
          } else {
            setError(`Service price with ID "${id}" not found.`);
            toast({ title: "Error", description: `Service price not found.`, variant: "destructive" });
          }
        } else {
          setError("No service prices found in storage.");
          toast({ title: "Error", description: "Service price data not available.", variant: "destructive" });
        }
      } catch (e) {
        console.error("Error loading service price for editing:", e);
        setError("Failed to load service price data.");
        toast({ title: "Error", description: "Could not load service price for editing.", variant: "destructive" });
      }
    }
    setIsLoading(false);
  }, [id, toast]);

  const handleFormSubmit = (data: Omit<ServicePriceItem, 'id'>) => {
    if (!initialData?.id) { 
      toast({ title: "Error", description: "Cannot update service: ID missing.", variant: "destructive" });
      return;
    }
    try {
      const storedPrices = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      const allPrices: ServicePriceItem[] = storedPrices ? JSON.parse(storedPrices) : [];
      
      const updatedPrices = allPrices.map(sp => 
        sp.id === initialData.id ? { ...initialData, ...data, id: initialData.id } : sp 
      );
      
      localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(updatedPrices));
      toast({ title: "Success", description: `Service price "${data.name}" updated.` });
      router.push('/admin/pricing');
    } catch (e) {
      console.error("Error updating service price:", e);
      toast({ title: "Error", description: "Could not update service price.", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    router.push('/admin/pricing');
  };

  if (isLoading) {
    return (
        <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4"/>
            <p className="text-muted-foreground">Loading service details...</p>
        </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl text-destructive">Error Loading Service</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="text-center text-muted-foreground text-sm">{error}</p>
            <Link href="/admin/pricing" passHref className="mt-4 block text-center">
              <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Pricing List
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  if (!initialData) {
     return (
        <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
            <p className="text-muted-foreground">Service not found.</p>
            <Link href="/admin/pricing" passHref className="mt-4">
              <Button variant="outline" size="sm">Back to Pricing List</Button>
            </Link>
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
              <Edit className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7" /> Edit Service Price
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
            key={initialData.id || 'edit-service'} 
            initialData={initialData}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </main>
  );
}
