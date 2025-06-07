
"use client";

import type { TripData, CostSummary } from '@/types/itinerary';
import { DetailsSummaryTable } from './details-summary-table';
import { CostBreakdownTable } from './cost-breakdown-table';
import { formatCurrency } from '@/lib/utils';
import { CalendarDays, Users, MapPin } from 'lucide-react';

interface PrintLayoutProps {
  tripData: TripData;
  costSummary: CostSummary;
  showCosts: boolean;
}

export function PrintLayout({ tripData, costSummary, showCosts }: PrintLayoutProps) {
  const currentDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const displayStartDate = tripData.settings.startDate ? new Date(tripData.settings.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';


  return (
    <div className="print-container p-4 md:p-0"> {/* Ensure no padding on print */}
      {/* Print Header - hidden by default, shown by print CSS */}
      <div className="print-header-display hidden">
        <div className="text-3xl font-bold font-headline text-primary mb-2">TRAVEL PRO</div>
        <div className="text-xs text-muted-foreground">
          123 Travel Street, Bangkok 10100, Thailand<br />
          Tel: +66 2 123 4567 | Email: info@travelpro.com<br />
          Website: www.travelpro.com | Tax ID: 1234567890
        </div>
        <div className="text-right text-xs text-muted-foreground mt-4">
          Generated on: {currentDate}
        </div>
      </div>

      {/* Main Content for Print */}
      <div className="print-content">
        <h1 className="text-2xl font-bold font-headline text-center my-6 text-primary">
          Travel Itinerary {showCosts ? "Cost Summary" : "Details"}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6 p-4 bg-secondary/30 rounded-lg border border-secondary print:bg-slate-100 print:border-slate-300">
            <div className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" /> <strong>Days:</strong><span className="ml-1 font-code">{tripData.settings.numDays}</span></div>
            <div className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> <strong>Adults:</strong><span className="ml-1 font-code">{tripData.pax.adults}</span>, <strong>Children:</strong><span className="ml-1 font-code">{tripData.pax.children}</span></div>
            <div className="flex items-center col-span-1 sm:col-span-2"><MapPin className="mr-2 h-5 w-5 text-primary" /> <strong>Start Date:</strong><span className="ml-1 font-code">{displayStartDate}</span></div>
             <div className="flex items-center col-span-1 sm:col-span-2"><Users className="mr-2 h-5 w-5 text-primary" /> <strong>Currency:</strong><span className="ml-1 font-code">{tripData.pax.currency}</span>
                {showCosts && tripData.settings.budget && (<span className="ml-4"><strong>Budget:</strong> <span className="ml-1 font-code">{formatCurrency(tripData.settings.budget, tripData.pax.currency)}</span></span>)}
            </div>
        </div>

        {showCosts && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3 border-b pb-2 text-primary">Per-Person Cost Breakdown</h2>
            <CostBreakdownTable summary={costSummary} currency={tripData.pax.currency} travelers={tripData.travelers} showCosts={showCosts} />
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold mb-3 border-b pb-2 text-primary">Detailed Itinerary Summary</h2>
          <DetailsSummaryTable summary={costSummary} currency={tripData.pax.currency} showCosts={showCosts} />
        </section>
      </div>

      {/* Print Footer - hidden by default, shown by print CSS */}
      <div className="print-footer-display hidden">
        <div>Thank you for choosing Travel Pro for your travel needs.</div>
        <div>This is a computer-generated document and does not require a signature.</div>
        <div>&copy; {new Date().getFullYear()} Travel Pro. All rights reserved.</div>
      </div>
    </div>
  );
}
