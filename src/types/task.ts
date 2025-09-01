export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate?: Date;
  dueTime?: string;
  reminderTime?: number; // minutes before due date/time
  notificationSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}