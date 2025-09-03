import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { EnhancedAddTaskModal } from './EnhancedAddTaskModal';
import { EnhancedEditTaskModal } from './EnhancedEditTaskModal';
import { FilterBar } from './FilterBar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Moon, Sun, ClipboardList, Bell, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { LiveClock } from './LiveClock';
import { DateFilter, type DateFilterType } from './DateFilter';
import { TaskStatistics } from './TaskStatistics';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { scheduleNotification, requestNotificationPermission } from '@/utils/notifications';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, isAfter, isBefore, isWithinInterval, isPast, isToday } from 'date-fns';
import { useKeyboardShortcuts, ShortcutConfig } from '@/hooks/useKeyboardShortcuts';
import { GeneratedTask } from '@/utils/aiTaskGenerator';
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
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showStatistics, setShowStatistics] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusedColumn, setFocusedColumn] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load tasks from localStorage on mount and request notification permission
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTasks(parsed.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        })));
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    }
    
    // Request notification permission
    requestNotificationPermission().then(granted => {
      setNotificationsEnabled(granted);
      if (granted) {
        toast.success('Notifications enabled for task reminders');
      }
    });
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
      
      // Date filtering
      let matchesDate = true;
      if (dateFilterType !== 'all' && task.dueDate) {
        const taskDate = new Date(task.dueDate);
        const now = new Date();
        
        switch (dateFilterType) {
          case 'today':
            matchesDate = isToday(taskDate);
            break;
          case 'week':
            matchesDate = isWithinInterval(taskDate, {
              start: startOfWeek(now),
              end: endOfWeek(now)
            });
            break;
          case 'overdue':
            matchesDate = isPast(taskDate) && !isToday(taskDate) && task.status !== 'done';
            break;
          case 'custom':
            if (customDateRange?.from && customDateRange?.to) {
              matchesDate = isWithinInterval(taskDate, {
                start: startOfDay(customDateRange.from),
                end: endOfDay(customDateRange.to)
              });
            }
            break;
        }
      } else if (dateFilterType !== 'all' && !task.dueDate) {
        matchesDate = false;
      }
      
      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [tasks, searchTerm, filterStatus, dateFilterType, customDateRange]);

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

  const handleAddTask = (taskData: { 
    title: string; 
    description: string; 
    dueDate?: Date; 
    dueTime?: string; 
    reminderTime?: number 
  }) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: taskData.dueDate,
      dueTime: taskData.dueTime,
      reminderTime: taskData.reminderTime,
    };
    setTasks(prev => [...prev, newTask]);
    
    // Schedule notification if reminder is set
    if (newTask.reminderTime && notificationsEnabled) {
      scheduleNotification(newTask);
    }
    
    toast.success('Task added successfully');
  };

  const handleEditTask = (updatedTask: Task) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    
    // Schedule notification if reminder is set
    if (updatedTask.reminderTime && notificationsEnabled) {
      scheduleNotification(updatedTask);
    }
    
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

  const handleDateFilterChange = (type: DateFilterType, range?: DateRange) => {
    setDateFilterType(type);
    if (range) {
      setCustomDateRange(range);
    }
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      toast.success('Notifications enabled!');
    } else {
      toast.error('Please enable notifications in your browser settings');
    }
  };

  // Keyboard navigation helpers
  const getSelectedTask = useCallback(() => {
    return tasks.find(t => t.id === selectedTaskId);
  }, [tasks, selectedTaskId]);

  const selectNextTask = useCallback(() => {
    const allTasks = filteredTasks;
    if (!selectedTaskId && allTasks.length > 0) {
      setSelectedTaskId(allTasks[0].id);
      return;
    }
    const currentIndex = allTasks.findIndex(t => t.id === selectedTaskId);
    if (currentIndex < allTasks.length - 1) {
      setSelectedTaskId(allTasks[currentIndex + 1].id);
    }
  }, [filteredTasks, selectedTaskId]);

  const selectPreviousTask = useCallback(() => {
    const allTasks = filteredTasks;
    if (!selectedTaskId && allTasks.length > 0) {
      setSelectedTaskId(allTasks[allTasks.length - 1].id);
      return;
    }
    const currentIndex = allTasks.findIndex(t => t.id === selectedTaskId);
    if (currentIndex > 0) {
      setSelectedTaskId(allTasks[currentIndex - 1].id);
    }
  }, [filteredTasks, selectedTaskId]);

  const moveTaskToStatus = useCallback((status: TaskStatus) => {
    const task = getSelectedTask();
    if (task && task.status !== status) {
      setTasks(prev => 
        prev.map(t => 
          t.id === task.id 
            ? { ...t, status, updatedAt: new Date() }
            : t
        )
      );
      toast.success(`Task moved to ${status}`);
    }
  }, [getSelectedTask]);

  const toggleTaskCompletion = useCallback(() => {
    const task = getSelectedTask();
    if (task) {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      setTasks(prev =>
        prev.map(t =>
          t.id === task.id
            ? { ...t, status: newStatus, updatedAt: new Date() }
            : t
        )
      );
      toast.success(newStatus === 'done' ? 'Task completed' : 'Task reopened');
    }
  }, [getSelectedTask]);

  const deleteSelectedTask = useCallback(() => {
    if (selectedTaskId) {
      setDeleteTaskId(selectedTaskId);
    }
  }, [selectedTaskId]);

  const editSelectedTask = useCallback(() => {
    const task = getSelectedTask();
    if (task) {
      setEditingTask(task);
      setIsEditModalOpen(true);
    }
  }, [getSelectedTask]);

  const generateAITasksHandler = useCallback(async () => {
    try {
      toast.info('Generating AI tasks...');
      // Simple AI task generation
      const aiTasks: Task[] = [
        {
          id: `ai-${Date.now()}-1`,
          title: 'Review quarterly goals',
          description: 'Analyze progress on Q4 objectives and prepare report',
          status: 'todo',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: `ai-${Date.now()}-2`,
          title: 'Schedule team meeting',
          description: 'Organize weekly sync to discuss project updates',
          status: 'todo',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: `ai-${Date.now()}-3`,
          title: 'Update documentation',
          description: 'Ensure all project documentation is current',
          status: 'todo',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      setTasks(prev => [...prev, ...aiTasks]);
      toast.success('AI tasks generated successfully');
    } catch (error) {
      toast.error('Failed to generate AI tasks');
    }
  }, []);

  // Set up keyboard shortcuts
  const shortcuts: ShortcutConfig[] = [
    // Task Management
    { key: 'n', ctrl: true, action: () => setIsAddModalOpen(true), description: 'New task' },
    { key: 'Delete', action: deleteSelectedTask, description: 'Delete selected task' },
    { key: 'Enter', action: editSelectedTask, description: 'Edit selected task' },
    { key: 'd', ctrl: true, shift: true, action: handleClearCompleted, description: 'Delete all completed' },
    { key: 'a', ctrl: true, shift: true, action: generateAITasksHandler, description: 'Generate AI tasks' },
    
    // Navigation
    { key: 'ArrowUp', action: selectPreviousTask, description: 'Previous task' },
    { key: 'ArrowDown', action: selectNextTask, description: 'Next task' },
    { key: '1', action: () => setFocusedColumn(0), description: 'Focus Todo' },
    { key: '2', action: () => setFocusedColumn(1), description: 'Focus In Progress' },
    { key: '3', action: () => setFocusedColumn(2), description: 'Focus Done' },
    
    // Task Movement
    { key: 'q', action: () => moveTaskToStatus('todo'), description: 'Move to Todo' },
    { key: 'w', action: () => moveTaskToStatus('in-progress'), description: 'Move to In Progress' },
    { key: 'e', action: () => moveTaskToStatus('done'), description: 'Move to Done' },
    { key: ' ', action: toggleTaskCompletion, description: 'Toggle completion' },
    
    // Filtering
    { key: 'f', ctrl: true, action: () => searchInputRef.current?.focus(), description: 'Focus search' },
    { key: 'Escape', action: () => {
      setSearchTerm('');
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setShowShortcuts(false);
    }, description: 'Clear/Close' },
    { key: 't', alt: true, action: () => setDateFilterType('today'), description: 'Today\'s tasks' },
    { key: 'w', alt: true, action: () => setDateFilterType('week'), description: 'This week' },
    { key: 'o', alt: true, action: () => setDateFilterType('overdue'), description: 'Overdue' },
    
    // View & UI
    { key: 's', ctrl: true, action: () => setShowStatistics(prev => !prev), description: 'Toggle statistics' },
    { key: 't', ctrl: true, action: toggleTheme, description: 'Toggle theme' },
    { key: 'b', ctrl: true, action: enableNotifications, description: 'Toggle notifications' },
    { key: '?', shift: true, action: () => setShowShortcuts(true), description: 'Show shortcuts' },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-label="Task Manager" />
            <LiveClock />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => setShowShortcuts(true)}
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Keyboard className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Shortcuts</span>
            </Button>
            {!notificationsEnabled && (
              <Button 
                onClick={enableNotifications}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Bell className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Enable</span> Notifications
              </Button>
            )}
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-card rounded-lg border shadow-sm">
              <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                aria-label="Toggle theme"
                className="h-4 w-8 sm:h-5 sm:w-9"
              />
              <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 text-xs sm:text-sm px-3 sm:px-4"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {showStatistics && <TaskStatistics tasks={tasks} />}

        <DateFilter 
          filterType={dateFilterType}
          customDateRange={customDateRange}
          onFilterChange={handleDateFilterChange}
        />

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
          searchInputRef={searchInputRef}
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
                selectedTaskId={selectedTaskId}
                onEdit={(task) => {
                  setEditingTask(task);
                  setIsEditModalOpen(true);
                }}
                onDelete={setDeleteTaskId}
                onComplete={handleCompleteTask}
                onTaskSelect={setSelectedTaskId}
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

        <EnhancedAddTaskModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddTask}
        />

        <EnhancedEditTaskModal
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

        <KeyboardShortcutsHelp
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
      </div>
    </div>
  );
}