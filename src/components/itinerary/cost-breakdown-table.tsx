/**
 * @fileoverview This component renders a table displaying the cost breakdown
 * per traveler for an itinerary. It takes the cost summary, currency, and list
 * of travelers as props, and shows individual totals and the grand total.
 * It also has an option to hide/show cost details.
 *
 * @bangla এই কম্পোনেন্টটি একটি ভ্রমণপথের জন্য প্রতি ভ্রমণকারীর খরচ ভাঙ্গন প্রদর্শনকারী
 * একটি টেবিল রেন্ডার করে। এটি খরচের সারাংশ, মুদ্রা এবং ভ্রমণকারীদের তালিকা props
 * হিসেবে গ্রহণ করে এবং ব্যক্তিগত মোট এবং গ্র্যান্ড টোটাল দেখায়। এটিতে খরচের বিবরণ
 * লুকানো/দেখানোর একটি বিকল্পও রয়েছে।
 */
"use client";

import * as React from 'react';
import type { CostSummary, CurrencyCode, Traveler } from '@/types/itinerary';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

interface CostBreakdownTableProps {
  summary: CostSummary;
  currency: CurrencyCode;
  travelers: Traveler[];
  showCosts: boolean;
}

function CostBreakdownTableComponent({ summary, currency, travelers, showCosts }: CostBreakdownTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Traveler</TableHead>
          {showCosts && <TableHead className="text-right">Total Cost</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {travelers.length > 0
          ? travelers.map(traveler => (
            <TableRow key={traveler.id}>
              <TableCell className="font-medium">{traveler.label}</TableCell>
              {showCosts && (
                <TableCell className="text-right font-code">
                  {formatCurrency(summary.perPersonTotals[traveler.id] || 0, currency)}
                </TableCell>
              )}
            </TableRow>
            ))
          : (
            <TableRow>
              <TableCell colSpan={showCosts ? 2 : 1} className="text-center text-muted-foreground">No travelers defined.</TableCell>
            </TableRow>
            )}
      </TableBody>
      {showCosts && (
        <TableFooter>
          <TableRow className="bg-muted/50">
            <TableHead>Grand Total</TableHead>
            <TableHead className="text-right text-lg font-bold text-accent font-code">
              {formatCurrency(summary.grandTotal, currency)}
            </TableHead>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}

export const CostBreakdownTable = React.memo(CostBreakdownTableComponent);
