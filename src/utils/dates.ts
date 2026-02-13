import { DateTime } from 'luxon';

// Get start of day (midnight) as Unix timestamp
export function startOfDay(date: DateTime | number = DateTime.now()): number {
  const dt = typeof date === 'number' ? DateTime.fromMillis(date) : date;
  return dt.startOf('day').toMillis();
}

// Get end of day (23:59:59.999) as Unix timestamp
export function endOfDay(date: DateTime | number = DateTime.now()): number {
  const dt = typeof date === 'number' ? DateTime.fromMillis(date) : date;
  return dt.endOf('day').toMillis();
}

// Check if timestamp is today
export function isToday(timestamp: number): boolean {
  const dt = DateTime.fromMillis(timestamp);
  const now = DateTime.now();
  return dt.hasSame(now, 'day');
}

// Format time for display
export function formatTime(timestamp: number): string {
  return DateTime.fromMillis(timestamp).toFormat('h:mm a');
}

// Format date for display
export function formatDate(timestamp: number, format: string = 'LLL dd, yyyy'): string {
  return DateTime.fromMillis(timestamp).toFormat(format);
}

// Get start of month
export function startOfMonth(date: DateTime | number = DateTime.now()): number {
  const dt = typeof date === 'number' ? DateTime.fromMillis(date) : date;
  return dt.startOf('month').toMillis();
}

// Get end of month
export function endOfMonth(date: DateTime | number = DateTime.now()): number {
  const dt = typeof date === 'number' ? DateTime.fromMillis(date) : date;
  return dt.endOf('month').toMillis();
}

// Get number of days in month
export function daysInMonth(date: DateTime | number = DateTime.now()): number {
  const dt = typeof date === 'number' ? DateTime.fromMillis(date) : date;
  return dt.daysInMonth || 30;
}

// Get start of week (Sunday)
export function startOfWeek(date: DateTime | number = DateTime.now()): number {
  const dt = typeof date === 'number' ? DateTime.fromMillis(date) : date;
  return dt.startOf('week').toMillis();
}

// Get end of week (Saturday)
export function endOfWeek(date: DateTime | number = DateTime.now()): number {
  const dt = typeof date === 'number' ? DateTime.fromMillis(date) : date;
  return dt.endOf('week').toMillis();
}

// Get today at midnight
export function today(): number {
  return DateTime.now().startOf('day').toMillis();
}

// Get tomorrow at midnight
export function tomorrow(): number {
  return DateTime.now().plus({ days: 1 }).startOf('day').toMillis();
}

// Add days to a timestamp
export function addDays(timestamp: number, days: number): number {
  return DateTime.fromMillis(timestamp).plus({ days }).toMillis();
}

// Subtract days from a timestamp
export function subtractDays(timestamp: number, days: number): number {
  return DateTime.fromMillis(timestamp).minus({ days }).toMillis();
}
