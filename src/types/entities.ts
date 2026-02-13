// Core entity types for the Relationship Calendar CRM

export type ContextType = 'work' | 'academic' | 'personal';

export interface Context {
  id?: number;
  name: string;
  type: ContextType;
  parentId?: number; // For sub-companies under Work
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Contact {
  id?: number;
  contextId: number;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  lastInteractionDate?: number;
  nextFollowUpDate?: number;
  generalNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Event {
  id?: number;
  contextId: number;
  title: string;
  description?: string;
  startTime: number;
  endTime?: number;
  allDay: boolean;
  location?: string;
  createdAt: number;
  updatedAt: number;
}

export interface EventContact {
  eventId: number;
  contactId: number;
  role?: string; // 'organizer', 'attendee', etc.
}

export interface Task {
  id?: number;
  contextId: number;
  contactId?: number; // Optional link to contact
  title: string;
  description?: string;
  dueDate?: number;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id?: number;
  contextId: number;
  contactId?: number; // Optional link to contact
  dateRef?: number; // Optional date reference
  title: string;
  body?: string;
  createdAt: number;
  updatedAt: number;
}

export interface InteractionHistory {
  id?: number;
  contactId: number;
  eventId?: number;
  noteId?: number;
  interactionType: 'meeting' | 'email' | 'call' | 'message';
  interactionDate: number;
  summary?: string;
  createdAt: number;
}

export interface MeetingNote {
  id?: number;
  eventId: number;
  noteId?: number;
  content: string;
  createdAt: number;
  updatedAt: number;
}
