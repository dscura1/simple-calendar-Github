import Dexie, { type Table } from 'dexie';
import { DateTime } from 'luxon';
import type {
  Context,
  Contact,
  Event,
  EventContact,
  Task,
  Note,
  InteractionHistory,
  MeetingNote,
} from '../types/entities';

export class RelationshipCalendarDB extends Dexie {
  // Tables
  contexts!: Table<Context, number>;
  contacts!: Table<Contact, number>;
  events!: Table<Event, number>;
  eventContacts!: Table<EventContact, [number, number]>;
  tasks!: Table<Task, number>;
  notes!: Table<Note, number>;
  interactionHistory!: Table<InteractionHistory, number>;
  meetingNotes!: Table<MeetingNote, number>;

  constructor() {
    super('RelationshipCalendarDB');

    // Version 1: Original schema
    this.version(1).stores({
      contexts: '++id, name, type, parentId, createdAt, updatedAt',
      contacts: '++id, contextId, name, company, lastInteractionDate, nextFollowUpDate, createdAt, updatedAt',
      events: '++id, contextId, startTime, endTime, allDay, createdAt, updatedAt',
      eventContacts: '[eventId+contactId], eventId, contactId',
      tasks: '++id, contextId, contactId, dueDate, completed, priority, linkedEventId, createdAt, updatedAt',
      notes: '++id, contextId, contactId, dateRef, linkedEventId, createdAt, updatedAt',
      interactionHistory: '++id, contactId, eventId, noteId, interactionDate, interactionType, createdAt',
      meetingNotes: '++id, eventId, noteId, createdAt, updatedAt',
    });

    // Version 2: Add general notes scope, topic tags, multi-contact linking
    this.version(2).stores({
      contexts: '++id, name, type, parentId, createdAt, updatedAt',
      contacts: '++id, contextId, name, company, lastInteractionDate, nextFollowUpDate, createdAt, updatedAt',
      events: '++id, contextId, startTime, endTime, allDay, createdAt, updatedAt',
      eventContacts: '[eventId+contactId], eventId, contactId',
      // Tasks: Add multi-entry index for linkedContactIds array, add dueDateKey
      tasks: '++id, contextId, *linkedContactIds, dueDate, dueDateKey, completed, priority, linkedEventId, createdAt, updatedAt',
      // Notes: Add multi-entry indexes for linkedContactIds and topicTags arrays, add scope and dateKey
      notes: '++id, contextId, *linkedContactIds, dateRef, dateKey, *topicTags, scope, linkedEventId, createdAt, updatedAt',
      interactionHistory: '++id, contactId, eventId, noteId, interactionDate, interactionType, createdAt',
      meetingNotes: '++id, eventId, noteId, createdAt, updatedAt',
    }).upgrade(async (tx) => {
      console.log('🔄 Migrating database from version 1 to version 2...');

      // Migrate Notes
      const notesCount = await tx.table('notes').count();
      console.log(`📝 Migrating ${notesCount} notes...`);

      await tx.table('notes').toCollection().modify((note: any) => {
        // Convert contactId to linkedContactIds array
        if (note.contactId !== undefined) {
          note.linkedContactIds = note.contactId ? [note.contactId] : [];
          delete note.contactId;
        } else {
          note.linkedContactIds = [];
        }

        // Generate dateKey from dateRef
        if (note.dateRef) {
          const dt = DateTime.fromMillis(note.dateRef);
          note.dateKey = dt.toFormat('yyyy-MM-dd');
        }

        // Determine scope
        if (note.linkedEventId) {
          note.scope = 'event';
        } else if (note.dateRef) {
          note.scope = 'day';
        } else {
          note.scope = 'general';
        }

        // Initialize topicTags
        note.topicTags = [];
      });

      // Migrate Tasks
      const tasksCount = await tx.table('tasks').count();
      console.log(`✅ Migrating ${tasksCount} tasks...`);

      await tx.table('tasks').toCollection().modify((task: any) => {
        // Convert contactId to linkedContactIds array
        if (task.contactId !== undefined) {
          task.linkedContactIds = task.contactId ? [task.contactId] : [];
          delete task.contactId;
        } else {
          task.linkedContactIds = [];
        }

        // Generate dueDateKey from dueDate
        if (task.dueDate) {
          const dt = DateTime.fromMillis(task.dueDate);
          task.dueDateKey = dt.toFormat('yyyy-MM-dd');
        }
      });

      console.log('✅ Database migration complete!');
    });
  }
}

// Create singleton instance
export const db = new RelationshipCalendarDB();

// Initialize with default contexts on first load
export async function initializeDatabase() {
  const contextCount = await db.contexts.count();

  if (contextCount === 0) {
    // Create default contexts
    const now = Date.now();

    await db.contexts.bulkAdd([
      {
        name: 'Work',
        type: 'work',
        color: '#3b82f6',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Academic',
        type: 'academic',
        color: '#10b981',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Personal',
        type: 'personal',
        color: '#f59e0b',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    console.log('✅ Database initialized with default contexts');
  }
}
