import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Context,
  Contact,
  Event,
  Task,
  Note,
} from '../types/entities';
import { contextService } from '../services/contexts';
import { contactService } from '../services/contacts';
import { eventService } from '../services/events';
import { taskService } from '../services/tasks';
import { noteService } from '../services/notes';

type ViewType = 'daily' | 'weekly' | 'monthly' | 'contacts' | 'notes' | 'settings';

interface AppState {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Context filtering (B4, B5)
  activeContextId: number | null;
  activeSubCompanyId: number | null;
  contexts: Context[];
  setActiveContext: (contextId: number | null, subCompanyId?: number | null) => void;
  loadContexts: () => Promise<void>;

  // Raw data (unfiltered)
  allContacts: Contact[];
  allEvents: Event[];
  allTasks: Task[];
  allNotes: Note[];

  // Filtered data (auto-updates on context change - B5)
  filteredContacts: Contact[];
  filteredEvents: Event[];
  filteredTasks: Task[];
  filteredNotes: Note[];

  // Loading all data
  loadAllData: () => Promise<void>;

  // Context filtering function (B5)
  applyContextFilter: () => void;

  // CRUD operations
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContact: (id: number, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: number) => Promise<void>;

  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: number, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  toggleTaskComplete: (id: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: number, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;

  addContext: (context: { name: string; type: any; parentId?: number; color?: string }) => Promise<void>;
  updateContext: (id: number, updates: Partial<Context>) => Promise<void>;
  deleteContext: (id: number) => Promise<void>;
}

export const useStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Navigation
      currentView: 'daily',
      setCurrentView: (view) => set({ currentView: view }),

      // Context filtering
      activeContextId: null,
      activeSubCompanyId: null,
      contexts: [],

      setActiveContext: (contextId, subCompanyId = null) => {
        set({ activeContextId: contextId, activeSubCompanyId: subCompanyId });
        get().applyContextFilter();
      },

      loadContexts: async () => {
        const contexts = await contextService.getAll();
        set({ contexts });
      },

      // Raw data
      allContacts: [],
      allEvents: [],
      allTasks: [],
      allNotes: [],

      // Filtered data
      filteredContacts: [],
      filteredEvents: [],
      filteredTasks: [],
      filteredNotes: [],

      // Load all data
      loadAllData: async () => {
        const [contacts, events, tasks, notes] = await Promise.all([
          contactService.getAll(),
          eventService.getAll(),
          taskService.getAll(),
          noteService.getAll(),
        ]);

        set({
          allContacts: contacts,
          allEvents: events,
          allTasks: tasks,
          allNotes: notes,
        });

        // Apply filter after loading
        get().applyContextFilter();
      },

      // Context filtering logic (B5)
      applyContextFilter: () => {
        const { activeContextId, activeSubCompanyId, allContacts, allEvents, allTasks, allNotes } = get();

        // Determine which context ID to filter by
        const filterContextId = activeSubCompanyId || activeContextId;

        if (filterContextId === null) {
          // No filter: show all data
          set({
            filteredContacts: allContacts,
            filteredEvents: allEvents,
            filteredTasks: allTasks,
            filteredNotes: allNotes,
          });
        } else {
          // Filter by context
          set({
            filteredContacts: allContacts.filter((c) => c.contextId === filterContextId),
            filteredEvents: allEvents.filter((e) => e.contextId === filterContextId),
            filteredTasks: allTasks.filter((t) => t.contextId === filterContextId),
            filteredNotes: allNotes.filter((n) => n.contextId === filterContextId),
          });
        }
      },

      // CRUD - Contacts
      addContact: async (contact) => {
        await contactService.create(contact);
        await get().loadAllData();
      },

      updateContact: async (id, updates) => {
        await contactService.update(id, updates);
        await get().loadAllData();
      },

      deleteContact: async (id) => {
        await contactService.delete(id);
        await get().loadAllData();
      },

      // CRUD - Events
      addEvent: async (event) => {
        await eventService.create(event);
        await get().loadAllData();
      },

      updateEvent: async (id, updates) => {
        await eventService.update(id, updates);
        await get().loadAllData();
      },

      deleteEvent: async (id) => {
        await eventService.delete(id);
        await get().loadAllData();
      },

      // CRUD - Tasks
      addTask: async (task) => {
        await taskService.create(task);
        await get().loadAllData();
      },

      updateTask: async (id, updates) => {
        await taskService.update(id, updates);
        await get().loadAllData();
      },

      toggleTaskComplete: async (id) => {
        await taskService.toggleComplete(id);
        await get().loadAllData();
      },

      deleteTask: async (id) => {
        await taskService.delete(id);
        await get().loadAllData();
      },

      // CRUD - Notes
      addNote: async (note) => {
        await noteService.create(note);
        await get().loadAllData();
      },

      updateNote: async (id, updates) => {
        await noteService.update(id, updates);
        await get().loadAllData();
      },

      deleteNote: async (id) => {
        await noteService.delete(id);
        await get().loadAllData();
      },

      // CRUD - Contexts
      addContext: async (context) => {
        await contextService.create(context);
        await get().loadContexts();
      },

      updateContext: async (id, updates) => {
        await contextService.update(id, updates);
        await get().loadContexts();
      },

      deleteContext: async (id) => {
        await contextService.delete(id);
        await get().loadContexts();
        // If deleted context was active, clear filter
        if (get().activeContextId === id) {
          set({ activeContextId: null, activeSubCompanyId: null });
          get().applyContextFilter();
        }
      },
    }),
    { name: 'RelationshipCRM' }
  )
);
