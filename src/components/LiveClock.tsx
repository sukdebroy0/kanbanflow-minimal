import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm">
      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" aria-label="Clock icon" />
      <div className="flex flex-col items-end">
        <span className="font-medium text-foreground tabular-nums text-xs sm:text-sm">{formatTime(time)}</span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(time)}</span>
      </div>
    </div>
  );
}