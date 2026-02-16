import { useStore } from '../../store';

const menuItems = [
  { id: 'daily', label: 'Daily', icon: '📅' },
  { id: 'weekly', label: 'Weekly', icon: '📆' },
  { id: 'monthly', label: 'Monthly', icon: '🗓️' },
  { id: 'contacts', label: 'Contacts', icon: '👥' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'general-notes', label: 'General Notes', icon: '🗒️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const;

export function Navigation() {
  const { currentView, setCurrentView } = useStore();

  return (
    <nav style={{
      display: 'flex',
      gap: '8px',
      padding: '12px',
      background: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
    }}>
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setCurrentView(item.id as any)}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: currentView === item.id ? '#3b82f6' : 'white',
            color: currentView === item.id ? 'white' : '#374151',
            cursor: 'pointer',
            fontWeight: currentView === item.id ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
