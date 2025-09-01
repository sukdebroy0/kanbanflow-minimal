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
    <div className="flex items-center gap-2">
      <Button
        variant={filterType === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
      >
        <Calendar className="mr-2 h-4 w-4" />
        All
      </Button>
      <Button
        variant={filterType === 'today' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('today')}
      >
        <CalendarDays className="mr-2 h-4 w-4" />
        Today
      </Button>
      <Button
        variant={filterType === 'week' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('week')}
      >
        <CalendarRange className="mr-2 h-4 w-4" />
        This Week
      </Button>
      <Button
        variant={filterType === 'overdue' ? 'destructive' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('overdue')}
      >
        Overdue
      </Button>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={filterType === 'custom' ? 'default' : 'outline'}
            size="sm"
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            {filterType === 'custom' ? getFilterLabel() : 'Custom'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="range"
            selected={dateRange}
            onSelect={handleCustomRangeSelect}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}