import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Key, Loader2 } from 'lucide-react';
import { generateTaskFromPrompt, setOpenAIKey } from '@/utils/aiTaskGenerator';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string) => void;
}

export function AddTaskModal({ isOpen, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Array<{title: string, description: string}>>([]);
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  const handleAIGenerate = async () => {
    if (!apiKey) {
      toast.error('Please enter your OpenAI API key first');
      setShowApiKeyInput(true);
      return;
    }

    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI task generation');
      return;
    }

    setIsGenerating(true);
    try {
      const tasks = await generateTaskFromPrompt(aiPrompt);
      setGeneratedTasks(tasks);
      
      if (tasks.length === 1) {
        setTitle(tasks[0].title);
        setDescription(tasks[0].description);
      }
      
      toast.success(`Generated ${tasks.length} task${tasks.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setOpenAIKey(apiKey.trim());
      setShowApiKeyInput(false);
      toast.success('API key saved successfully');
    }
  };

  const handleAddGeneratedTask = (task: {title: string, description: string}) => {
    onAdd(task.title, task.description);
    setGeneratedTasks(prev => prev.filter(t => t !== task));
    if (generatedTasks.length === 1) {
      setAiPrompt('');
      onClose();
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setAiPrompt('');
    setGeneratedTasks([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleReset();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        
        {showApiKeyInput ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="h-4 w-4" />
                <span>OpenAI API key required for AI features</span>
              </div>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                  Save API Key
                </Button>
                <Button variant="outline" onClick={() => setShowApiKeyInput(false)}>
                  Skip
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Generate
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter task title..."
                    className="w-full"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter task description..."
                    className="w-full min-h-[100px]"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    handleReset();
                    onClose();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!title.trim()}>
                    Add Task
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="ai" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-prompt">Describe your task(s)</Label>
                  <Textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., 'Create a marketing campaign for Q2 with social media posts and email newsletters' or 'Fix bugs in the authentication system'"
                    className="w-full min-h-[100px]"
                  />
                </div>
                
                <Button 
                  onClick={handleAIGenerate} 
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full bg-gradient-primary"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Tasks
                    </>
                  )}
                </Button>

                {generatedTasks.length > 0 && (
                  <div className="space-y-3">
                    <Label>Generated Tasks ({generatedTasks.length})</Label>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {generatedTasks.map((task, index) => (
                        <div key={index} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{task.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddGeneratedTask(task)}
                              className="shrink-0"
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowApiKeyInput(true)}
                    className="gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Change API Key
                  </Button>
                  <Button variant="outline" onClick={() => {
                    handleReset();
                    onClose();
                  }}>
                    Close
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}