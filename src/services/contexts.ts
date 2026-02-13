import { db } from '../db/database';
import type { Context, ContextType } from '../types/entities';

export const contextService = {
  // Create
  async create(data: {
    name: string;
    type: ContextType;
    parentId?: number;
    color?: string;
  }): Promise<Context> {
    const now = Date.now();
    const id = await db.contexts.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    const context = await db.contexts.get(id);
    if (!context) throw new Error('Failed to create context');
    return context;
  },

  // Read
  async getById(id: number): Promise<Context | undefined> {
    return await db.contexts.get(id);
  },

  async getAll(): Promise<Context[]> {
    return await db.contexts.orderBy('name').toArray();
  },

  async getTopLevel(): Promise<Context[]> {
    return await db.contexts.where('parentId').equals(undefined as any).toArray();
  },

  async getSubCompanies(workContextId: number): Promise<Context[]> {
    return await db.contexts.where('parentId').equals(workContextId).toArray();
  },

  // Update
  async update(id: number, updates: Partial<Context>): Promise<void> {
    await db.contexts.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  // Delete
  async delete(id: number): Promise<void> {
    await db.contexts.delete(id);
  },
};
