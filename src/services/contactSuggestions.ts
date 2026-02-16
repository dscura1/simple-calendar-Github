import { db } from '../db/database';
import type { Contact } from '../types/entities';

export interface ContactSuggestion {
  contact: Contact;
  relevanceScore: number;
  reason: string;
}

export const contactSuggestionService = {
  /**
   * Get top N contact suggestions based on:
   * 1. Recent interactions (last 7 days = high score)
   * 2. Upcoming follow-ups (high score)
   * 3. Linked to recent events/tasks/notes (medium score)
   * 4. Frequency of interaction (low score)
   */
  async getSuggestedContacts(
    contextId: number,
    limit: number = 5
  ): Promise<ContactSuggestion[]> {
    const contacts = await db.contacts
      .where('contextId')
      .equals(contextId)
      .toArray();

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const suggestions: ContactSuggestion[] = [];

    for (const contact of contacts) {
      let score = 0;
      const reasons: string[] = [];

      // Recent interaction (50 points max)
      if (contact.lastInteractionDate && contact.lastInteractionDate >= weekAgo) {
        const daysAgo = Math.floor((now - contact.lastInteractionDate) / (24 * 60 * 60 * 1000));
        score += Math.max(0, 50 - daysAgo * 7);
        reasons.push('Recent interaction');
      }

      // Upcoming follow-up (40 points max)
      if (contact.nextFollowUpDate) {
        const daysUntil = Math.floor((contact.nextFollowUpDate - now) / (24 * 60 * 60 * 1000));
        if (daysUntil >= -7 && daysUntil <= 7) {
          score += Math.max(0, 40 - Math.abs(daysUntil) * 5);
          if (daysUntil < 0) {
            reasons.push('Overdue follow-up');
          } else {
            reasons.push('Upcoming follow-up');
          }
        }
      }

      // Frequency of mentions (30 points max)
      const tasks = await db.tasks.toArray();
      const notes = await db.notes.toArray();
      const mentionCount = [...tasks, ...notes].filter(item =>
        item.linkedContactIds?.includes(contact.id!)
      ).length;

      if (mentionCount > 0) {
        score += Math.min(30, mentionCount * 5);
        reasons.push(`${mentionCount} linked item${mentionCount > 1 ? 's' : ''}`);
      }

      if (score > 0) {
        suggestions.push({
          contact,
          relevanceScore: score,
          reason: reasons.join(', '),
        });
      }
    }

    // Sort by score and return top N
    return suggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  },
};
