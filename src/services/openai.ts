import OpenAI from 'openai';
import type { Contact } from '../types/entities';

export interface OpenAIClassification {
  intent: 'task' | 'event' | 'note';
  confidence: 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  dateStart?: number;
  dateEnd?: number;
  allDay: boolean;
  contactNames: string[];
  priority?: 'low' | 'medium' | 'high';
}

// Store API key in localStorage
const OPENAI_API_KEY_STORAGE = 'openai_api_key';

export const openAIService = {
  // Get stored API key
  getApiKey(): string | null {
    return localStorage.getItem(OPENAI_API_KEY_STORAGE);
  },

  // Set API key
  setApiKey(apiKey: string): void {
    localStorage.setItem(OPENAI_API_KEY_STORAGE, apiKey);
  },

  // Clear API key
  clearApiKey(): void {
    localStorage.removeItem(OPENAI_API_KEY_STORAGE);
  },

  // Check if API key is set
  hasApiKey(): boolean {
    return !!this.getApiKey();
  },

  // Classify user input using OpenAI
  async classifyInput(
    text: string,
    availableContacts: Contact[]
  ): Promise<OpenAIClassification | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return null;
    }

    try {
      const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Required for client-side usage
      });

      const contactNames = availableContacts.map(c => c.name).join(', ');
      const today = new Date();
      const todayStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const systemPrompt = `You are a smart calendar assistant that classifies user input into tasks, events, or notes.

Today is ${todayStr}.

Available contacts: ${contactNames || 'None'}

Analyze the user's input and extract:
1. Intent: Is it a task (action item), event (meeting/appointment), or note (information)?
2. Title: A concise title
3. Description: Additional details (if any)
4. Date/Time: When it should happen (convert relative dates like "tomorrow", "next Friday" to actual dates)
5. Contacts: Which people are mentioned (match against available contacts)
6. Priority: Low, medium, or high (for tasks)
7. Confidence: How confident are you in this classification?

Respond ONLY with a JSON object in this exact format:
{
  "intent": "task" | "event" | "note",
  "confidence": "high" | "medium" | "low",
  "title": "string",
  "description": "string or null",
  "dateStart": "ISO 8601 string or null",
  "dateEnd": "ISO 8601 string or null",
  "allDay": boolean,
  "contactNames": ["array of matched contact names"],
  "priority": "low" | "medium" | "high" (for tasks only)
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cheapest model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3, // Low temperature for consistent classification
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const result = JSON.parse(responseText);

      // Convert ISO strings to timestamps
      const classification: OpenAIClassification = {
        intent: result.intent,
        confidence: result.confidence,
        title: result.title,
        description: result.description || undefined,
        dateStart: result.dateStart ? new Date(result.dateStart).getTime() : undefined,
        dateEnd: result.dateEnd ? new Date(result.dateEnd).getTime() : undefined,
        allDay: result.allDay || false,
        contactNames: result.contactNames || [],
        priority: result.priority || 'medium',
      };

      return classification;
    } catch (error) {
      console.error('OpenAI classification error:', error);
      return null;
    }
  },

  // Test API key validity
  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
      });

      // Simple test completion
      await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });

      return true;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  },
};
