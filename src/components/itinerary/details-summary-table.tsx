
"use client";
import React from 'react';
import type { CostSummary, CurrencyCode, DetailedSummaryItem, HotelOccupancyDetail } from '@/types/itinerary';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

interface DetailsSummaryTableProps {
  summary: CostSummary;
  currency: CurrencyCode;
  showCosts: boolean;
}

export function DetailsSummaryTable({ summary, currency, showCosts }: DetailsSummaryTableProps) {
  const renderItemRow = (item: DetailedSummaryItem, isPrintView: boolean = false) => (
    <React.Fragment key={`${item.id}-${isPrintView ? 'print' : 'screen'}-${showCosts ? 'costs' : 'no-costs'}`}>
      <TableRow className={isPrintView ? 'print-details-item' : ''}>
        <TableCell className="font-medium">{item.type}</TableCell>
        <TableCell>{item.day && !isPrintView ? `(Day ${item.day}) ` : ''}{item.name}</TableCell>
        <TableCell className="text-xs text-muted-foreground">{item.note}</TableCell>
        <TableCell className="text-xs font-code whitespace-pre-wrap max-w-xs">{item.configurationDetails}</TableCell>
        {!isPrintView && <TableCell className="text-xs">{item.excludedTravelers}</TableCell>}
        {showCosts && !isPrintView && <TableCell className="text-right font-code">{formatCurrency(item.adultCost, currency)}</TableCell>}
        {showCosts && !isPrintView && <TableCell className="text-right font-code">{formatCurrency(item.childCost, currency)}</TableCell>}
        {showCosts && <TableCell className="text-right font-semibold font-code">{formatCurrency(item.totalCost, currency)}</TableCell>}
      </TableRow>
      {item.occupancyDetails && item.occupancyDetails.map((occDetail: HotelOccupancyDetail, index) => ( // Ensure occDetail is typed
        <TableRow 
            key={`${item.id}-occ-${index}-${isPrintView ? 'print' : 'screen'}-${showCosts ? 'costs' : 'no-costs'}`} 
            className={`bg-muted/30 text-xs ${isPrintView ? 'print-hotel-occupancy-detail-item' : 'hotel-occupancy-detail-item'}`}
        >
          <TableCell></TableCell>
          <TableCell className="pl-6">└ Room Type: {occDetail.roomTypeName}</TableCell>
          <TableCell>#Rooms: {occDetail.numRooms}, Nights: {occDetail.nights}</TableCell>
          <TableCell className="font-code whitespace-pre-wrap max-w-xs">
            {occDetail.characteristics && `Details: ${occDetail.characteristics}`}<br/>
            {occDetail.assignedTravelerLabels && <><br/>Assigned: {occDetail.assignedTravelerLabels}</>}
          </TableCell>
          {!isPrintView && <TableCell></TableCell>}
          {showCosts && !isPrintView && <TableCell></TableCell>}
          {showCosts && !isPrintView && <TableCell></TableCell>}
          {showCosts && <TableCell className="text-right font-code">{formatCurrency(occDetail.totalRoomBlockCost, currency)}</TableCell>}
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

  const screenColSpan = showCosts ? 8 : 5;
  const printColSpan = showCosts ? 5 : 4;
  const screenTotalLabelColSpan = showCosts ? 7 : 4;
  const printTotalLabelColSpan = showCosts ? 4 : 3;

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
            {showCosts && <TableHead className="text-right">Adult Cost</TableHead>}
            {showCosts && <TableHead className="text-right">Child Cost</TableHead>}
            {showCosts && <TableHead className="text-right">Total Cost</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedItems).length > 0
            ? Object.entries(groupedItems).map(([type, items]) => (
              <React.Fragment key={`${type}-screen`}>
                <TableRow className="bg-muted font-semibold category-summary-header">
                  <TableCell colSpan={screenColSpan} className="text-secondary-foreground py-3">{type}</TableCell>
                </TableRow>
                {items.map(item => renderItemRow(item, false))}
              </React.Fragment>
              ))
            : (
              <TableRow>
                <TableCell colSpan={screenColSpan} className="text-center text-muted-foreground h-24">No items added to the itinerary yet.</TableCell>
              </TableRow>
              )}
        </TableBody>
        {showCosts && (
          <TableFooter>
            <TableRow className="bg-muted/80">
              <TableHead colSpan={screenTotalLabelColSpan} className="text-right font-bold">Grand Total</TableHead>
              <TableHead className="text-right text-xl font-bold text-accent font-code">
                {formatCurrency(summary.grandTotal, currency)}
              </TableHead>
            </TableRow>
          </TableFooter>
        )}
      </Table>
      {!showCosts && <p className="text-center text-muted-foreground mt-4">Cost details are hidden.</p>}
    </div>

    {/* Print View Table */}
    <div className="print-only hidden">
       <Table id="details-table">
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Name/Description</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Configuration Details</TableHead>
            {showCosts && <TableHead className="text-right">Total Cost</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedItems).length > 0
             ? Object.entries(groupedItems).map(([type, items]) => (
               <React.Fragment key={`${type}-print`}>
                <TableRow className="bg-muted font-semibold category-summary-header">
                  <TableCell colSpan={printColSpan} className="text-secondary-foreground py-2">{type}</TableCell>
                </TableRow>
                {items.map(item => renderItemRow(item, true))}
              </React.Fragment>
             ))
            : (
              <TableRow>
                <TableCell colSpan={printColSpan} className="text-center text-muted-foreground h-24">No items in the itinerary.</TableCell>
              </TableRow>
              )}
        </TableBody>
        {showCosts && (
          <TableFooter>
            <TableRow className="bg-muted/80">
              <TableHead colSpan={printTotalLabelColSpan} className="text-right font-bold">Grand Total</TableHead>
              <TableHead className="text-right text-xl font-bold text-accent font-code">
                {formatCurrency(summary.grandTotal, currency)}
              </TableHead>
            </TableRow>
          </TableFooter>
        )}
      </Table>
      {!showCosts && <p className="text-center text-muted-foreground mt-4 print:block hidden">Cost details are hidden.</p>}
    </div>
    </>
  );
}
