/**
 * @fileoverview This component renders a detailed table summarizing all items in an itinerary.
 * It groups items by category (e.g., Hotels, Activities, Transfers) and displays key details
 * for each item, including name, notes, configuration, excluded travelers, and costs (if shown).
 * It is designed to provide a comprehensive overview for both screen and print views.
 *
 * @bangla এই কম্পোনেন্টটি একটি ভ্রমণপথের সমস্ত আইটেমের সারসংক্ষেপ একটি বিস্তারিত টেবিল রেন্ডার করে।
 * এটি আইটেমগুলিকে বিভাগ অনুসারে (যেমন, হোটেল, কার্যকলাপ, ট্রান্সফার) গ্রুপ করে এবং প্রতিটি
 * আইটেমের জন্য মূল বিবরণ প্রদর্শন করে, যার মধ্যে নাম, নোট, কনফিগারেশন, বাদ দেওয়া ভ্রমণকারী
 * এবং খরচ (যদি দেখানো হয়) অন্তর্ভুক্ত। এটি স্ক্রিন এবং প্রিন্ট উভয় ভিউয়ের জন্য একটি
 * ব্যাপক ওভারভিউ প্রদানের জন্য ডিজাইন করা হয়েছে।
 */
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

function DetailsSummaryTableComponent({ summary, currency, showCosts }: DetailsSummaryTableProps) {
  const renderItemRow = (item: DetailedSummaryItem, isPrintContext: boolean = false) => {
    const configDetailsArray = item.configurationDetails?.split(';').map(d => d.trim()).filter(Boolean) || [];

    return (
      <React.Fragment key={`${item.id}-${isPrintContext ? 'print' : 'screen'}-${showCosts ? 'costs' : 'no-costs'}`}>
        <TableRow className={isPrintContext ? 'print-details-item' : ''}>
          <TableCell className="font-medium align-top">{item.type}</TableCell>
          <TableCell className="align-top">
            {item.day && !isPrintContext ? `(Day ${item.day}) ` : ''}
            {item.name}
            {item.province && <div className="text-xs text-muted-foreground">Loc: {item.province}{item.countryName ? `, ${item.countryName}` : ''}</div>}
          </TableCell>
          <TableCell className="text-xs text-muted-foreground align-top">{item.note || '-'}</TableCell>
          <TableCell className="text-xs font-code align-top">
            {configDetailsArray.length > 0 ? (
              configDetailsArray.map((detail, idx) => (
                <div key={idx} className="whitespace-normal break-words">{detail}</div>
              ))
            ) : '-'}
          </TableCell>
          {!isPrintContext && <TableCell className="text-xs align-top">{item.excludedTravelers || 'All Included'}</TableCell>}
          {showCosts && !isPrintContext && <TableCell className="text-right font-code align-top">{formatCurrency(item.adultCost, currency)}</TableCell>}
          {showCosts && !isPrintContext && <TableCell className="text-right font-code align-top">{formatCurrency(item.childCost, currency)}</TableCell>}
          {showCosts && <TableCell className="text-right font-semibold font-code align-top">{formatCurrency(item.totalCost, currency)}</TableCell>}
        </TableRow>
        {item.occupancyDetails && item.occupancyDetails.map((occDetail: HotelOccupancyDetail, index) => {
          const characteristicsArray = occDetail.characteristics?.split(';').map(d => d.trim()).filter(Boolean) || [];
          return (
            <TableRow 
                key={`${item.id}-occ-${index}-${isPrintContext ? 'print' : 'screen'}-${showCosts ? 'costs' : 'no-costs'}`} 
                className={`bg-muted/30 text-xs ${isPrintContext ? 'print-hotel-occupancy-detail-item' : 'hotel-occupancy-detail-item'}`}
            >
              <TableCell className="py-1 pl-4 align-top"></TableCell> {/* Indent for sub-item */}
              <TableCell className="py-1 pl-4 align-top italic">└ Room: {occDetail.roomTypeName}</TableCell>
              <TableCell className="py-1 align-top">#Rooms: {occDetail.numRooms}, Nights: {occDetail.nights} {occDetail.extraBedAdded ? '(Incl. Extra Bed)' : ''}</TableCell>
              <TableCell className="py-1 font-code align-top">
                {characteristicsArray.length > 0 && (
                  <div>
                    <span className="font-medium">Details:</span>
                    {characteristicsArray.map((char, idx) => (
                      <div key={idx} className="ml-2 whitespace-normal break-words">{char}</div>
                    ))}
                  </div>
                )}
                {occDetail.assignedTravelerLabels && (
                  <div className="mt-1">
                    <span className="font-medium">Assigned:</span> {occDetail.assignedTravelerLabels}
                  </div>
                )}
              </TableCell>
              {!isPrintContext && <TableCell className="py-1 align-top"></TableCell>}
              {showCosts && !isPrintContext && <TableCell className="py-1 align-top"></TableCell>}
              {showCosts && !isPrintContext && <TableCell className="py-1 align-top"></TableCell>}
              {showCosts && <TableCell className="text-right font-code py-1 align-top">{formatCurrency(occDetail.totalRoomBlockCost, currency)}</TableCell>}
            </TableRow>
          );
        })}
      </React.Fragment>
    );
  };

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
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="min-w-[200px]">Name/Description</TableHead>
            <TableHead className="min-w-[150px]">Note</TableHead>
            <TableHead className="min-w-[250px]">Configuration Details</TableHead>
            <TableHead className="w-[120px]">Excluded Travelers</TableHead>
            {showCosts && <TableHead className="text-right w-[100px]">Adult Cost</TableHead>}
            {showCosts && <TableHead className="text-right w-[100px]">Child Cost</TableHead>}
            {showCosts && <TableHead className="text-right w-[120px]">Total Cost</TableHead>}
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

export const DetailsSummaryTable = React.memo(DetailsSummaryTableComponent);
