import { db } from '../db/database';
import { DateTime } from 'luxon';
import type { Note, NoteScope } from '../types/entities';

export const noteService = {
  // Create
  async create(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const now = Date.now();
    const id = await db.notes.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    const note = await db.notes.get(id);
    if (!note) throw new Error('Failed to create note');
    return note;
  },

  // Read
  async getById(id: number): Promise<Note | undefined> {
    return await db.notes.get(id);
  },

  async getAll(): Promise<Note[]> {
    return await db.notes.orderBy('updatedAt').reverse().toArray();
  },

  async getByContext(contextId: number): Promise<Note[]> {
    return await db.notes.where('contextId').equals(contextId).reverse().toArray();
  },

  async getByContact(contactId: number): Promise<Note[]> {
    // Updated for multi-contact linking
    const allNotes = await db.notes.toArray();
    return allNotes.filter(note => note.linkedContactIds.includes(contactId));
  },

  async getByDateRef(dateRef: number): Promise<Note[]> {
    return await db.notes.where('dateRef').equals(dateRef).toArray();
  },

  // Update
  async update(id: number, updates: Partial<Note>): Promise<void> {
    await db.notes.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  // Delete
  async delete(id: number): Promise<void> {
    await db.notes.delete(id);
  },

  // General Notes queries
  async getGeneralNotes(contextId?: number): Promise<Note[]> {
    let notes = await db.notes
      .where('scope')
      .equals('general')
      .reverse()
      .sortBy('updatedAt');

    if (contextId) {
      notes = notes.filter(n => n.contextId === contextId);
    }

    return notes;
  },

  async getByTopicTag(tag: string, contextId?: number): Promise<Note[]> {
    const allNotes = await db.notes.toArray();
    let filtered = allNotes.filter(note =>
      note.topicTags.includes(tag) && note.scope === 'general'
    );

    if (contextId) {
      filtered = filtered.filter(n => n.contextId === contextId);
    }

    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getAllTopicTags(contextId?: number): Promise<string[]> {
    const notes = contextId
      ? await db.notes.where('contextId').equals(contextId).toArray()
      : await db.notes.toArray();

    const tagsSet = new Set<string>();
    notes
      .filter(n => n.scope === 'general')
      .forEach(note => {
        note.topicTags.forEach(tag => tagsSet.add(tag));
      });

    return Array.from(tagsSet).sort();
  },

  // Scope management
  async moveToScope(
    noteId: number,
    targetScope: NoteScope,
    options?: {
      dateRef?: number;
      linkedEventId?: number;
    }
  ): Promise<void> {
    const updates: Partial<Note> = {
      scope: targetScope,
      updatedAt: Date.now(),
    };

    // Clear scope-specific fields based on target scope
    if (targetScope === 'general') {
      updates.dateRef = undefined;
      updates.dateKey = undefined;
      updates.linkedEventId = undefined;
    } else if (targetScope === 'day') {
      updates.dateRef = options?.dateRef;
      updates.dateKey = options?.dateRef
        ? DateTime.fromMillis(options.dateRef).toFormat('yyyy-MM-dd')
        : undefined;
      updates.linkedEventId = undefined;
    } else if (targetScope === 'event') {
      updates.linkedEventId = options?.linkedEventId;
      updates.dateRef = options?.dateRef;
      updates.dateKey = options?.dateRef
        ? DateTime.fromMillis(options.dateRef).toFormat('yyyy-MM-dd')
        : undefined;
    }

    await db.notes.update(noteId, updates);
  },
};
