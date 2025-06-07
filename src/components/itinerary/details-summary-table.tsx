
"use client";
import * as React from 'react'; // Added React import
import type { CostSummary, CurrencyCode, DetailedSummaryItem } from '@/types/itinerary';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

interface DetailsSummaryTableProps {
  summary: CostSummary;
  currency: CurrencyCode;
}

export function DetailsSummaryTable({ summary, currency }: DetailsSummaryTableProps) {
  const renderItemRow = (item: DetailedSummaryItem, isPrintView: boolean = false) => (
    <React.Fragment key={`${item.id}-${isPrintView ? 'print' : 'screen'}`}>
      <TableRow className={isPrintView ? 'print-details-item' : ''}>
        <TableCell className="font-medium">{item.type}</TableCell>
        <TableCell>{item.day && !isPrintView ? `(Day ${item.day}) ` : ''}{item.name}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{item.note}</TableCell>
        <TableCell className="text-xs font-code whitespace-pre-wrap max-w-xs">{item.configurationDetails}</TableCell>
        <TableCell className="text-xs">{item.excludedTravelers}</TableCell>
        <TableCell className="text-right font-code">{formatCurrency(item.adultCost, currency)}</TableCell>
        <TableCell className="text-right font-code">{formatCurrency(item.childCost, currency)}</TableCell>
        <TableCell className="text-right font-semibold font-code">{formatCurrency(item.totalCost, currency)}</TableCell>
      </TableRow>
      {item.occupancyDetails && item.occupancyDetails.map((occDetail, index) => (
        <TableRow key={`${item.id}-occ-${index}-${isPrintView ? 'print' : 'screen'}`} className={`bg-muted/30 text-xs ${isPrintView ? 'print-hotel-occupancy-detail-item' : 'hotel-occupancy-detail-item'}`}>
          <TableCell></TableCell>
          <TableCell className="pl-6">└ Room: {occDetail.roomCategory}</TableCell>
          <TableCell>#R: {occDetail.numRooms}, Nights: {occDetail.nights}</TableCell>
          <TableCell className="font-code whitespace-pre-wrap max-w-xs">
            Type: {occDetail.roomType}, Ad: {occDetail.adults}, Ch: {occDetail.children}, EB: {occDetail.extraBeds}<br/>
            R.Rate: {formatCurrency(occDetail.roomRate, currency)}, EB Rate: {formatCurrency(occDetail.extraBedRate, currency)}
            {occDetail.assignedTravelerLabels && <><br/>Assigned: {occDetail.assignedTravelerLabels}</>}
          </TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell></TableCell>
          <TableCell className="text-right font-code">{formatCurrency(occDetail.totalOccupancyCost, currency)}</TableCell>
        </TableRow>
      ))}
    </React.Fragment>
  );

  const groupedItems: { [type: string]: DetailedSummaryItem[] } = {};
  summary.detailedItems.forEach(item => {
    if (!groupedItems[item.type]) {
      groupedItems[item.type] = [];
    }
    groupedItems[item.type].push(item);
  });


  return (
    <>
    {/* Screen View Table */}
    <div className="no-print">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Name/Description</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Configuration Details</TableHead>
            <TableHead>Excluded Travelers</TableHead>
            <TableHead className="text-right">Adult Cost</TableHead>
            <TableHead className="text-right">Child Cost</TableHead>
            <TableHead className="text-right">Total Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedItems).length > 0 ? (
            Object.entries(groupedItems).map(([type, items]) => (
              <React.Fragment key={type}>
                <TableRow className="bg-secondary/50 category-summary-header">
                  <TableCell colSpan={8} className="font-bold text-secondary-foreground">{type}</TableCell>
                </TableRow>
                {items.map(item => renderItemRow(item, false))}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground h-24">No items added to the itinerary yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/80">
            <TableHead colSpan={7} className="text-right font-bold">Grand Total</TableHead>
            <TableHead className="text-right text-xl font-bold text-accent font-code">
              {formatCurrency(summary.grandTotal, currency)}
            </TableHead>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
    {/* Print View Table (simplified) - This will be shown by print CSS */}
    <div className="print-only hidden">
       <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Name/Description</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Configuration Details</TableHead>
            {/* Excluded travelers, adult/child cost might be too much for print, can be re-added if needed */}
            <TableHead className="text-right">Total Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedItems).length > 0 ? (
             Object.entries(groupedItems).map(([type, items]) => (
              <React.Fragment key={`${type}-print`}>
                <TableRow className="bg-secondary/50 category-summary-header">
                  <TableCell colSpan={5} className="font-bold text-secondary-foreground">{type}</TableCell>
                </TableRow>
                {items.map(item => (
                  <React.Fragment key={`${item.id}-print-detail`}>
                  <TableRow className='print-details-item'>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.name}</TableCell> {/* Day prefix removed for print */}
                    <TableCell className="text-xs text-muted-foreground">{item.note}</TableCell>
                    <TableCell className="text-xs font-code whitespace-pre-wrap max-w-xs">{item.configurationDetails}</TableCell>
                    <TableCell className="text-right font-semibold font-code">{formatCurrency(item.totalCost, currency)}</TableCell>
                  </TableRow>
                  {item.occupancyDetails && item.occupancyDetails.map((occDetail, index) => (
                    <TableRow key={`${item.id}-occ-${index}-print`} className={`bg-muted/30 text-xs print-hotel-occupancy-detail-item`}>
                      <TableCell></TableCell>
                      <TableCell className="pl-6">└ Room: {occDetail.roomCategory}</TableCell>
                      <TableCell>#R: {occDetail.numRooms}, Nights: {occDetail.nights}</TableCell>
                      <TableCell className="font-code whitespace-pre-wrap max-w-xs">
                        Type: {occDetail.roomType}, Ad: {occDetail.adults}, Ch: {occDetail.children}, EB: {occDetail.extraBeds}
                        {occDetail.assignedTravelerLabels && <><br/>Assigned: {occDetail.assignedTravelerLabels}</>}
                      </TableCell>
                      <TableCell className="text-right font-code">{formatCurrency(occDetail.totalOccupancyCost, currency)}</TableCell>
                    </TableRow>
                  ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground h-24">No items in the itinerary.</TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/80">
            <TableHead colSpan={4} className="text-right font-bold">Grand Total</TableHead>
            <TableHead className="text-right text-xl font-bold text-accent font-code">
              {formatCurrency(summary.grandTotal, currency)}
            </TableHead>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
    </>
  );
}
