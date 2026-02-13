import { Navigation } from './Navigation';
import { ContextSelector } from './ContextSelector';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <ContextSelector />
      <main style={{ flex: 1, overflow: 'auto', background: '#f9fafb' }}>
        {children}
      </main>
    </div>
  );
}
