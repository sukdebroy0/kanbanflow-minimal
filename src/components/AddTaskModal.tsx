import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Key, Loader2, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { generateTaskFromPrompt } from '@/utils/aiTaskGenerator';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string) => void;
}

export function AddTaskModal({ isOpen, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [apiKey, setApiKey] = useState(''); // Secure: Only stored in memory
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Array<{title: string, description: string}>>([]);
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim().slice(0, 100); // Enforce max length
    const trimmedDescription = description.trim().slice(0, 500); // Enforce max length
    
    if (trimmedTitle) {
      onAdd(trimmedTitle, trimmedDescription);
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
      const tasks = await generateTaskFromPrompt(aiPrompt, apiKey);
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
      // API key is now only stored in component state (memory)
      setShowApiKeyInput(false);
      toast.success('API key saved for this session only (secure mode)');
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
        
        {showApiKeyInput && !apiKey ? (
          <div className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
              <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Security Notice:</strong> Your API key is only stored in memory during this session. It will be cleared when you close the app or refresh the page.
              </AlertDescription>
            </Alert>
            
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="h-4 w-4" />
                <span>Enter your OpenAI API key for AI features</span>
              </div>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="font-mono text-sm pr-10"
                  maxLength={200}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                  Use API Key
                </Button>
                <Button variant="outline" onClick={() => setShowApiKeyInput(false)}>
                  Skip AI Features
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
                  <Label htmlFor="title">Title (max 100 characters)</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                    placeholder="Enter task title..."
                    className="w-full"
                    maxLength={100}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (max 500 characters)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                    placeholder="Enter task description..."
                    className="w-full min-h-[100px]"
                    maxLength={500}
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
              {!apiKey && (
                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    Please enter your OpenAI API key above to use AI features
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-prompt">Describe your task(s) (max 1000 characters)</Label>
                  <Textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value.slice(0, 1000))}
                    placeholder="e.g., 'Create a marketing campaign for Q2 with social media posts and email newsletters' or 'Fix bugs in the authentication system'"
                    className="w-full min-h-[100px]"
                    maxLength={1000}
                    disabled={!apiKey}
                  />
                </div>
                
                <Button 
                  onClick={handleAIGenerate} 
                  disabled={isGenerating || !aiPrompt.trim() || !apiKey}
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

                <div className="flex gap-2 flex-wrap">
                  {apiKey && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setApiKey('');
                        setShowApiKeyInput(true);
                        toast.info('API key cleared from memory');
                      }}
                      className="gap-2"
                    >
                      <Key className="h-4 w-4" />
                      Clear API Key
                    </Button>
                  )}
                  {!apiKey && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowApiKeyInput(true)}
                      className="gap-2"
                    >
                      <Key className="h-4 w-4" />
                      Add API Key
                    </Button>
                  )}
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