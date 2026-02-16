// Intent classification logic

import type { IntentType } from './types';

export function classifyIntent(
  actionIntent?: IntentType,
  hasDate?: boolean,
  hasContact?: boolean,
  hasTime?: boolean
): IntentType {
  // If action provides intent, prefer that
  if (actionIntent) {
    return actionIntent;
  }

  // Heuristics for fallback classification
  // If has time specified, likely an event
  if (hasTime) {
    return 'event';
  }

  // If has contact + date, likely a task
  if (hasContact && hasDate) {
    return 'task';
  }

  // Default to note if unclear
  return 'note';
}

export function determineConfidence(
  hasAction: boolean,
  hasDate: boolean,
  hasContact: boolean,
  hasUnresolved: boolean
): 'high' | 'medium' | 'low' {
  if (hasAction && hasDate && hasContact && !hasUnresolved) {
    return 'high';
  }

  if (hasAction && (hasDate || hasContact)) {
    return 'medium';
  }

  return 'low';
}
