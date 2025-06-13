
"use client";

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, CalendarClock, Package, AlertTriangle, Info, Car } from 'lucide-react';
import type { ServicePriceItem, ItineraryItemType, VehicleOption } from '@/types/itinerary';
import { formatCurrency } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from 'date-fns';

interface ServicePriceTableProps {
  servicePrices: ServicePriceItem[];
  onEdit: (serviceId: string) => void;
  onDeleteConfirmation: (serviceId: string) => React.ReactNode;
  displayMode: 'all' | ItineraryItemType;
}

export function ServicePriceTable({ servicePrices, onEdit, onDeleteConfirmation, displayMode }: ServicePriceTableProps) {

  const renderAllModeRow = (service: ServicePriceItem) => {
    let displayDetail = service.subCategory || 'N/A';
    let displayPriceInfo = service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : 'See Details';
    let rateTooltipContent: React.ReactNode = null;

    if (service.category === 'hotel' && service.hotelDetails && service.hotelDetails.roomTypes.length > 0) {
      displayDetail = `${service.hotelDetails.roomTypes.length} room type(s)`;
      let lowestRate: number | undefined = undefined;
      service.hotelDetails.roomTypes.forEach(rt => {
        rt.seasonalPrices.forEach(sp => {
          if (lowestRate === undefined || sp.rate < lowestRate) lowestRate = sp.rate;
        });
      });
      displayPriceInfo = lowestRate !== undefined ? `From ${formatCurrency(lowestRate, service.currency)}` : "Complex Rates";
      rateTooltipContent = (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="ml-1 sm:ml-2 cursor-default border-primary/50 text-primary text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5">
                <CalendarClock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Seasonal
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>This hotel has seasonal/tiered pricing.</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (service.category === 'activity' && service.activityPackages && service.activityPackages.length > 0) {
      displayDetail = `${service.activityPackages.length} package(s)`;
      let lowestPackagePrice: number | undefined = undefined;
      service.activityPackages.forEach(pkg => {
        if (lowestPackagePrice === undefined || pkg.price1 < lowestPackagePrice) lowestPackagePrice = pkg.price1;
      });
      displayPriceInfo = lowestPackagePrice !== undefined ? `From ${formatCurrency(lowestPackagePrice, service.currency)}` : (service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : "See Packages");
      rateTooltipContent = (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="ml-1 sm:ml-2 cursor-default border-indigo-500/50 text-indigo-600 text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5">
                <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Multi-Package
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>This activity has multiple packages.</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (service.category === 'transfer') {
      if (service.transferMode === 'vehicle' && service.vehicleOptions && service.vehicleOptions.length > 0) {
        displayDetail = `${service.vehicleOptions.length} vehicle option(s)`;
        let lowestVehiclePrice: number | undefined = undefined;
        service.vehicleOptions.forEach(vo => {
            if (lowestVehiclePrice === undefined || vo.price < lowestVehiclePrice) lowestVehiclePrice = vo.price;
        });
        displayPriceInfo = lowestVehiclePrice !== undefined ? `From ${formatCurrency(lowestVehiclePrice, service.currency)}` : 'See Options';
         rateTooltipContent = (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-1 sm:ml-2 cursor-default border-blue-500/50 text-blue-600 text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5">
                    <Car className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Vehicles
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold mb-1 text-xs">Vehicle Options:</p>
                    {service.vehicleOptions.slice(0,3).map(vo => <li key={vo.id} className="text-xs">{vo.vehicleType}: {formatCurrency(vo.price, service.currency)} (Max: {vo.maxPassengers})</li>)}
                    {service.vehicleOptions.length > 3 && <li className="text-xs italic">...and more.</li>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        if (service.surchargePeriods && service.surchargePeriods.length > 0) {
           const surchargeBadge = (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-1 sm:ml-2 cursor-default border-orange-500/50 text-orange-600 text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5">
                    <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Surcharges
                  </Badge>
                </TooltipTrigger>
                <TooltipContent><p>This transfer has date-based surcharges.</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
          rateTooltipContent = <>{rateTooltipContent}{surchargeBadge}</>;
        }
      } else {
        displayDetail = "Ticket Basis";
        displayPriceInfo = service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : "N/A";
      }
    }

    return (
      <TableRow key={service.id} className="text-xs sm:text-sm">
        <TableCell className="font-medium py-2 px-2 sm:px-4">{service.name}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.province || 'N/A'}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.category.charAt(0).toUpperCase() + service.category.slice(1)}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{displayDetail}</TableCell>
        <TableCell className="text-right py-2 px-2 sm:px-4">
          <div className="flex items-center justify-end font-code">
            <span>{displayPriceInfo}</span>
            {rateTooltipContent}
          </div>
        </TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.currency}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4 max-w-[100px] sm:max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
        <TableCell className="text-center py-2 px-2 sm:px-4">
          <Button variant="ghost" size="icon" onClick={() => onEdit(service.id)} className="mr-1 sm:mr-2 text-primary hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8">
            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          {onDeleteConfirmation(service.id)}
        </TableCell>
      </TableRow>
    );
  };

  const renderHotelRow = (service: ServicePriceItem) => { /* ... similar responsive adjustments ... */
    let lowestRate: number | undefined = undefined;
    service.hotelDetails?.roomTypes.forEach(rt => { rt.seasonalPrices.forEach(sp => { if (lowestRate === undefined || sp.rate < lowestRate) lowestRate = sp.rate; }); });
    const displayPriceInfo = lowestRate !== undefined ? `From ${formatCurrency(lowestRate, service.currency)}` : "N/A";
    const numRoomTypes = service.hotelDetails?.roomTypes.length || 0;

    return (
      <TableRow key={service.id} className="text-xs sm:text-sm">
        <TableCell className="font-medium py-2 px-2 sm:px-4">{service.name}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.province || 'N/A'}</TableCell>
        <TableCell className="text-center py-2 px-2 sm:px-4">{numRoomTypes}</TableCell>
        <TableCell className="text-right font-code py-2 px-2 sm:px-4">{displayPriceInfo}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">
            {numRoomTypes > 0 && ( <TooltipProvider> <Tooltip> <TooltipTrigger asChild>
              <Badge variant="outline" className="ml-1 sm:ml-2 cursor-default border-primary/50 text-primary text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5"> <CalendarClock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Details </Badge>
            </TooltipTrigger> <TooltipContent> <p className="font-semibold mb-1 text-xs">Room Types & Lowest Rates:</p> {service.hotelDetails?.roomTypes.slice(0,5).map(rt => { let minRtRate: number | undefined; rt.seasonalPrices.forEach(sp => { if (minRtRate === undefined || sp.rate < minRtRate) minRtRate = sp.rate; }); return <p key={rt.id} className="text-xs">{rt.name}: From {minRtRate !== undefined ? formatCurrency(minRtRate, service.currency) : 'N/A'}</p> })} {numRoomTypes > 5 && <p className="text-xs italic">...and more.</p>} </TooltipContent> </Tooltip> </TooltipProvider> )}
        </TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.currency}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4 max-w-[100px] sm:max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
        <TableCell className="text-center py-2 px-2 sm:px-4">
          <Button variant="ghost" size="icon" onClick={() => onEdit(service.id)} className="mr-1 sm:mr-2 text-primary hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8"> <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> </Button>
          {onDeleteConfirmation(service.id)}
        </TableCell>
      </TableRow>
    );
  };

  const renderActivityRow = (service: ServicePriceItem) => { /* ... similar responsive adjustments ... */
    let lowestPackagePrice: number | undefined = undefined;
    service.activityPackages?.forEach(pkg => { if (lowestPackagePrice === undefined || pkg.price1 < lowestPackagePrice) lowestPackagePrice = pkg.price1; });
    const displayPriceInfo = lowestPackagePrice !== undefined ? `From ${formatCurrency(lowestPackagePrice, service.currency)}` : (service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : "N/A");
    const numPackages = service.activityPackages?.length || 0;
    return (
      <TableRow key={service.id} className="text-xs sm:text-sm">
        <TableCell className="font-medium py-2 px-2 sm:px-4">{service.name}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.province || 'N/A'}</TableCell>
        <TableCell className="text-center py-2 px-2 sm:px-4">{numPackages}</TableCell>
        <TableCell className="text-right font-code py-2 px-2 sm:px-4">{displayPriceInfo}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">
            {numPackages > 0 && ( <TooltipProvider> <Tooltip> <TooltipTrigger asChild>
                <Badge variant="outline" className="ml-1 sm:ml-2 cursor-default border-indigo-500/50 text-indigo-600 text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5"> <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Packages </Badge>
            </TooltipTrigger> <TooltipContent> <p className="font-semibold mb-1 text-xs">Packages & Base Prices:</p> {service.activityPackages?.slice(0,5).map(pkg => ( <p key={pkg.id} className="text-xs">{pkg.name}: {formatCurrency(pkg.price1, service.currency)}</p> ))} {numPackages > 5 && <p className="text-xs italic">...and more.</p>} </TooltipContent> </Tooltip> </TooltipProvider> )}
        </TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.currency}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4 max-w-[100px] sm:max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
        <TableCell className="text-center py-2 px-2 sm:px-4">
          <Button variant="ghost" size="icon" onClick={() => onEdit(service.id)} className="mr-1 sm:mr-2 text-primary hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8"> <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> </Button>
          {onDeleteConfirmation(service.id)}
        </TableCell>
      </TableRow>
    );
  };

  const renderTransferRow = (service: ServicePriceItem) => { /* ... similar responsive adjustments ... */
     const isVehicle = service.transferMode === 'vehicle';
     let displayDetail = "Ticket Basis";
     let baseRate = service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : 'N/A';
     let optionsIndicator: React.ReactNode = null;
     if (isVehicle && service.vehicleOptions && service.vehicleOptions.length > 0) {
        displayDetail = `${service.vehicleOptions.length} vehicle option(s)`;
        let lowestPrice: number | undefined; service.vehicleOptions.forEach(vo => { if (lowestPrice === undefined || vo.price < lowestPrice) lowestPrice = vo.price; });
        baseRate = lowestPrice !== undefined ? `From ${formatCurrency(lowestPrice, service.currency)}` : "See Options";
        optionsIndicator = ( <TooltipProvider> <Tooltip> <TooltipTrigger asChild>
            <Badge variant="outline" className="ml-1 sm:ml-2 cursor-default border-blue-500/50 text-blue-600 text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5"> <Car className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Options </Badge>
        </TooltipTrigger> <TooltipContent> <p className="font-semibold mb-1 text-xs">Vehicle Options:</p> <ul className="list-none pl-1 text-xs"> {service.vehicleOptions.slice(0,5).map(vo => <li key={vo.id}>{vo.vehicleType}: {formatCurrency(vo.price, service.currency)} (Max: {vo.maxPassengers})</li>)} {service.vehicleOptions.length > 5 && <li className="italic">...and more.</li>} </ul> </TooltipContent> </Tooltip> </TooltipProvider> );
     } else if (isVehicle) { displayDetail = "Vehicle (No Options)"; baseRate = "N/A"; }

    return (
      <TableRow key={service.id} className="text-xs sm:text-sm">
        <TableCell className="font-medium py-2 px-2 sm:px-4">{service.name}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.province || 'N/A'}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.transferMode === 'vehicle' ? 'Vehicle' : 'Ticket'}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{displayDetail}</TableCell>
        <TableCell className="text-right font-code py-2 px-2 sm:px-4">{baseRate}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">
            {optionsIndicator}
            {isVehicle && service.surchargePeriods && service.surchargePeriods.length > 0 && ( <TooltipProvider> <Tooltip> <TooltipTrigger asChild>
              <Badge variant="outline" className="ml-1 sm:ml-2 cursor-default border-orange-500/50 text-orange-600 text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-0.5"> <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Surcharges </Badge>
            </TooltipTrigger> <TooltipContent> <p className="font-semibold mb-1 text-xs">Surcharges Apply:</p> <ul className="list-disc pl-4 mt-1 text-xs"> {service.surchargePeriods.slice(0,3).map(sp => <li key={sp.id}>{sp.name}: +{formatCurrency(sp.surchargeAmount, service.currency)} ({format(new Date(sp.startDate), 'dd MMM')} - {format(new Date(sp.endDate), 'dd MMM')})</li>)} {service.surchargePeriods.length > 3 && <li>...and more</li>} </ul> </TooltipContent> </Tooltip> </TooltipProvider> )}
        </TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.currency}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4 max-w-[100px] sm:max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
        <TableCell className="text-center py-2 px-2 sm:px-4">
          <Button variant="ghost" size="icon" onClick={() => onEdit(service.id)} className="mr-1 sm:mr-2 text-primary hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8"> <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> </Button>
          {onDeleteConfirmation(service.id)}
        </TableCell>
      </TableRow>
    );
  };

  const renderSimpleRow = (service: ServicePriceItem, typeLabel: string) => (
      <TableRow key={service.id} className="text-xs sm:text-sm">
        <TableCell className="font-medium py-2 px-2 sm:px-4">{service.name}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.province || 'N/A'}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.subCategory || 'N/A'}</TableCell>
        <TableCell className="text-right font-code py-2 px-2 sm:px-4">{service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : 'N/A'}</TableCell>
        <TableCell className="text-right font-code py-2 px-2 sm:px-4">{service.price2 !== undefined ? formatCurrency(service.price2, service.currency) : 'N/A'}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4">{service.currency}</TableCell>
        <TableCell className="py-2 px-2 sm:px-4 max-w-[100px] sm:max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
        <TableCell className="text-center py-2 px-2 sm:px-4">
          <Button variant="ghost" size="icon" onClick={() => onEdit(service.id)} className="mr-1 sm:mr-2 text-primary hover:bg-primary/10 h-7 w-7 sm:h-8 sm:w-8"> <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> </Button>
          {onDeleteConfirmation(service.id)}
        </TableCell>
      </TableRow>
  );


  let headers: React.ReactNode;
  let rows: React.ReactNode;

  switch (displayMode) {
    case 'hotel':
      headers = ( <TableRow> <TableHead className="px-2 sm:px-4 py-3">Hotel Name</TableHead> <TableHead className="px-2 sm:px-4 py-3">Province</TableHead> <TableHead className="text-center px-2 sm:px-4 py-3">Room Types</TableHead> <TableHead className="text-right px-2 sm:px-4 py-3">Base Rate</TableHead> <TableHead className="px-2 sm:px-4 py-3">Pricing</TableHead> <TableHead className="px-2 sm:px-4 py-3">Currency</TableHead> <TableHead className="px-2 sm:px-4 py-3">Notes</TableHead> <TableHead className="text-center px-2 sm:px-4 py-3">Actions</TableHead> </TableRow> );
      rows = servicePrices.map(renderHotelRow);
      break;
    case 'activity':
      headers = ( <TableRow> <TableHead className="px-2 sm:px-4 py-3">Activity Name</TableHead> <TableHead className="px-2 sm:px-4 py-3">Province</TableHead> <TableHead className="text-center px-2 sm:px-4 py-3">Packages</TableHead> <TableHead className="text-right px-2 sm:px-4 py-3">Base Price</TableHead> <TableHead className="px-2 sm:px-4 py-3">Pricing</TableHead> <TableHead className="px-2 sm:px-4 py-3">Currency</TableHead> <TableHead className="px-2 sm:px-4 py-3">Notes</TableHead> <TableHead className="text-center px-2 sm:px-4 py-3">Actions</TableHead> </TableRow> );
      rows = servicePrices.map(renderActivityRow);
      break;
    case 'transfer':
      headers = ( <TableRow> <TableHead className="px-2 sm:px-4 py-3">Route Name</TableHead> <TableHead className="px-2 sm:px-4 py-3">Province</TableHead> <TableHead className="px-2 sm:px-4 py-3">Mode</TableHead> <TableHead className="px-2 sm:px-4 py-3">Details</TableHead> <TableHead className="text-right px-2 sm:px-4 py-3">Base Rate</TableHead> <TableHead className="px-2 sm:px-4 py-3">Info</TableHead> <TableHead className="px-2 sm:px-4 py-3">Currency</TableHead> <TableHead className="px-2 sm:px-4 py-3">Notes</TableHead> <TableHead className="text-center px-2 sm:px-4 py-3">Actions</TableHead> </TableRow> );
      rows = servicePrices.map(renderTransferRow);
      break;
    case 'meal':
      headers = ( <TableRow> <TableHead className="px-2 sm:px-4 py-3">Meal Name</TableHead> <TableHead className="px-2 sm:px-4 py-3">Province</TableHead> <TableHead className="px-2 sm:px-4 py-3">Type</TableHead> <TableHead className="text-right px-2 sm:px-4 py-3">Adult Price</TableHead> <TableHead className="text-right px-2 sm:px-4 py-3">Child Price</TableHead> <TableHead className="px-2 sm:px-4 py-3">Currency</TableHead> <TableHead className="px-2 sm:px-4 py-3">Notes</TableHead> <TableHead className="text-center px-2 sm:px-4 py-3">Actions</TableHead> </TableRow> );
      rows = servicePrices.map(service => renderSimpleRow(service, "Meal"));
      break;
    case 'misc':
      headers = ( <TableRow> <TableHead className="px-2 sm:px-4 py-3">Item Name</TableHead> <TableHead className="px-2 sm:px-4 py-3">Province</TableHead> <TableHead className="px-2 sm:px-4 py-3">Type</TableHead> <TableHead className="text-right px-2 sm:px-4 py-3">Unit Cost</TableHead> <TableHead className="text-right px-2 sm:px-4 py-3">Secondary Cost</TableHead> <TableHead className="px-2 sm:px-4 py-3">Currency</TableHead> <TableHead className="px-2 sm:px-4 py-3">Notes</TableHead> <TableHead className="text-center px-2 sm:px-4 py-3">Actions</TableHead> </TableRow> );
      rows = servicePrices.map(service => renderSimpleRow(service, "Misc"));
      break;
    case 'all':
    default:
      headers = ( <TableRow> <TableHead className="w-[150px] min-w-[120px] sm:w-[200px] sm:min-w-[150px] px-2 sm:px-4 py-3">Name</TableHead> <TableHead className="px-2 sm:px-4 py-3">Province</TableHead> <TableHead className="px-2 sm:px-4 py-3">Category</TableHead> <TableHead className="min-w-[120px] sm:min-w-[150px] px-2 sm:px-4 py-3">Details</TableHead> <TableHead className="text-right min-w-[120px] sm:min-w-[150px] px-2 sm:px-4 py-3">Base Rate / Info</TableHead> <TableHead className="px-2 sm:px-4 py-3">Currency</TableHead> <TableHead className="min-w-[100px] sm:min-w-[150px] px-2 sm:px-4 py-3">Notes</TableHead> <TableHead className="text-center w-[100px] sm:w-[120px] px-2 sm:px-4 py-3">Actions</TableHead> </TableRow> );
      rows = servicePrices.map(renderAllModeRow);
      break;
  }
  const colSpan = displayMode === 'all' ? 8 : (displayMode === 'transfer' ? 9 : 8);


  return (
    <div className="rounded-lg border shadow-sm overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          {headers}
        </TableHeader>
        <TableBody>
          {servicePrices.length > 0 ? rows : (
            <TableRow>
                <TableCell colSpan={colSpan} className="text-center h-24 text-muted-foreground text-sm sm:text-base">
                    No services to display for this category.
                </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
