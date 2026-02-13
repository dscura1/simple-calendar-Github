import { db } from '../db/database';
import { DateTime } from 'luxon';

export async function seedSampleData() {
  // Check if data already exists
  const eventCount = await db.events.count();
  if (eventCount > 0) {
    console.log('Sample data already exists');
    return;
  }

  const now = Date.now();

  // Get contexts
  const contexts = await db.contexts.toArray();
  const workContext = contexts.find(c => c.type === 'work');
  const academicContext = contexts.find(c => c.type === 'academic');
  const personalContext = contexts.find(c => c.type === 'personal');

  if (!workContext || !academicContext || !personalContext) {
    console.error('Contexts not found');
    return;
  }

  // Add sub-company
  const acmeCorpId = await db.contexts.add({
    name: 'Acme Corp',
    type: 'work',
    parentId: workContext.id,
    color: '#0ea5e9',
    createdAt: now,
    updatedAt: now,
  });

  // Add Contacts
  const sarahId = await db.contacts.add({
    contextId: acmeCorpId,
    name: 'Sarah Johnson',
    company: 'Acme Corp',
    role: 'VP of Sales',
    email: 'sarah.johnson@acmecorp.com',
    phone: '(555) 123-4567',
    lastInteractionDate: DateTime.now().minus({ days: 3 }).toMillis(),
    nextFollowUpDate: DateTime.now().plus({ days: 7 }).toMillis(),
    generalNotes: 'Met at tech conference. Very interested in our product roadmap.',
    createdAt: now,
    updatedAt: now,
  });

  const mikeId = await db.contacts.add({
    contextId: workContext.id!,
    name: 'Mike Chen',
    company: 'StartupXYZ',
    role: 'Founder & CEO',
    email: 'mike@startupxyz.com',
    phone: '(555) 234-5678',
    lastInteractionDate: DateTime.now().minus({ days: 10 }).toMillis(),
    generalNotes: 'Looking for strategic partnerships.',
    createdAt: now,
    updatedAt: now,
  });

  const emilyId = await db.contacts.add({
    contextId: academicContext.id!,
    name: 'Dr. Emily Rodriguez',
    company: 'Stanford University',
    role: 'Professor',
    email: 'emily.rodriguez@stanford.edu',
    phone: '(555) 345-6789',
    lastInteractionDate: DateTime.now().minus({ days: 2 }).toMillis(),
    nextFollowUpDate: DateTime.now().plus({ days: 14 }).toMillis(),
    generalNotes: 'Research collaboration on AI ethics.',
    createdAt: now,
    updatedAt: now,
  });

  const alexId = await db.contacts.add({
    contextId: personalContext.id!,
    name: 'Alex Parker',
    company: '',
    role: 'Friend',
    email: 'alex.parker@email.com',
    phone: '(555) 456-7890',
    lastInteractionDate: DateTime.now().minus({ days: 5 }).toMillis(),
    generalNotes: 'College roommate. Loves hiking.',
    createdAt: now,
    updatedAt: now,
  });

  // Add Events
  const tomorrow2pm = DateTime.now().plus({ days: 1 }).set({ hour: 14, minute: 0, second: 0, millisecond: 0 });
  const event1Id = await db.events.add({
    contextId: acmeCorpId,
    title: 'Product Demo with Sarah',
    description: 'Demo new features for Q1 release',
    startTime: tomorrow2pm.toMillis(),
    endTime: tomorrow2pm.plus({ hours: 1 }).toMillis(),
    allDay: false,
    location: 'Zoom',
    createdAt: now,
    updatedAt: now,
  });
  await db.eventContacts.add({ eventId: event1Id, contactId: sarahId, role: 'attendee' });

  const nextWeek10am = DateTime.now().plus({ days: 7 }).set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
  const event2Id = await db.events.add({
    contextId: workContext.id!,
    title: 'Coffee chat with Mike',
    description: 'Discuss partnership opportunities',
    startTime: nextWeek10am.toMillis(),
    endTime: nextWeek10am.plus({ minutes: 45 }).toMillis(),
    allDay: false,
    location: 'Cafe Roasters',
    createdAt: now,
    updatedAt: now,
  });
  await db.eventContacts.add({ eventId: event2Id, contactId: mikeId, role: 'attendee' });

  const today9am = DateTime.now().set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
  const event3Id = await db.events.add({
    contextId: academicContext.id!,
    title: 'Research Sync with Dr. Rodriguez',
    description: 'Review paper draft',
    startTime: today9am.toMillis(),
    endTime: today9am.plus({ hours: 1, minutes: 30 }).toMillis(),
    allDay: false,
    location: 'Stanford Campus',
    createdAt: now,
    updatedAt: now,
  });
  await db.eventContacts.add({ eventId: event3Id, contactId: emilyId, role: 'attendee' });

  const friday6pm = DateTime.now().plus({ days: 3 }).set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
  const event4Id = await db.events.add({
    contextId: personalContext.id!,
    title: 'Dinner with Alex',
    description: 'Catch up',
    startTime: friday6pm.toMillis(),
    endTime: friday6pm.plus({ hours: 2 }).toMillis(),
    allDay: false,
    location: 'Italian Restaurant',
    createdAt: now,
    updatedAt: now,
  });
  await db.eventContacts.add({ eventId: event4Id, contactId: alexId, role: 'attendee' });

  // Add Tasks
  await db.tasks.add({
    contextId: acmeCorpId,
    contactId: sarahId,
    title: 'Prepare demo slides for Sarah meeting',
    description: 'Include Q1 feature highlights',
    dueDate: DateTime.now().plus({ days: 1 }).startOf('day').toMillis(),
    completed: false,
    priority: 'high',
    createdAt: now,
    updatedAt: now,
  });

  await db.tasks.add({
    contextId: acmeCorpId,
    contactId: sarahId,
    title: 'Send follow-up email with pricing',
    description: 'Include enterprise tier details',
    dueDate: DateTime.now().plus({ days: 2 }).startOf('day').toMillis(),
    completed: false,
    priority: 'medium',
    createdAt: now,
    updatedAt: now,
  });

  await db.tasks.add({
    contextId: workContext.id!,
    contactId: mikeId,
    title: 'Research StartupXYZ background',
    description: 'Check recent funding, team size',
    dueDate: DateTime.now().plus({ days: 6 }).startOf('day').toMillis(),
    completed: false,
    priority: 'medium',
    createdAt: now,
    updatedAt: now,
  });

  await db.tasks.add({
    contextId: academicContext.id!,
    contactId: emilyId,
    title: 'Review research paper draft',
    description: 'Provide feedback on methodology section',
    dueDate: DateTime.now().startOf('day').toMillis(),
    completed: false,
    priority: 'high',
    createdAt: now,
    updatedAt: now,
  });

  await db.tasks.add({
    contextId: personalContext.id!,
    title: 'Book weekend hiking trip',
    description: 'Find good trail for Alex',
    dueDate: DateTime.now().plus({ days: 5 }).startOf('day').toMillis(),
    completed: false,
    priority: 'low',
    createdAt: now,
    updatedAt: now,
  });

  await db.tasks.add({
    contextId: workContext.id!,
    title: 'Complete Q1 sales report',
    description: '',
    dueDate: DateTime.now().startOf('day').toMillis(),
    completed: true,
    priority: 'high',
    createdAt: now,
    updatedAt: now,
  });

  // Add Notes
  await db.notes.add({
    contextId: acmeCorpId,
    contactId: sarahId,
    title: 'Sarah\'s Key Requirements',
    body: '- Needs integration with Salesforce\n- Team size: 50-100 users\n- Budget approved for annual license\n- Decision timeline: end of Q1',
    createdAt: now,
    updatedAt: now,
  });

  await db.notes.add({
    contextId: academicContext.id!,
    contactId: emilyId,
    title: 'Research Notes - AI Ethics Paper',
    body: 'Key points for discussion:\n- Bias detection methodology\n- Dataset considerations\n- Real-world applications\n\nNext steps:\n- Revise introduction\n- Add case studies',
    dateRef: DateTime.now().startOf('day').toMillis(),
    createdAt: now,
    updatedAt: now,
  });

  await db.notes.add({
    contextId: personalContext.id!,
    title: 'Weekend Ideas',
    body: 'Things to do:\n- Visit new art gallery\n- Try that new coffee shop\n- Finish reading "Atomic Habits"',
    createdAt: now,
    updatedAt: now,
  });

  await db.notes.add({
    contextId: workContext.id!,
    title: 'Q1 Goals',
    body: '1. Close 3 enterprise deals\n2. Launch new product features\n3. Hire 2 sales reps\n4. Improve customer retention by 15%',
    createdAt: now,
    updatedAt: now,
  });

  console.log('✅ Sample data loaded successfully!');
  console.log('- 4 Contacts');
  console.log('- 4 Events');
  console.log('- 6 Tasks');
  console.log('- 4 Notes');
  console.log('- 1 Sub-company (Acme Corp)');
}
