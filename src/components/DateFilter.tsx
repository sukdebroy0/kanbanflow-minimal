import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';

export type DateFilterType = 'all' | 'today' | 'week' | 'overdue' | 'custom';

interface DateFilterProps {
  filterType: DateFilterType;
  customDateRange?: DateRange;
  onFilterChange: (type: DateFilterType, range?: DateRange) => void;
}

export function DateFilter({ filterType, customDateRange, onFilterChange }: DateFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(customDateRange);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onFilterChange('custom', range);
      setIsCalendarOpen(false);
    }
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'overdue':
        return 'Overdue';
      case 'custom':
        if (customDateRange?.from && customDateRange?.to) {
          return `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d')}`;
        }
        return 'Custom Range';
      default:
        return 'All Tasks';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={filterType === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
        className="text-xs sm:text-sm h-8 sm:h-9"
      >
        <Calendar className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
        All
      </Button>
      <Button
        variant={filterType === 'today' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('today')}
        className="text-xs sm:text-sm h-8 sm:h-9"
      >
        <CalendarDays className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Today
      </Button>
      <Button
        variant={filterType === 'week' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('week')}
        className="text-xs sm:text-sm h-8 sm:h-9"
      >
        <CalendarRange className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">This</span> Week
      </Button>
      <Button
        variant={filterType === 'overdue' ? 'destructive' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('overdue')}
        className="text-xs sm:text-sm h-8 sm:h-9"
      >
        Overdue
      </Button>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={filterType === 'custom' ? 'default' : 'outline'}
            size="sm"
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            <CalendarRange className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {filterType === 'custom' ? getFilterLabel() : 'Custom'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50" align="start">
          <CalendarComponent
            mode="range"
            selected={dateRange}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={window.innerWidth < 640 ? 1 : 2}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}