
"use client";

import * as React from 'react';
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { XIcon, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isWithinInterval, isValid } from 'date-fns';
import type { ActivityPackageDefinition } from '@/types/itinerary';
import { cn } from '@/lib/utils';

type SchedulingData = Pick<ActivityPackageDefinition, 'validityStartDate' | 'validityEndDate' | 'closedWeekdays' | 'specificClosedDates'>;

interface ActivityPackageSchedulerProps {
  packageId: string; // For unique IDs within form elements
  initialSchedulingData: SchedulingData;
  onSchedulingChange: (newSchedulingData: SchedulingData) => void;
}

const WEEKDAYS = [
  { id: 0, label: 'Sun' }, { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' }, { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' }
];

export function ActivityPackageScheduler({ packageId, initialSchedulingData, onSchedulingChange }: ActivityPackageSchedulerProps) {
  const [validityStart, setValidityStart] = React.useState<Date | undefined>(initialSchedulingData.validityStartDate ? parseISO(initialSchedulingData.validityStartDate) : undefined);
  const [validityEnd, setValidityEnd] = React.useState<Date | undefined>(initialSchedulingData.validityEndDate ? parseISO(initialSchedulingData.validityEndDate) : undefined);
  const [closedWeekdays, setClosedWeekdays] = React.useState<number[]>(initialSchedulingData.closedWeekdays || []);
  const [specificClosedDates, setSpecificClosedDates] = React.useState<string[]>(initialSchedulingData.specificClosedDates || []);
  const [specificDateInput, setSpecificDateInput] = React.useState<Date | undefined>(undefined);

  const [currentDisplayDate, setCurrentDisplayDate] = React.useState<Date>(validityStart || new Date());

  React.useEffect(() => {
    const newSchedulingData: SchedulingData = {
      validityStartDate: validityStart ? format(validityStart, 'yyyy-MM-dd') : undefined,
      validityEndDate: validityEnd ? format(validityEnd, 'yyyy-MM-dd') : undefined,
      closedWeekdays: closedWeekdays.length > 0 ? [...closedWeekdays].sort((a,b) => a-b) : undefined,
      specificClosedDates: specificClosedDates.length > 0 ? [...specificClosedDates].sort() : undefined,
    };
    onSchedulingChange(newSchedulingData);
  }, [validityStart, validityEnd, closedWeekdays, specificClosedDates, onSchedulingChange]);

  const handleWeekdayToggle = (dayIndex: number) => {
    setClosedWeekdays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleAddSpecificDate = () => {
    if (specificDateInput) {
      const isoDate = format(specificDateInput, 'yyyy-MM-dd');
      if (!specificClosedDates.includes(isoDate)) {
        setSpecificClosedDates(prev => [...prev, isoDate].sort());
      }
      setSpecificDateInput(undefined); // Clear input
    }
  };

  const handleRemoveSpecificDate = (dateToRemove: string) => {
    setSpecificClosedDates(prev => prev.filter(d => d !== dateToRemove));
  };

  const handleCalendarDayClick = (day: Date) => {
    const isoDate = format(day, 'yyyy-MM-dd');
    // Only toggle if within validity period
    if (validityStart && validityEnd && isWithinInterval(day, { start: validityStart, end: validityEnd })) {
      setSpecificClosedDates(prev =>
        prev.includes(isoDate) ? prev.filter(d => d !== isoDate) : [...prev, isoDate].sort()
      );
    }
  };

  const getDayStatus = (date: Date): { status: 'open' | 'closed-weekday' | 'closed-specific' | 'invalid-range'; reason: string } => {
    const isoDate = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);

    if (validityStart && validityEnd) {
      if (!isWithinInterval(date, { start: validityStart, end: validityEnd })) {
        return { status: 'invalid-range', reason: 'Outside validity' };
      }
    } else if (validityStart && date < validityStart) {
        return { status: 'invalid-range', reason: 'Before validity start' };
    } else if (validityEnd && date > validityEnd) {
        return { status: 'invalid-range', reason: 'After validity end' };
    }


    if (specificClosedDates.includes(isoDate)) {
      return { status: 'closed-specific', reason: 'Specifically Closed' };
    }
    if (closedWeekdays.includes(dayOfWeek)) {
      return { status: 'closed-weekday', reason: `Closed (${WEEKDAYS.find(wd => wd.id === dayOfWeek)?.label})` };
    }
    return { status: 'open', reason: 'Open' };
  };

  const monthStart = startOfMonth(currentDisplayDate);
  const monthEnd = endOfMonth(currentDisplayDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOffset = getDay(monthStart);


  return (
    <div className="space-y-6 p-3 border rounded-md bg-muted/20 my-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`validityStart-${packageId}`} className="text-xs">Price Valid From</Label>
          <DatePicker
            date={validityStart}
            onDateChange={setValidityStart}
            placeholder="Set start date"
          />
        </div>
        <div>
          <Label htmlFor={`validityEnd-${packageId}`} className="text-xs">Price Valid To</Label>
          <DatePicker
            date={validityEnd}
            onDateChange={setValidityEnd}
            minDate={validityStart}
            placeholder="Set end date"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1 block">Recurring Weekday Closures</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 text-sm">
          {WEEKDAYS.map(weekday => (
            <div key={weekday.id} className="flex items-center space-x-2">
              <Checkbox
                id={`weekday-${packageId}-${weekday.id}`}
                checked={closedWeekdays.includes(weekday.id)}
                onCheckedChange={() => handleWeekdayToggle(weekday.id)}
              />
              <Label htmlFor={`weekday-${packageId}-${weekday.id}`} className="font-normal cursor-pointer">{weekday.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor={`specificDate-${packageId}`} className="text-xs">Specific Closed Dates</Label>
        <div className="flex items-center gap-2">
          <DatePicker date={specificDateInput} onDateChange={setSpecificDateInput} placeholder="Add a specific closed date" />
          <Button type="button" size="sm" onClick={handleAddSpecificDate} disabled={!specificDateInput}>Add</Button>
        </div>
        {specificClosedDates.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {specificClosedDates.map(dateStr => (
              <Badge key={dateStr} variant="secondary" className="font-normal pr-1">
                {format(parseISO(dateStr), 'dd-MM-yy')}
                <button type="button" onClick={() => handleRemoveSpecificDate(dateStr)} className="ml-1.5 p-0.5 rounded-full hover:bg-destructive/20">
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDisplayDate(subMonths(currentDisplayDate, 1))} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium text-center">
            {format(currentDisplayDate, 'MMMM yyyy')}
          </div>
          <Button variant="outline" size="icon" onClick={() => setCurrentDisplayDate(addMonths(currentDisplayDate, 1))} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
         <Button variant="link" size="sm" onClick={() => setCurrentDisplayDate(new Date())} className="text-xs mb-2">Jump to Today</Button>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map(day => <div key={day.id}>{day.label}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px border-t border-l mt-1">
          {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} className="border-r border-b h-10 sm:h-12 bg-muted/10"></div>)}
          {daysInMonth.map(day => {
            const dayStatus = getDayStatus(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                onClick={() => handleCalendarDayClick(day)}
                title={dayStatus.reason}
                className={cn(
                  "border-r border-b p-1 text-xs h-10 sm:h-12 flex flex-col items-center justify-center relative transition-colors",
                  dayStatus.status === 'invalid-range' && "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed",
                  dayStatus.status === 'closed-weekday' && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                  dayStatus.status === 'closed-specific' && "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
                  dayStatus.status === 'open' && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50 cursor-pointer",
                  dayStatus.status !== 'invalid-range' && "hover:ring-1 hover:ring-primary",
                  isToday && "ring-2 ring-accent ring-offset-1"
                )}
              >
                <span className={cn("font-medium", isToday && "font-bold")}>{format(day, 'd')}</span>
                {/* <span className="text-[0.6rem] hidden sm:block truncate">{dayStatus.reason}</span> */}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
