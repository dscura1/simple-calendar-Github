// Action keyword lexicon with phrase priority (longest match first)

import type { ActionType, IntentType } from './types';

export interface ActionMapping {
  action: ActionType;
  intent: IntentType;
  patterns: string[];
}

// Ordered by phrase length (longest first) for greedy matching
export const ACTION_MAPPINGS: ActionMapping[] = [
  {
    action: 'follow_up',
    intent: 'task',
    patterns: [
      'follow up with',
      'follow-up with',
      'followup with',
      'check in with',
      'reach out to',
      'touch base with',
      'follow up',
      'followup',
    ],
  },
  {
    action: 'call',
    intent: 'task',
    patterns: ['call', 'phone', 'ring', 'call up'],
  },
  {
    action: 'text',
    intent: 'task',
    patterns: ['text', 'message', 'sms'],
  },
  {
    action: 'email',
    intent: 'task',
    patterns: ['email', 'send email to', 'mail'],
  },
  {
    action: 'introduce',
    intent: 'task',
    patterns: ['introduce', 'connect', 'intro'],
  },
  {
    action: 'send',
    intent: 'task',
    patterns: ['send', 'share', 'forward'],
  },
  {
    action: 'schedule',
    intent: 'event',
    patterns: ['schedule', 'book', 'set up'],
  },
  {
    action: 'meeting',
    intent: 'event',
    patterns: ['meeting with', 'meet with', 'meeting', 'meet'],
  },
  {
    action: 'remind',
    intent: 'task',
    patterns: ['remind me to', 'reminder to', 'remind', 'reminder'],
  },
];

export function extractAction(text: string): {
  action?: ActionType;
  intent?: IntentType;
  matchedPattern?: string;
} {
  const normalizedText = text.toLowerCase().trim();

  // Try to match patterns (longest first)
  for (const mapping of ACTION_MAPPINGS) {
    for (const pattern of mapping.patterns) {
      if (normalizedText.includes(pattern)) {
        return {
          action: mapping.action,
          intent: mapping.intent,
          matchedPattern: pattern,
        };
      }
    }
  }

  return {};
}
