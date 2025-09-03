import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { defaultShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const shortcutsByCategory = defaultShortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof defaultShortcuts>);

  const formatKey = (shortcut: typeof defaultShortcuts[0]) => {
    const keys = [];
    if (shortcut.ctrl) keys.push('Ctrl');
    if (shortcut.alt) keys.push('Alt');
    if (shortcut.shift) keys.push('Shift');
    if (shortcut.meta) keys.push('⌘');
    
    let key = shortcut.key;
    if (key === ' ') key = 'Space';
    if (key === 'ArrowLeft') key = '←';
    if (key === 'ArrowRight') key = '→';
    if (key === 'ArrowUp') key = '↑';
    if (key === 'ArrowDown') key = '↓';
    
    keys.push(key);
    return keys;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick actions to boost your productivity
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {formatKey(shortcut).map((key, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="font-mono text-xs px-2 py-0.5"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {category !== Object.keys(shortcutsByCategory)[Object.keys(shortcutsByCategory).length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Press <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5 mx-1">?</Badge> at any time to view these shortcuts
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}