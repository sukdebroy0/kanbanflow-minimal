import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Edit2, Trash2, Check, Clock, Calendar, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, onComplete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getDueDateDisplay = () => {
    if (!task.dueDate) return null;
    
    const dueDate = new Date(task.dueDate);
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes));
    }
    
    const now = new Date();
    const isOverdue = task.status !== 'done' && isPast(dueDate) && !isToday(dueDate);
    
    let dateText = '';
    if (isToday(dueDate)) {
      dateText = `Today${task.dueTime ? ` at ${task.dueTime}` : ''}`;
    } else if (isTomorrow(dueDate)) {
      dateText = `Tomorrow${task.dueTime ? ` at ${task.dueTime}` : ''}`;
    } else {
      dateText = format(dueDate, task.dueTime ? 'MMM d, h:mm a' : 'MMM d');
    }
    
    return { text: dateText, isOverdue };
  };
  
  const dueDateInfo = getDueDateDisplay();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50'
      )}
    >
      <Card className={cn(
        "p-4 cursor-default hover:shadow-md transition-shadow duration-200 bg-gradient-card border-border/50",
        isDragging && "shadow-drag"
      )}>
        <div className="flex items-start gap-2">
          <button
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground mb-1 truncate">
              {task.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
            
            {(dueDateInfo || task.reminderTime) && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {dueDateInfo && (
                  <Badge 
                    variant={dueDateInfo.isOverdue ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {dueDateInfo.text}
                  </Badge>
                )}
                {task.reminderTime && (
                  <Badge variant="outline" className="text-xs">
                    <Bell className="h-3 w-3 mr-1" />
                    {task.reminderTime} min reminder
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1 mt-3">
              {task.status !== 'done' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-done hover:text-done hover:bg-done/10"
                  onClick={() => onComplete(task.id)}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={() => onEdit(task)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}