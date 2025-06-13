
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
import type { ProvinceItem, CountryItem } from '@/types/itinerary';

interface ProvinceTableProps {
  provinces: ProvinceItem[];
  countries: CountryItem[];
  onEdit: (province: ProvinceItem) => void;
  onDeleteConfirmation: (provinceId: string) => React.ReactNode;
}

export function ProvinceTable({ provinces, countries, onEdit, onDeleteConfirmation }: ProvinceTableProps) {
  const getCountryName = (countryId: string) => {
    return countries.find(c => c.id === countryId)?.name || 'N/A';
  };

  return (
    <div className="rounded-lg border shadow-sm overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="px-2 sm:px-4 py-3">Province Name</TableHead>
            <TableHead className="px-2 sm:px-4 py-3">Country</TableHead>
            <TableHead className="text-center w-[100px] sm:w-[120px] px-2 sm:px-4 py-3">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {provinces.map((province) => (
            <TableRow key={province.id} className="text-sm">
              <TableCell className="font-medium py-2 px-2 sm:px-4">{province.name}</TableCell>
              <TableCell className="py-2 px-2 sm:px-4">{getCountryName(province.countryId)}</TableCell>
              <TableCell className="text-center py-2 px-2 sm:px-4">
                <Button variant="ghost" size="icon" onClick={() => onEdit(province)} className="mr-1 sm:mr-2 text-primary hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8">
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                {onDeleteConfirmation(province.id)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
