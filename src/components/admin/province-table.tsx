
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
import type { ProvinceItem } from '@/types/itinerary';

interface ProvinceTableProps {
  provinces: ProvinceItem[];
  onEdit: (province: ProvinceItem) => void;
  onDeleteConfirmation: (provinceId: string) => React.ReactNode;
}

export function ProvinceTable({ provinces, onEdit, onDeleteConfirmation }: ProvinceTableProps) {
  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Province Name</TableHead>
            <TableHead className="text-center w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {provinces.map((province) => (
            <TableRow key={province.id}>
              <TableCell className="font-medium">{province.name}</TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" onClick={() => onEdit(province)} className="mr-2 text-primary hover:bg-primary/10">
                  <Edit className="h-4 w-4" />
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
