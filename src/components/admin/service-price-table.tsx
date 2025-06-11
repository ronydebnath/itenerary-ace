
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
    let displayUnit = service.unitDescription || 'N/A';
    let rateTooltipContent: React.ReactNode = null;

    if (service.category === 'hotel' && service.hotelDetails && service.hotelDetails.roomTypes.length > 0) {
      displayDetail = `${service.hotelDetails.roomTypes.length} room type(s)`;
      displayUnit = service.unitDescription || 'per night';
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
              <Badge variant="outline" className="ml-2 cursor-default border-primary/50 text-primary">
                <CalendarClock className="h-3 w-3 mr-1" /> Seasonal/Tiered
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>This hotel has seasonal and/or multi-room type pricing.</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (service.category === 'activity' && service.activityPackages && service.activityPackages.length > 0) {
      displayDetail = `${service.activityPackages.length} package(s)`;
      displayUnit = service.unitDescription || 'per person';
      let lowestPackagePrice: number | undefined = undefined;
      service.activityPackages.forEach(pkg => {
        if (lowestPackagePrice === undefined || pkg.price1 < lowestPackagePrice) lowestPackagePrice = pkg.price1;
      });
      displayPriceInfo = lowestPackagePrice !== undefined ? `From ${formatCurrency(lowestPackagePrice, service.currency)}` : (service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : "See Packages");
      rateTooltipContent = (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="ml-2 cursor-default border-indigo-500/50 text-indigo-600">
                <Package className="h-3 w-3 mr-1" /> Multi-Package
              </Badge>
            </TooltipTrigger>
            <TooltipContent><p>This activity has multiple packages with varying prices and schedules.</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (service.category === 'transfer') {
      if (service.transferMode === 'vehicle' && service.vehicleOptions && service.vehicleOptions.length > 0) {
        displayDetail = `${service.vehicleOptions.length} vehicle option(s)`;
        displayUnit = service.unitDescription || 'per service';
        let lowestVehiclePrice: number | undefined = undefined;
        service.vehicleOptions.forEach(vo => {
            if (lowestVehiclePrice === undefined || vo.price < lowestVehiclePrice) lowestVehiclePrice = vo.price;
        });
        displayPriceInfo = lowestVehiclePrice !== undefined ? `From ${formatCurrency(lowestVehiclePrice, service.currency)}` : 'See Options';
         rateTooltipContent = (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2 cursor-default border-blue-500/50 text-blue-600">
                    <Car className="h-3 w-3 mr-1" /> Multiple Vehicles
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold mb-1">Vehicle Options:</p>
                    {service.vehicleOptions.slice(0,3).map(vo => <li key={vo.id} className="text-xs">{vo.vehicleType}: {formatCurrency(vo.price, service.currency)} (Max: {vo.maxPassengers})</li>)}
                    {service.vehicleOptions.length > 3 && <li className="text-xs italic">...and more options.</li>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        if (service.surchargePeriods && service.surchargePeriods.length > 0) {
           const surchargeBadge = (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="ml-2 cursor-default border-orange-500/50 text-orange-600">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Surcharges
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This transfer route has date-based surcharges.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
          rateTooltipContent = <>{rateTooltipContent}{surchargeBadge}</>;
        }
      } else { // Ticket transfer
        displayDetail = "Ticket Basis";
        displayUnit = service.unitDescription || 'per person';
        displayPriceInfo = service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : "N/A";
      }
    }

    return (
      <TableRow key={service.id}>
        <TableCell className="font-medium">{service.name}</TableCell>
        <TableCell>{service.province || 'N/A'}</TableCell>
        <TableCell>{service.category.charAt(0).toUpperCase() + service.category.slice(1)}</TableCell>
        <TableCell>{displayDetail}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end font-code">
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
  };

  const renderHotelRow = (service: ServicePriceItem) => {
    let lowestRate: number | undefined = undefined;
    service.hotelDetails?.roomTypes.forEach(rt => {
        rt.seasonalPrices.forEach(sp => {
            if (lowestRate === undefined || sp.rate < lowestRate) lowestRate = sp.rate;
        });
    });
    const displayPriceInfo = lowestRate !== undefined ? `From ${formatCurrency(lowestRate, service.currency)}` : "N/A";
    const numRoomTypes = service.hotelDetails?.roomTypes.length || 0;

    return (
      <TableRow key={service.id}>
        <TableCell className="font-medium">{service.name}</TableCell>
        <TableCell>{service.province || 'N/A'}</TableCell>
        <TableCell className="text-center">{numRoomTypes}</TableCell>
        <TableCell className="text-right font-code">{displayPriceInfo}</TableCell>
        <TableCell>
            {numRoomTypes > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-2 cursor-default border-primary/50 text-primary">
                        <CalendarClock className="h-3 w-3 mr-1" /> Seasonal/Tiered
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-semibold mb-1">Room Types & Lowest Rates:</p>
                        {service.hotelDetails?.roomTypes.slice(0,5).map(rt => {
                            let minRtRate: number | undefined;
                            rt.seasonalPrices.forEach(sp => {
                                if (minRtRate === undefined || sp.rate < minRtRate) minRtRate = sp.rate;
                            });
                            return <p key={rt.id} className="text-xs">{rt.name}: From {minRtRate !== undefined ? formatCurrency(minRtRate, service.currency) : 'N/A'}</p>
                        })}
                        {numRoomTypes > 5 && <p className="text-xs italic">...and more room types.</p>}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            )}
        </TableCell>
        <TableCell>{service.currency}</TableCell>
        <TableCell>{service.unitDescription || 'per night'}</TableCell>
        <TableCell className="text-xs max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
        <TableCell className="text-center">
          <Button variant="ghost" size="icon" onClick={() => onEdit(service.id)} className="mr-2 text-primary hover:bg-primary/10">
            <Edit className="h-4 w-4" />
          </Button>
          {onDeleteConfirmation(service.id)}
        </TableCell>
      </TableRow>
    );
  };

  const renderActivityRow = (service: ServicePriceItem) => {
    let lowestPackagePrice: number | undefined = undefined;
    service.activityPackages?.forEach(pkg => {
        if (lowestPackagePrice === undefined || pkg.price1 < lowestPackagePrice) lowestPackagePrice = pkg.price1;
    });
    const displayPriceInfo = lowestPackagePrice !== undefined ? `From ${formatCurrency(lowestPackagePrice, service.currency)}` : (service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : "N/A");
    const numPackages = service.activityPackages?.length || 0;

    return (
      <TableRow key={service.id}>
        <TableCell className="font-medium">{service.name}</TableCell>
        <TableCell>{service.province || 'N/A'}</TableCell>
        <TableCell className="text-center">{numPackages}</TableCell>
        <TableCell className="text-right font-code">{displayPriceInfo}</TableCell>
        <TableCell>
            {numPackages > 0 && (
                 <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge variant="outline" className="ml-2 cursor-default border-indigo-500/50 text-indigo-600">
                            <Package className="h-3 w-3 mr-1" /> Multi-Package
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-semibold mb-1">Packages & Base Prices:</p>
                        {service.activityPackages?.slice(0,5).map(pkg => (
                            <p key={pkg.id} className="text-xs">{pkg.name}: {formatCurrency(pkg.price1, service.currency)}</p>
                        ))}
                        {numPackages > 5 && <p className="text-xs italic">...and more packages.</p>}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            )}
        </TableCell>
        <TableCell>{service.currency}</TableCell>
        <TableCell>{service.unitDescription || 'per person'}</TableCell>
        <TableCell className="text-xs max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
        <TableCell className="text-center">
          <Button variant="ghost" size="icon" onClick={() => onEdit(service.id)} className="mr-2 text-primary hover:bg-primary/10">
            <Edit className="h-4 w-4" />
          </Button>
          {onDeleteConfirmation(service.id)}
        </TableCell>
      </TableRow>
    );
  };

  const renderTransferRow = (service: ServicePriceItem) => {
     const isVehicle = service.transferMode === 'vehicle';
     let displayDetail = "Ticket Basis";
     let baseRate = service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : 'N/A';
     let optionsIndicator: React.ReactNode = null;

     if (isVehicle && service.vehicleOptions && service.vehicleOptions.length > 0) {
        displayDetail = `${service.vehicleOptions.length} vehicle option(s)`;
        let lowestPrice: number | undefined;
        service.vehicleOptions.forEach(vo => {
            if (lowestPrice === undefined || vo.price < lowestPrice) lowestPrice = vo.price;
        });
        baseRate = lowestPrice !== undefined ? `From ${formatCurrency(lowestPrice, service.currency)}` : "See Options";
        optionsIndicator = (
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="outline" className="ml-2 cursor-default border-blue-500/50 text-blue-600">
                        <Car className="h-3 w-3 mr-1" /> Options
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold mb-1">Vehicle Options:</p>
                    <ul className="list-none pl-1 text-xs">
                    {service.vehicleOptions.slice(0,5).map(vo => <li key={vo.id}>{vo.vehicleType}: {formatCurrency(vo.price, service.currency)} (Max: {vo.maxPassengers})</li>)}
                    {service.vehicleOptions.length > 5 && <li className="italic">...and more options.</li>}
                    </ul>
                </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
     } else if (isVehicle) { // Vehicle mode but no options defined (should not happen with validation)
        displayDetail = "Vehicle (No Options)";
        baseRate = "N/A";
     }


    return (
      <TableRow key={service.id}>
        <TableCell className="font-medium">{service.name}</TableCell>
        <TableCell>{service.province || 'N/A'}</TableCell>
        <TableCell>{service.transferMode === 'vehicle' ? 'Vehicle' : 'Ticket'}</TableCell>
        <TableCell>{displayDetail}</TableCell>
        <TableCell className="text-right font-code">{baseRate}</TableCell>
        <TableCell>
            {optionsIndicator}
            {isVehicle && service.surchargePeriods && service.surchargePeriods.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-2 cursor-default border-orange-500/50 text-orange-600">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Surcharges
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold mb-1">Surcharges Apply:</p>
                       <ul className="list-disc pl-4 mt-1 text-xs">
                        {service.surchargePeriods.slice(0,3).map(sp => <li key={sp.id}>{sp.name}: +{formatCurrency(sp.surchargeAmount, service.currency)} ({format(new Date(sp.startDate), 'dd MMM')} - {format(new Date(sp.endDate), 'dd MMM')})</li>)}
                        {service.surchargePeriods.length > 3 && <li>...and more</li>}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            )}
        </TableCell>
        <TableCell>{service.currency}</TableCell>
        <TableCell>{service.unitDescription || (isVehicle ? 'per service' : 'per person')}</TableCell>
        <TableCell className="text-xs max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
        <TableCell className="text-center">
          <Button variant="ghost" size="icon" onClick={() => onEdit(service.id)} className="mr-2 text-primary hover:bg-primary/10">
            <Edit className="h-4 w-4" />
          </Button>
          {onDeleteConfirmation(service.id)}
        </TableCell>
      </TableRow>
    );
  };

  const renderSimpleRow = (service: ServicePriceItem, typeLabel: string) => (
      <TableRow key={service.id}>
        <TableCell className="font-medium">{service.name}</TableCell>
        <TableCell>{service.province || 'N/A'}</TableCell>
        <TableCell>{service.subCategory || 'N/A'}</TableCell>
        <TableCell className="text-right font-code">{service.price1 !== undefined ? formatCurrency(service.price1, service.currency) : 'N/A'}</TableCell>
        <TableCell className="text-right font-code">{service.price2 !== undefined ? formatCurrency(service.price2, service.currency) : 'N/A'}</TableCell>
        <TableCell>{service.currency}</TableCell>
        <TableCell>{service.unitDescription || 'per item'}</TableCell>
        <TableCell className="text-xs max-w-xs truncate">{service.notes || 'N/A'}</TableCell>
        <TableCell className="text-center">
          <Button variant="ghost" size="icon" onClick={() => onEdit(service.id)} className="mr-2 text-primary hover:bg-primary/10">
            <Edit className="h-4 w-4" />
          </Button>
          {onDeleteConfirmation(service.id)}
        </TableCell>
      </TableRow>
  );


  let headers: React.ReactNode;
  let rows: React.ReactNode;

  switch (displayMode) {
    case 'hotel':
      headers = (
        <TableRow>
          <TableHead>Hotel Name</TableHead>
          <TableHead>Province</TableHead>
          <TableHead className="text-center">Room Types (#)</TableHead>
          <TableHead className="text-right">Base Rate (From)</TableHead>
          <TableHead>Pricing Model</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      );
      rows = servicePrices.map(renderHotelRow);
      break;
    case 'activity':
      headers = (
        <TableRow>
          <TableHead>Activity Name</TableHead>
          <TableHead>Province</TableHead>
          <TableHead className="text-center">Packages (#)</TableHead>
          <TableHead className="text-right">Base Price (From)</TableHead>
          <TableHead>Pricing Model</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      );
      rows = servicePrices.map(renderActivityRow);
      break;
    case 'transfer':
      headers = (
        <TableRow>
          <TableHead>Route Name</TableHead>
          <TableHead>Province</TableHead>
          <TableHead>Mode</TableHead>
          <TableHead>Details</TableHead>
          <TableHead className="text-right">Base Rate (From)</TableHead>
          <TableHead>Info / Surcharges</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      );
      rows = servicePrices.map(renderTransferRow);
      break;
    case 'meal':
      headers = (
        <TableRow>
          <TableHead>Meal Name</TableHead>
          <TableHead>Province</TableHead>
          <TableHead>Type/Sub-Category</TableHead>
          <TableHead className="text-right">Adult Price</TableHead>
          <TableHead className="text-right">Child Price</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      );
      rows = servicePrices.map(service => renderSimpleRow(service, "Meal"));
      break;
    case 'misc':
      headers = (
        <TableRow>
          <TableHead>Item Name</TableHead>
          <TableHead>Province</TableHead>
          <TableHead>Type/Sub-Category</TableHead>
          <TableHead className="text-right">Unit Cost</TableHead>
          <TableHead className="text-right">Secondary Cost</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      );
      rows = servicePrices.map(service => renderSimpleRow(service, "Misc"));
      break;
    case 'all':
    default:
      headers = (
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
      );
      rows = servicePrices.map(renderAllModeRow);
      break;
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          {headers}
        </TableHeader>
        <TableBody>
          {servicePrices.length > 0 ? rows : (
            <TableRow>
                <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">
                    No services to display for this category.
                </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
