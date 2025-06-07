
"use client";

import * as React from 'react';
import Link from 'next/link'; // Import Link
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, Home } from 'lucide-react'; // Import Home icon
import type { ServicePriceItem, CurrencyCode } from '@/types/itinerary';
import { CURRENCIES } from '@/types/itinerary'; // Import CURRENCIES
import { ServicePriceForm } from './service-price-form';
import { ServicePriceTable } from './service-price-table';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

export function PricingManager() {
  const [servicePrices, setServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<ServicePriceItem | undefined>(undefined);
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const storedPrices = localStorage.getItem(SERVICE_PRICES_STORAGE_KEY);
      if (storedPrices) {
        const parsedData = JSON.parse(storedPrices);
        if (Array.isArray(parsedData)) {
            setServicePrices(parsedData.map(p => {
              const category = p.category || "misc"; // Default category
              const seasonalRatesValid = category === 'hotel' && Array.isArray(p.seasonalRates)
                ? p.seasonalRates.map((sr: any) => ({
                    id: sr.id || generateGUID(),
                    startDate: sr.startDate || "",
                    endDate: sr.endDate || "",
                    roomRate: typeof sr.roomRate === 'number' ? sr.roomRate : 0,
                    extraBedRate: typeof sr.extraBedRate === 'number' ? sr.extraBedRate : undefined,
                  }))
                : (category === 'hotel' ? [] : undefined);

              return {
                id: p.id || generateGUID(),
                name: p.name || "Unnamed Service",
                province: p.province || undefined, // Handle new province field
                category: category,
                subCategory: p.subCategory,
                price1: typeof p.price1 === 'number' ? p.price1 : 0,
                price2: typeof p.price2 === 'number' ? p.price2 : undefined,
                currency: CURRENCIES.includes(p.currency as CurrencyCode) ? p.currency : "USD" as CurrencyCode,
                unitDescription: p.unitDescription || "N/A",
                notes: p.notes,
                seasonalRates: seasonalRatesValid,
              } as ServicePriceItem;
            }));
        } else {
            console.warn("Stored service prices are not an array. Clearing.");
            localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY);
            setServicePrices([]);
        }
      }
    } catch (error) {
      console.error("Failed to load or parse service prices from localStorage:", error);
      toast({ title: "Error", description: "Could not load service prices. Data might be corrupted. Resetting prices.", variant: "destructive" });
      localStorage.removeItem(SERVICE_PRICES_STORAGE_KEY);
      setServicePrices([]);
    }
  }, [toast]);

  const savePricesToLocalStorage = (prices: ServicePriceItem[]) => {
    try {
      localStorage.setItem(SERVICE_PRICES_STORAGE_KEY, JSON.stringify(prices));
    } catch (error) {
      console.error("Failed to save service prices to localStorage:", error);
      toast({ title: "Error", description: "Could not save service prices.", variant: "destructive" });
    }
  };

  const handleFormSubmit = (data: Omit<ServicePriceItem, 'id'>) => {
    let updatedPrices;
    if (editingService) {
      updatedPrices = servicePrices.map(sp => sp.id === editingService.id ? { ...editingService, ...data } : sp);
      toast({ title: "Success", description: `Service price "${data.name}" updated.` });
    } else {
      const newServicePrice: ServicePriceItem = { ...data, id: generateGUID() };
      updatedPrices = [...servicePrices, newServicePrice];
      toast({ title: "Success", description: `Service price "${data.name}" added.` });
    }
    setServicePrices(updatedPrices);
    savePricesToLocalStorage(updatedPrices);
    setIsFormOpen(false);
    setEditingService(undefined);
  };

  const handleEdit = (service: ServicePriceItem) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleDelete = (serviceId: string) => {
    const serviceToDelete = servicePrices.find(sp => sp.id === serviceId);
    const updatedPrices = servicePrices.filter(sp => sp.id !== serviceId);
    setServicePrices(updatedPrices);
    savePricesToLocalStorage(updatedPrices);
    toast({ title: "Success", description: `Service price "${serviceToDelete?.name || 'Item'}" deleted.` });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Home className="h-5 w-5" />
              <span className="sr-only">Go to Home</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary">Manage Service Prices</h1>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingService(undefined);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Service Price
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl"> 
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit' : 'Add'} Service Price</DialogTitle>
            </DialogHeader>
            <ServicePriceForm
              key={editingService?.id || 'new'}
              initialData={editingService}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingService(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {servicePrices.length > 0 ? (
        <ServicePriceTable
          servicePrices={servicePrices}
          onEdit={handleEdit}
          onDeleteConfirmation={(serviceId) => ( 
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the service price.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(serviceId)} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        />
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <p className="text-muted-foreground text-lg">No service prices defined yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Click "Add New Service Price" to get started.</p>
        </div>
      )}
    </div>
  );
}
