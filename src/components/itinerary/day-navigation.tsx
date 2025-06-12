
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayNavigationProps {
  currentDayView: number;
  setCurrentDayView: React.Dispatch<React.SetStateAction<number>>;
  numDays: number;
  getFormattedDateForDay: (dayNum: number) => string;
}

export function DayNavigation({ currentDayView, setCurrentDayView, numDays, getFormattedDateForDay }: DayNavigationProps) {
  return (
    <>
      <div className="md:hidden mb-4 no-print">
        <Select value={String(currentDayView)} onValueChange={(val) => setCurrentDayView(Number(val))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Day" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: numDays }, (_, i) => i + 1).map(dayNum => (
              <SelectItem key={dayNum} value={String(dayNum)}>{getFormattedDateForDay(dayNum)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden md:flex justify-between items-center mb-6 p-3 bg-card border rounded-lg shadow-sm no-print">
        <Button
          onClick={() => setCurrentDayView(prev => Math.max(1, prev - 1))}
          disabled={currentDayView === 1}
          variant="outline"
        >
          <ChevronLeft className="h-5 w-5 mr-1" /> Previous Day
        </Button>
        <h2 className="text-xl font-semibold text-primary">{getFormattedDateForDay(currentDayView)}</h2>
        <Button
          onClick={() => setCurrentDayView(prev => Math.min(numDays, prev + 1))}
          disabled={currentDayView === numDays}
          variant="outline"
        >
          Next Day <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>
    </>
  );
}
