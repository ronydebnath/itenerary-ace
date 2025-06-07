
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
import type { ServicePriceItem } from '@/types/itinerary';
import { formatCurrency } from '@/lib/utils';

interface ServicePriceTableProps {
  servicePrices: ServicePriceItem[];
  onEdit: (service: ServicePriceItem) => void;
  onDelete: (serviceId: string) => React.ReactNode; // Expecting JSX for AlertDialog trigger
}

export function ServicePriceTable({ servicePrices, onEdit, onDelete }: ServicePriceTableProps) {
  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[250px]">Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Sub-category</TableHead>
            <TableHead className="text-right">Price 1</TableHead>
            <TableHead className="text-right">Price 2</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-center w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicePrices.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.name}</TableCell>
              <TableCell>{service.category.charAt(0).toUpperCase() + service.category.slice(1)}</TableCell>
              <TableCell>{service.subCategory || 'N/A'}</TableCell>
              <TableCell className="text-right font-code">{formatCurrency(service.price1, service.currency)}</TableCell>
              <TableCell className="text-right font-code">
                {service.price2 !== undefined ? formatCurrency(service.price2, service.currency) : 'N/A'}
              </TableCell>
              <TableCell>{service.currency}</TableCell>
              <TableCell>{service.unitDescription}</TableCell>
              <TableCell className="text-xs max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" onClick={() => onEdit(service)} className="mr-2 text-primary hover:bg-primary/10">
                  <Edit className="h-4 w-4" />
                </Button>
                {onDelete(service.id)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
