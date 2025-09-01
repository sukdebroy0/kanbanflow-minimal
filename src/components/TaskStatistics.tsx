import { Task } from '@/types/task';
import { CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TaskStatisticsProps {
  tasks: Task[];
}

export function TaskStatistics({ tasks }: TaskStatisticsProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  
  const now = new Date();
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    if (t.dueTime) {
      const [hours, minutes] = t.dueTime.split(':');
      dueDate.setHours(parseInt(hours), parseInt(minutes));
    }
    return dueDate < now;
  }).length;

  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: ListTodo,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-600/10 dark:bg-green-400/10'
    },
    {
      label: 'Pending',
      value: pendingTasks,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-600/10 dark:bg-yellow-400/10'
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}