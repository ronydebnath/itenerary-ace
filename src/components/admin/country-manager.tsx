
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Globe, Trash2, LayoutDashboard, MapPinned } from 'lucide-react';
import type { CountryItem } from '@/types/itinerary';
import { CountryForm } from './country-form';
import { CountryTable } from './country-table';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCountries } from '@/hooks/useCountries';

export function CountryManager() {
  const { countries, addCountry, updateCountry, deleteCountry, isLoading } = useCountries();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCountry, setEditingCountry] = React.useState<CountryItem | undefined>(undefined);
  const { toast } = useToast();

  const handleFormSubmit = (data: Omit<CountryItem, 'id'>) => {
    if (editingCountry) {
      updateCountry({ ...editingCountry, ...data });
      toast({ title: "Success", description: `Country "${data.name}" updated.` });
    } else {
      addCountry(data);
      toast({ title: "Success", description: `Country "${data.name}" added.` });
    }
    setIsFormOpen(false);
    setEditingCountry(undefined);
  };

  const handleEdit = (country: CountryItem) => {
    setEditingCountry(country);
    setIsFormOpen(true);
  };

  const handleDelete = (countryId: string) => {
    const countryToDelete = countries.find(c => c.id === countryId);
    deleteCountry(countryId);
    toast({ title: "Success", description: `Country "${countryToDelete?.name || 'Item'}" deleted.` });
  };

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-foreground flex items-center">
          <Globe className="mr-2 h-6 w-6" /> All Countries
        </h2>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingCountry(undefined);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Country
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCountry ? 'Edit' : 'Add'} Country</DialogTitle>
            </DialogHeader>
            <CountryForm
              key={editingCountry?.id || 'new'}
              initialData={editingCountry}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingCountry(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <p>Loading countries...</p>
      ) : countries.length > 0 ? (
        <CountryTable
          countries={countries}
          onEdit={handleEdit}
          onDeleteConfirmation={(countryId) => (
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
                    This action cannot be undone. This will permanently delete the country and may affect associated provinces and services.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(countryId)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        />
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-lg">
          <p className="text-muted-foreground text-lg">No countries defined yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Click "Add New Country" to get started. Default countries like "Thailand" and "Malaysia" will be added automatically if not present.</p>
        </div>
      )}
    </div>
  );
}
