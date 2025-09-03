import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Allow Escape to work even in input fields
      if (event.key !== 'Escape') {
        return;
      }
    }

    shortcuts.forEach(shortcut => {
      const ctrlKey = shortcut.ctrl ?? false;
      const altKey = shortcut.alt ?? false;
      const shiftKey = shortcut.shift ?? false;
      const metaKey = shortcut.meta ?? false;

      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        event.ctrlKey === ctrlKey &&
        event.altKey === altKey &&
        event.shiftKey === shiftKey &&
        event.metaKey === metaKey
      ) {
        event.preventDefault();
        shortcut.action();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const defaultShortcuts: Omit<ShortcutConfig, 'action'>[] = [
  // Task Management
  { key: 'n', ctrl: true, description: 'New task', category: 'Task Management' },
  { key: 'Delete', description: 'Delete selected task', category: 'Task Management' },
  { key: 'Enter', description: 'Edit selected task', category: 'Task Management' },
  { key: 'd', ctrl: true, shift: true, description: 'Delete all completed tasks', category: 'Task Management' },
  { key: 'a', ctrl: true, shift: true, description: 'Generate AI tasks', category: 'Task Management' },
  
  // Navigation
  { key: 'ArrowLeft', description: 'Navigate to previous column', category: 'Navigation' },
  { key: 'ArrowRight', description: 'Navigate to next column', category: 'Navigation' },
  { key: 'ArrowUp', description: 'Navigate to previous task', category: 'Navigation' },
  { key: 'ArrowDown', description: 'Navigate to next task', category: 'Navigation' },
  { key: '1', description: 'Focus Todo column', category: 'Navigation' },
  { key: '2', description: 'Focus In Progress column', category: 'Navigation' },
  { key: '3', description: 'Focus Done column', category: 'Navigation' },
  
  // Task Movement
  { key: 'q', description: 'Move task to Todo', category: 'Task Movement' },
  { key: 'w', description: 'Move task to In Progress', category: 'Task Movement' },
  { key: 'e', description: 'Move task to Done', category: 'Task Movement' },
  { key: ' ', description: 'Toggle task completion', category: 'Task Movement' },
  
  // Filtering & Search
  { key: 'f', ctrl: true, description: 'Focus search', category: 'Filtering' },
  { key: 'Escape', description: 'Clear search/Close modals', category: 'Filtering' },
  { key: 'f', alt: true, description: 'Toggle filter menu', category: 'Filtering' },
  { key: 't', alt: true, description: 'Show Today\'s tasks', category: 'Filtering' },
  { key: 'w', alt: true, description: 'Show This Week\'s tasks', category: 'Filtering' },
  { key: 'o', alt: true, description: 'Show Overdue tasks', category: 'Filtering' },
  
  // View & UI
  { key: 's', ctrl: true, description: 'Toggle statistics', category: 'View' },
  { key: 't', ctrl: true, description: 'Toggle theme', category: 'View' },
  { key: 'b', ctrl: true, description: 'Toggle notifications', category: 'View' },
  { key: '?', shift: true, description: 'Show keyboard shortcuts', category: 'View' },
  { key: 'h', ctrl: true, description: 'Show help', category: 'View' },
];