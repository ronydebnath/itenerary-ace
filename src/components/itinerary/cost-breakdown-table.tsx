
"use client";

import type { CostSummary, CurrencyCode, Traveler } from '@/types/itinerary';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

interface CostBreakdownTableProps {
  summary: CostSummary;
  currency: CurrencyCode;
  travelers: Traveler[];
  showCosts: boolean;
}

export function CostBreakdownTable({ summary, currency, travelers, showCosts }: CostBreakdownTableProps) {
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
