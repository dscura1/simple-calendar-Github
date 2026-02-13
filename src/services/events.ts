import { db } from '../db/database';
import type { Event } from '../types/entities';

export const eventService = {
  // Create
  async create(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const now = Date.now();
    const id = await db.events.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    const event = await db.events.get(id);
    if (!event) throw new Error('Failed to create event');
    return event;
  },

  // Read
  async getById(id: number): Promise<Event | undefined> {
    return await db.events.get(id);
  },

  async getAll(): Promise<Event[]> {
    return await db.events.orderBy('startTime').toArray();
  },

  async getByContext(contextId: number): Promise<Event[]> {
    return await db.events.where('contextId').equals(contextId).sortBy('startTime');
  },

  async getByDateRange(startDate: number, endDate: number): Promise<Event[]> {
    return await db.events
      .where('startTime')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async getByContextAndDateRange(
    contextId: number,
    startDate: number,
    endDate: number
  ): Promise<Event[]> {
    const events = await db.events
      .where('startTime')
      .between(startDate, endDate, true, true)
      .toArray();
    return events.filter((e) => e.contextId === contextId);
  },

  // Update
  async update(id: number, updates: Partial<Event>): Promise<void> {
    await db.events.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  // Delete
  async delete(id: number): Promise<void> {
    // Delete associated event-contact links
    await db.eventContacts.where('eventId').equals(id).delete();
    await db.events.delete(id);
  },

  // Event-Contact links
  async linkContact(eventId: number, contactId: number, role?: string): Promise<void> {
    await db.eventContacts.add({ eventId, contactId, role });
  },

  async unlinkContact(eventId: number, contactId: number): Promise<void> {
    await db.eventContacts.where('[eventId+contactId]').equals([eventId, contactId]).delete();
  },

  async getEventContacts(eventId: number): Promise<number[]> {
    const links = await db.eventContacts.where('eventId').equals(eventId).toArray();
    return links.map((link) => link.contactId);
  },

  async getContactEvents(contactId: number): Promise<number[]> {
    const links = await db.eventContacts.where('contactId').equals(contactId).toArray();
    return links.map((link) => link.eventId);
  },
};
