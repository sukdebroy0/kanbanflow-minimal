export interface GeneratedTask {
  title: string;
  description: string;
}

// Maximum lengths for security
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_PROMPT_LENGTH = 1000;

export async function generateTaskFromPrompt(prompt: string, apiKey: string): Promise<GeneratedTask[]> {
  // Validate inputs
  if (!apiKey) {
    throw new Error('Please provide your OpenAI API key');
  }
  
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Please provide a task description');
  }
  
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt is too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed`);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a task generation assistant. Convert the user's input into structured tasks.
            Return a JSON array of tasks with "title" and "description" fields.
            Keep titles concise (max 50 chars) and descriptions clear but brief (max 200 chars).
            If the input suggests multiple tasks, create separate tasks for each.
            Example output: [{"title": "Review Q4 report", "description": "Analyze quarterly financial results and prepare summary"}]`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate tasks');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      const tasks = JSON.parse(content);
      if (!Array.isArray(tasks)) {
        return [{
          title: (tasks.title || 'New Task').slice(0, MAX_TITLE_LENGTH),
          description: (tasks.description || '').slice(0, MAX_DESCRIPTION_LENGTH)
        }];
      }
      // Validate and sanitize each task
      return tasks.map(task => ({
        title: String(task.title || 'New Task').slice(0, MAX_TITLE_LENGTH),
        description: String(task.description || '').slice(0, MAX_DESCRIPTION_LENGTH)
      }));
    } catch {
      // Fallback if response isn't valid JSON
      return [{
        title: prompt.slice(0, MAX_TITLE_LENGTH),
        description: (content || prompt).slice(0, MAX_DESCRIPTION_LENGTH)
      }];
    }
  } catch (error) {
    console.error('AI task generation error:', error);
    throw error;
  }
}