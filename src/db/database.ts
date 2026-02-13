import Dexie, { type Table } from 'dexie';
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

    this.version(1).stores({
      // Contexts
      contexts: '++id, name, type, parentId, createdAt, updatedAt',

      // Contacts - indexed by contextId for filtering
      contacts: '++id, contextId, name, company, lastInteractionDate, nextFollowUpDate, createdAt, updatedAt',

      // Events - indexed by contextId, startTime for filtering and date queries
      events: '++id, contextId, startTime, endTime, allDay, createdAt, updatedAt',

      // Event-Contact junction table (many-to-many)
      eventContacts: '[eventId+contactId], eventId, contactId',

      // Tasks - indexed by contextId, contactId, dueDate, completed
      tasks: '++id, contextId, contactId, dueDate, completed, priority, createdAt, updatedAt',

      // Notes - indexed by contextId, contactId, dateRef
      notes: '++id, contextId, contactId, dateRef, createdAt, updatedAt',

      // Interaction History
      interactionHistory: '++id, contactId, eventId, noteId, interactionDate, interactionType, createdAt',

      // Meeting Notes
      meetingNotes: '++id, eventId, noteId, createdAt, updatedAt',
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
