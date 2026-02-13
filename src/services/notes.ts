import { db } from '../db/database';
import type { Note } from '../types/entities';

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
    return await db.notes.where('contactId').equals(contactId).toArray();
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
};
