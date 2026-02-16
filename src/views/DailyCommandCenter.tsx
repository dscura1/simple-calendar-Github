import { useStore } from '../store';
import { startOfDay, endOfDay } from '../utils/dates';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { parseCommand } from '../parser';
import { executeCommand } from '../parser/executor';
import { getEventsForDay } from '../utils/eventUtils';
import { EventDetailModal } from '../components/EventDetailModal';
import { eventService } from '../services/events';
import { followUpService, type FollowUpContact } from '../services/followUps';
import type { Event } from '../types/entities';
import { DateTime } from 'luxon';
import { theme } from '../styles/theme';
import { TopNav } from '../components/TopNav';
import { QuickInput } from '../components/QuickInput';
import { TimelineCalendar } from '../components/TimelineCalendar';
import { ContextSidebar } from '../components/ContextSidebar';

// Single source of truth for view state
type ViewMode = 'day' | 'week' | 'month';

export function DailyCommandCenter() {
  const {
    filteredEvents,
    filteredTasks,
    filteredNotes,
    filteredContacts,
    contexts,
    toggleTaskComplete,
    activeContextId,
    setActiveContext,
    addTask,
    addEvent,
    addNote,
    addContact,
  } = useStore();

  // SCOPE STATE: Day Scope vs Event Scope
  const [view, setView] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(DateTime.now());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // null = Day Scope
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventContactCounts, setEventContactCounts] = useState<Map<number, number>>(new Map());
  const [lastParsedContactNames, setLastParsedContactNames] = useState<string[]>([]);
  const [followUpContacts, setFollowUpContacts] = useState<FollowUpContact[]>([]);
  const [eventDetailModalEvent, setEventDetailModalEvent] = useState<Event | null>(null);

  // Date key for filtering (YYYY-MM-DD)
  const selectedDateKey = currentDate.toFormat('yyyy-MM-dd');
  const todayStart = startOfDay(currentDate.toMillis());
  const todayEnd = endOfDay(currentDate.toMillis());

  const todaysEvents = getEventsForDay(filteredEvents, todayStart, todayEnd);

  // SCOPE-AWARE FILTERING LOGIC
  // If selectedEvent exists (Event Scope):
  //   - tasks = tasks linked to this event
  //   - notes = notes linked to this event
  // Else (Day Scope):
  //   - tasks = tasks for selected day (not linked to any event)
  //   - notes = notes for selected day (not linked to any event)
  const scopedTasks = selectedEvent
    ? filteredTasks.filter(t => t.linkedEventId === selectedEvent.id)
    : filteredTasks.filter(t => {
        // Day scope: tasks for this day, not linked to events
        if (t.linkedEventId) return false; // Exclude event-linked tasks
        if (!t.dueDate) return false;
        return t.dueDate >= todayStart && t.dueDate <= todayEnd;
      });

  const scopedNotes = selectedEvent
    ? filteredNotes.filter(n => n.linkedEventId === selectedEvent.id)
    : filteredNotes.filter(n => {
        // Day scope: notes for this day, not linked to events, not general
        if (n.scope === 'general') return false; // Exclude general notes
        if (n.linkedEventId) return false; // Exclude event-linked notes
        if (!n.dateRef) return false;
        return n.dateRef >= todayStart && n.dateRef <= todayEnd;
      });

  // SCOPE-AWARE CONTACTS
  // In Event Scope: show contacts linked to the event
  // In Day Scope: show follow-ups
  const scopedFollowUps = selectedEvent
    ? [] // TODO: Load event-linked contacts when in Event Scope
    : followUpContacts;

  // Escape key handler: Exit Event Scope to Day Scope
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEvent) {
        setSelectedEvent(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedEvent]);

  // Clear selected event when date changes
  useEffect(() => {
    setSelectedEvent(null);
  }, [selectedDateKey]);

  // Load contact counts for events
  useEffect(() => {
    const loadContactCounts = async () => {
      const counts = new Map<number, number>();
      for (const event of todaysEvents) {
        if (event.id) {
          const contactIds = await eventService.getEventContacts(event.id);
          counts.set(event.id, contactIds.length);
        }
      }
      setEventContactCounts(counts);
    };
    loadContactCounts();
  }, [todaysEvents.length]);

  // Load follow-up contacts (Day Scope only)
  useEffect(() => {
    const loadFollowUps = async () => {
      const contacts = await followUpService.getContactsNeedingFollowUp(activeContextId || undefined);
      setFollowUpContacts(contacts);
    };
    loadFollowUps();
  }, [activeContextId, filteredContacts.length]);

  const handleQuickInputSubmit = async (text: string) => {
    if (!activeContextId) {
      toast.error('Please select a context first');
      return;
    }

    setIsProcessing(true);

    try {
      const command = parseCommand(text, filteredContacts, activeContextId);

      if (command.contactNames.length > 0) {
        setLastParsedContactNames(command.contactNames);
      }

      if (command.confidence === 'high' || command.confidence === 'medium') {
        const result = await executeCommand(command, {
          addTask,
          addEvent,
          addNote,
        });

        if (result.success) {
          toast.success(result.message);
          if (result.warnings.length > 0) {
            setTimeout(() => {
              result.warnings.forEach(w => toast(w, { icon: '⚠️', duration: 3000 }));
            }, 500);
          }
        } else {
          toast.error(result.message);
        }
      } else {
        await addNote({
          contextId: activeContextId,
          title: text,
          body: text,
          dateRef: command.dateStart,
          linkedContactIds: [],
          scope: 'day',
          topicTags: [],
        });
        toast('Created as note (low confidence). Try being more specific!', {
          icon: '📝',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Command execution error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process command');
    } finally {
      setIsProcessing(false);
    }
  };

  // SCOPE ACTION: Select Event (enter Event Scope)
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
  };

  // SCOPE ACTION: Clear selected event (exit Event Scope to Day Scope)
  const handleClearScope = () => {
    setSelectedEvent(null);
  };

  // SCOPE ACTION: Create task in current scope
  const handleCreateTaskInScope = async (title: string) => {
    if (!activeContextId) {
      toast.error('Please select a context first');
      return;
    }

    try {
      if (selectedEvent) {
        // Event Scope: link task to event
        await addTask({
          contextId: activeContextId,
          title,
          linkedEventId: selectedEvent.id,
          dueDate: selectedEvent.startTime,
          linkedContactIds: [],
          completed: false,
        });
        toast.success('Task added to event');
      } else {
        // Day Scope: link task to date
        await addTask({
          contextId: activeContextId,
          title,
          dueDate: todayStart,
          linkedContactIds: [],
          completed: false,
        });
        toast.success('Task added to day');
      }
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  // SCOPE ACTION: Create note in current scope
  const handleCreateNoteInScope = async (body: string) => {
    if (!activeContextId) {
      toast.error('Please select a context first');
      return;
    }

    try {
      if (selectedEvent) {
        // Event Scope: link note to event
        await addNote({
          contextId: activeContextId,
          title: `Event note: ${selectedEvent.title}`,
          body,
          linkedEventId: selectedEvent.id,
          dateRef: selectedEvent.startTime,
          linkedContactIds: [],
          scope: 'event',
          topicTags: [],
        });
        toast.success('Note added to event');
      } else {
        // Day Scope: link note to date
        await addNote({
          contextId: activeContextId,
          title: `Daily note: ${selectedDateKey}`,
          body,
          dateRef: todayStart,
          linkedContactIds: [],
          scope: 'day',
          topicTags: [],
        });
        toast.success('Note added to day');
      }
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  return (
    <>
      {/* Unified Header - single source of all controls */}
      <TopNav
        currentView={view}
        onViewChange={setView}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        contexts={contexts}
        activeContextId={activeContextId}
        onContextChange={setActiveContext}
      />

      {/* Quick Input - appears once only */}
      <QuickInput
        onSubmit={handleQuickInputSubmit}
        isProcessing={isProcessing}
      />

      {/* Main Content - flex: 1, min-height: 0 for proper scrolling */}
      <div className="main-content" style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Daily Split Layout: Timeline (~65%) + Sidebar (~35%) */}
        <div className="daily-split" style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
        }}>
          {/* Left: Timeline Pane (scrollable) */}
          <div className="timeline-pane" style={{
            minHeight: 0,
            overflowY: 'auto',
            background: theme.colors.bg.primary,
          }}>
            <TimelineCalendar
              date={currentDate}
              events={todaysEvents}
              selectedEventId={selectedEvent?.id || null}
              onEventClick={handleSelectEvent}
              onClearSelection={handleClearScope}
            />
          </div>

          {/* Right: Context Pane (scrollable) - SCOPE-AWARE */}
          <div className="right-pane" style={{
            minHeight: 0,
            overflowY: 'auto',
          }}>
            <ContextSidebar
              selectedEvent={selectedEvent}
              selectedDateKey={selectedDateKey}
              tasks={scopedTasks}
              notes={scopedNotes}
              followUps={scopedFollowUps}
              onToggleTask={toggleTaskComplete}
              onCreateTask={handleCreateTaskInScope}
              onCreateNote={handleCreateNoteInScope}
              onClearScope={handleClearScope}
            />
          </div>
        </div>
      </div>

      {/* Event Detail Modal (legacy, for contact management) */}
      {eventDetailModalEvent && (
        <EventDetailModal
          event={eventDetailModalEvent}
          onClose={() => setEventDetailModalEvent(null)}
          availableContacts={filteredContacts}
          unresolvedContactNames={
            eventContactCounts.get(eventDetailModalEvent.id!) === 0 ? lastParsedContactNames : []
          }
          onCreateContact={async (name) => {
            if (!activeContextId) return;
            try {
              await addContact({
                contextId: activeContextId,
                name,
              });
              toast.success(`Contact "${name}" created!`);
              const contactIds = await eventService.getEventContacts(eventDetailModalEvent.id!);
              setEventContactCounts(new Map(eventContactCounts.set(eventDetailModalEvent.id!, contactIds.length)));
              setLastParsedContactNames([]);
            } catch (error) {
              toast.error('Failed to create contact');
            }
          }}
        />
      )}
    </>
  );
}
