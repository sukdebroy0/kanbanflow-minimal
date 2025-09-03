import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Trash2, Download, Upload } from 'lucide-react';
import { TaskStatus } from '@/types/task';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterStatus: TaskStatus | 'all';
  onFilterChange: (value: TaskStatus | 'all') => void;
  onClearCompleted: () => void;
  onDeleteAll: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  totalTasks: number;
  completedTasks: number;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  onClearCompleted,
  onDeleteAll,
  onExport,
  onImport,
  totalTasks,
  completedTasks,
}: FilterBarProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="pl-10"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tasks</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{totalTasks}</span>
          </span>
          <span className="text-sm text-muted-foreground">
            Completed: <span className="font-semibold text-done">{completedTasks}</span>
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearCompleted}
            disabled={completedTasks === 0}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            <span className="hidden sm:inline">Clear</span> Completed
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onDeleteAll}
            disabled={totalTasks === 0}
            className="text-destructive hover:text-destructive text-xs sm:text-sm h-8 sm:h-9"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Delete</span> All
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={totalTasks === 0}
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            Export
          </Button>
          
          <label>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs sm:text-sm h-8 sm:h-9"
            >
              <span>
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}