// Contact extraction with fuzzy matching

import Fuse from 'fuse.js';
import type { Contact } from '../types/entities';
import type { ContactMatch } from './types';

// Words to exclude from name detection (action keywords, months, common words)
const EXCLUDE_WORDS = new Set([
  // Action keywords
  'Meeting', 'Call', 'Email', 'Text', 'Send', 'Schedule', 'Remind', 'Follow',
  'Check', 'Reach', 'Touch', 'Introduce', 'Connect', 'Share', 'Forward',
  // Months
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
  // Days
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  // Common words
  'Today', 'Tomorrow', 'Next', 'This', 'Last', 'Week', 'Month', 'Year',
  'The', 'And', 'Or', 'But', 'For', 'With', 'About', 'From', 'To',
]);

export function extractContacts(
  text: string,
  availableContacts: Contact[]
): { matches: ContactMatch[]; unresolved: string[] } {
  const matches: ContactMatch[] = [];
  const unresolved: string[] = [];

  // Extract potential names, filtering out common words
  const namePattern = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g;
  const potentialNames = Array.from(new Set(
    Array.from(text.matchAll(namePattern))
      .map(m => m[1])
      .filter(name => {
        // Filter out excluded words (case-insensitive partial match)
        const lowerName = name.toLowerCase();
        for (const excluded of EXCLUDE_WORDS) {
          if (excluded.toLowerCase().startsWith(lowerName) || lowerName.startsWith(excluded.toLowerCase())) {
            return false;
          }
        }

        // Filter out very short words (< 3 chars likely not names)
        if (name.length < 3) return false;

        // Keep words that look like names (3+ chars, capitalized)
        return true;
      })
  ));

  if (potentialNames.length === 0) {
    return { matches, unresolved };
  }

  // Setup Fuse for fuzzy matching
  const fuse = new Fuse(availableContacts, {
    keys: ['name', 'company'],
    threshold: 0.3,
    includeScore: true,
  });

  for (const name of potentialNames) {
    // Try exact match first
    const exactMatch = availableContacts.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    );

    if (exactMatch && exactMatch.id !== undefined) {
      matches.push({
        contactId: exactMatch.id,
        name: exactMatch.name,
        score: 1.0,
      });
      continue;
    }

    // Fuzzy fallback
    const fuzzyResults = fuse.search(name);
    if (fuzzyResults.length > 0 && fuzzyResults[0].item.id !== undefined) {
      const result = fuzzyResults[0];
      matches.push({
        contactId: result.item.id!,
        name: result.item.name,
        score: 1 - (result.score || 0),
      });
    } else {
      unresolved.push(name);
    }
  }

  return { matches, unresolved };
}
