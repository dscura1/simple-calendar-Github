import { db } from '../db/database';
import type { Contact } from '../types/entities';

export const contactService = {
  // Create
  async create(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const now = Date.now();
    const id = await db.contacts.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    const contact = await db.contacts.get(id);
    if (!contact) throw new Error('Failed to create contact');
    return contact;
  },

  // Read
  async getById(id: number): Promise<Contact | undefined> {
    return await db.contacts.get(id);
  },

  async getAll(): Promise<Contact[]> {
    return await db.contacts.orderBy('name').toArray();
  },

  async getByContext(contextId: number): Promise<Contact[]> {
    return await db.contacts.where('contextId').equals(contextId).toArray();
  },

  async getByIds(ids: number[]): Promise<Contact[]> {
    return await db.contacts.bulkGet(ids).then((contacts) =>
      contacts.filter((c): c is Contact => c !== undefined)
    );
  },

  // Update
  async update(id: number, updates: Partial<Contact>): Promise<void> {
    await db.contacts.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  // Delete
  async delete(id: number): Promise<void> {
    await db.contacts.delete(id);
  },
};
