// Command executor - converts ParsedCommand to actual entities

import type { ParsedCommand } from './types';
import { DateTime } from 'luxon';
import { eventService } from '../services/events';

export interface ExecutionResult {
  success: boolean;
  message: string;
  entityType: 'task' | 'event' | 'note';
  warnings: string[];
  createdId?: number;
}

export async function executeCommand(
  command: ParsedCommand,
  context: {
    addTask: (task: any) => Promise<void>;
    addEvent: (event: any) => Promise<void>;
    addNote: (note: any) => Promise<void>;
  }
): Promise<ExecutionResult> {
  const warnings = [...command.parseWarnings];

  if (!command.contextId) {
    throw new Error('No context selected. Please select a context (Work, Academic, or Personal) first.');
  }

  try {
    switch (command.intent) {
      case 'task': {
        // Create task
        const contactId = command.contactIds[0]; // Use first contact if multiple

        await context.addTask({
          contextId: command.contextId,
          title: command.title,
          dueDate: command.dateStart,
          contactId,
          completed: false,
          priority: 'medium',
        });

        let message = `Task created: "${command.title}"`;
        if (command.dateStart) {
          const dateStr = DateTime.fromMillis(command.dateStart).toLocaleString(DateTime.DATE_MED);
          message += ` (due ${dateStr})`;
        }
        if (contactId) {
          message += ` for contact`;
        }

        return {
          success: true,
          message,
          entityType: 'task',
          warnings,
        };
      }

      case 'event': {
        // Create event
        let startTime = command.dateStart!;
        let endTime: number | undefined;

        // If no time specified, default to 9 AM - 10 AM
        if (command.allDay && !command.timeSpecified) {
          const dt = DateTime.fromMillis(startTime).set({ hour: 9, minute: 0 });
          startTime = dt.toMillis();
          endTime = dt.plus({ hours: 1 }).toMillis();
          // Note: Don't warn for this - it's expected behavior
        } else if (command.dateEnd) {
          endTime = command.dateEnd;
        } else {
          // Default 1 hour duration
          endTime = DateTime.fromMillis(startTime).plus({ hours: 1 }).toMillis();
        }

        // Create event using service (to get ID back)
        const event = await eventService.create({
          contextId: command.contextId,
          title: command.title,
          startTime,
          endTime,
          allDay: command.allDay,
        });

        // Link contacts to event via EventContact junction table
        if (event.id && command.contactIds.length > 0) {
          for (const contactId of command.contactIds) {
            await eventService.linkContact(event.id, contactId, 'attendee');
          }
          warnings.push(`Linked to ${command.contactIds.length} contact(s)`);
        }

        // Reload data in store (call addEvent with dummy to trigger refresh)
        await context.addEvent({
          contextId: command.contextId,
          title: '',
          startTime: 0,
          endTime: 0,
          allDay: false,
        });
        // Delete the dummy event
        if (event.id) {
          const allEvents = await eventService.getAll();
          const dummyEvent = allEvents.find(e => e.title === '' && e.startTime === 0);
          if (dummyEvent?.id) {
            await eventService.delete(dummyEvent.id);
          }
        }

        const dateStr = DateTime.fromMillis(startTime).toLocaleString(DateTime.DATETIME_MED);
        const message = `Event created: "${command.title}" on ${dateStr}`;

        return {
          success: true,
          message,
          entityType: 'event',
          warnings,
          createdId: event.id,
        };
      }

      case 'note': {
        // Create note
        const contactId = command.contactIds[0];

        await context.addNote({
          contextId: command.contextId,
          title: command.title,
          body: command.rawText,
          dateRef: command.dateStart,
          contactId,
        });

        const message = `Note created: "${command.title}"`;

        return {
          success: true,
          message,
          entityType: 'note',
          warnings,
        };
      }

      default:
        throw new Error(`Unknown intent: ${command.intent}`);
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      entityType: command.intent,
      warnings,
    };
  }
}
