
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, Home, MapPinned, Loader2, LayoutDashboard, ListPlus } from 'lucide-react'; 
import type { ServicePriceItem } from '@/types/itinerary';
import { ServicePriceForm } from './service-price-form';
import { ServicePriceTable } from './service-price-table';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useServicePrices } from '@/hooks/useServicePrices';

const SERVICE_PRICES_STORAGE_KEY = 'itineraryAceServicePrices';

export function PricingManager() {
  const { allServicePrices, isLoading: isLoadingServices } = useServicePrices();
  const [currentServicePrices, setCurrentServicePrices] = React.useState<ServicePriceItem[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<ServicePriceItem | undefined>(undefined);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!isLoadingServices) {
      setCurrentServicePrices(allServicePrices);
    }
  }, [allServicePrices, isLoadingServices]);

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
      updatedPrices = currentServicePrices.map(sp => sp.id === editingService.id ? { ...editingService, ...data } : sp);
      toast({ title: "Success", description: `Service price "${data.name}" updated.` });
    } else {
      const newServicePrice: ServicePriceItem = { ...data, id: generateGUID() };
      updatedPrices = [...currentServicePrices, newServicePrice];
      toast({ title: "Success", description: `Service price "${data.name}" added.` });
    }
    setCurrentServicePrices(updatedPrices);
    savePricesToLocalStorage(updatedPrices);
    setIsFormOpen(false);
    setEditingService(undefined);
  };

  const handleEdit = (service: ServicePriceItem) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleDelete = (serviceId: string) => {
    const serviceToDelete = currentServicePrices.find(sp => sp.id === serviceId);
    const updatedPrices = currentServicePrices.filter(sp => sp.id !== serviceId);
    setCurrentServicePrices(updatedPrices);
    savePricesToLocalStorage(updatedPrices);
    toast({ title: "Success", description: `Service price "${serviceToDelete?.name || 'Item'}" deleted.` });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
           <Link href="/admin">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <LayoutDashboard className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary flex items-center">
             <ListPlus className="mr-3 h-8 w-8" /> Manage Service Prices
          </h1>
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

      <div className="mb-6">
        <Link href="/admin/provinces">
          <Button variant="link" className="text-primary flex items-center">
            <MapPinned className="mr-2 h-5 w-5" /> Manage Provinces
          </Button>
        </Link>
      </div>

      {isLoadingServices ? (
        <div className="text-center py-10">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading service prices...</p>
        </div>
      ) : currentServicePrices.length > 0 ? (
        <ServicePriceTable
          servicePrices={currentServicePrices}
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
          <p className="text-sm text-muted-foreground mt-2">Demo data should load automatically. If not, please refresh or click "Add New Service Price".</p>
        </div>
      )}
    </div>
  );
}
