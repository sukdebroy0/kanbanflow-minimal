import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Task, TaskStatus, TaskColumn as TaskColumnType } from '@/types/task';
import { TaskColumn } from './TaskColumn';
import { TaskCard } from './TaskCard';
import { AddTaskModal } from './AddTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { FilterBar } from './FilterBar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STORAGE_KEY = 'kanban-tasks';

export function KanbanBoard() {
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load tasks from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTasks(parsed.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        })));
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Filter and organize tasks into columns
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchTerm, filterStatus]);

  const columns: TaskColumnType[] = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: filteredTasks.filter(task => task.status === 'todo'),
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: filteredTasks.filter(task => task.status === 'in-progress'),
    },
    {
      id: 'done',
      title: 'Done',
      tasks: filteredTasks.filter(task => task.status === 'done'),
    },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = tasks.find(task => task.id === active.id);
    if (!activeTask) {
      setActiveId(null);
      return;
    }

    // Check if dropped on a column
    if (['todo', 'in-progress', 'done'].includes(over.id as string)) {
      const newStatus = over.id as TaskStatus;
      if (activeTask.status !== newStatus) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === active.id
              ? { ...task, status: newStatus, updatedAt: new Date() }
              : task
          )
        );
        toast.success(`Task moved to ${columns.find(c => c.id === newStatus)?.title}`);
      }
    } else {
      // Dropped on another task - reorder within column
      const overTask = tasks.find(task => task.id === over.id);
      if (overTask && activeTask.status === overTask.status) {
        const columnTasks = tasks.filter(task => task.status === activeTask.status);
        const oldIndex = columnTasks.findIndex(task => task.id === active.id);
        const newIndex = columnTasks.findIndex(task => task.id === over.id);
        
        const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex);
        
        setTasks(prevTasks => {
          const otherTasks = prevTasks.filter(task => task.status !== activeTask.status);
          return [...otherTasks, ...reorderedTasks];
        });
      }
    }
    
    setActiveId(null);
  };

  const handleAddTask = (title: string, description: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
    toast.success('Task added successfully');
  };

  const handleEditTask = (taskId: string, title: string, description: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, title, description, updatedAt: new Date() }
          : task
      )
    );
    toast.success('Task updated successfully');
  };

  const handleDeleteTask = () => {
    if (deleteTaskId) {
      setTasks(prev => prev.filter(task => task.id !== deleteTaskId));
      setDeleteTaskId(null);
      toast.success('Task deleted successfully');
    }
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, status: 'done', updatedAt: new Date() }
          : task
      )
    );
    toast.success('Task marked as complete');
  };

  const handleClearCompleted = () => {
    setTasks(prev => prev.filter(task => task.status !== 'done'));
    toast.success('Completed tasks cleared');
  };

  const handleDeleteAll = () => {
    setTasks([]);
    setShowDeleteAllDialog(false);
    toast.success('All tasks deleted');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `tasks_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Tasks exported successfully');
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          // Validate and sanitize each task
          const validTasks = imported
            .filter((task: any) => 
              typeof task === 'object' && 
              task !== null &&
              typeof task.title === 'string' &&
              task.title.trim().length > 0
            )
            .map((task: any) => ({
              id: String(task.id || Date.now().toString() + Math.random()),
              title: String(task.title).slice(0, 100).trim(), // Enforce max length
              description: String(task.description || '').slice(0, 500).trim(), // Enforce max length
              status: ['todo', 'in-progress', 'done'].includes(task.status) 
                ? task.status 
                : 'todo', // Validate status
              createdAt: new Date(task.createdAt || Date.now()),
              updatedAt: new Date(task.updatedAt || Date.now()),
            }));
          
          if (validTasks.length === 0) {
            toast.error('No valid tasks found in file');
            return;
          }
          
          setTasks(validTasks);
          toast.success(`Imported ${validTasks.length} tasks successfully`);
        } else {
          toast.error('Invalid file format - expected an array of tasks');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import tasks - invalid JSON format');
      }
    };
    reader.readAsText(file);
  };

  const activeTask = tasks.find(task => task.id === activeId);
  const completedCount = tasks.filter(task => task.status === 'done').length;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task Manager</h1>
            <p className="text-muted-foreground mt-1">Organize your tasks with drag and drop</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-lg border shadow-sm">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                aria-label="Toggle theme"
              />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          onClearCompleted={handleClearCompleted}
          onDeleteAll={() => setShowDeleteAllDialog(true)}
          onExport={handleExport}
          onImport={handleImport}
          totalTasks={tasks.length}
          completedTasks={completedCount}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map(column => (
              <TaskColumn
                key={column.id}
                column={column}
                onEdit={(task) => {
                  setEditingTask(task);
                  setIsEditModalOpen(true);
                }}
                onDelete={setDeleteTaskId}
                onComplete={handleCompleteTask}
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeTask && (
              <div className="rotate-3 opacity-90">
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onComplete={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>

        <AddTaskModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddTask}
        />

        <EditTaskModal
          task={editingTask}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleEditTask}
        />

        <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the task.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all tasks?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all {tasks.length} tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}