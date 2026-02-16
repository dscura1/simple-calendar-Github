// Extract tasks from note text

import type { Contact } from '../types/entities';
import { extractTemporal } from './temporalParser';
import { extractContacts } from './contactExtractor';
import { DateTime } from 'luxon';

export interface ExtractedTask {
  title: string;
  dueDate?: number;
  contactId?: number;
  sourceLine: string;
  sourceLineNumber: number;
}

// Task patterns
const CHECKLIST_PATTERNS = [
  /^[-*•]\s*\[\s*\]\s*(.+)$/i,  // - [ ] Task
  /^[-*•]\s+(.+)$/i,             // - Task or * Task
  /^\d+\.\s+(.+)$/,              // 1. Task
];

const ACTION_VERBS = [
  'call', 'email', 'text', 'message', 'send', 'share', 'forward',
  'follow up', 'check in', 'reach out', 'touch base',
  'schedule', 'book', 'set up', 'arrange',
  'prepare', 'draft', 'write', 'create',
  'review', 'read', 'check', 'verify',
  'update', 'revise', 'modify', 'change',
  'complete', 'finish', 'finalize',
  'ask', 'discuss', 'talk to', 'meet with',
  'research', 'investigate', 'look into',
  'buy', 'purchase', 'order',
  'remind', 'note', 'remember',
];

export function extractTasksFromNote(
  noteText: string,
  noteDateRef: number | undefined,
  availableContacts: Contact[]
): ExtractedTask[] {
  const lines = noteText.split('\n');
  const tasks: ExtractedTask[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    let taskTitle: string | null = null;

    // Check for checklist patterns
    for (const pattern of CHECKLIST_PATTERNS) {
      const match = trimmedLine.match(pattern);
      if (match) {
        taskTitle = match[1].trim();
        break;
      }
    }

    // If not a checklist, check for action verbs at start
    if (!taskTitle) {
      const lowerLine = trimmedLine.toLowerCase();
      for (const verb of ACTION_VERBS) {
        if (lowerLine.startsWith(verb)) {
          taskTitle = trimmedLine;
          break;
        }
      }
    }

    // If we found a task-like line, extract it
    if (taskTitle) {
      // Try to extract date from the task line itself
      const temporal = extractTemporal(taskTitle);
      let dueDate: number | undefined;

      if (temporal.dateStart && temporal.confidence > 0) {
        dueDate = temporal.dateStart;
      } else if (noteDateRef) {
        // Use note's date if no date in task line
        dueDate = noteDateRef;
      } else {
        // Default to today
        dueDate = DateTime.now().startOf('day').toMillis();
      }

      // Try to extract contact
      const { matches } = extractContacts(taskTitle, availableContacts);
      const contactId = matches[0]?.contactId;

      tasks.push({
        title: taskTitle,
        dueDate,
        contactId,
        sourceLine: trimmedLine,
        sourceLineNumber: index + 1,
      });
    }
  });

  return tasks;
}
