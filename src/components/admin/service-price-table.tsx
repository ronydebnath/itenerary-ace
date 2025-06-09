
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
import { Edit, CalendarClock, Package, AlertTriangle } from 'lucide-react';
import type { ServicePriceItem } from '@/types/itinerary';
import { formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ServicePriceTableProps {
  servicePrices: ServicePriceItem[];
  onEdit: (serviceId: string) => void;
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
            <TableHead className="min-w-[150px]">Details / Packages</TableHead>
            <TableHead className="text-right min-w-[150px]">Base Rate / Info</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="min-w-[150px]">Notes</TableHead>
            <TableHead className="text-center w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servicePrices.map((service) => {
            let displayDetail = service.subCategory || 'N/A';
            let displayPriceInfo = service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : 'See Details';
            let displayUnit = service.unitDescription || 'N/A';
            let rateTooltipContent: React.ReactNode = null;

            if (service.category === 'hotel' && service.hotelDetails && service.hotelDetails.roomTypes.length > 0) {
              displayDetail = `${service.hotelDetails.roomTypes.length} room type(s)`;
              displayUnit = service.unitDescription || 'per night';
              
              let lowestRate: number | undefined = undefined;
              service.hotelDetails.roomTypes.forEach(rt => {
                rt.seasonalPrices.forEach(sp => {
                  if (lowestRate === undefined || sp.rate < lowestRate) {
                    lowestRate = sp.rate;
                  }
                });
              });
              if (lowestRate !== undefined) {
                displayPriceInfo = `From ${formatCurrency(lowestRate, service.currency)}`;
              } else {
                displayPriceInfo = "Complex Rates";
              }
              rateTooltipContent = (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-2 cursor-default border-primary/50 text-primary">
                        <CalendarClock className="h-3 w-3 mr-1" /> Seasonal/Tiered
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This hotel has seasonal and/or multi-room type pricing.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );

            } else if (service.category === 'activity' && service.activityPackages && service.activityPackages.length > 0) {
              displayDetail = `${service.activityPackages.length} package(s)`;
              displayUnit = service.unitDescription || 'per person';
              
              let lowestPackagePrice: number | undefined = undefined;
              service.activityPackages.forEach(pkg => {
                if (lowestPackagePrice === undefined || pkg.price1 < lowestPackagePrice) {
                  lowestPackagePrice = pkg.price1;
                }
              });
               if (lowestPackagePrice !== undefined) {
                displayPriceInfo = `From ${formatCurrency(lowestPackagePrice, service.currency)}`;
              } else if (service.price1 !== undefined) { // Fallback to simple price if packages have no price
                displayPriceInfo = formatCurrency(service.price1, service.currency);
              } else {
                displayPriceInfo = "See Packages";
              }
               rateTooltipContent = (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-2 cursor-default border-indigo-500/50 text-indigo-600">
                        <Package className="h-3 w-3 mr-1" /> Multi-Package
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This activity has multiple packages with varying prices.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );

            } else if (service.category === 'transfer') {
              if (service.subCategory !== 'ticket') { // Vehicle transfer
                displayDetail = `${service.subCategory || 'Vehicle'} ${service.maxPassengers ? `(Max: ${service.maxPassengers})` : ''}`;
                displayUnit = service.unitDescription || 'per vehicle';
                if (service.surchargePeriods && service.surchargePeriods.length > 0) {
                  rateTooltipContent = (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="ml-2 cursor-default border-orange-500/50 text-orange-600">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Surcharges
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This transfer has date-based surcharges.</p>
                          <ul className="list-disc pl-4 mt-1 text-xs">
                            {service.surchargePeriods.slice(0,3).map(sp => <li key={sp.id}>{sp.name}: +{formatCurrency(sp.surchargeAmount, service.currency)}</li>)}
                            {service.surchargePeriods.length > 3 && <li>...and more</li>}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }
              } else { // Ticket transfer
                displayDetail = "Ticket Basis";
                displayUnit = service.unitDescription || 'per person';
              }
            }


            return (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>{service.province || 'N/A'}</TableCell>
                <TableCell>{service.category.charAt(0).toUpperCase() + service.category.slice(1)}</TableCell>
                <TableCell>{displayDetail}</TableCell>
                <TableCell className="text-right font-code">
                  <div className="flex items-center justify-end">
                    <span>{displayPriceInfo}</span>
                    {rateTooltipContent}
                  </div>
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

