import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskColumn as TaskColumnType } from '@/types/task';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { Task } from '@/types/task';

interface TaskColumnProps {
  column: TaskColumnType;
  selectedTaskId?: string | null;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onTaskSelect?: (taskId: string) => void;
}

export function TaskColumn({ column, selectedTaskId, onEdit, onDelete, onComplete, onTaskSelect }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const getColumnStyles = () => {
    switch (column.id) {
      case 'todo':
        return 'bg-muted/50 border-muted';
      case 'in-progress':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'done':
        return 'bg-green-500/10 border-green-500/30';
      default:
        return 'bg-muted/30 border-border';
    }
  };

  const getHeaderStyles = () => {
    switch (column.id) {
      case 'todo':
        return 'text-muted-foreground';
      case 'in-progress':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'done':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full rounded-xl border-2 border-dashed transition-all duration-200",
        getColumnStyles(),
        isOver && "border-primary bg-primary/5 scale-[1.02]"
      )}
    >
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h2 className={cn("font-semibold text-lg", getHeaderStyles())}>
            {column.title}
          </h2>
          <span className="text-sm font-medium px-2 py-1 rounded-full bg-background/80 text-muted-foreground">
            {column.tasks.length}
          </span>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <SortableContext
          items={column.tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
              onSelect={() => onTaskSelect?.(task.id)}
            />
          ))}
        </SortableContext>
        
        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}