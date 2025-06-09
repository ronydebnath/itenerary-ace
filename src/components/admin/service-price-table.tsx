
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
import { Edit, CalendarClock } from 'lucide-react';
import type { ServicePriceItem } from '@/types/itinerary';
import { formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ServicePriceTableProps {
  servicePrices: ServicePriceItem[];
  onEdit: (serviceId: string) => void; // Changed to accept serviceId
  onDeleteConfirmation: (serviceId: string) => React.ReactNode;
}

export function ServicePriceTable({ servicePrices, onEdit, onDeleteConfirmation }: ServicePriceTableProps) {
  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[200px] min-w-[150px]">Name</TableHead>
            <TableHead>Province</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Details / Packages</TableHead>
            <TableHead className="text-right">Primary Rate</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="min-w-[150px]">Notes</TableHead>
            <TableHead className="text-center w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicePrices.map((service) => {
            let displayDetail = service.subCategory || 'N/A';
            let displayPrice = formatCurrency(service.price1, service.currency);
            let displayUnit = service.unitDescription;

            if (service.category === 'hotel' && service.hotelDetails && service.hotelDetails.roomTypes.length > 0) {
              const firstRoomType = service.hotelDetails.roomTypes[0];
              const firstSeason = firstRoomType.seasonalPrices[0];
              displayDetail = `${service.hotelDetails.roomTypes.length} room type(s)`;
              if (firstSeason) {
                displayPrice = `${formatCurrency(firstSeason.rate, service.currency)} (from ${firstRoomType.name})`;
              } else {
                displayPrice = "See details";
              }
              displayUnit = service.unitDescription || 'per night';
            } else if (service.category === 'activity' && service.activityPackages && service.activityPackages.length > 0) {
              const firstPackage = service.activityPackages[0];
              displayDetail = `${service.activityPackages.length} package(s)`;
              displayPrice = `${formatCurrency(firstPackage.price1, service.currency)} (from ${firstPackage.name})`;
              displayUnit = service.unitDescription || 'per person';
            } else if (service.category === 'transfer' && service.subCategory !== 'ticket' && service.maxPassengers) {
                displayDetail = `${service.subCategory || 'Vehicle'} (Max: ${service.maxPassengers})`;
            }


            return (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>{service.province || 'N/A'}</TableCell>
                <TableCell>{service.category.charAt(0).toUpperCase() + service.category.slice(1)}</TableCell>
                <TableCell>{displayDetail}</TableCell>
                <TableCell className="text-right font-code">
                  {displayPrice}
                   {(service.category === 'hotel' && service.hotelDetails && service.hotelDetails.roomTypes.some(rt => rt.seasonalPrices.length > 1 || rt.seasonalPrices[0]?.startDate !== rt.seasonalPrices[0]?.endDate)) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="ml-2 cursor-default border-primary/50 text-primary">
                            <CalendarClock className="h-3 w-3 mr-1" /> Seasonal
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This hotel has seasonal rates defined.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell>{service.currency}</TableCell>
                <TableCell>{displayUnit}</TableCell>
                <TableCell className="text-xs max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(service.id)} className="mr-2 text-primary hover:bg-primary/10">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {onDeleteConfirmation(service.id)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
