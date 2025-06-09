
"use client";

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ServicePriceForm } from '@/components/admin/service-price-form';
import type { ServicePriceItem } from '@/types/itinerary';
import { generateGUID } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Home, ListPlus, ArrowLeft } from 'lucide-react';
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
    } catch (error) {
      console.error("Error reading prefill data:", error);
      toast({ title: "Error", description: "Could not load prefill data.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  const handleFormSubmit = (data: Omit<ServicePriceItem, 'id'>) => {
    try {
      const storedPrices = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      const allPrices: ServicePriceItem[] = storedPrices ? JSON.parse(storedPrices) : [];
      
      const newServicePrice: ServicePriceItem = { ...data, id: generateGUID() };
      const updatedPrices = [...allPrices, newServicePrice];
      
      localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(updatedPrices));
      toast({ title: "Success", description: `Service price "${data.name}" added.` });
      router.push('/admin/pricing');
    } catch (error) {
      console.error("Error saving new service price:", error);
      toast({ title: "Error", description: "Could not save new service price.", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    router.push('/admin/pricing');
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <ListPlus className="mr-3 h-7 w-7" /> Add New Service Price
            </CardTitle>
            <Link href="/admin/pricing" passHref>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pricing List
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ServicePriceForm
            key={JSON.stringify(initialData) || 'new-service'} // Re-mount if initialData changes
            initialData={initialData}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </main>
  );
}
