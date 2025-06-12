
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ServicePriceFormRouter } from '@/components/admin/service-pricing/ServicePriceFormRouter'; // Updated import
import type { ServicePriceItem } from '@/types/itinerary';
import { useToast } from '@/hooks/use-toast';
import { Home, ListPlus, Edit, ArrowLeft } from 'lucide-react';
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
    if (!initialData?.id) { // Ensure initialData and its id exist
      toast({ title: "Error", description: "Cannot update service: ID missing.", variant: "destructive" });
      return;
    }
    try {
      const storedPrices = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      const allPrices: ServicePriceItem[] = storedPrices ? JSON.parse(storedPrices) : [];
      
      const updatedPrices = allPrices.map(sp => 
        sp.id === initialData.id ? { ...initialData, ...data, id: initialData.id } : sp // Preserve ID and spread new data
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
    return <div className="flex justify-center items-center min-h-screen">Loading service details...</div>;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Error Loading Service</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error}</p>
            <Link href="/admin/pricing" passHref className="mt-4 block text-center">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pricing List
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }
  
  if (!initialData) {
     return <div className="flex justify-center items-center min-h-screen">Service not found.</div>;
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <Card className="w-full max-w-4xl mx-auto shadow-xl"> {/* Changed max-w-6xl to max-w-4xl for consistency */}
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <Edit className="mr-3 h-7 w-7" /> Edit Service Price
            </CardTitle>
            <Link href="/admin/pricing" passHref>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pricing List
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ServicePriceFormRouter // Using the new router form
            key={initialData.id || 'edit-service'} // Ensure key is stable or changes appropriately
            initialData={initialData}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </main>
  );
}
