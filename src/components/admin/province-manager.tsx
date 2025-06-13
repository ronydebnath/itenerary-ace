/**
 * @fileoverview This component provides the user interface for managing provinces.
 * It enables users to view a list of existing provinces (often filtered by country),
 * add new provinces, edit their details, and delete them. It utilizes the `useProvinces`
 * and `useCountries` hooks to manage and display province and country data.
 *
 * @bangla এই কম্পোনেন্টটি প্রদেশ পরিচালনার জন্য ব্যবহারকারী ইন্টারফেস সরবরাহ করে।
 * এটি ব্যবহারকারীদের বিদ্যমান প্রদেশগুলির একটি তালিকা দেখতে (প্রায়শই দেশ অনুসারে ফিল্টার করা),
 * নতুন প্রদেশ যুক্ত করতে, তাদের বিবরণ সম্পাদনা করতে এবং সেগুলি মুছতে সক্ষম করে। এটি প্রদেশ
 * এবং দেশের ডেটা পরিচালনা ও প্রদর্শন করতে `useProvinces` এবং `useCountries` হুক ব্যবহার করে।
 */
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, MapPinned, Trash2, LayoutDashboard, ListPlus, Globe } from 'lucide-react';
import type { ProvinceItem } from '@/types/itinerary';
import { ProvinceForm } from './province-form';
import { ProvinceTable } from './province-table'; 
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useProvinces } from '@/hooks/useProvinces';
import { useCountries } from '@/hooks/useCountries'; 

export function ProvinceManager() {
  const { provinces, addProvince, updateProvince, deleteProvince, isLoading: isLoadingProvinces } = useProvinces();
  const { countries, isLoading: isLoadingCountries } = useCountries(); 

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingProvince, setEditingProvince] = React.useState<ProvinceItem | undefined>(undefined);
  const { toast } = useToast();

  const handleFormSubmit = (data: Omit<ProvinceItem, 'id'>) => {
    if (editingProvince) {
      updateProvince({ ...editingProvince, ...data });
      toast({ title: "Success", description: `Province "${data.name}" updated.` });
    } else {
      addProvince(data);
      toast({ title: "Success", description: `Province "${data.name}" added.` });
    }
    setIsFormOpen(false);
    setEditingProvince(undefined);
  };

  const handleEdit = (province: ProvinceItem) => {
    setEditingProvince(province);
    setIsFormOpen(true);
  };

  const handleDelete = (provinceId: string) => {
    const provinceToDelete = provinces.find(p => p.id === provinceId);
    deleteProvince(provinceId);
    toast({ title: "Success", description: `Province "${provinceToDelete?.name || 'Item'}" deleted.` });
  };

  const isLoading = isLoadingProvinces || isLoadingCountries;

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-semibold text-foreground flex items-center">
          <MapPinned className="mr-2 h-6 w-6" /> All Provinces
        </h2>
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
      <div className="mb-6 flex gap-4">
        {/* Link to pricing can remain if useful contextually */}
        <Link href="/admin/pricing">
          <Button variant="link" className="text-primary flex items-center p-1 text-sm">
             <ListPlus className="mr-2 h-4 w-4" /> Manage Service Prices
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <p>Loading provinces and countries...</p>
      ) : provinces.length > 0 ? (
        <ProvinceTable
          provinces={provinces}
          countries={countries} 
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
          <p className="text-sm text-muted-foreground mt-2">Ensure countries are defined first. Default Thai provinces will be added if "Thailand" exists.</p>
        </div>
      )}
    </div>
  );
}
