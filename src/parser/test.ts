// Quick parser tests - run with: tsx src/parser/test.ts

import { parseCommand } from './index';
import type { Contact } from '../types/entities';

const mockContacts: Contact[] = [
  {
    id: 1,
    contextId: 1,
    name: 'Sarah Johnson',
    company: 'Acme Corp',
    role: 'VP of Sales',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 2,
    contextId: 1,
    name: 'Mike Chen',
    company: 'StartupXYZ',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 3,
    contextId: 2,
    name: 'Dr. Emily Rodriguez',
    company: 'Stanford',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 4,
    contextId: 3,
    name: 'Alex Parker',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Test cases from spec
const testCases = [
  'Follow up with Sarah next Tuesday',
  'Call Tim tomorrow at 2pm',
  'Introduce Mac to Geoff Friday',
  'Send deck to Mia in 3 days',
  'Meeting with Sarah tomorrow at 10am',
  'Email Mike about partnership',
  'Georgetown trip March 20-22',
];

console.log('🧪 Testing NLP Parser\n');

testCases.forEach((input, i) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test ${i + 1}: "${input}"`);
  console.log('='.repeat(60));

  const result = parseCommand(input, mockContacts, 1);

  console.log(`Intent: ${result.intent}`);
  console.log(`Action: ${result.action || 'none'}`);
  console.log(`Title: ${result.title}`);
  console.log(`Contact IDs: ${result.contactIds.join(', ') || 'none'}`);
  console.log(`Unresolved contacts: ${result.contactNames.join(', ') || 'none'}`);
  console.log(`Date: ${result.dateStart ? new Date(result.dateStart).toLocaleDateString() : 'none'}`);
  console.log(`Time specified: ${result.timeSpecified}`);
  console.log(`All day: ${result.allDay}`);
  console.log(`Confidence: ${result.confidence}`);
  if (result.parseWarnings.length > 0) {
    console.log(`Warnings: ${result.parseWarnings.join('; ')}`);
  }
});

console.log('\n✅ Test complete!\n');
