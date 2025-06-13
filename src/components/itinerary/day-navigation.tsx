/**
 * @fileoverview This component renders the day navigation controls for the itinerary planner.
 * It allows users to switch between different days of the itinerary using previous/next buttons
 * (on larger screens) or a select dropdown (on smaller screens). It dynamically displays
 * the formatted date for the currently viewed day.
 *
 * @bangla এই কম্পোনেন্টটি ভ্রমণপথ পরিকল্পনাকারীর জন্য দিন নেভিগেশন নিয়ন্ত্রণগুলি রেন্ডার করে।
 * এটি ব্যবহারকারীদের ভ্রমণপথের বিভিন্ন দিনের মধ্যে স্যুইচ করার অনুমতি দেয় পূর্ববর্তী/পরবর্তী
 * বোতাম ব্যবহার করে (বড় স্ক্রিনে) অথবা একটি সিলেক্ট ড্রপডাউন (ছোট স্ক্রিনে)। এটি গতিশীলভাবে
 * বর্তমানে দেখা দিনের জন্য ফরম্যাট করা তারিখ প্রদর্শন করে।
 */
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

function DayNavigationComponent({ currentDayView, setCurrentDayView, numDays, getFormattedDateForDay }: DayNavigationProps) {
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

export const DayNavigation = React.memo(DayNavigationComponent);
