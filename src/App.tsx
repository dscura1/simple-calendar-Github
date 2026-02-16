import { useEffect, useState } from 'react';
import { initializeDatabase } from './db/database';
import { seedSampleData } from './utils/sampleData';
import { useStore } from './store';
import { Toaster } from 'react-hot-toast';
import { AppShell } from './components/layout/AppShell';
import { Navigation } from './components/layout/Navigation';
import { DailyCommandCenter } from './views/DailyCommandCenter';
import { WeeklyView } from './views/WeeklyView';
import { MonthlyView } from './views/MonthlyView';
import { ContactsView } from './views/ContactsView';
import { NotesView } from './views/NotesView';
import { GeneralNotesView } from './views/GeneralNotesView';
import { SettingsView } from './views/SettingsView';
import './App.css';

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const { loadContexts, loadAllData, currentView } = useStore();

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        await seedSampleData();
        await loadContexts();
        await loadAllData();
        setDbInitialized(true);
        console.log('✅ App initialized successfully');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    }
    init();
  }, [loadContexts, loadAllData]);

  if (!dbInitialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{ fontSize: '48px' }}>📅</div>
        <h2 style={{ margin: 0 }}>Initializing Relationship Calendar CRM...</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Loading database...</p>
      </div>
    );
  }

  // View router based on currentView state
  const renderView = () => {
    switch (currentView) {
      case 'daily':
        return <DailyCommandCenter />;
      case 'weekly':
        return <WeeklyView />;
      case 'monthly':
        return <MonthlyView />;
      case 'contacts':
        return <ContactsView />;
      case 'notes':
        return <NotesView />;
      case 'general-notes':
        return <GeneralNotesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DailyCommandCenter />;
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <AppShell>
        <Navigation />
        {renderView()}
      </AppShell>
    </>
  );
}

export default App;
