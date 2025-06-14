/**
 * @fileoverview This component renders a table displaying a list of countries.
 * Each row shows the country's name, default currency, and provides actions
 * to edit or delete the country. It is used within the `CountryManager` component.
 *
 * @bangla এই কম্পোনেন্টটি দেশগুলির একটি তালিকা প্রদর্শনকারী একটি টেবিল রেন্ডার করে।
 * প্রতিটি সারিতে দেশের নাম, ডিফল্ট মুদ্রা এবং দেশটি সম্পাদনা বা মুছে ফেলার জন্য
 * ক্রিয়া সরবরাহ করা হয়। এটি `CountryManager` কম্পোনেন্টের মধ্যে ব্যবহৃত হয়।
 */
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit } from 'lucide-react';
import type { CountryItem } from '@/types/itinerary';

interface CountryTableProps {
  countries: CountryItem[];
  onEdit: (country: CountryItem) => void;
  onDeleteConfirmation: (countryId: string) => React.ReactNode;
}

export function CountryTable({ countries, onEdit, onDeleteConfirmation }: CountryTableProps) {
  return (
    <div className="rounded-lg border shadow-sm overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="px-2 sm:px-4 py-3">Country Name</TableHead>
            <TableHead className="px-2 sm:px-4 py-3">Default Currency</TableHead>
            <TableHead className="text-center w-[100px] sm:w-[120px] px-2 sm:px-4 py-3">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {countries.map((country) => (
            <TableRow key={country.id} className="text-sm">
              <TableCell className="font-medium py-2 px-2 sm:px-4">{country.name}</TableCell>
              <TableCell className="py-2 px-2 sm:px-4">{country.defaultCurrency}</TableCell>
              <TableCell className="text-center py-2 px-2 sm:px-4">
                <Button variant="ghost" size="icon" onClick={() => onEdit(country)} className="mr-1 sm:mr-2 text-primary hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8">
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                {onDeleteConfirmation(country.id)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
