export interface TaskSuggestion {
  title: string;
  description: string;
}

// Predefined suggestions for quick access (used when no API key)
const TASK_TEMPLATES: Record<string, TaskSuggestion[]> = {
  'website': [
    { title: 'Design homepage layout', description: 'Create wireframes and mockups for the main landing page' },
    { title: 'Set up hosting', description: 'Configure web hosting and domain settings' },
    { title: 'Implement responsive design', description: 'Ensure website works on all device sizes' },
    { title: 'Add analytics tracking', description: 'Set up Google Analytics or similar tracking' }
  ],
  'launch': [
    { title: 'Prepare launch announcement', description: 'Draft press release and social media posts' },
    { title: 'Test all features', description: 'Complete QA testing of all functionality' },
    { title: 'Create launch checklist', description: 'Document all pre-launch requirements' },
    { title: 'Schedule marketing campaign', description: 'Plan and schedule promotional activities' }
  ],
  'meeting': [
    { title: 'Prepare agenda', description: 'Create detailed meeting agenda with time allocations' },
    { title: 'Send invitations', description: 'Email meeting invites to all participants' },
    { title: 'Book conference room', description: 'Reserve meeting space and equipment' },
    { title: 'Follow up on action items', description: 'Send summary and assigned tasks after meeting' }
  ],
  'project': [
    { title: 'Define project scope', description: 'Document project objectives and deliverables' },
    { title: 'Create timeline', description: 'Develop project schedule with milestones' },
    { title: 'Assign team roles', description: 'Define responsibilities for each team member' },
    { title: 'Set up project tracking', description: 'Configure project management tools' }
  ],
  'review': [
    { title: 'Gather feedback', description: 'Collect input from stakeholders and team members' },
    { title: 'Analyze metrics', description: 'Review performance data and KPIs' },
    { title: 'Document findings', description: 'Create comprehensive review report' },
    { title: 'Plan improvements', description: 'Identify areas for optimization' }
  ],
  'test': [
    { title: 'Write test cases', description: 'Document all test scenarios and expected outcomes' },
    { title: 'Set up test environment', description: 'Configure testing infrastructure' },
    { title: 'Execute test plan', description: 'Run through all test cases systematically' },
    { title: 'Report bugs', description: 'Document and prioritize discovered issues' }
  ],
  'bug': [
    { title: 'Reproduce issue', description: 'Verify bug and document steps to reproduce' },
    { title: 'Investigate root cause', description: 'Debug and identify source of the problem' },
    { title: 'Implement fix', description: 'Code and test the bug fix solution' },
    { title: 'Verify resolution', description: 'Confirm bug is fixed and no regressions' }
  ],
  'email': [
    { title: 'Draft email template', description: 'Create reusable email format for communications' },
    { title: 'Update mailing list', description: 'Verify and clean email recipient list' },
    { title: 'Schedule email campaign', description: 'Set up automated email sequence' },
    { title: 'Track email metrics', description: 'Monitor open rates and engagement' }
  ],
  'phone': [
    { title: 'Schedule phone calls', description: 'Block time for important phone conversations' },
    { title: 'Prepare call notes', description: 'Document talking points for phone meetings' },
    { title: 'Follow up on calls', description: 'Send summary emails after phone discussions' },
    { title: 'Update contact list', description: 'Maintain current phone directory' }
  ],
  'report': [
    { title: 'Compile data', description: 'Gather all necessary information for report' },
    { title: 'Create visualizations', description: 'Design charts and graphs for data presentation' },
    { title: 'Write executive summary', description: 'Prepare high-level overview of findings' },
    { title: 'Review and edit', description: 'Proofread and refine report content' }
  ]
};

// Get local suggestions based on input
export function getLocalSuggestions(input: string): TaskSuggestion[] {
  if (!input || input.length < 2) return [];
  
  const lowercaseInput = input.toLowerCase();
  const suggestions: TaskSuggestion[] = [];
  
  // Check each template category
  for (const [keyword, templates] of Object.entries(TASK_TEMPLATES)) {
    if (keyword.includes(lowercaseInput) || lowercaseInput.includes(keyword)) {
      suggestions.push(...templates);
    }
  }
  
  // Also check if any template titles or descriptions match
  for (const templates of Object.values(TASK_TEMPLATES)) {
    for (const template of templates) {
      if (template.title.toLowerCase().includes(lowercaseInput) || 
          template.description.toLowerCase().includes(lowercaseInput)) {
        if (!suggestions.some(s => s.title === template.title)) {
          suggestions.push(template);
        }
      }
    }
  }
  
  // Limit to top 5 suggestions
  return suggestions.slice(0, 5);
}

// Generate AI suggestions using OpenAI API
export async function getAISuggestions(input: string, apiKey: string): Promise<TaskSuggestion[]> {
  if (!input || input.length < 3 || !apiKey) {
    return getLocalSuggestions(input);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a task suggestion assistant. Based on the user's partial input, suggest 3-5 relevant task completions.
            Return a JSON array of objects with "title" and "description" fields.
            Titles should be concise (max 50 chars) and descriptions brief (max 100 chars).
            Make suggestions contextually relevant to what the user is typing.
            Example: If user types "email", suggest tasks like "Send weekly update email", "Draft client proposal", etc.`
          },
          {
            role: 'user',
            content: `Suggest task completions for: "${input}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.error('AI suggestions failed, falling back to local');
      return getLocalSuggestions(input);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const suggestions = JSON.parse(content);
      if (Array.isArray(suggestions)) {
        return suggestions.slice(0, 5).map(s => ({
          title: String(s.title || '').slice(0, 100),
          description: String(s.description || '').slice(0, 500)
        }));
      }
    } catch {
      // Parsing failed, use local suggestions
    }
  } catch (error) {
    console.error('AI suggestions error:', error);
  }

  return getLocalSuggestions(input);
}