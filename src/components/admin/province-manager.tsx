
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, MapPinned, Trash2, LayoutDashboard, ListPlus } from 'lucide-react'; // Removed Home
import type { ProvinceItem } from '@/types/itinerary';
import { ProvinceForm } from './province-form';
import { ProvinceTable } from './province-table';
import { generateGUID } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const PROVINCES_STORAGE_KEY = 'itineraryAceProvinces';

export function ProvinceManager() {
  const [provinces, setProvinces] = React.useState<ProvinceItem[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProvince, setEditingProvince] = React.useState<ProvinceItem | undefined>(undefined);
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const storedProvinces = localStorage.getItem(PROVINCES_STORAGE_KEY);
      if (storedProvinces) {
        const parsedData = JSON.parse(storedProvinces);
        if (Array.isArray(parsedData)) {
          setProvinces(parsedData.map(p => ({
            id: p.id || generateGUID(),
            name: p.name || "Unnamed Province",
          } as ProvinceItem)));
        } else {
          localStorage.removeItem(PROVINCES_STORAGE_KEY);
          setProvinces([]);
        }
      }
    } catch (error) {
      console.error("Failed to load provinces from localStorage:", error);
      localStorage.removeItem(PROVINCES_STORAGE_KEY);
      setProvinces([]);
    }
  }, []);

  const saveProvincesToLocalStorage = (currentProvinces: ProvinceItem[]) => {
    try {
      localStorage.setItem(PROVINCES_STORAGE_KEY, JSON.stringify(currentProvinces));
    } catch (error) {
      console.error("Failed to save provinces to localStorage:", error);
      toast({ title: "Error", description: "Could not save provinces.", variant: "destructive" });
    }
  };

  const handleFormSubmit = (data: Omit<ProvinceItem, 'id'>) => {
    let updatedProvinces;
    if (editingProvince) {
      updatedProvinces = provinces.map(p => p.id === editingProvince.id ? { ...editingProvince, ...data } : p);
      toast({ title: "Success", description: `Province "${data.name}" updated.` });
    } else {
      const newProvince: ProvinceItem = { ...data, id: generateGUID() };
      updatedProvinces = [...provinces, newProvince];
      toast({ title: "Success", description: `Province "${data.name}" added.` });
    }
    setProvinces(updatedProvinces);
    saveProvincesToLocalStorage(updatedProvinces);
    setIsFormOpen(false);
    setEditingProvince(undefined);
  };

  const handleEdit = (province: ProvinceItem) => {
    setEditingProvince(province);
    setIsFormOpen(true);
  };

  const handleDelete = (provinceId: string) => {
    const provinceToDelete = provinces.find(p => p.id === provinceId);
    const updatedProvinces = provinces.filter(p => p.id !== provinceId);
    setProvinces(updatedProvinces);
    saveProvincesToLocalStorage(updatedProvinces);
    toast({ title: "Success", description: `Province "${provinceToDelete?.name || 'Item'}" deleted.` });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <LayoutDashboard className="h-5 w-5" />
              <span className="sr-only">Go to Admin Dashboard</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary flex items-center">
            <MapPinned className="mr-3 h-8 w-8" /> Manage Provinces
          </h1>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingProvince(undefined);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Province
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md"> 
            <DialogHeader>
              <DialogTitle>{editingProvince ? 'Edit' : 'Add'} Province</DialogTitle>
            </DialogHeader>
            <ProvinceForm
              key={editingProvince?.id || 'new'}
              initialData={editingProvince}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingProvince(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="mb-6">
        <Link href="/admin/pricing">
          <Button variant="link" className="text-primary flex items-center">
             <ListPlus className="mr-2 h-5 w-5" /> Manage Service Prices
          </Button>
        </Link>
      </div>

      {provinces.length > 0 ? (
        <ProvinceTable
          provinces={provinces}
          onEdit={handleEdit}
          onDeleteConfirmation={(provinceId) => ( 
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
                    This action cannot be undone. This will permanently delete the province.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(provinceId)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        />
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <p className="text-muted-foreground text-lg">No provinces defined yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Famous Thai provinces will be added automatically. You can also click "Add New Province" to get started.</p>
        </div>
      )}
    </div>
  );
}
