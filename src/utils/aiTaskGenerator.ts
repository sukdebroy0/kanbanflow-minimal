export interface GeneratedTask {
  title: string;
  description: string;
}

const OPENAI_API_KEY = localStorage.getItem('openai_api_key') || '';

export async function generateTaskFromPrompt(prompt: string): Promise<GeneratedTask[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('Please set your OpenAI API key first');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
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
          title: tasks.title || 'New Task',
          description: tasks.description || ''
        }];
      }
      return tasks;
    } catch {
      // Fallback if response isn't valid JSON
      return [{
        title: prompt.slice(0, 50),
        description: content || prompt
      }];
    }
  } catch (error) {
    console.error('AI task generation error:', error);
    throw error;
  }
}

export function setOpenAIKey(key: string) {
  localStorage.setItem('openai_api_key', key);
}