// Parser types for NLP command interpretation

export type ActionType =
  | 'follow_up'
  | 'call'
  | 'text'
  | 'email'
  | 'introduce'
  | 'send'
  | 'schedule'
  | 'remind'
  | 'meeting'
  | 'note';

export type IntentType = 'task' | 'event' | 'note';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ParsedCommand {
  intent: IntentType;
  action?: ActionType;
  contactIds: number[];
  contactNames: string[]; // Unresolved contact names
  dateStart?: number; // timestamp
  dateEnd?: number; // timestamp
  timeSpecified: boolean;
  allDay: boolean;
  contextId?: number;
  rawText: string;
  title: string; // Cleaned title for task/event
  confidence: ConfidenceLevel;
  parseWarnings: string[];
}

export interface TemporalEntity {
  dateStart?: number;
  dateEnd?: number;
  timeSpecified: boolean;
  allDay: boolean;
  confidence: number;
}

export interface ContactMatch {
  contactId: number;
  name: string;
  score: number;
}
