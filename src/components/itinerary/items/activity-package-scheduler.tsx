
"use client";

import * as React from 'react';
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep if specificDateInput uses it, otherwise remove if DatePicker is enough
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { XIcon, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isWithinInterval, isValid, isEqual } from 'date-fns';
import type { ActivityPackageDefinition } from '@/types/itinerary';
import { cn } from '@/lib/utils';

type SchedulingData = Pick<ActivityPackageDefinition, 'validityStartDate' | 'validityEndDate' | 'closedWeekdays' | 'specificClosedDates'>;

interface ActivityPackageSchedulerProps {
  packageId: string;
  initialSchedulingData: SchedulingData; // This comes from react-hook-form's field.value
  onSchedulingChange: (newSchedulingData: SchedulingData) => void; // This is field.onChange
}

const WEEKDAYS = [
  { id: 0, label: 'Sun' }, { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' }, { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' }
];

export function ActivityPackageScheduler({ packageId, initialSchedulingData, onSchedulingChange }: ActivityPackageSchedulerProps) {
  // UI-specific state, not directly part of the form value
  const [currentDisplayDate, setCurrentDisplayDate] = React.useState<Date>(
    initialSchedulingData.validityStartDate ? parseISO(initialSchedulingData.validityStartDate) : new Date()
  );
  const [specificDateInput, setSpecificDateInput] = React.useState<Date | undefined>(undefined);

  // Derived values from props for rendering and logic
  const currentValidityStart = React.useMemo(() => 
    initialSchedulingData.validityStartDate ? parseISO(initialSchedulingData.validityStartDate) : undefined,
    [initialSchedulingData.validityStartDate]
  );
  const currentValidityEnd = React.useMemo(() =>
    initialSchedulingData.validityEndDate ? parseISO(initialSchedulingData.validityEndDate) : undefined,
    [initialSchedulingData.validityEndDate]
  );
  const currentClosedWeekdays = initialSchedulingData.closedWeekdays || [];
  const currentSpecificClosedDates = initialSchedulingData.specificClosedDates || [];


  const handleValidityStartChange = (date?: Date) => {
    const newStartDateString = date ? format(date, 'yyyy-MM-dd') : undefined;
    // Prevent update if the string representation is identical
    if (newStartDateString === initialSchedulingData.validityStartDate) return;

    onSchedulingChange({
      ...initialSchedulingData,
      validityStartDate: newStartDateString,
    });
  };

  const handleValidityEndChange = (date?: Date) => {
    const newEndDateString = date ? format(date, 'yyyy-MM-dd') : undefined;
    if (newEndDateString === initialSchedulingData.validityEndDate) return;

    onSchedulingChange({
      ...initialSchedulingData,
      validityEndDate: newEndDateString,
    });
  };

  const handleWeekdayToggle = (dayIndex: number) => {
    const newClosedWeekdays = currentClosedWeekdays.includes(dayIndex)
      ? currentClosedWeekdays.filter(d => d !== dayIndex)
      : [...currentClosedWeekdays, dayIndex].sort((a, b) => a - b);

    onSchedulingChange({
      ...initialSchedulingData,
      closedWeekdays: newClosedWeekdays.length > 0 ? newClosedWeekdays : undefined,
    });
  };

  const handleAddSpecificDate = () => {
    if (specificDateInput) {
      const isoDate = format(specificDateInput, 'yyyy-MM-dd');
      if (!currentSpecificClosedDates.includes(isoDate)) {
        const newSpecificClosedDates = [...currentSpecificClosedDates, isoDate].sort();
        onSchedulingChange({
          ...initialSchedulingData,
          specificClosedDates: newSpecificClosedDates,
        });
      }
      setSpecificDateInput(undefined);
    }
  };

  const handleRemoveSpecificDate = (dateToRemove: string) => {
    const newSpecificClosedDates = currentSpecificClosedDates.filter(d => d !== dateToRemove);
    onSchedulingChange({
      ...initialSchedulingData,
      specificClosedDates: newSpecificClosedDates.length > 0 ? newSpecificClosedDates : undefined,
    });
  };

  const handleCalendarDayClick = (day: Date) => {
    const isoDate = format(day, 'yyyy-MM-dd');
    if (currentValidityStart && currentValidityEnd && !isWithinInterval(day, { start: currentValidityStart, end: currentValidityEnd })) {
      return; // Do nothing if outside validity range
    }
    if (currentValidityStart && !currentValidityEnd && day < currentValidityStart) return;
    if (!currentValidityStart && currentValidityEnd && day > currentValidityEnd) return;


    const newSpecificClosedDates = currentSpecificClosedDates.includes(isoDate)
      ? currentSpecificClosedDates.filter(d => d !== isoDate)
      : [...currentSpecificClosedDates, isoDate].sort();

    onSchedulingChange({
      ...initialSchedulingData,
      specificClosedDates: newSpecificClosedDates.length > 0 ? newSpecificClosedDates : undefined,
    });
  };

  const getDayStatus = React.useCallback((date: Date): { status: 'open' | 'closed-weekday' | 'closed-specific' | 'invalid-range'; reason: string } => {
    const isoDate = format(date, 'yyyy-MM-dd');
    const dayOfWeek = getDay(date);

    if (currentValidityStart && currentValidityEnd) {
      if (!isWithinInterval(date, { start: currentValidityStart, end: currentValidityEnd })) {
        return { status: 'invalid-range', reason: 'Outside validity' };
      }
    } else if (currentValidityStart && !currentValidityEnd && !isEqual(date, currentValidityStart) && date < currentValidityStart) {
        return { status: 'invalid-range', reason: 'Before validity start' };
    } else if (!currentValidityStart && currentValidityEnd && !isEqual(date, currentValidityEnd) && date > currentValidityEnd) {
        return { status: 'invalid-range', reason: 'After validity end' };
    }


    if (currentSpecificClosedDates.includes(isoDate)) {
      return { status: 'closed-specific', reason: 'Specifically Closed' };
    }
    if (currentClosedWeekdays.includes(dayOfWeek)) {
      return { status: 'closed-weekday', reason: `Closed (${WEEKDAYS.find(wd => wd.id === dayOfWeek)?.label})` };
    }
    return { status: 'open', reason: 'Open' };
  }, [currentValidityStart, currentValidityEnd, currentSpecificClosedDates, currentClosedWeekdays]);


  const monthStart = startOfMonth(currentDisplayDate);
  const monthEnd = endOfMonth(currentDisplayDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOffset = getDay(monthStart);

  React.useEffect(() => {
     if (currentValidityStart && !isValid(currentDisplayDate)) {
        setCurrentDisplayDate(currentValidityStart);
     } else if (!currentValidityStart && !isValid(currentDisplayDate)){
        setCurrentDisplayDate(new Date());
     }
  }, [currentValidityStart, currentDisplayDate]);


  return (
    <div className="space-y-6 p-3 border rounded-md bg-muted/20 my-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`validityStart-${packageId}`} className="text-xs">Price Valid From</Label>
          <DatePicker
            date={currentValidityStart}
            onDateChange={handleValidityStartChange}
            placeholder="Set start date"
          />
        </div>
        <div>
          <Label htmlFor={`validityEnd-${packageId}`} className="text-xs">Price Valid To</Label>
          <DatePicker
            date={currentValidityEnd}
            onDateChange={handleValidityEndChange}
            minDate={currentValidityStart}
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
                checked={currentClosedWeekdays.includes(weekday.id)}
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
        {currentSpecificClosedDates.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {currentSpecificClosedDates.map(dateStr => (
              <Badge key={dateStr} variant="secondary" className="font-normal pr-1">
                {isValid(parseISO(dateStr)) ? format(parseISO(dateStr), 'dd-MM-yy') : 'Invalid Date'}
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
          <Button variant="outline" size="icon" onClick={() => setCurrentDisplayDate(prev => subMonths(prev, 1))} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium text-center">
            {isValid(currentDisplayDate) ? format(currentDisplayDate, 'MMMM yyyy') : 'Loading...'}
          </div>
          <Button variant="outline" size="icon" onClick={() => setCurrentDisplayDate(prev => addMonths(prev, 1))} className="h-8 w-8">
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
