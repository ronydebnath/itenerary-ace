/**
 * @fileoverview This component provides a user interface for configuring the scheduling
 * details of an activity package. It includes date pickers for setting validity periods
 * (start and end dates), checkboxes for recurring weekday closures, and an input for
 * adding specific one-off closed dates. It also features an optional calendar view to
 * visualize the package's availability based on the configured schedule.
 *
 * @bangla এই কম্পোনেন্টটি একটি কার্যকলাপ প্যাকেজের সময়সূচী বিবরণ কনফিগার করার জন্য
 * একটি ব্যবহারকারী ইন্টারফেস সরবরাহ করে। এটিতে বৈধতার সময়কাল (শুরু এবং শেষের তারিখ)
 * নির্ধারণের জন্য ডেট পিকার, পুনরাবৃত্ত সাপ্তাহিক বন্ধের জন্য চেকবক্স এবং নির্দিষ্ট
 * এককালীন বন্ধ তারিখ যুক্ত করার জন্য একটি ইনপুট অন্তর্ভুক্ত রয়েছে। কনফিগার করা সময়সূচীর
 * উপর ভিত্তি করে প্যাকেজের উপলব্ধতা কল্পনা করার জন্য এটিতে একটি ঐচ্ছিক ক্যালেন্ডার ভিউও রয়েছে।
 */
"use client";

import * as React from 'react';
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { XIcon, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isWithinInterval, isValid, isEqual, startOfDay } from 'date-fns';
import type { ActivityPackageDefinition } from '@/types/itinerary';
import { cn } from '@/lib/utils';

type SchedulingData = Pick<ActivityPackageDefinition, 'validityStartDate' | 'validityEndDate' | 'closedWeekdays' | 'specificClosedDates'>;

interface ActivityPackageSchedulerProps {
  packageId: string;
  initialSchedulingData: SchedulingData;
  onSchedulingChange: (newSchedulingData: SchedulingData) => void;
}

const WEEKDAYS = [
  { id: 0, label: 'Sun' }, { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' }, { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' }
];

export function ActivityPackageScheduler({ packageId, initialSchedulingData, onSchedulingChange }: ActivityPackageSchedulerProps) {
  const [currentDisplayDate, setCurrentDisplayDate] = React.useState<Date>(new Date());
  const [specificDateInput, setSpecificDateInput] = React.useState<Date | undefined>(undefined);
  const [isCalendarViewOpen, setIsCalendarViewOpen] = React.useState<boolean>(false);

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
  
  React.useEffect(() => {
    if (currentValidityStart && isValid(currentValidityStart)) {
      setCurrentDisplayDate(currentValidityStart);
    } else {
      setCurrentDisplayDate(new Date());
    }
  }, [currentValidityStart]);


  const handleValidityStartChange = (date?: Date) => {
    const newStartDateString = date ? format(date, 'yyyy-MM-dd') : undefined;
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
    const dayStart = startOfDay(day); // Normalize to start of day for comparisons

    if (currentValidityStart && currentValidityEnd) {
      if (!isWithinInterval(dayStart, { start: startOfDay(currentValidityStart), end: startOfDay(currentValidityEnd) })) return;
    } else if (currentValidityStart && dayStart < startOfDay(currentValidityStart)) {
      return;
    } else if (currentValidityEnd && dayStart > startOfDay(currentValidityEnd)) {
      return;
    }

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
    const dayStart = startOfDay(date); // Normalize to start of day for comparisons

    if (currentValidityStart && currentValidityEnd) {
      if (!isWithinInterval(dayStart, { start: startOfDay(currentValidityStart), end: startOfDay(currentValidityEnd) })) {
        return { status: 'invalid-range', reason: 'Outside validity' };
      }
    } else if (currentValidityStart && dayStart < startOfDay(currentValidityStart)) {
      return { status: 'invalid-range', reason: 'Before validity start' };
    } else if (currentValidityEnd && dayStart > startOfDay(currentValidityEnd)) {
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

  return (
    <div className="space-y-4 p-3 border rounded-md bg-muted/20 my-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`validityStart-${packageId}`} className="text-xs">Package Valid From</Label>
          <DatePicker
            date={currentValidityStart}
            onDateChange={handleValidityStartChange}
            placeholder="Set start date"
          />
        </div>
        <div>
          <Label htmlFor={`validityEnd-${packageId}`} className="text-xs">Package Valid To</Label>
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
        <Label htmlFor={`specificDate-${packageId}`} className="text-xs">Additional Specific Closed Dates</Label>
        <div className="flex items-center gap-2">
          <DatePicker date={specificDateInput} onDateChange={setSpecificDateInput} placeholder="Add a specific closed date" />
          <Button type="button" size="sm" onClick={handleAddSpecificDate} disabled={!specificDateInput}>Add</Button>
        </div>
        {currentSpecificClosedDates.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {currentSpecificClosedDates.map(dateStr => (
              <Badge key={dateStr} variant="secondary" className="font-normal pr-1">
                {isValid(parseISO(dateStr)) ? format(parseISO(dateStr), 'dd-MMM-yy') : 'Invalid Date'}
                <button type="button" onClick={() => handleRemoveSpecificDate(dateStr)} className="ml-1.5 p-0.5 rounded-full hover:bg-destructive/20">
                  <XIcon className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsCalendarViewOpen(!isCalendarViewOpen)}
          className="w-full mb-3"
        >
          {isCalendarViewOpen ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {isCalendarViewOpen ? 'Hide Calendar View' : 'Show Calendar View for Specific Dates'}
        </Button>

        {isCalendarViewOpen && (
          <>
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
            <div className="grid grid-cols-7 gap-px border-t border-l mt-1 bg-background shadow">
              {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`} className="border-r border-b h-10 sm:h-12 bg-muted/20"></div>)}
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
          </>
        )}
      </div>
    </div>
  );
}

