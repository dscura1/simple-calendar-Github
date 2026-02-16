import { db } from '../db/database';
import type { Task } from '../types/entities';
import { followUpService } from './followUps';

export const taskService = {
  // Create
  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const now = Date.now();
    const id = await db.tasks.add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    const task = await db.tasks.get(id);
    if (!task) throw new Error('Failed to create task');
    return task;
  },

  // Read
  async getById(id: number): Promise<Task | undefined> {
    return await db.tasks.get(id);
  },

  async getAll(): Promise<Task[]> {
    return await db.tasks.orderBy('dueDate').toArray();
  },

  async getByContext(contextId: number): Promise<Task[]> {
    return await db.tasks.where('contextId').equals(contextId).toArray();
  },

  async getByContact(contactId: number): Promise<Task[]> {
    // Updated for multi-contact linking
    const allTasks = await db.tasks.toArray();
    return allTasks.filter(task => task.linkedContactIds.includes(contactId));
  },

  async getByDueDate(dueDate: number): Promise<Task[]> {
    return await db.tasks.where('dueDate').equals(dueDate).toArray();
  },

  async getIncomplete(): Promise<Task[]> {
    return await db.tasks.where('completed').equals(0 as any).toArray();
  },

  // Update
  async update(id: number, updates: Partial<Task>): Promise<void> {
    await db.tasks.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async toggleComplete(id: number): Promise<void> {
    const task = await db.tasks.get(id);
    if (task) {
      const newCompletedState = !task.completed;
      await db.tasks.update(id, {
        completed: newCompletedState,
        updatedAt: Date.now(),
      });

      // F7: Auto-update last interaction date when completing a task with contacts
      if (newCompletedState && task.linkedContactIds.length > 0) {
        // Update all linked contacts
        for (const contactId of task.linkedContactIds) {
          await followUpService.updateLastInteraction(contactId);
          await followUpService.recordInteraction(
            contactId,
            'message', // Generic interaction type for tasks
            Date.now(),
            `Completed: ${task.title}`
          );
        }
      }
    }
  },

  // Delete
  async delete(id: number): Promise<void> {
    await db.tasks.delete(id);
  },
};
