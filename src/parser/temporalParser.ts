// Temporal entity extraction using chrono-node

import * as chrono from 'chrono-node';
import { DateTime } from 'luxon';
import type { TemporalEntity } from './types';

export function extractTemporal(text: string, referenceDate?: Date): TemporalEntity {
  const results = chrono.parse(text, referenceDate || new Date(), { forwardDate: true });

  if (results.length === 0) {
    return {
      allDay: false,
      timeSpecified: false,
      confidence: 0,
    };
  }

  // Use the first match (most confident)
  const match = results[0];
  const startDate = match.start.date();
  const endDate = match.end?.date();

  // Determine if time was specified
  const timeSpecified = match.start.isCertain('hour') || match.start.isCertain('minute');

  // If no time specified, treat as all-day or default to 9 AM
  const dateStart = DateTime.fromJSDate(startDate).toMillis();
  const dateEnd = endDate ? DateTime.fromJSDate(endDate).toMillis() : undefined;

  return {
    dateStart,
    dateEnd,
    timeSpecified,
    allDay: !timeSpecified,
    confidence: 0.8, // chrono-node is generally reliable
  };
}

// Fallback regex-based date range parser for ambiguous cases
export function extractDateRange(text: string): TemporalEntity | null {
  const rangePattern = /(\w+\s+\d+)-(\d+)/i; // e.g., "March 20-22"
  const match = text.match(rangePattern);

  if (!match) return null;

  try {
    const startStr = match[1]; // "March 20"
    const endDay = match[2]; // "22"

    const startDate = DateTime.fromFormat(startStr, 'MMMM d');
    const endDate = startDate.set({ day: parseInt(endDay, 10) });

    if (!startDate.isValid || !endDate.isValid) return null;

    return {
      dateStart: startDate.startOf('day').toMillis(),
      dateEnd: endDate.endOf('day').toMillis(),
      timeSpecified: false,
      allDay: true,
      confidence: 0.6,
    };
  } catch {
    return null;
  }
}
