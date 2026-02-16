// Main NLP parser pipeline

import { extractAction } from './actionLexicon';
import { extractTemporal, extractDateRange } from './temporalParser';
import { extractContacts } from './contactExtractor';
import { classifyIntent, determineConfidence } from './intentClassifier';
import type { Contact } from '../types/entities';
import type { ParsedCommand, ActionType } from './types';
import { DateTime } from 'luxon';
import { openAIService } from '../services/openai';

export * from './types';

// Enhanced parser with OpenAI support
export async function parseCommandWithAI(
  input: string,
  availableContacts: Contact[],
  activeContextId?: number
): Promise<ParsedCommand> {
  // Try OpenAI first if API key is available
  if (openAIService.hasApiKey()) {
    try {
      const aiResult = await openAIService.classifyInput(
        input,
        availableContacts
      );

      if (aiResult) {
        // Map contact names to IDs
        const contactIds: number[] = [];
        const unresolvedNames: string[] = [];

        for (const name of aiResult.contactNames) {
          const contact = availableContacts.find(
            c => c.name.toLowerCase() === name.toLowerCase()
          );
          if (contact && contact.id) {
            contactIds.push(contact.id);
          } else {
            unresolvedNames.push(name);
          }
        }

        // Map intent to action type
        let action: ActionType | undefined;
        if (aiResult.intent === 'event') {
          action = 'meeting';
        } else if (aiResult.intent === 'note') {
          action = 'note';
        }
        // For tasks, action is optional (can be 'call', 'follow_up', etc.)

        const command: ParsedCommand = {
          intent: aiResult.intent,
          action,
          contactIds,
          contactNames: unresolvedNames,
          dateStart: aiResult.dateStart,
          dateEnd: aiResult.dateEnd,
          timeSpecified: !aiResult.allDay,
          allDay: aiResult.allDay,
          contextId: activeContextId,
          rawText: input,
          title: aiResult.title,
          confidence: aiResult.confidence,
          parseWarnings: unresolvedNames.length > 0
            ? [`Unresolved contacts: ${unresolvedNames.join(', ')}`]
            : [],
        };

        return command;
      }
    } catch (error) {
      console.warn('OpenAI parsing failed, falling back to regex parser:', error);
    }
  }

  // Fallback to regex-based parser
  return parseCommand(input, availableContacts, activeContextId);
}

// Original regex-based parser (kept for fallback)
export function parseCommand(
  input: string,
  availableContacts: Contact[],
  activeContextId?: number
): ParsedCommand {
  const warnings: string[] = [];
  const rawText = input.trim();
  const normalizedText = input.toLowerCase().trim();

  // Step 1: Extract action
  const { action, intent: actionIntent, matchedPattern } = extractAction(normalizedText);

  // Step 2: Extract temporal entities
  let temporal = extractTemporal(rawText);

  // Fallback to range parser if chrono failed
  if (temporal.confidence === 0) {
    const rangeResult = extractDateRange(rawText);
    if (rangeResult) {
      temporal = rangeResult;
    }
  }

  // Default to today if no date found
  if (!temporal.dateStart) {
    temporal.dateStart = DateTime.now().startOf('day').toMillis();
    temporal.allDay = true;
    warnings.push('No date specified, defaulting to today');
  }

  // Step 3: Extract contacts
  const { matches: contactMatches, unresolved } = extractContacts(rawText, availableContacts);

  if (unresolved.length > 0) {
    warnings.push(`Unresolved contacts: ${unresolved.join(', ')}`);
  }

  // Step 4: Determine intent
  const intent = classifyIntent(
    actionIntent,
    !!temporal.dateStart,
    contactMatches.length > 0,
    temporal.timeSpecified
  );

  // Step 5: Build clean title
  let title = rawText;
  if (matchedPattern) {
    // Remove the action pattern from title
    title = rawText.replace(new RegExp(matchedPattern, 'i'), '').trim();
  }

  // Step 6: Apply active context
  const contextId = activeContextId;

  // Step 7: Determine confidence
  const confidence = determineConfidence(
    !!action,
    !!temporal.dateStart,
    contactMatches.length > 0,
    unresolved.length > 0
  );

  // Step 8: Build command object
  const command: ParsedCommand = {
    intent,
    action,
    contactIds: contactMatches.map(m => m.contactId),
    contactNames: unresolved,
    dateStart: temporal.dateStart,
    dateEnd: temporal.dateEnd,
    timeSpecified: temporal.timeSpecified,
    allDay: temporal.allDay,
    contextId,
    rawText,
    title: title || rawText,
    confidence,
    parseWarnings: warnings,
  };

  return command;
}

// Helper to format parse result for debugging
export function formatParseResult(command: ParsedCommand): string {
  const parts = [
    `Intent: ${command.intent}`,
    `Action: ${command.action || 'none'}`,
    `Contacts: ${command.contactIds.length} matched${command.contactNames.length > 0 ? `, ${command.contactNames.length} unresolved` : ''}`,
    `Date: ${command.dateStart ? new Date(command.dateStart).toLocaleDateString() : 'none'}`,
    `Confidence: ${command.confidence}`,
  ];

  if (command.parseWarnings.length > 0) {
    parts.push(`Warnings: ${command.parseWarnings.join('; ')}`);
  }

  return parts.join(' | ');
}
