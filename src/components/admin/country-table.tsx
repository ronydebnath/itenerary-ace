
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
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Country Name</TableHead>
            <TableHead>Default Currency</TableHead>
            <TableHead className="text-center w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {countries.map((country) => (
            <TableRow key={country.id}>
              <TableCell className="font-medium">{country.name}</TableCell>
              <TableCell>{country.defaultCurrency}</TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" onClick={() => onEdit(country)} className="mr-2 text-primary hover:bg-primary/10">
                  <Edit className="h-4 w-4" />
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
